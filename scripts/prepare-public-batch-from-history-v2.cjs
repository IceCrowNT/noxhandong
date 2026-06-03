#!/usr/bin/env node

require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in .env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const BASE_YEAR = 2026;

function parseArgs() {
  const args = process.argv.slice(2);
  const periodArg = args.find((arg) => arg.startsWith("--period="));
  return {
    period: periodArg ? periodArg.split("=").slice(1).join("=").trim() : "",
  };
}

function parsePeriod(period) {
  const match = String(period || "").match(/T\s*(\d{1,2})\s*[-/]\s*(\d{4})/i);
  if (!match) {
    throw new Error("Period must use format T6-2026");
  }
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    throw new Error("Period must use format T6-2026");
  }
  return { month, year, label: `T${month}-${year}` };
}

function resolveRelativeMonth(relativeMonth) {
  const zeroBasedMonthIndex = relativeMonth - 1;
  const year = BASE_YEAR + Math.floor(zeroBasedMonthIndex / 12);
  const month = ((zeroBasedMonthIndex % 12) + 12) % 12 + 1;
  return { year, month };
}

function numericValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function recordValue(value) {
  return value && typeof value === "object" ? value : null;
}

function extractBaseNumericMonth(row) {
  const payload = recordValue(row.payload_public_json);
  const paidThrough = recordValue(payload && payload.paidThrough);
  const fromPayload =
    numericValue(paidThrough && paidThrough.numericMonth) ??
    numericValue(payload && payload.numericMonth);
  if (fromPayload !== null) return Math.floor(fromPayload);

  const match = String(row.thang_da_dong_den_hien_tai || "").match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const value = Number(match[0].replace(",", "."));
  return Number.isFinite(value) ? Math.floor(value) : null;
}

function buildPaidThroughInfo(numericMonth, source) {
  if (numericMonth === null) {
    return {
      rawText: "",
      rawMonth: null,
      numericMonth: null,
      kind: "EMPTY",
      needsReview: false,
      isPartialPayment: false,
      isOutsideBaseYear: false,
      displayText: "Chưa có dữ liệu tháng đã đóng.",
      source,
    };
  }

  const resolved = resolveRelativeMonth(numericMonth);
  return {
    rawText: `Hết tháng ${numericMonth}`,
    rawMonth: String(numericMonth),
    numericMonth,
    kind: resolved.year === BASE_YEAR ? "BASE_YEAR_MONTH" : "OUTSIDE_BASE_YEAR",
    needsReview: false,
    isPartialPayment: false,
    isOutsideBaseYear: resolved.year !== BASE_YEAR,
    resolvedMonth: resolved.month,
    resolvedYear: resolved.year,
    displayText: `đã đóng hết tháng ${resolved.month} năm ${resolved.year}`,
    source,
  };
}

async function main() {
  const args = parseArgs();
  const period = parsePeriod(args.period || "T6-2026");

  const currentBatch = await prisma.batchTrangThaiPhiPublic.findFirst({
    where: { la_batch_public_hien_hanh: true },
    orderBy: { public_luc: "desc" },
    select: { id: true, ky_du_lieu: true },
  });
  if (!currentBatch) {
    throw new Error("Cannot find current public fee batch to use as opening balance");
  }

  const [apartments, currentRows, feeRules, histories] = await Promise.all([
    prisma.canHo.findMany({
      orderBy: { ma_can: "asc" },
      select: { id: true, ma_can: true, loai_can: true },
    }),
    prisma.trangThaiPhiCanHoPublic.findMany({
      where: { batch_id: currentBatch.id },
      select: {
        can_ho_id: true,
        thang_da_dong_den_hien_tai: true,
        payload_public_json: true,
      },
    }),
    prisma.quyTacPhi.findMany({
      where: { dang_ap_dung: true, ma_phi: "QLVH" },
      orderBy: { hieu_luc_tu_ngay: "desc" },
      select: { loai_can: true, so_tien: true },
    }),
    prisma.lichSuDongPhiCanHo.findMany({
      where: {
        loai_nguon: "GIAO_DICH_DA_DUYET",
        batch_phi_public_id: null,
      },
      orderBy: { ngay_tao: "asc" },
      select: {
        id: true,
        can_ho_id: true,
        so_tien: true,
        giao_dich_ngan_hang_id: true,
        ngay_tao: true,
      },
    }),
  ]);

  const currentByApartmentId = new Map(currentRows.map((row) => [row.can_ho_id, row]));
  const feeByType = new Map(feeRules.map((rule) => [rule.loai_can, Number(rule.so_tien)]));
  const historiesByApartmentId = new Map();
  for (const history of histories) {
    const list = historiesByApartmentId.get(history.can_ho_id) || [];
    list.push(history);
    historiesByApartmentId.set(history.can_ho_id, list);
  }

  await prisma.batchTrangThaiPhiPublic.deleteMany({
    where: {
      trang_thai: "NHAP",
      la_batch_public_hien_hanh: false,
      ky_du_lieu: period.label,
      metadata_json: {
        path: ["source"],
        equals: "APPROVED_PAYMENT_HISTORY",
      },
    },
  });

  const snapshotRows = [];
  const historyRecordIds = [];
  const changedApartmentCodes = [];
  let totalApprovedAmount = 0;
  let remainderAmount = 0;

  for (const apartment of apartments) {
    const baseRow = currentByApartmentId.get(apartment.id);
    const baseNumericMonth = baseRow ? extractBaseNumericMonth(baseRow) : null;
    const unitFee = feeByType.get(apartment.loai_can) || 0;
    const apartmentHistories = historiesByApartmentId.get(apartment.id) || [];
    const paidAmount = apartmentHistories.reduce((sum, item) => sum + Number(item.so_tien), 0);
    const addedMonths = unitFee > 0 ? Math.floor(paidAmount / unitFee) : 0;
    const amountRemainder = unitFee > 0 ? paidAmount - addedMonths * unitFee : paidAmount;
    const nextNumericMonth = baseNumericMonth === null ? null : baseNumericMonth + addedMonths;
    const paidThroughInfo = buildPaidThroughInfo(nextNumericMonth, "APPROVED_PAYMENT_HISTORY");

    if (paidAmount > 0) {
      totalApprovedAmount += paidAmount;
      remainderAmount += amountRemainder;
      changedApartmentCodes.push(apartment.ma_can);
      historyRecordIds.push(...apartmentHistories.map((item) => item.id));
    }

    snapshotRows.push({
      can_ho_id: apartment.id,
      ma_can: apartment.ma_can,
      thang_da_dong_den_hien_tai:
        nextNumericMonth === null ? null : `Hết tháng ${nextNumericMonth}`,
      ky_du_lieu: period.label,
      payload_public_json: {
        source: "APPROVED_PAYMENT_HISTORY",
        previousPublicBatchId: currentBatch.id,
        previousPublicPeriod: currentBatch.ky_du_lieu,
        baseNumericMonth,
        addedMonths,
        approvedPaymentAmount: paidAmount,
        unitFee,
        remainderAmount: amountRemainder,
        includedHistoryIds: apartmentHistories.map((item) => item.id),
        paidThrough: paidThroughInfo,
        publicDisplayText: paidThroughInfo.displayText,
        needsReview: false,
        isPartialPayment: amountRemainder > 0,
        isOutsideBaseYear: Boolean(paidThroughInfo.isOutsideBaseYear),
      },
    });
  }

  const draftBatch = await prisma.batchTrangThaiPhiPublic.create({
    data: {
      ky_du_lieu: period.label,
      ten_file_nguon: "Lịch sử đóng phí đã duyệt",
      trang_thai: "NHAP",
      la_batch_public_hien_hanh: false,
      tong_so_can: snapshotRows.length,
      metadata_json: {
        source: "APPROVED_PAYMENT_HISTORY",
        previousPublicBatchId: currentBatch.id,
        previousPublicPeriod: currentBatch.ky_du_lieu,
        historyRecordIds,
        approvedHistoryRows: histories.length,
        changedApartmentCount: changedApartmentCodes.length,
        changedApartmentCodes: changedApartmentCodes.slice(0, 100),
        totalApprovedAmount,
        remainderAmount,
      },
      trang_thai_phi: {
        createMany: {
          data: snapshotRows,
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        draftPublicBatchId: draftBatch.id,
        period: period.label,
        previousPublicBatchId: currentBatch.id,
        snapshotRows: snapshotRows.length,
        approvedHistoryRows: histories.length,
        changedApartmentCount: changedApartmentCodes.length,
        totalApprovedAmount,
        remainderAmount,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

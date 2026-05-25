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

function inferPeriod(fileName) {
  const matches = Array.from(String(fileName || "").matchAll(/(?:^|[^A-Z0-9])T\s*(\d{1,2})(?!\d)/gi));
  if (!matches.length) {
    return "UNKNOWN";
  }

  const month = matches[matches.length - 1][1];
  return `T${Number(month)}-2026`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const batchArg = args.find((arg) => arg.startsWith("--import-batch-id="));
  return {
    importBatchId: batchArg ? Number(batchArg.split("=")[1]) : null,
  };
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function resolveRelativeMonth(relativeMonth) {
  const zeroBasedMonthIndex = relativeMonth - 1;
  const year = BASE_YEAR + Math.floor(zeroBasedMonthIndex / 12);
  const month = ((zeroBasedMonthIndex % 12) + 12) % 12 + 1;
  return { year, month };
}

function buildPaidThroughInfo(value) {
  const rawText = String(value || "").trim();
  if (!rawText) {
    return {
      rawText: "",
      rawMonth: null,
      numericMonth: null,
      kind: "EMPTY",
      needsReview: false,
      isPartialPayment: false,
      isOutsideBaseYear: false,
      displayText: null,
    };
  }

  const text = normalizeText(rawText);
  const match = text.match(/het thang\s*(-?\d+(?:[,.]\d+)?)/);
  if (!match) {
    return {
      rawText,
      rawMonth: null,
      numericMonth: null,
      kind: "UNPARSED",
      needsReview: true,
      isPartialPayment: false,
      isOutsideBaseYear: false,
      displayText: rawText,
    };
  }

  const rawMonth = match[1];
  const numericMonth = Number(rawMonth.replace(",", "."));
  if (!Number.isFinite(numericMonth)) {
    return {
      rawText,
      rawMonth,
      numericMonth: null,
      kind: "UNPARSED",
      needsReview: true,
      isPartialPayment: false,
      isOutsideBaseYear: false,
      displayText: rawText,
    };
  }

  if (!Number.isInteger(numericMonth)) {
    return {
      rawText,
      rawMonth,
      numericMonth,
      kind: "PARTIAL_PAYMENT",
      needsReview: false,
      isPartialPayment: true,
      isOutsideBaseYear: false,
      displayText: `đã đóng lẻ tiền, tương đương ${rawMonth} tháng trong năm ${BASE_YEAR}`,
    };
  }

  const resolved = resolveRelativeMonth(numericMonth);
  return {
    rawText,
    rawMonth,
    numericMonth,
    kind: resolved.year === BASE_YEAR ? "BASE_YEAR_MONTH" : "OUTSIDE_BASE_YEAR",
    needsReview: false,
    isPartialPayment: false,
    isOutsideBaseYear: resolved.year !== BASE_YEAR,
    resolvedMonth: resolved.month,
    resolvedYear: resolved.year,
    displayText: `đã đóng hết tháng ${resolved.month} năm ${resolved.year}`,
  };
}

function isUnusualPaidThrough(value) {
  const text = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
  const match = text.match(/het thang\s*(-?\d+(?:[,.]\d+)?)/);
  if (!match) {
    return Boolean(String(value || "").trim());
  }
  const month = Number(match[1].replace(",", "."));
  return !Number.isFinite(month);
}

async function main() {
  const args = parseArgs();
  const importBatch = args.importBatchId
    ? await prisma.loNhapDuLieu.findUnique({ where: { id: args.importBatchId } })
    : await prisma.loNhapDuLieu.findFirst({
        where: { loai_nguon: "WORKBOOK_THEO_DOI_THU_PHI" },
        orderBy: { id: "desc" },
      });

  if (!importBatch) {
    throw new Error("Cannot find fee tracking import batch");
  }

  if (importBatch.loai_nguon !== "WORKBOOK_THEO_DOI_THU_PHI") {
    throw new Error(`Batch ${importBatch.id} is not WORKBOOK_THEO_DOI_THU_PHI`);
  }

  const existingNonDraft = await prisma.batchTrangThaiPhiPublic.findFirst({
    where: {
      lo_nhap_du_lieu_id: importBatch.id,
      trang_thai: { not: "NHAP" },
    },
  });

  if (existingNonDraft) {
    throw new Error(
      `Import batch ${importBatch.id} already has non-draft public fee batch ${existingNonDraft.id}`
    );
  }

  await prisma.batchTrangThaiPhiPublic.deleteMany({
    where: {
      lo_nhap_du_lieu_id: importBatch.id,
      trang_thai: "NHAP",
      la_batch_public_hien_hanh: false,
    },
  });

  const feeRows = await prisma.dongTheoDoiThuPhiTho.findMany({
    where: {
      lo_nhap_du_lieu_id: importBatch.id,
      ma_can: { not: null },
    },
    orderBy: { ma_can: "asc" },
  });

  const apartments = await prisma.canHo.findMany({
    where: {
      ma_can: { in: feeRows.map((row) => row.ma_can).filter(Boolean) },
    },
    select: { id: true, ma_can: true },
  });
  const apartmentByCode = new Map(apartments.map((apartment) => [apartment.ma_can, apartment]));

  const missingApartments = [];
  const snapshotRows = [];
  for (const row of feeRows) {
    const apartment = apartmentByCode.get(row.ma_can);
    if (!apartment) {
      missingApartments.push(row.ma_can);
      continue;
    }

    const paidThroughInfo =
      row.payload_json &&
      typeof row.payload_json === "object" &&
      row.payload_json.paidThrough
        ? row.payload_json.paidThrough
        : buildPaidThroughInfo(row.thang_da_dong_den_hien_tai);

    snapshotRows.push({
      can_ho_id: apartment.id,
      ma_can: apartment.ma_can,
      thang_da_dong_den_hien_tai: row.thang_da_dong_den_hien_tai,
      payload_public_json: {
        sourceImportBatchId: importBatch.id,
        sourceRowId: row.id,
        sourceExcelRow: row.so_dong_nguon,
        paidThrough: paidThroughInfo,
        publicDisplayText: paidThroughInfo.displayText,
        needsReview: Boolean(paidThroughInfo.needsReview),
        isPartialPayment: Boolean(paidThroughInfo.isPartialPayment),
        isOutsideBaseYear: Boolean(paidThroughInfo.isOutsideBaseYear),
        unusualPaidThrough: isUnusualPaidThrough(row.thang_da_dong_den_hien_tai),
      },
    });
  }

  const period = inferPeriod(importBatch.ten_file);
  const draftBatch = await prisma.batchTrangThaiPhiPublic.create({
    data: {
      lo_nhap_du_lieu_id: importBatch.id,
      ky_du_lieu: period,
      ten_file_nguon: importBatch.ten_file,
      trang_thai: "NHAP",
      la_batch_public_hien_hanh: false,
      tong_so_can: snapshotRows.length,
      tong_quan_loi: missingApartments.length
        ? `Missing apartments: ${missingApartments.join(", ")}`
        : null,
      metadata_json: {
        sourceImportBatchId: importBatch.id,
        sourceRows: feeRows.length,
        missingApartments,
        needsReviewRows: snapshotRows.filter((row) => row.payload_public_json.needsReview).length,
        partialPaymentRows: snapshotRows.filter((row) => row.payload_public_json.isPartialPayment)
          .length,
        outsideBaseYearRows: snapshotRows.filter(
          (row) => row.payload_public_json.isOutsideBaseYear
        ).length,
      },
      trang_thai_phi: {
        createMany: {
          data: snapshotRows.map((row) => ({
            can_ho_id: row.can_ho_id,
            ma_can: row.ma_can,
            thang_da_dong_den_hien_tai: row.thang_da_dong_den_hien_tai,
            ky_du_lieu: period,
            payload_public_json: row.payload_public_json,
          })),
        },
      },
    },
  });

  const publicBatchCount = await prisma.batchTrangThaiPhiPublic.count({
    where: { la_batch_public_hien_hanh: true },
  });

  console.log(
    JSON.stringify(
      {
        importBatchId: importBatch.id,
        draftPublicBatchId: draftBatch.id,
        status: draftBatch.trang_thai,
        isCurrentPublicBatch: draftBatch.la_batch_public_hien_hanh,
        period,
        sourceRows: feeRows.length,
        snapshotRows: snapshotRows.length,
        missingApartments: missingApartments.length,
        needsReviewRows: snapshotRows.filter((row) => row.payload_public_json.needsReview).length,
        partialPaymentRows: snapshotRows.filter((row) => row.payload_public_json.isPartialPayment)
          .length,
        outsideBaseYearRows: snapshotRows.filter(
          (row) => row.payload_public_json.isOutsideBaseYear
        ).length,
        currentPublicBatchCount: publicBatchCount,
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

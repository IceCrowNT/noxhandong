import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

if (!process.env.DATABASE_URL) {
  throw new Error("Thieu DATABASE_URL trong .env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type JsonRecord = Record<string, unknown>;

function args() {
  const values = process.argv.slice(2);
  const period = values.find((value) => value.startsWith("--period="))?.split("=")[1] || "T6-2026";
  return { period };
}

function jsonRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function jsonNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatDate(value: Date | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(value)
    : "";
}

function monthRange(period: string) {
  const match = period.match(/^T(\d{1,2})-(\d{4})$/i);
  if (!match) return null;

  const month = Number(match[1]);
  const year = Number(match[2]);
  const vietnamOffsetMs = 7 * 60 * 60 * 1000;

  return {
    from: new Date(Date.UTC(year, month - 1, 1) - vietnamOffsetMs),
    to: new Date(Date.UTC(year, month, 1) - vietnamOffsetMs),
  };
}

function previousPeriod(period: string) {
  const match = period.match(/^T(\d{1,2})-(\d{4})$/i);
  if (!match) return null;

  let month = Number(match[1]) - 1;
  let year = Number(match[2]);
  if (month <= 0) {
    month = 12;
    year -= 1;
  }
  return `T${month}-${year}`;
}

function compactPeriodLabel(period: string) {
  const match = period.match(/^T(\d{1,2})-(\d{4})$/i);
  if (!match) return period;
  return `T${Number(match[1])}`;
}

function resolveRelativeMonth(relativeMonth: number, baseYear = 2026) {
  const zeroBasedMonthIndex = relativeMonth - 1;
  return {
    year: baseYear + Math.floor(zeroBasedMonthIndex / 12),
    month: ((zeroBasedMonthIndex % 12) + 12) % 12 + 1,
  };
}

function formatPaidThrough(payload: JsonRecord, fallback: string | null) {
  const paidThroughObj = jsonRecord(payload?.paidThrough);
  
  let numericMonth: number | null = null;
  const numFromPaidThrough = Number(paidThroughObj?.numericMonth);
  const numFromPayload = Number(payload?.numericMonth);
  
  if (paidThroughObj?.numericMonth !== undefined && Number.isFinite(numFromPaidThrough)) numericMonth = Math.floor(numFromPaidThrough);
  else if (payload?.numericMonth !== undefined && Number.isFinite(numFromPayload)) numericMonth = Math.floor(numFromPayload);
  else {
    const match = String(fallback || "").match(/-?\d+(?:[.,]\d+)?/);
    if (match) {
      const parsed = Number(match[0].replace(",", "."));
      if (Number.isFinite(parsed)) numericMonth = Math.floor(parsed);
    }
  }

  if (numericMonth === null) {
    return fallback || "";
  }

  const resolvedMonth = Number(paidThroughObj?.resolvedMonth);
  const resolvedYear = Number(paidThroughObj?.resolvedYear);

  if (paidThroughObj?.resolvedMonth !== undefined && paidThroughObj?.resolvedYear !== undefined && Number.isFinite(resolvedMonth) && Number.isFinite(resolvedYear)) {
    return `Hết tháng ${resolvedMonth}/${resolvedYear}`;
  }

  const resolved = resolveRelativeMonth(numericMonth);
  return `Hết tháng ${resolved.month}/${resolved.year}`;
}

function makeSheet(rows: Array<Record<string, unknown>>, widths: number[], filter = true) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = widths.map((wch) => ({ wch }));
  if (filter && sheet["!ref"]) sheet["!autofilter"] = { ref: sheet["!ref"] };
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  return sheet;
}

function setMoneyFormat(sheet: XLSX.WorkSheet, columns: number[], rowCount: number) {
  for (const column of columns) {
    for (let row = 2; row <= rowCount + 1; row += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ c: column, r: row - 1 })];
      if (cell) cell.z = "#,##0";
    }
  }
}

async function main() {
  const { period } = args();
  const periodColumnLabel = period.replace("-", " ");
  const previousPeriodCode = previousPeriod(period);
  const previousPeriodLabel = previousPeriodCode ? compactPeriodLabel(previousPeriodCode) : "ky truoc";
  const exportStatus = "FINAL";

  const target = await prisma.batchTrangThaiPhiPublic.findFirst({
    where: { ky_du_lieu: period, trang_thai: "DA_PUBLIC" },
    orderBy: { id: "desc" },
  });

  if (!target) {
    throw new Error(`Ky ${period} chua duoc cong khai, khong the xuat file FINAL.`);
  }

  const range = monthRange(period);

  const [apartments, targetRows, previousPublishedBatch, approvedTransactionsInMonth, reviewTransactions] =
    await Promise.all([
      prisma.canHo.findMany({
        orderBy: { ma_can: "asc" },
        select: {
          id: true,
          ma_can: true,
          loai_can: true,
          ma_lo: true,
          chu_ho_ten_goc: true,
          ghi_chu: true,
        },
      }),
      prisma.trangThaiPhiCanHoPublic.findMany({
        where: { batch_id: target.id },
        select: {
          can_ho_id: true,
          thang_da_dong_den_hien_tai: true,
          ghi_chu_public: true,
          payload_public_json: true,
        },
      }),
      previousPeriodCode
        ? prisma.batchTrangThaiPhiPublic.findFirst({
            where: { ky_du_lieu: previousPeriodCode, trang_thai: "DA_PUBLIC" },
            orderBy: { id: "desc" },
            select: { id: true },
          })
        : null,
      prisma.giaoDichNganHang.findMany({
        where: {
          so_tien: { gt: 0 },
          trang_thai_duyet: "DA_DUYET",
          ...(range ? { ngay_giao_dich: { gte: range.from, lt: range.to } } : {}),
          lich_su_dong_phi: {
            some: { loai_nguon: { in: ["GIAO_DICH_DA_DUYET", "BO_SUNG_QUA_KHU"] } },
          },
        },
        orderBy: [{ ngay_giao_dich: "asc" }, { id: "asc" }],
        include: {
          lich_su_dong_phi: {
            where: { loai_nguon: { in: ["GIAO_DICH_DA_DUYET", "BO_SUNG_QUA_KHU"] } },
            orderBy: [{ ngay_tao: "asc" }, { id: "asc" }],
            include: {
              can_ho: { select: { ma_can: true } },
              giao_dich_ngan_hang: {
                select: {
                  id: true,
                  ngay_giao_dich: true,
                  tham_chieu_ngan_hang: true,
                  ten_nguoi_chuyen: true,
                  tai_khoan_nguoi_chuyen: true,
                  noi_dung_goc: true,
                  trang_thai_duyet: true,
                  nguoi_duyet: true,
                  ngay_duyet: true,
                  chung_tu_doi_soat: { select: { id: true, loai_chung_tu: true } },
                },
              },
            },
          },
        },
      }),
      prisma.giaoDichNganHang.findMany({
        where: {
          trang_thai_duyet: { in: ["CHUA_DUYET", "DA_RA_SOAT"] },
          ...(range ? { ngay_giao_dich: { gte: range.from, lt: range.to } } : {}),
        },
        orderBy: [{ ngay_giao_dich: "asc" }, { id: "asc" }],
        select: {
          id: true,
          ngay_giao_dich: true,
          so_tien: true,
          ten_nguoi_chuyen: true,
          tham_chieu_ngan_hang: true,
          noi_dung_goc: true,
          ma_can_parse: true,
          ma_can_duoc_chon: true,
          trang_thai_khop: true,
          trang_thai_duyet: true,
          ghi_chu_duyet: true,
        },
      }),
    ]);

  const previousRows =
    previousPublishedBatch?.id
      ? await prisma.trangThaiPhiCanHoPublic.findMany({
          where: { batch_id: previousPublishedBatch.id },
          select: { can_ho_id: true, thang_da_dong_den_hien_tai: true, payload_public_json: true },
        })
      : [];

  const histories = approvedTransactionsInMonth.flatMap((transaction) =>
    transaction.lich_su_dong_phi.filter((history) => history.giao_dich_ngan_hang_id === transaction.id),
  );

  const targetByApartment = new Map(targetRows.map((row) => [row.can_ho_id, row]));
  const previousByApartment = new Map(previousRows.map((row) => [row.can_ho_id, row]));
  const historiesByApartment = new Map<number, typeof histories>();

  for (const history of histories) {
    const list = historiesByApartment.get(history.can_ho_id) || [];
    list.push(history);
    historiesByApartment.set(history.can_ho_id, list);
  }

  const trackingRows = apartments.map((apartment, index) => {
    const targetRow = targetByApartment.get(apartment.id);
    const previousRow = previousByApartment.get(apartment.id);
    const apartmentHistories = historiesByApartment.get(apartment.id) || [];
    const paymentAmount = apartmentHistories.reduce((sum, row) => sum + Number(row.so_tien), 0);
    const previousPayload = jsonRecord(previousRow?.payload_public_json);
    const payload = jsonRecord(targetRow?.payload_public_json);
    const remainder = jsonNumber(payload.remainderAmount);
    const needsReview = Boolean(payload.needsReview) || remainder > 0;
    const transactionTimes = apartmentHistories
      .map((row) => formatDate(row.giao_dich_ngan_hang?.ngay_giao_dich))
      .filter(Boolean);
    const latestTransactionTime =
      apartmentHistories
        .map((row) => row.giao_dich_ngan_hang?.ngay_giao_dich || null)
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    return {
      STT: index + 1,
      "Mã căn": apartment.ma_can,
      "Loại căn": apartment.loai_can === "CHUNG_CU" ? "Chung cư" : "Liền kề",
      "Lô": apartment.ma_lo,
      "Chủ hộ gốc": apartment.chu_ho_ten_goc || "",
      [`Trạng thái cuối ${previousPeriodLabel}`]: previousRow ? formatPaidThrough(previousPayload, previousRow.thang_da_dong_den_hien_tai) : "",
      [periodColumnLabel]: paymentAmount,
      "Tháng đã đóng đến hiện tại": targetRow ? formatPaidThrough(payload, targetRow.thang_da_dong_den_hien_tai) : "",
      "Tháng hệ cơ sở (DB thô)": targetRow?.thang_da_dong_den_hien_tai || "",
      "Giao dịch trong tháng": transactionTimes.join("\n"),
      "Giao dịch gần nhất": formatDate(latestTransactionTime),
      "Trạng thái": needsReview ? "Cần kiểm tra" : paymentAmount > 0 ? "Đã ghi nhận" : "Không phát sinh",
      "Ghi chú": targetRow?.ghi_chu_public || apartment.ghi_chu || "",
    };
  });

  const transactionRows = histories.map((history, index) => ({
    STT: index + 1,
    "Mã căn": history.can_ho.ma_can,
    "Ngày giao dịch": formatDate(history.giao_dich_ngan_hang?.ngay_giao_dich),
    "Số tiền": Number(history.so_tien),
    "Người chuyển": history.giao_dich_ngan_hang?.ten_nguoi_chuyen || "",
    "Tài khoản/SDT": history.giao_dich_ngan_hang?.tai_khoan_nguoi_chuyen || "",
    "Mã tham chiếu": history.giao_dich_ngan_hang?.tham_chieu_ngan_hang || "",
    "Nội dung chuyển khoản": history.giao_dich_ngan_hang?.noi_dung_goc || "",
    "Trạng thái duyệt": history.giao_dich_ngan_hang?.trang_thai_duyet || "",
    "Người duyệt": history.giao_dich_ngan_hang?.nguoi_duyet || "",
    "Ngày duyệt": formatDate(history.giao_dich_ngan_hang?.ngay_duyet),
    "Số bằng chứng": history.giao_dich_ngan_hang?.chung_tu_doi_soat.length || 0,
    "Ghi chú": history.ghi_chu || "",
  }));

  const changedRows = trackingRows.filter((row) => Number(row[periodColumnLabel]) > 0);
  const reviewRows = reviewTransactions.map((transaction, index) => ({
    STT: index + 1,
    "Ngày giao dịch": formatDate(transaction.ngay_giao_dich),
    "Số tiền": Number(transaction.so_tien),
    "Người chuyển": transaction.ten_nguoi_chuyen || "",
    "Mã tham chiếu": transaction.tham_chieu_ngan_hang || "",
    "Mã căn parser": transaction.ma_can_parse || "",
    "Mã căn đang chọn": transaction.ma_can_duoc_chon || "",
    "Trạng thái parser": transaction.trang_thai_khop || "",
    "Trạng thái duyệt": transaction.trang_thai_duyet,
    "Nội dung chuyển khoản": transaction.noi_dung_goc,
    "Ghi chú": transaction.ghi_chu_duyet || "",
  }));

  const periodTransactionWhere = {
    so_tien: { gt: 0 },
    ...(range ? { ngay_giao_dich: { gte: range.from, lt: range.to } } : {}),
  };

  const [totalCreditTransactions, totalCreditAmountResult, approvedTransactionCount, approvedTransactionAmountResult] =
    await Promise.all([
      prisma.giaoDichNganHang.count({ where: periodTransactionWhere }),
      prisma.giaoDichNganHang.aggregate({
        where: periodTransactionWhere,
        _sum: { so_tien: true },
      }),
      prisma.giaoDichNganHang.count({
        where: { ...periodTransactionWhere, trang_thai_duyet: "DA_DUYET" },
      }),
      prisma.giaoDichNganHang.aggregate({
        where: { ...periodTransactionWhere, trang_thai_duyet: "DA_DUYET" },
        _sum: { so_tien: true },
      }),
    ]);

  const reviewAmount = reviewTransactions.reduce((sum, transaction) => sum + Number(transaction.so_tien), 0);
  const approvedAmount = histories.reduce((sum, row) => sum + Number(row.so_tien), 0);
  const totalCreditAmount = Number(totalCreditAmountResult._sum.so_tien || 0);
  const approvedTransactionAmount = Number(approvedTransactionAmountResult._sum.so_tien || 0);
  const approvedButUnallocatedAmount = Math.max(0, approvedTransactionAmount - approvedAmount);
  const unrecordedCreditAmount = Math.max(0, totalCreditAmount - approvedAmount);

  const infoRows = [
    { "Thông tin": "Kỳ dữ liệu", "Giá trị": period },
    { "Thông tin": "Thời điểm xuất", "Giá trị": formatDate(new Date()) },
    { "Thông tin": "Tổng số căn", "Giá trị": apartments.length },
    { "Thông tin": "Tổng số giao dịch ghi có trong kỳ", "Giá trị": totalCreditTransactions },
    { "Thông tin": "Tổng tiền ghi có trong kỳ", "Giá trị": totalCreditAmount },
    { "Thông tin": "Số giao dịch ngân hàng đã duyệt", "Giá trị": approvedTransactionCount },
    { "Thông tin": "Tổng tiền giao dịch ngân hàng đã duyệt", "Giá trị": approvedTransactionAmount },
    { "Thông tin": "Số khoản phí đã phân bổ vào căn trong tháng", "Giá trị": histories.length },
    { "Thông tin": "Tổng tiền đã phân bổ và ghi nhận căn hộ trong tháng", "Giá trị": approvedAmount },
    { "Thông tin": "Số căn thay đổi", "Giá trị": changedRows.length },
    { "Thông tin": "Giao dịch cần rà soát", "Giá trị": reviewRows.length },
    { "Thông tin": "Tổng tiền cần rà soát/chưa gắn căn", "Giá trị": reviewAmount },
    { "Thông tin": "Tiền đã duyệt nhưng chưa phân bổ hết", "Giá trị": approvedButUnallocatedAmount },
    { "Thông tin": "Tổng chênh lệch ghi có chưa được ghi nhận", "Giá trị": unrecordedCreditAmount },
    {
      "Thông tin": "Lưu ý",
      "Giá trị":
        "Sheet theo dõi lấy từ batch đã public. Sheet giao dịch và các số tổng tháng được tính trên toàn bộ giao dịch ghi có của đúng tháng dữ liệu.",
    },
  ];

  const workbook = XLSX.utils.book_new();

  const trackingSheet = makeSheet(trackingRows, [7, 14, 12, 10, 22, 18, 14, 24, 20, 18, 16, 16, 30]);
  setMoneyFormat(trackingSheet, [6], trackingRows.length);
  XLSX.utils.book_append_sheet(workbook, trackingSheet, "Theo doi thu phi");

  const transactionSheet = makeSheet(transactionRows, [7, 14, 20, 15, 24, 18, 22, 55, 18, 18, 20, 14, 35]);
  setMoneyFormat(transactionSheet, [3], transactionRows.length);
  XLSX.utils.book_append_sheet(workbook, transactionSheet, "Giao dich trong ky");

  const changedSheet = makeSheet(changedRows, [7, 14, 12, 10, 22, 18, 14, 24, 20, 18, 16, 16, 30]);
  setMoneyFormat(changedSheet, [6], changedRows.length);
  XLSX.utils.book_append_sheet(workbook, changedSheet, "Can thay doi");

  const reviewSheet = makeSheet(reviewRows, [7, 20, 15, 24, 22, 16, 18, 18, 55, 35]);
  setMoneyFormat(reviewSheet, [2], reviewRows.length);
  XLSX.utils.book_append_sheet(workbook, reviewSheet, "Can ra soat");

  const infoSheet = makeSheet(infoRows, [34, 90], false);
  setMoneyFormat(infoSheet, [1], infoRows.length);
  XLSX.utils.book_append_sheet(workbook, infoSheet, "Thong tin luu tru");

  const outputDir = path.resolve(process.env.EXPORT_DIR || ".local/exports");
  fs.mkdirSync(outputDir, { recursive: true });
  const fileName = `So-theo-doi-thu-phi-${period}-${exportStatus}.xlsx`;
  let outputPath = path.join(outputDir, fileName);

  try {
    XLSX.writeFile(workbook, outputPath, { compression: true });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code !== "EBUSY" && code !== "EPERM") throw error;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    outputPath = path.join(outputDir, `So-theo-doi-thu-phi-${period}-${exportStatus}-${timestamp}.xlsx`);
    XLSX.writeFile(workbook, outputPath, { compression: true });
  }

  console.log(
    JSON.stringify(
      {
        outputPath,
        status: exportStatus,
        period,
        batchId: target.id,
        apartmentRows: trackingRows.length,
        transactionRows: transactionRows.length,
        changedApartmentRows: changedRows.length,
        reviewRows: reviewRows.length,
      },
      null,
      2,
    ),
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

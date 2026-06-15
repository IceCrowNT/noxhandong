import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong .env");
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

function jsonString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function historyIds(value: unknown) {
  const metadata = jsonRecord(value);
  return Array.isArray(metadata.historyRecordIds)
    ? metadata.historyRecordIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];
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
  const published = await prisma.batchTrangThaiPhiPublic.findFirst({
    where: { ky_du_lieu: period, trang_thai: "DA_PUBLIC" },
    orderBy: { id: "desc" },
  });
  const target = published;

  if (!target) {
    throw new Error(`Kỳ ${period} chưa được công khai, không thể xuất file FINAL.`);
  }
  const exportStatus = "FINAL";

  const metadata = jsonRecord(target.metadata_json);
  const previousBatchId = jsonNumber(metadata.previousPublicBatchId) || null;
  const includedHistoryIds = historyIds(metadata);
  const range = monthRange(period);

  const [apartments, targetRows, previousRows, histories, reviewTransactions] = await Promise.all([
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
    previousBatchId
      ? prisma.trangThaiPhiCanHoPublic.findMany({
          where: { batch_id: previousBatchId },
          select: { can_ho_id: true, thang_da_dong_den_hien_tai: true },
        })
      : [],
    prisma.lichSuDongPhiCanHo.findMany({
      where: includedHistoryIds.length ? { id: { in: includedHistoryIds } } : { batch_phi_public_id: target.id },
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
    const payload = jsonRecord(targetRow?.payload_public_json);
    const remainder = jsonNumber(payload.remainderAmount);
    const needsReview = Boolean(payload.needsReview) || remainder > 0;
    const transactionTimes = apartmentHistories
      .map((row) => formatDate(row.giao_dich_ngan_hang?.ngay_giao_dich))
      .filter(Boolean);
    const transactionReferences = apartmentHistories
      .map((row) => row.giao_dich_ngan_hang?.tham_chieu_ngan_hang || "")
      .filter(Boolean);
    return {
      STT: index + 1,
      "Số căn hộ": apartment.ma_can,
      "Loại căn": apartment.loai_can === "CHUNG_CU" ? "Chung cư" : "Liền kề",
      Lô: apartment.ma_lo,
      "Chủ hộ gốc": apartment.chu_ho_ten_goc || "",
      "Trạng thái cuối T5": previousRow?.thang_da_dong_den_hien_tai || "",
      [period.replace("-", " ")]: paymentAmount,
      "Tổng tiền đã ghi nhận": paymentAmount,
      "Tháng đã đóng đến hiện tại": targetRow?.thang_da_dong_den_hien_tai || "",
      "Số giao dịch": apartmentHistories.length,
      "Thời gian phát sinh giao dịch": transactionTimes.join("\n"),
      "Mã tham chiếu ngân hàng": transactionReferences.join("\n"),
      "Còn tiền lẻ": remainder,
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
    "Tài khoản/SĐT": history.giao_dich_ngan_hang?.tai_khoan_nguoi_chuyen || "",
    "Mã tham chiếu": history.giao_dich_ngan_hang?.tham_chieu_ngan_hang || "",
    "Nội dung chuyển khoản": history.giao_dich_ngan_hang?.noi_dung_goc || "",
    "Trạng thái duyệt": history.giao_dich_ngan_hang?.trang_thai_duyet || "",
    "Người duyệt": history.giao_dich_ngan_hang?.nguoi_duyet || "",
    "Ngày duyệt": formatDate(history.giao_dich_ngan_hang?.ngay_duyet),
    "Số bằng chứng": history.giao_dich_ngan_hang?.chung_tu_doi_soat.length || 0,
    "Ghi chú": history.ghi_chu || "",
    "ID lịch sử": history.id,
    "ID giao dịch": history.giao_dich_ngan_hang_id || "",
  }));

  const changedRows = trackingRows.filter((row) => Number(row["Tổng tiền đã ghi nhận"]) > 0);
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
    "ID giao dịch": transaction.id,
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
  const approvedButUnallocatedAmount = approvedTransactionAmount - approvedAmount;
  const unrecordedCreditAmount = totalCreditAmount - approvedAmount;

  const infoRows = [
    { "Thông tin": "Kỳ dữ liệu", "Giá trị": period },
    { "Thông tin": "Trạng thái file", "Giá trị": exportStatus },
    { "Thông tin": "Batch nguồn", "Giá trị": target.id },
    { "Thông tin": "Batch public trước", "Giá trị": previousBatchId || "" },
    { "Thông tin": "Thời điểm xuất", "Giá trị": formatDate(new Date()) },
    { "Thông tin": "Tổng số căn", "Giá trị": apartments.length },
    { "Thông tin": "Tổng số giao dịch ghi có trong kỳ", "Giá trị": totalCreditTransactions },
    { "Thông tin": "Tổng tiền ghi có trong kỳ", "Giá trị": totalCreditAmount },
    { "Thông tin": "Số giao dịch ngân hàng đã duyệt", "Giá trị": approvedTransactionCount },
    { "Thông tin": "Tổng tiền giao dịch ngân hàng đã duyệt", "Giá trị": approvedTransactionAmount },
    { "Thông tin": "Số khoản phí đã phân bổ vào căn", "Giá trị": histories.length },
    { "Thông tin": "Tổng tiền đã phân bổ và ghi nhận căn hộ", "Giá trị": approvedAmount },
    { "Thông tin": "Số căn thay đổi", "Giá trị": changedRows.length },
    { "Thông tin": "Giao dịch cần rà soát", "Giá trị": reviewRows.length },
    { "Thông tin": "Tổng tiền cần rà soát/chưa gắn căn", "Giá trị": reviewAmount },
    { "Thông tin": "Tiền đã duyệt nhưng chưa phân bổ hết", "Giá trị": approvedButUnallocatedAmount },
    { "Thông tin": "Tổng chênh lệch ghi có chưa được ghi nhận", "Giá trị": unrecordedCreditAmount },
    {
      "Thông tin": "Lưu ý",
      "Giá trị":
        "Bản lưu trữ được xuất từ batch đã public.",
    },
  ];

  const workbook = XLSX.utils.book_new();
  const trackingSheet = makeSheet(trackingRows, [7, 14, 12, 10, 24, 20, 15, 20, 25, 13, 28, 24, 15, 18, 35]);
  setMoneyFormat(trackingSheet, [6, 7, 12], trackingRows.length);
  XLSX.utils.book_append_sheet(workbook, trackingSheet, "Theo doi thu phi");

  const transactionSheet = makeSheet(transactionRows, [7, 14, 20, 15, 24, 18, 22, 55, 18, 18, 20, 14, 35, 12, 13]);
  setMoneyFormat(transactionSheet, [3], transactionRows.length);
  XLSX.utils.book_append_sheet(workbook, transactionSheet, "Giao dich trong ky");

  const changedSheet = makeSheet(changedRows, [7, 14, 12, 10, 24, 20, 15, 20, 25, 13, 28, 24, 15, 18, 35]);
  setMoneyFormat(changedSheet, [6, 7, 12], changedRows.length);
  XLSX.utils.book_append_sheet(workbook, changedSheet, "Can thay doi");

  const reviewSheet = makeSheet(reviewRows, [7, 20, 15, 24, 22, 16, 18, 18, 18, 55, 35, 13]);
  setMoneyFormat(reviewSheet, [2], reviewRows.length);
  XLSX.utils.book_append_sheet(workbook, reviewSheet, "Can ra soat");

  const infoSheet = makeSheet(infoRows, [28, 80], false);
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

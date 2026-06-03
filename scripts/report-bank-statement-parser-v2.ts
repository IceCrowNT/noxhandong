// @ts-nocheck

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import XLSX from "xlsx";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { APARTMENT_CODE_PARSER_VERSION, parseApartmentCode } from "../src/modules/transactions/parser/apartment-parser";
import {
  formatDate,
  formatMoney,
  readStatementRows,
  resolveExistingInputArg,
} from "./bank-statement-common";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in .env");
}

const DEFAULT_INPUT = "docs/lich-su-giao-dich(15-04-2026 09_33_29).xls";
const DEFAULT_OUTPUT_DIR = "docs/reports";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function parseArgs(args) {
  const options = {
    from: null,
    ignoreClosingCutoff: false,
  };

  for (const arg of args) {
    if (arg === "--ignore-closing-cutoff") {
      options.ignoreClosingCutoff = true;
      continue;
    }
    if (arg.startsWith("--from=")) {
      const raw = arg.slice("--from=".length).trim();
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid --from datetime: ${raw}`);
      }
      options.from = date;
    }
  }

  return options;
}

function getClosingCutoffFromMetadata(value) {
  if (!value || typeof value !== "object") return null;
  const raw = value.chotDenThoiDiem;
  if (typeof raw !== "string" || !raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function resolveImportCutoff(args) {
  const options = parseArgs(args);
  if (options.ignoreClosingCutoff) {
    return { cutoff: null, source: "ignored_by_flag", closingId: null, closingPeriod: null };
  }
  if (options.from) {
    return { cutoff: options.from, source: "cli_from", closingId: null, closingPeriod: null };
  }

  const latestClosings = await prisma.soChotThang.findMany({
    where: { trang_thai: "DA_CHOT" },
    orderBy: { id: "desc" },
    take: 20,
    select: { id: true, ky_du_lieu: true, metadata_json: true },
  });
  const latestClosing = latestClosings.find((closing) => getClosingCutoffFromMetadata(closing.metadata_json));
  const cutoff = getClosingCutoffFromMetadata(latestClosing?.metadata_json);

  return {
    cutoff,
    source: cutoff ? "latest_monthly_closing_with_cutoff" : "none",
    closingId: latestClosing?.id || null,
    closingPeriod: latestClosing?.ky_du_lieu || null,
  };
}

function publicPayload(payload) {
  return payload && typeof payload === "object" ? payload : {};
}

function paidThroughInfo(status) {
  if (!status) return {};
  const payload = publicPayload(status.payload_public_json);
  return publicPayload(payload.paidThrough);
}

function feePerMonth(apartmentType) {
  if (apartmentType === "LIEN_KE") return 200000;
  if (apartmentType === "CHUNG_CU") return 250000;
  return null;
}

function buildCheckNote({ status, apartment, feeStatus, amount }) {
  if (status === "KHONG_NHAN_DIEN") return "Không nhận diện được căn từ nội dung.";
  if (status === "NHIEU_CAN") return "Có nhiều căn ứng viên, cần kiểm tra bằng mắt.";
  if (status === "MA_CAN_KHONG_TON_TAI") return "Parser ra mã căn nhưng không có trong bảng căn hộ.";
  if (!feeStatus) return "Có căn parser nhưng chưa có dòng trong lịch sử thu phí công khai hiện hành.";

  const monthlyFee = feePerMonth(apartment?.loai_can);
  const paidInfo = paidThroughInfo(feeStatus);
  const numericMonth = typeof paidInfo.numericMonth === "number" ? paidInfo.numericMonth : null;
  const equivalentMonths = monthlyFee ? amount / monthlyFee : null;

  if (equivalentMonths && Number.isInteger(equivalentMonths) && equivalentMonths === 6 && numericMonth !== null && numericMonth < 10) {
    return "Cần kiểm tra: sao kê có khoản tương đương 6 tháng nhưng dữ liệu phí hiện hành chưa thể hiện đã đóng đến tháng 10.";
  }
  if (publicPayload(feeStatus.payload_public_json).isPartialPayment) {
    return "Dữ liệu phí hiện hành đang đánh dấu căn này đóng lẻ tiền.";
  }
  return "Có căn parser và có dữ liệu trong lịch sử thu phí hiện hành.";
}

async function main() {
  const { inputPath, rest } = resolveExistingInputArg(DEFAULT_INPUT);
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) throw new Error(`File not found: ${resolvedPath}`);

  const outputDirArg = rest.find((arg) => !arg.startsWith("--"));
  const outputDir = path.resolve(process.cwd(), outputDirArg || DEFAULT_OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  const statement = readStatementRows(resolvedPath);
  const importCutoff = await resolveImportCutoff(rest);
  const [apartments, currentBatch] = await Promise.all([
    prisma.canHo.findMany({
      select: { id: true, ma_can: true, loai_can: true, chu_ho_ten_goc: true },
    }),
    prisma.batchTrangThaiPhiPublic.findFirst({
      where: { la_batch_public_hien_hanh: true },
      orderBy: { public_luc: "desc" },
      select: { id: true, ky_du_lieu: true, ten_file_nguon: true },
    }),
  ]);

  if (!currentBatch) throw new Error("Chưa có batch thu phí công khai hiện hành để đối chiếu.");

  const feeStatuses = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { batch_id: currentBatch.id },
    select: {
      ma_can: true,
      thang_da_dong_den_hien_tai: true,
      payload_public_json: true,
    },
  });

  const apartmentByCode = new Map(apartments.map((item) => [item.ma_can, item]));
  const feeStatusByCode = new Map(feeStatuses.map((item) => [item.ma_can, item]));

  const detailRows = [];
  const amountByApartment = new Map();
  const allIncomeRecords = statement.records.filter((record) => record.transaction.amount > 0);
  const skippedBeforeOrAtClosingRows = importCutoff.cutoff
    ? allIncomeRecords.filter(
        (record) => record.transaction.transactionDate && record.transaction.transactionDate <= importCutoff.cutoff
      ).length
    : 0;
  const incomeRecords = importCutoff.cutoff
    ? allIncomeRecords.filter(
        (record) => !record.transaction.transactionDate || record.transaction.transactionDate > importCutoff.cutoff
      )
    : allIncomeRecords;

  for (const record of incomeRecords) {
    const parse = parseApartmentCode(record.transaction.description);
    const uniqueCandidates = [...new Set(parse.candidates.map((item) => item.code))];
    const matchedCode = uniqueCandidates.length === 1 ? uniqueCandidates[0] : parse.parsedApartmentCode || "";
    const apartment = matchedCode ? apartmentByCode.get(matchedCode) : null;
    const feeStatus = matchedCode ? feeStatusByCode.get(matchedCode) : null;
    const isValid = Boolean(apartment);
    const status =
      uniqueCandidates.length > 1
        ? "NHIEU_CAN"
        : matchedCode && isValid
          ? "NHAN_DIEN_DUOC_CAN"
          : matchedCode
            ? "MA_CAN_KHONG_TON_TAI"
            : "KHONG_NHAN_DIEN";
    const publicText =
      publicPayload(feeStatus?.payload_public_json).publicDisplayText ||
      feeStatus?.thang_da_dong_den_hien_tai ||
      "";
    const checkNote = buildCheckNote({ status, apartment, feeStatus, amount: record.transaction.amount });
    const monthlyFee = feePerMonth(apartment?.loai_can);
    const equivalentMonths = monthlyFee && record.transaction.amount > 0 ? record.transaction.amount / monthlyFee : null;

    if (matchedCode && isValid) {
      amountByApartment.set(matchedCode, (amountByApartment.get(matchedCode) || 0) + record.transaction.amount);
    }

    detailRows.push({
      "Dòng Excel": record.sourceRowIndex,
      "Ngày": formatDate(record.transaction.transactionDate),
      "Số tiền": record.transaction.amount,
      "Nội dung": record.transaction.description,
      "Căn parser": matchedCode,
      "Trạng thái parser": status,
      "Ứng viên": uniqueCandidates.join(", "),
      "Lý do parser": parse.matchReason,
      "Loại căn": apartment?.loai_can || "",
      "Chủ hộ gốc": apartment?.chu_ho_ten_goc || "",
      "Tương đương số tháng": equivalentMonths === null ? "" : Number(equivalentMonths.toFixed(2)),
      "Trạng thái thu phí hiện hành": publicText,
      "Đối chiếu gợi ý": checkNote,
      "Người chuyển": record.transaction.senderName,
      "TK đối ứng": record.transaction.senderAccount,
      "Mã giao dịch": record.transaction.transactionId,
    });
  }

  const reviewRows = detailRows.filter((row) => row["Đối chiếu gợi ý"].startsWith("Cần kiểm tra") || row["Trạng thái parser"] !== "NHAN_DIEN_DUOC_CAN");
  const summary = {
    sourceFile: inputPath,
    parserVersion: APARTMENT_CODE_PARSER_VERSION,
    currentFeeBatchId: currentBatch.id,
    currentFeePeriod: currentBatch.ky_du_lieu,
    rawRows: statement.records.length,
    skippedExpenseRows: statement.records.length - allIncomeRecords.length,
    skippedBeforeOrAtClosingRows,
    totalRows: incomeRecords.length,
    incomeRows: incomeRecords.length,
    parsedValidRows: detailRows.filter((row) => row["Trạng thái parser"] === "NHAN_DIEN_DUOC_CAN").length,
    multiCandidateRows: detailRows.filter((row) => row["Trạng thái parser"] === "NHIEU_CAN").length,
    invalidApartmentRows: detailRows.filter((row) => row["Trạng thái parser"] === "MA_CAN_KHONG_TON_TAI").length,
    unparsedRows: detailRows.filter((row) => row["Trạng thái parser"] === "KHONG_NHAN_DIEN").length,
    uniqueParsedApartments: amountByApartment.size,
    totalParsedIncomeAmount: [...amountByApartment.values()].reduce((sum, amount) => sum + amount, 0),
    needsVisualReviewRows: reviewRows.length,
    importCutoff: {
      source: importCutoff.source,
      cutoffAt: importCutoff.cutoff?.toISOString() || null,
      closingId: importCutoff.closingId,
      closingPeriod: importCutoff.closingPeriod,
    },
  };

  const annotatedRows = statement.rows.map((row, index) => {
    const copy = [...row];
    if (index === statement.headerIndex) {
      copy.splice(statement.descriptionIndex + 1, 0, "Căn parser");
      return copy;
    }
    const record = statement.records.find((item) => item.sourceRowIndex === index + 1);
    if (!record) {
      copy.splice(statement.descriptionIndex + 1, 0, "");
      return copy;
    }
    const detail = detailRows.find((item) => item["Dòng Excel"] === record.sourceRowIndex);
    if (!detail && record.transaction.amount <= 0) {
      copy.splice(statement.descriptionIndex + 1, 0, "Bỏ qua: thanh toán chi");
      return copy;
    }
    if (!detail && importCutoff.cutoff && record.transaction.transactionDate && record.transaction.transactionDate <= importCutoff.cutoff) {
      copy.splice(statement.descriptionIndex + 1, 0, "Bỏ qua: đã thuộc mốc chốt Excel/opening balance");
      return copy;
    }
    const parserText = detail
      ? [
          detail["Căn parser"] || detail["Trạng thái parser"],
          detail["Trạng thái thu phí hiện hành"] ? `Phí: ${detail["Trạng thái thu phí hiện hành"]}` : "",
          detail["Đối chiếu gợi ý"],
        ]
          .filter(Boolean)
          .join(" | ")
      : "";
    copy.splice(statement.descriptionIndex + 1, 0, parserText);
    return copy;
  });

  const baseName = path.basename(resolvedPath, path.extname(resolvedPath)).replace(/[^\p{L}\p{N}_-]+/gu, "-");
  const outputXlsx = path.join(outputDir, `${baseName}-parser-doi-chieu.xlsx`);
  const outputJson = path.join(outputDir, `${baseName}-parser-summary.json`);
  const outputCsv = path.join(outputDir, `${baseName}-can-kiem-tra.csv`);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(annotatedRows), "Sao ke co parser");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { "Chỉ số": "File sao kê", "Giá trị": inputPath },
      { "Chỉ số": "Parser version", "Giá trị": APARTMENT_CODE_PARSER_VERSION },
      { "Chỉ số": "Batch thu phí đối chiếu", "Giá trị": `${currentBatch.ky_du_lieu} (#${currentBatch.id})` },
      { "Chỉ số": "Tổng dòng thô trong sao kê", "Giá trị": summary.rawRows },
      { "Chỉ số": "Dòng thanh toán chi đã bỏ qua", "Giá trị": summary.skippedExpenseRows },
      { "Chỉ số": "Dòng thu đã thuộc mốc chốt", "Giá trị": summary.skippedBeforeOrAtClosingRows },
      { "Chỉ số": "Dòng thanh toán thu được phân tích", "Giá trị": summary.incomeRows },
      { "Chỉ số": "Dòng nhận diện được căn", "Giá trị": summary.parsedValidRows },
      { "Chỉ số": "Dòng nhiều căn ứng viên", "Giá trị": summary.multiCandidateRows },
      { "Chỉ số": "Dòng mã căn không tồn tại", "Giá trị": summary.invalidApartmentRows },
      { "Chỉ số": "Dòng không nhận diện căn", "Giá trị": summary.unparsedRows },
      { "Chỉ số": "Số căn nhận diện duy nhất", "Giá trị": summary.uniqueParsedApartments },
      { "Chỉ số": "Tổng tiền vào đã nhận diện căn", "Giá trị": formatMoney(summary.totalParsedIncomeAmount) },
      { "Chỉ số": "Dòng cần kiểm tra bằng mắt", "Giá trị": summary.needsVisualReviewRows },
    ]),
    "Tong hop"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows), "Chi tiet parser");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reviewRows), "Can kiem tra");
  XLSX.writeFile(workbook, outputXlsx);

  fs.writeFileSync(outputJson, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(outputCsv, XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(reviewRows)), "utf8");

  console.log(JSON.stringify({ ...summary, outputXlsx, outputJson, outputCsv }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

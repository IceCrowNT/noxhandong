// @ts-nocheck

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import XLSX from "xlsx";
import { parseApartmentCode } from "../src/modules/transactions/parser/apartment-parser";
import { normalizeApartmentCode, normalizeHeader, safeString } from "../src/modules/shared/utils/text";
import { formatDate, formatMoney, readStatementRows, transactionFingerprint } from "./bank-statement-common";

const DEFAULT_TRACKING_HINT = "Theo dõi thu phí T5.xlsx";
const DEFAULT_STATEMENT_HINT = "lich-su-giao-dich T5(26).xls";
const DEFAULT_TRACKING_SHEET = "Lịch sử đóng phí";
const DEFAULT_MONTH_COLUMN = "T5";
const DEFAULT_PERIOD = "T5-2026";
const DEFAULT_OUTPUT_DIR = "docs/reports";

type Args = {
  tracking?: string;
  statement?: string;
  monthColumn: string;
  period: string;
  outputDir: string;
};

type FeeTrackingRow = {
  sourceRowIndex: number;
  apartmentCode: string;
  targetAmount: number;
  totalAmount: number;
  paidThrough: string;
  note: string;
  rawRow: Record<string, unknown>;
};

type Allocation = {
  apartmentCode: string;
  amount: number;
  method: string;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = {
    monthColumn: DEFAULT_MONTH_COLUMN,
    period: DEFAULT_PERIOD,
    outputDir: DEFAULT_OUTPUT_DIR,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--tracking") result.tracking = args[++index];
    else if (arg === "--statement") result.statement = args[++index];
    else if (arg === "--month") result.monthColumn = args[++index] || result.monthColumn;
    else if (arg === "--period") result.period = args[++index] || result.period;
    else if (arg === "--out") result.outputDir = args[++index] || result.outputDir;
  }

  return result;
}

function resolveFileByHint(baseDir: string, hint: string): string {
  const direct = path.resolve(process.cwd(), hint);
  if (fs.existsSync(direct)) return direct;

  const normalizedHint = normalizeHeader(path.basename(hint));
  const stack = [baseDir];
  const files: string[] = [];

  while (stack.length) {
    const current = stack.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      if (entry.isFile()) files.push(fullPath);
    }
  }

  const matched = files.find((file) => {
    const name = path.basename(file);
    return normalizeHeader(name) === normalizedHint || normalizeHeader(name).includes(normalizedHint);
  });

  if (!matched) {
    throw new Error(`Cannot find file matching "${hint}" under ${baseDir}`);
  }

  return matched;
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") return value;
  const text = safeString(value).replace(/[^\d.-]/g, "");
  if (!text) return 0;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowToMappedObject(headers: string[], values: unknown[]): Record<string, unknown> {
  return headers.reduce((mapped, header, index) => {
    mapped[safeString(header) || `__EMPTY_${index}`] = values[index] ?? "";
    return mapped;
  }, {});
}

function findTrackingHeaderRow(rows: unknown[][]) {
  for (let index = 0; index < Math.min(rows.length, 50); index += 1) {
    const normalized = rows[index].map((cell) => normalizeHeader(safeString(cell)));
    const codeIndex = normalized.findIndex((header) => header === "so can ho");
    const paidThroughIndex = normalized.findIndex((header) => header.includes("thang da dong den hien tai"));
    if (codeIndex >= 0 && paidThroughIndex >= 0) return { rowIndex: index, codeIndex, paidThroughIndex };
  }
  throw new Error(`Cannot detect tracking header row in sheet "${DEFAULT_TRACKING_SHEET}"`);
}

function findTrackingColumn(headers: string[], label: string): number {
  const normalizedLabel = normalizeHeader(label);
  const index = headers.findIndex((header) => normalizeHeader(header) === normalizedLabel);
  if (index < 0) {
    throw new Error(`Cannot find column "${label}". Headers: ${headers.join(" | ")}`);
  }
  return index;
}

function readFeeTrackingRows(filePath: string, monthColumn: string): FeeTrackingRow[] {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[DEFAULT_TRACKING_SHEET];
  if (!sheet) throw new Error(`Cannot find sheet "${DEFAULT_TRACKING_SHEET}" in ${filePath}`);

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false }) as unknown[][];
  const headerInfo = findTrackingHeaderRow(rows);
  const headers = rows[headerInfo.rowIndex].map(safeString);
  const monthIndex = findTrackingColumn(headers, monthColumn);
  const totalIndex = findTrackingColumn(headers, "Tổng số dư");
  const noteIndex = headers.findIndex((header) => normalizeHeader(header) === "ghi chu");

  return rows
    .slice(headerInfo.rowIndex + 1)
    .map((row, offset) => {
      const sourceRowIndex = headerInfo.rowIndex + 2 + offset;
      const rawCode = safeString(row[headerInfo.codeIndex]);
      const apartmentCode = normalizeApartmentCode(rawCode);
      if (!apartmentCode) return null;

      return {
        sourceRowIndex,
        apartmentCode,
        targetAmount: parseMoney(row[monthIndex]),
        totalAmount: parseMoney(row[totalIndex]),
        paidThrough: safeString(row[headerInfo.paidThroughIndex]),
        note: noteIndex >= 0 ? safeString(row[noteIndex]) : "",
        rawRow: rowToMappedObject(headers, row),
      };
    })
    .filter(Boolean);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function collectCandidateCodes(parseResult, validCodes: Set<string>): string[] {
  const parsed = parseResult.parsedApartmentCode ? normalizeApartmentCode(parseResult.parsedApartmentCode) : null;
  return unique([
    ...(parsed ? [parsed] : []),
    ...parseResult.candidates.map((candidate) => normalizeApartmentCode(candidate.code)).filter(Boolean),
  ]).filter((code) => validCodes.has(code));
}

function detectManualEvidenceReason(record, candidateCodes: string[]): string {
  const description = `${record.transaction.description} ${record.transaction.senderName || ""}`.toUpperCase();
  if (description.includes("ZALO")) return "Chuyển khoản qua Zalo hoặc nội dung Zalo, cần nhập tay căn hộ và lưu ảnh bằng chứng.";
  if (!candidateCodes.length) return "Không nhận diện được căn hộ từ nội dung, cần liên hệ cư dân hoặc đối chiếu ảnh/chứng từ.";
  if (candidateCodes.length > 1) return "Một giao dịch có nhiều căn ứng viên nhưng chưa phân bổ được bằng file theo dõi.";
  return "";
}

function allocateTransaction(record, trackingByCode: Map<string, FeeTrackingRow>, validCodes: Set<string>): {
  allocations: Allocation[];
  status: string;
  reason: string;
  candidates: string[];
} {
  const parseResult = parseApartmentCode(record.transaction.description);
  const candidates = collectCandidateCodes(parseResult, validCodes);

  if (!candidates.length) {
    return {
      allocations: [],
      status: "CAN_NHAP_TAY",
      reason: detectManualEvidenceReason(record, candidates),
      candidates,
    };
  }

  if (candidates.length === 1) {
    return {
      allocations: [{ apartmentCode: candidates[0], amount: record.transaction.amount, method: "MOT_CAN_TU_PARSER" }],
      status: "DA_PHAN_BO_MOT_CAN",
      reason: parseResult.matchReason,
      candidates,
    };
  }

  const candidateTrackingAmounts = candidates.map((code) => ({
    code,
    amount: trackingByCode.get(code)?.targetAmount || 0,
  }));
  const trackingSum = candidateTrackingAmounts.reduce((sum, item) => sum + item.amount, 0);

  if (trackingSum > 0 && trackingSum === record.transaction.amount) {
    return {
      allocations: candidateTrackingAmounts
        .filter((item) => item.amount > 0)
        .map((item) => ({
          apartmentCode: item.code,
          amount: item.amount,
          method: "NHIEU_CAN_THEO_FILE_THEO_DOI",
        })),
      status: "DA_PHAN_BO_NHIEU_CAN",
      reason: `Tổng tiền ${candidates.join(", ")} trong file theo dõi khớp số tiền sao kê.`,
      candidates,
    };
  }

  return {
    allocations: [],
    status: "CAN_RA_SOAT_NHIEU_CAN",
    reason: `Parser thấy nhiều căn (${candidates.join(", ")}) nhưng tổng tiền theo dõi ${formatMoney(trackingSum)} không khớp sao kê ${formatMoney(record.transaction.amount)}.`,
    candidates,
  };
}

function apartmentReconcileStatus(trackingAmount: number, statementAmount: number): string {
  if (trackingAmount === 0 && statementAmount === 0) return "KHONG_PHAT_SINH";
  if (trackingAmount === statementAmount) return "KHOP";
  if (trackingAmount > 0 && statementAmount === 0) return "CO_THEO_DOI_CHUA_THAY_SAO_KE";
  if (trackingAmount === 0 && statementAmount > 0) return "CO_SAO_KE_CHUA_GHI_THEO_DOI";
  return "LECH_TIEN";
}

function makeSafeBaseName(value: string): string {
  return path.basename(value, path.extname(value)).replace(/[^\p{L}\p{N}_-]+/gu, "-");
}

function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
  return items.reduce((result, item) => {
    const key = getKey(item);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {} as Record<string, number>);
}

async function main() {
  const args = parseArgs();
  const docsDir = path.resolve(process.cwd(), "docs");
  const resourcesDir = path.resolve(process.cwd(), "docs/resources");
  const trackingPath = args.tracking
    ? path.resolve(process.cwd(), args.tracking)
    : resolveFileByHint(docsDir, DEFAULT_TRACKING_HINT);
  const statementPath = args.statement
    ? path.resolve(process.cwd(), args.statement)
    : resolveFileByHint(resourcesDir, DEFAULT_STATEMENT_HINT);
  const outputDir = path.resolve(process.cwd(), args.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const trackingRows = readFeeTrackingRows(trackingPath, args.monthColumn);
  const trackingByCode = new Map(trackingRows.map((row) => [row.apartmentCode, row]));
  const validCodes = new Set(trackingByCode.keys());
  const statement = readStatementRows(statementPath);
  const incomeRecords = statement.records.filter((record) => record.transaction.amount > 0);

  const allocatedByCode = new Map<string, number>();
  const transactionRows = [];
  const manualEvidenceRows = [];

  for (const record of incomeRecords) {
    const allocation = allocateTransaction(record, trackingByCode, validCodes);
    const fingerprint = transactionFingerprint(record.transaction);
    const allocationText = allocation.allocations
      .map((item) => `${item.apartmentCode}: ${formatMoney(item.amount)}`)
      .join("; ");

    for (const item of allocation.allocations) {
      allocatedByCode.set(item.apartmentCode, (allocatedByCode.get(item.apartmentCode) || 0) + item.amount);
    }

    const row = {
      "Dòng sao kê": record.sourceRowIndex,
      "Ngày": formatDate(record.transaction.transactionDate),
      "Số tiền thu": record.transaction.amount,
      "Nội dung gốc": record.transaction.description,
      "Người chuyển": record.transaction.senderName || "",
      "Tài khoản chuyển": record.transaction.senderAccount || "",
      "Mã giao dịch": record.transaction.transactionId || "",
      "Fingerprint": fingerprint,
      "Ứng viên căn": allocation.candidates.join(", "),
      "Phân bổ": allocationText,
      "Trạng thái đối soát": allocation.status,
      "Ghi chú": allocation.reason,
    };
    transactionRows.push(row);

    if (!allocation.allocations.length || allocation.status.startsWith("CAN_")) {
      manualEvidenceRows.push({
        ...row,
        "Loại bằng chứng cần lưu": "Ảnh Zalo / ảnh sao kê cư dân / ghi chú xác nhận thủ công",
        "Gợi ý lưu": "Gắn theo căn, ngày giao dịch, số tiền và mã giao dịch ngân hàng nếu có.",
      });
    }
  }

  const apartmentRows = trackingRows.map((row) => {
    const statementAmount = allocatedByCode.get(row.apartmentCode) || 0;
    const difference = statementAmount - row.targetAmount;
    const status = apartmentReconcileStatus(row.targetAmount, statementAmount);
    return {
      "Dòng theo dõi": row.sourceRowIndex,
      "Mã căn": row.apartmentCode,
      [`File theo dõi ${args.monthColumn}`]: row.targetAmount,
      "Sao kê đã phân bổ": statementAmount,
      "Chênh lệch": difference,
      "Trạng thái": status,
      "Tháng đã đóng đến hiện tại": row.paidThrough,
      "Tổng số dư trên file theo dõi": row.totalAmount,
      "Ghi chú file theo dõi": row.note,
    };
  });

  const issueRows = apartmentRows.filter((row) => row["Trạng thái"] !== "KHONG_PHAT_SINH" && row["Trạng thái"] !== "KHOP");
  const apartmentStatusCounts = countBy(apartmentRows, (row) => row["Trạng thái"]);
  const transactionStatusCounts = countBy(transactionRows, (row) => row["Trạng thái đối soát"]);
  const parsedIncomeAmount = transactionRows
    .filter((row) => row["Phân bổ"])
    .reduce((sum, row) => sum + Number(row["Số tiền thu"] || 0), 0);
  const trackingMonthAmount = trackingRows.reduce((sum, row) => sum + row.targetAmount, 0);
  const allocatedAmount = [...allocatedByCode.values()].reduce((sum, amount) => sum + amount, 0);
  const summary = {
    period: args.period,
    monthColumn: args.monthColumn,
    trackingFile: path.basename(trackingPath),
    statementFile: path.basename(statementPath),
    trackingRows: trackingRows.length,
    rawStatementRows: statement.records.length,
    incomeStatementRows: incomeRecords.length,
    skippedExpenseRows: statement.records.length - incomeRecords.length,
    trackingMonthAmount,
    allocatedStatementAmount: allocatedAmount,
    parsedIncomeAmount,
    matchedApartments: apartmentRows.filter((row) => row["Trạng thái"] === "KHOP").length,
    issueApartments: issueRows.length,
    manualEvidenceRows: manualEvidenceRows.length,
    multiAllocatedTransactions: transactionRows.filter((row) => row["Trạng thái đối soát"] === "DA_PHAN_BO_NHIEU_CAN").length,
    unresolvedMultiTransactions: transactionRows.filter((row) => row["Trạng thái đối soát"] === "CAN_RA_SOAT_NHIEU_CAN").length,
    manualInputTransactions: transactionRows.filter((row) => row["Trạng thái đối soát"] === "CAN_NHAP_TAY").length,
    apartmentStatusCounts,
    transactionStatusCounts,
  };

  const outputBase = `${args.period}-${makeSafeBaseName(path.basename(statementPath))}-doi-soat-theo-doi`;
  const outputXlsx = path.join(outputDir, `${outputBase}.xlsx`);
  const outputJson = path.join(outputDir, `${outputBase}-summary.json`);
  const outputCsv = path.join(outputDir, `${outputBase}-can-xu-ly.csv`);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { "Chỉ số": "Kỳ đối soát", "Giá trị": summary.period },
      { "Chỉ số": "Cột theo dõi", "Giá trị": summary.monthColumn },
      { "Chỉ số": "File theo dõi", "Giá trị": summary.trackingFile },
      { "Chỉ số": "File sao kê", "Giá trị": summary.statementFile },
      { "Chỉ số": "Số căn trong file theo dõi", "Giá trị": summary.trackingRows },
      { "Chỉ số": "Dòng sao kê thu", "Giá trị": summary.incomeStatementRows },
      { "Chỉ số": "Dòng sao kê chi đã bỏ qua", "Giá trị": summary.skippedExpenseRows },
      { "Chỉ số": "Tổng tiền cột theo dõi", "Giá trị": formatMoney(summary.trackingMonthAmount) },
      { "Chỉ số": "Tổng tiền sao kê đã phân bổ", "Giá trị": formatMoney(summary.allocatedStatementAmount) },
      { "Chỉ số": "Căn khớp tiền", "Giá trị": summary.matchedApartments },
      { "Chỉ số": "Căn còn sai khớp", "Giá trị": summary.issueApartments },
      { "Chỉ số": "Giao dịch cần bằng chứng/nhập tay", "Giá trị": summary.manualEvidenceRows },
      { "Chỉ số": "Giao dịch nhiều căn tự phân bổ theo file theo dõi", "Giá trị": summary.multiAllocatedTransactions },
      { "Chỉ số": "Giao dịch nhiều căn chưa phân bổ được", "Giá trị": summary.unresolvedMultiTransactions },
      { "Chỉ số": "Giao dịch không nhận diện căn", "Giá trị": summary.manualInputTransactions },
      ...Object.entries(apartmentStatusCounts).map(([key, value]) => ({
        "Chỉ số": `Căn hộ - ${key}`,
        "Giá trị": value,
      })),
      ...Object.entries(transactionStatusCounts).map(([key, value]) => ({
        "Chỉ số": `Giao dịch - ${key}`,
        "Giá trị": value,
      })),
    ]),
    "Tong hop"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(apartmentRows), "Doi soat can ho");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(issueRows), "Can xu ly");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionRows), "Giao dich sao ke");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(manualEvidenceRows), "Bang chung nhap tay");
  XLSX.writeFile(workbook, outputXlsx);

  fs.writeFileSync(outputJson, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(outputCsv, XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(issueRows)), "utf8");

  console.log(JSON.stringify({ ...summary, outputXlsx, outputJson, outputCsv }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

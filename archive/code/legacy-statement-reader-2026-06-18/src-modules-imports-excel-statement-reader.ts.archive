import * as XLSX from "xlsx";
import {
  DEFAULT_STATEMENT_COLUMN_ALIASES,
  MANAGEMENT_SHEET_NAMES,
} from "@/src/modules/shared/constants";
import { TransactionRecord } from "@/src/modules/shared/types";
import { normalizeHeader, safeString } from "@/src/modules/shared/utils/text";

function matchAliasScore(cellValue: string, aliases: readonly string[]): number {
  const normalizedCell = normalizeHeader(cellValue)
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedCell) {
    return 0;
  }

  let score = 0;
  for (const alias of aliases) {
    if (normalizedCell === alias) {
      score += 6;
      continue;
    }

    if (normalizedCell.includes(alias) || alias.includes(normalizedCell)) {
      score += 3;
    }
  }

  return score;
}

function scoreHeaderRow(row: unknown[]): number {
  const dateScore = row.reduce<number>((sum, cell) => {
    return sum + matchAliasScore(safeString(cell), DEFAULT_STATEMENT_COLUMN_ALIASES.transactionDate);
  }, 0);
  const amountScore = row.reduce<number>((sum, cell) => {
    return sum + matchAliasScore(safeString(cell), DEFAULT_STATEMENT_COLUMN_ALIASES.amount);
  }, 0);
  const descriptionScore = row.reduce<number>((sum, cell) => {
    return sum + matchAliasScore(safeString(cell), DEFAULT_STATEMENT_COLUMN_ALIASES.description);
  }, 0);

  return dateScore + amountScore + descriptionScore;
}

function looksLikeDate(value: unknown): boolean {
  if (typeof value === "number") {
    return true;
  }

  const raw = safeString(value);
  return /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/.test(raw);
}

function looksLikeAmount(value: unknown): boolean {
  if (typeof value === "number") {
    return value !== 0;
  }

  const raw = safeString(value);
  return /^-?\d{1,3}([.,]\d{3})+([.,]\d+)?$/.test(raw) || /^-?\d{4,}$/.test(raw);
}

function inferColumnIndex(
  rows: unknown[][],
  startRow: number,
  matcher: (value: unknown) => boolean,
  minimumMatches: number
): number {
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  let bestColumn = -1;
  let bestScore = 0;

  for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
    let matchedRows = 0;

    for (const row of rows.slice(startRow, startRow + 40)) {
      if (matcher(row[columnIndex])) {
        matchedRows += 1;
      }
    }

    if (matchedRows > bestScore && matchedRows >= minimumMatches) {
      bestScore = matchedRows;
      bestColumn = columnIndex;
    }
  }

  return bestColumn;
}

function findMatchingSheet(workbook: XLSX.WorkBook): XLSX.WorkSheet {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: ""
    });
    const headerRow = rows.find((row) => scoreHeaderRow(row) > 0);

    if (headerRow) {
      return sheet;
    }
  }

  return workbook.Sheets[workbook.SheetNames[0]];
}

function looksLikeManagementWorkbook(workbook: XLSX.WorkBook): boolean {
  return workbook.SheetNames.includes(MANAGEMENT_SHEET_NAMES.customers) &&
    workbook.SheetNames.includes(MANAGEMENT_SHEET_NAMES.paymentHistory);
}

function detectHeaderRow(rows: unknown[][]): number {
  let bestIndex = -1;
  let bestScore = 0;

  for (const [index, row] of rows.slice(0, 20).entries()) {
    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  if (bestIndex >= 0 && bestScore >= 6) {
    return bestIndex;
  }

  const inferredDescriptionColumn = inferColumnIndex(
    rows,
    0,
    (value) => {
      const raw = safeString(value);
      return raw.length > 10 && /[A-Za-zÀ-ỹ0-9]/.test(raw);
    },
    3
  );
  const inferredDateColumn = inferColumnIndex(rows, 0, looksLikeDate, 2);

  if (inferredDescriptionColumn >= 0 || inferredDateColumn >= 0) {
    const firstDataRowIndex = rows.findIndex((row) => {
      const hasDescription = inferredDescriptionColumn >= 0 && safeString(row[inferredDescriptionColumn]).length > 10;
      const hasDate = inferredDateColumn >= 0 && looksLikeDate(row[inferredDateColumn]);
      return hasDescription || hasDate;
    });

    if (firstDataRowIndex > 0) {
      return firstDataRowIndex - 1;
    }
  }

  return -1;
}

function findColumnIndex(headers: string[], aliases: readonly string[]): number {
  return headers.findIndex((header) => matchAliasScore(header, aliases) > 0);
}

function normalizeDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) {
      return undefined;
    }
    const month = `${parsed.m}`.padStart(2, "0");
    const day = `${parsed.d}`.padStart(2, "0");
    return `${parsed.y}-${month}-${day}`;
  }

  const raw = safeString(value);
  const normalized = raw.replace(/[.]/g, "/");
  const matched = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matched) {
    const day = matched[1].padStart(2, "0");
    const month = matched[2].padStart(2, "0");
    return `${matched[3]}-${month}-${day}`;
  }

  return raw;
}

function parseAmount(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  const raw = safeString(value).replace(/[^\d-]/g, "");
  return raw ? Number(raw) : 0;
}

export function readStatementWorkbook(buffer: ArrayBuffer): TransactionRecord[] {
  const workbook = XLSX.read(buffer, { type: "array" });

  if (looksLikeManagementWorkbook(workbook)) {
    throw new Error("File sao kê có vẻ là file quản lý chung cư. Hãy chọn đúng file sao kê ngân hàng.");
  }

  const sheet = findMatchingSheet(workbook);
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: ""
  });
  const detectedHeaderRowIndex = detectHeaderRow(matrix);
  const hasHeader = detectedHeaderRowIndex >= 0;
  const headerRowIndex = hasHeader ? detectedHeaderRowIndex : 0;
  const headers = hasHeader
    ? matrix[headerRowIndex].map((cell) => safeString(cell))
    : Array.from({ length: matrix.reduce((max, row) => Math.max(max, row.length), 0) }, (_, index) => `COLUMN_${index + 1}`);
  const dataStartRowIndex = hasHeader ? headerRowIndex + 1 : 0;

  const transactionDateIndex =
    hasHeader && findColumnIndex(headers, DEFAULT_STATEMENT_COLUMN_ALIASES.transactionDate) >= 0
      ? findColumnIndex(headers, DEFAULT_STATEMENT_COLUMN_ALIASES.transactionDate)
      : inferColumnIndex(matrix, dataStartRowIndex, looksLikeDate, 2);
  const amountIndex =
    hasHeader && findColumnIndex(headers, DEFAULT_STATEMENT_COLUMN_ALIASES.amount) >= 0
      ? findColumnIndex(headers, DEFAULT_STATEMENT_COLUMN_ALIASES.amount)
      : inferColumnIndex(matrix, dataStartRowIndex, looksLikeAmount, 2);
  const descriptionIndex =
    hasHeader && findColumnIndex(headers, DEFAULT_STATEMENT_COLUMN_ALIASES.description) >= 0
      ? findColumnIndex(headers, DEFAULT_STATEMENT_COLUMN_ALIASES.description)
      : inferColumnIndex(
          matrix,
          dataStartRowIndex,
          (value) => safeString(value).length > 10 && !looksLikeAmount(value),
          2
        );
  const senderNameIndex = findColumnIndex(headers, DEFAULT_STATEMENT_COLUMN_ALIASES.senderName);
  const senderAccountIndex = findColumnIndex(headers, DEFAULT_STATEMENT_COLUMN_ALIASES.senderAccount);
  const transactionIdIndex = findColumnIndex(headers, DEFAULT_STATEMENT_COLUMN_ALIASES.transactionId);

  if (descriptionIndex < 0 || amountIndex < 0) {
    throw new Error(
      `Không tìm thấy cột nội dung hoặc số tiền trong file sao kê. Header nhận diện: ${headers.filter(Boolean).slice(0, 12).join(" | ")}`
    );
  }

  return matrix.slice(dataStartRowIndex).flatMap((row) => {
    const description = safeString(row[descriptionIndex]);
    const amount = parseAmount(row[amountIndex]);

    if (!description && !amount) {
      return [];
    }

    const rawRow = headers.reduce<Record<string, unknown>>((accumulator, header, index) => {
      accumulator[header || `COLUMN_${index + 1}`] = row[index];
      return accumulator;
    }, {});

    return [
      {
        transactionDate: transactionDateIndex >= 0 ? normalizeDate(row[transactionDateIndex]) : undefined,
        amount,
        description,
        senderName: senderNameIndex >= 0 ? safeString(row[senderNameIndex]) : undefined,
        senderAccount: senderAccountIndex >= 0 ? safeString(row[senderAccountIndex]) : undefined,
        transactionId: transactionIdIndex >= 0 ? safeString(row[transactionIdIndex]) : undefined,
        rawRow
      }
    ];
  });
}

// @ts-nocheck

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { normalizeHeader, safeString } from "../src/modules/shared/utils/text";

export interface StatementTransaction {
  transactionDate: Date | null;
  amount: number;
  description: string;
  senderName: string | null;
  senderAccount: string | null;
  transactionId: string | null;
  rawRow: Record<string, unknown>;
}

export interface StatementRecord {
  sourceRowIndex: number;
  headers: string[];
  values: unknown[];
  row: unknown[];
  mappedRow: Record<string, unknown>;
  transaction: StatementTransaction;
}

export function fileHash(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function normalizeJsonValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeJsonValue(item)]));
  }
  return value;
}

export function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const raw = safeString(value).replace(/[^\d-]/g, "");
  return raw ? Number(raw) : 0;
}

export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    // Bank statement timestamps are local Vietnam business time. Constructing
    // with Date.UTC would shift them by +7h when displayed in Asia/Saigon.
    return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
  }

  const raw = safeString(value);
  const match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (!match) return null;
  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

export function formatDate(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function formatMoney(value: number): string {
  return Number(value || 0).toLocaleString("vi-VN");
}

function rowToMappedObject(headers: string[], values: unknown[]): Record<string, unknown> {
  return headers.reduce((mapped, header, index) => {
    const key = safeString(header) || `__EMPTY_${index}`;
    mapped[key] = values[index] ?? "";
    return mapped;
  }, {});
}

export function findHeaderRow(rows: unknown[][]): number {
  let best = { index: -1, score: 0 };
  for (let index = 0; index < Math.min(rows.length, 80); index += 1) {
    const normalized = rows[index].map((cell) => normalizeHeader(safeString(cell)));
    const score =
      Number(normalized.some((cell) => cell.includes("ngay hach toan") || cell.includes("accounting date"))) +
      Number(normalized.some((cell) => cell.includes("mo ta giao dich") || cell.includes("transaction description"))) * 3 +
      Number(normalized.some((cell) => cell.includes("co") || cell.includes("credit"))) +
      Number(normalized.some((cell) => cell.includes("no") || cell.includes("debit")));

    if (score > best.score) best = { index, score };
  }

  if (best.index < 0 || best.score < 3) {
    throw new Error("Cannot detect bank statement header row.");
  }

  return best.index;
}

export function findColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((header) => aliases.some((alias) => header.includes(alias)));
}

export function findDebitColumn(headers: string[]): number {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((header) => header.includes("debit") || /^no\b/.test(header));
}

export function findCreditColumn(headers: string[]): number {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((header) => header.includes("credit") || /^co\b/.test(header));
}

export function readStatementRows(filePath: string) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" }) as unknown[][];
  const headerIndex = findHeaderRow(rows);
  const headers = rows[headerIndex].map(safeString);
  const normalizedHeaders = headers.map(normalizeHeader);

  const dateIndex = findColumn(headers, ["ngay hach toan", "accounting date", "ngay phat sinh giao dich", "transaction date"]);
  const descriptionIndex = findColumn(headers, ["mo ta giao dich", "transaction description"]);
  const debitIndex = findDebitColumn(headers);
  const creditIndex = findCreditColumn(headers);
  const transactionIdIndex = findColumn(headers, ["so giao dich", "transaction number"]);
  const senderAccountIndex = findColumn(headers, ["so tai khoan doi ung", "corresponsive account"]);
  const senderNameIndex = findColumn(headers, ["ten tai khoan doi ung", "corresponsive name"]);

  if (descriptionIndex < 0 || (debitIndex < 0 && creditIndex < 0)) {
    throw new Error(`Cannot detect statement columns. Headers: ${headers.join(" | ")}`);
  }

  const records: StatementRecord[] = [];
  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const description = safeString(row[descriptionIndex]);
    const debit = debitIndex >= 0 ? parseNumber(row[debitIndex]) : 0;
    const credit = creditIndex >= 0 ? parseNumber(row[creditIndex]) : 0;
    const amount = credit > 0 ? credit : debit > 0 ? -debit : 0;
    if (!description && !amount) return;

    const mappedRow = rowToMappedObject(headers, row);
    records.push({
      sourceRowIndex: headerIndex + 2 + offset,
      headers,
      values: normalizeJsonValue(row) as unknown[],
      row,
      mappedRow: normalizeJsonValue(mappedRow) as Record<string, unknown>,
      transaction: {
        transactionDate: dateIndex >= 0 ? parseDate(row[dateIndex]) : null,
        amount,
        description,
        senderName: senderNameIndex >= 0 ? safeString(row[senderNameIndex]) : null,
        senderAccount: senderAccountIndex >= 0 ? safeString(row[senderAccountIndex]) : null,
        transactionId: transactionIdIndex >= 0 ? safeString(row[transactionIdIndex]) : null,
        rawRow: normalizeJsonValue(mappedRow) as Record<string, unknown>,
      },
    });
  });

  return {
    workbook,
    sheetName,
    rows,
    headerIndex,
    headerRowNumber: headerIndex + 1,
    headers,
    normalizedHeaders,
    descriptionIndex,
    records,
  };
}

export function transactionFingerprint(transaction: StatementTransaction): string {
  return crypto
    .createHash("sha256")
    .update(
      [
        transaction.transactionDate?.toISOString() || "",
        transaction.amount,
        transaction.description,
        transaction.senderAccount || "",
        transaction.transactionId || "",
      ].join("|")
    )
    .digest("hex");
}

export function resolveExistingInputArg(defaultInput: string, args = process.argv.slice(2)) {
  if (!args.length) {
    return { inputPath: defaultInput, rest: [] };
  }

  for (let end = args.length; end >= 1; end -= 1) {
    const candidate = args.slice(0, end).join(" ");
    if (fs.existsSync(path.resolve(process.cwd(), candidate))) {
      return { inputPath: candidate, rest: args.slice(end) };
    }
  }

  return { inputPath: args[0], rest: args.slice(1) };
}

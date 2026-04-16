import { TransactionRecord } from "@/src/modules/shared/types";
import { normalizeWhitespace, safeString } from "@/src/modules/shared/utils/text";

const DATE_AT_START_PATTERN = /^\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/;
const DATE_ANYWHERE_PATTERN = /(\d{1,2}[/-]\d{1,2}[/-]\d{4})/;
const MONEY_PATTERN = /-?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|-?\d{4,}/g;
const TRANSACTION_ID_PATTERN = /\b(?:FT|GD|REF|TRANS|TXN)[A-Z0-9-]{4,}\b/i;

function normalizePdfDate(raw: string): string | undefined {
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) {
    return undefined;
  }

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  return `${match[3]}-${month}-${day}`;
}

function parseMoney(raw: string): number {
  const normalized = raw.replace(/[.,](?=\d{3}\b)/g, "").replace(/,/g, ".");
  return Number(normalized);
}

function sanitizeDescription(groupText: string, amountTokens: string[]): string {
  let description = groupText.replace(DATE_AT_START_PATTERN, " ");

  for (const token of amountTokens.slice(-2)) {
    description = description.replace(token, " ");
  }

  return normalizeWhitespace(description);
}

function splitIntoTransactionGroups(text: string): string[] {
  const normalizedText = normalizeWhitespace(text.replace(/\r?\n/g, " "));
  const matches = [...normalizedText.matchAll(/\d{1,2}[/-]\d{1,2}[/-]\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/g)];
  const groups: string[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index ?? 0;
    const end = matches[index + 1]?.index ?? normalizedText.length;
    const group = normalizeWhitespace(normalizedText.slice(start, end));
    if (group) {
      groups.push(group);
    }
  }

  return groups;
}

export function parsePdfTransactionGroup(groupText: string): TransactionRecord | undefined {
  const dateMatch = groupText.match(DATE_AT_START_PATTERN) || groupText.match(DATE_ANYWHERE_PATTERN);
  if (!dateMatch) {
    return undefined;
  }

  const amountTokens = [...groupText.matchAll(MONEY_PATTERN)].map((match) => match[0]);
  if (amountTokens.length === 0) {
    return undefined;
  }

  const amountToken = amountTokens.length >= 2 ? amountTokens[amountTokens.length - 2] : amountTokens[0];
  const amount = parseMoney(amountToken);
  const description = sanitizeDescription(groupText, amountTokens);
  const transactionId = safeString(groupText.match(TRANSACTION_ID_PATTERN)?.[0]);

  if (!description || !Number.isFinite(amount) || amount === 0) {
    return undefined;
  }

  return {
    transactionDate: normalizePdfDate(dateMatch[1]),
    amount,
    description,
    transactionId: transactionId || undefined,
    rawRow: {
      source: "pdf",
      rawText: groupText
    }
  };
}

export async function readStatementPdf(buffer: ArrayBuffer): Promise<TransactionRecord[]> {
  const [{ PDFParse }, { getData }] = await Promise.all([import("pdf-parse"), import("pdf-parse/worker")]);
  PDFParse.setWorker(getData());
  const parser = new PDFParse({ data: Buffer.from(buffer) });
  const parsed = await parser.getText();
  await parser.destroy();
  const groups = splitIntoTransactionGroups(parsed.text);
  const transactions = groups
    .map((groupText) => parsePdfTransactionGroup(groupText))
    .filter((record): record is TransactionRecord => Boolean(record));

  if (transactions.length === 0) {
    throw new Error("Không parse được giao dịch từ file PDF. Cần kiểm tra lại format sao kê.");
  }

  return transactions;
}

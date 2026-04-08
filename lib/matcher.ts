import { ApartmentParseResult, CustomerRecord, ReviewRow, TransactionRecord } from "@/lib/types";
import { normalizeApartmentCode } from "@/lib/utils/text";

const INTERNAL_KEYWORDS = [
  "TRA LAI TAI KHOAN",
  "DDA",
  "BQT",
  "BHXH",
  "BHYT",
  "BHTN",
  "LUONG",
  "THU LAO",
  "NOXH",
  "BAN QUAN TRI"
];

const GENERIC_NON_APARTMENT_KEYWORDS = [
  "CHUYEN KHOAN NHANH",
  "QUA ZALO",
  "CHUYEN KHOAN",
  "CK NHANH",
  "NHANH QUA",
  "NAP TIEN",
  "HOAN TIEN"
];

const APARTMENT_CONTEXT_KEYWORDS = [
  "CAN",
  "CAN HO",
  "PHI",
  "QLVH",
  "QLCC",
  "DONG",
  "NOP",
  "THANG",
  "CHUNG CU",
  "CC"
];

function hasApartmentContext(parseResult: ApartmentParseResult): boolean {
  const content = parseResult.normalizedDescription;
  return (
    parseResult.candidates.length > 0 ||
    /\bL[1-9][A-C]?\b/.test(content) ||
    APARTMENT_CONTEXT_KEYWORDS.some((keyword) => content.includes(keyword))
  );
}

function isInternalTransaction(transaction: TransactionRecord, parseResult: ApartmentParseResult): boolean {
  if (transaction.amount <= 0 || transaction.amount < 100000) {
    return true;
  }

  const content = `${transaction.description} ${parseResult.normalizedDescription}`.toUpperCase();
  if (INTERNAL_KEYWORDS.some((keyword) => content.includes(keyword))) {
    return true;
  }

  if (!hasApartmentContext(parseResult) && GENERIC_NON_APARTMENT_KEYWORDS.some((keyword) => content.includes(keyword))) {
    return true;
  }

  return false;
}

function makeId(index: number, transaction: TransactionRecord): string {
  return [
    index + 1,
    transaction.transactionDate ?? "NA",
    transaction.amount,
    transaction.transactionId ?? transaction.description.slice(0, 30)
  ].join("-");
}

export function buildReviewRows(
  transactions: TransactionRecord[],
  parseResults: ApartmentParseResult[],
  customers: CustomerRecord[]
): ReviewRow[] {
  const customerMap = new Map(customers.map((item) => [item.apartmentCode, item]));
  const validCodes = new Set(customerMap.keys());

  return transactions.map((transaction, index) => {
    const parseResult = parseResults[index];
    const suggestions = parseResult.candidates
      .map((item) => item.code)
      .filter((code, suggestionIndex, array) => array.indexOf(code) === suggestionIndex);
    const normalizedParsed = parseResult.parsedApartmentCode
      ? normalizeApartmentCode(parseResult.parsedApartmentCode)
      : undefined;

    let matchStatus: ReviewRow["matchStatus"] = "UNPARSED";
    let matchedApartmentCode: string | undefined;
    let ownerName: string | undefined;
    let matchReason = parseResult.matchReason;
    let matchConfidence = 0.1;

    if (isInternalTransaction(transaction, parseResult)) {
      matchStatus = "IGNORED_INTERNAL";
      matchReason = "Internal or non-resident transaction";
      matchConfidence = 0.05;
    } else if (suggestions.length > 1) {
      matchStatus = "MULTI_MATCH";
      matchConfidence = 0.45;
    } else if (normalizedParsed) {
      if (validCodes.has(normalizedParsed)) {
        matchedApartmentCode = normalizedParsed;
        ownerName = customerMap.get(normalizedParsed)?.ownerName;
        matchStatus =
          parseResult.rawDescription.toUpperCase().includes(normalizedParsed) ||
          parseResult.rawDescription.toUpperCase().includes(normalizedParsed.replace(".", " "))
            ? "EXACT_MATCH"
            : "NORMALIZED_MATCH";
        matchConfidence = matchStatus === "EXACT_MATCH" ? 0.99 : 0.9;
      } else {
        matchStatus = "INVALID_CODE";
        matchConfidence = 0.4;
        matchReason = `Parsed apartment code ${normalizedParsed} does not exist in customer list`;
      }
    }

    return {
      id: makeId(index, transaction),
      transactionDate: transaction.transactionDate,
      amount: transaction.amount,
      rawDescription: transaction.description,
      normalizedDescription: parseResult.normalizedDescription,
      parsedApartmentCode: normalizedParsed,
      matchedApartmentCode,
      matchStatus,
      matchConfidence,
      matchReason,
      ownerName,
      approved: false,
      reviewNote: "",
      senderName: transaction.senderName,
      senderAccount: transaction.senderAccount,
      transactionId: transaction.transactionId,
      suggestions
    };
  });
}

import { ApartmentParseResult, CustomerRecord, ReviewRow, TransactionRecord } from "@/lib/types";
import { FILTER_RULES } from "@/lib/filter-rules";
import { normalizeApartmentCode } from "@/lib/utils/text";

function hasApartmentContext(parseResult: ApartmentParseResult): boolean {
  const content = parseResult.normalizedDescription;
  return (
    parseResult.candidates.length > 0 ||
    /\bL[1-9][A-C]?\b/.test(content) ||
    FILTER_RULES.apartmentContextKeywords.some((keyword) => content.includes(keyword))
  );
}

function hasResidentPaymentSignal(
  transaction: TransactionRecord,
  parseResult: ApartmentParseResult,
  hasValidApartmentCode: boolean
): boolean {
  const content = `${transaction.description} ${parseResult.normalizedDescription}`.toUpperCase();

  return (
    (parseResult.candidates.length > 0 || hasValidApartmentCode) &&
    FILTER_RULES.residentPaymentKeywords.some((keyword) => content.includes(keyword))
  );
}

function detectInternalRule(
  transaction: TransactionRecord,
  parseResult: ApartmentParseResult,
  hasValidApartmentCode: boolean
): string | undefined {
  if (transaction.amount <= 0) {
    return "Bị lọc vì số tiền nhỏ hơn hoặc bằng 0.";
  }

  const content = `${transaction.description} ${parseResult.normalizedDescription}`.toUpperCase();
  const hasResidentSignal = hasResidentPaymentSignal(transaction, parseResult, hasValidApartmentCode);
  const matchedHardKeyword = FILTER_RULES.hardInternalKeywords.find((keyword) => content.includes(keyword));

  if (matchedHardKeyword) {
    return `Bị lọc vì chứa từ khóa nội bộ cứng: ${matchedHardKeyword}.`;
  }

  if (!hasResidentSignal && transaction.amount < FILTER_RULES.minimumResidentAmount) {
    return `Bị lọc vì số tiền nhỏ hơn ngưỡng tối thiểu ${FILTER_RULES.minimumResidentAmount.toLocaleString("vi-VN")} và không có tín hiệu cư dân đóng phí.`;
  }

  const matchedSoftKeyword = FILTER_RULES.softInternalKeywords.find((keyword) => content.includes(keyword));
  if (!hasResidentSignal && matchedSoftKeyword) {
    return `Bị lọc vì chứa từ khóa nội bộ mềm: ${matchedSoftKeyword}, trong khi không có tín hiệu cư dân đóng phí.`;
  }

  if (
    !hasResidentSignal &&
    !hasApartmentContext(parseResult) &&
    FILTER_RULES.genericNonApartmentKeywords.some((keyword) => content.includes(keyword))
  ) {
    const matchedGenericKeyword = FILTER_RULES.genericNonApartmentKeywords.find((keyword) => content.includes(keyword));
    return `Bị lọc vì là giao dịch chuyển khoản chung chung (${matchedGenericKeyword}) và không có ngữ cảnh căn hộ.`;
  }

  return undefined;
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
    const hasValidApartmentCode = normalizedParsed ? validCodes.has(normalizedParsed) : false;

    let matchStatus: ReviewRow["matchStatus"] = "UNPARSED";
    let matchedApartmentCode: string | undefined;
    let ownerName: string | undefined;
    let matchReason = parseResult.matchReason;
    let matchConfidence = 0.1;
    const internalRuleReason = detectInternalRule(transaction, parseResult, hasValidApartmentCode);

    if (internalRuleReason) {
      matchStatus = "IGNORED_INTERNAL";
      matchReason = internalRuleReason;
      matchConfidence = 0.05;
    } else if (suggestions.length > 1) {
      matchStatus = "MULTI_MATCH";
      matchConfidence = 0.45;
    } else if (normalizedParsed) {
      if (hasValidApartmentCode) {
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

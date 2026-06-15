import { ApartmentParseResult, CustomerRecord, ReviewRow, TransactionRecord } from "@/src/modules/shared/types";
import {
  ApartmentTransactionStatus,
  classifyApartmentTransaction
} from "@/src/modules/transactions/parser/apartment-parser";

function makeId(index: number, transaction: TransactionRecord): string {
  return [
    index + 1,
    transaction.transactionDate ?? "NA",
    transaction.amount,
    transaction.transactionId ?? transaction.description.slice(0, 30)
  ].join("-");
}

function toReviewStatus(status: ApartmentTransactionStatus): ReviewRow["matchStatus"] {
  switch (status) {
    case "KHOP_TRUC_TIEP":
      return "EXACT_MATCH";
    case "KHOP_SAU_CHUAN_HOA":
      return "NORMALIZED_MATCH";
    case "NHIEU_CAN":
      return "MULTI_MATCH";
    case "MA_CAN_KHONG_HOP_LE":
      return "INVALID_CODE";
    case "KHONG_LIEN_QUAN_CAN_HO":
      return "IGNORED_INTERNAL";
    default:
      return "UNPARSED";
  }
}

export function buildReviewRows(
  transactions: TransactionRecord[],
  parseResults: ApartmentParseResult[],
  customers: CustomerRecord[]
): ReviewRow[] {
  const customerMap = new Map(customers.map((customer) => [customer.apartmentCode, customer]));
  const validCodes = new Set(customerMap.keys());

  return transactions.map((transaction, index) => {
    const parseResult = parseResults[index];
    const classification = classifyApartmentTransaction(transaction, validCodes, parseResult);
    const matchedApartmentCode = classification.matchedCode && validCodes.has(classification.matchedCode)
      ? classification.matchedCode
      : undefined;

    return {
      id: makeId(index, transaction),
      transactionDate: transaction.transactionDate,
      amount: transaction.amount,
      rawDescription: transaction.description,
      normalizedDescription: parseResult.normalizedDescription,
      parsedApartmentCode: parseResult.parsedApartmentCode,
      matchedApartmentCode,
      matchStatus: toReviewStatus(classification.status),
      matchConfidence: classification.confidence,
      matchReason: classification.reason,
      ownerName: matchedApartmentCode ? customerMap.get(matchedApartmentCode)?.ownerName : undefined,
      approved: false,
      reviewNote: "",
      senderName: transaction.senderName,
      senderAccount: transaction.senderAccount,
      transactionId: transaction.transactionId,
      suggestions: classification.suggestions
    };
  });
}

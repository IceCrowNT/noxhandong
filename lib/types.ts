export type MatchStatus =
  | "EXACT_MATCH"
  | "NORMALIZED_MATCH"
  | "MULTI_MATCH"
  | "INVALID_CODE"
  | "UNPARSED"
  | "IGNORED_INTERNAL"
  | "NEED_REVIEW"
  | "MANUAL_FIXED"
  | "APPROVED";

export interface CustomerRecord {
  apartmentCode: string;
  ownerName?: string;
  residentInfo?: string;
  status?: string;
  note?: string;
  rawRow: Record<string, unknown>;
}

export interface ManagementWorkbookData {
  customers: CustomerRecord[];
  workbookSheetNames: string[];
}

export interface TransactionRecord {
  transactionDate?: string;
  amount: number;
  description: string;
  senderName?: string;
  senderAccount?: string;
  transactionId?: string;
  rawRow: Record<string, unknown>;
}

export interface ApartmentParseCandidate {
  code: string;
  reason: string;
  score: number;
}

export interface ApartmentParseResult {
  rawDescription: string;
  normalizedDescription: string;
  parsedApartmentCode?: string;
  candidates: ApartmentParseCandidate[];
  matchReason: string;
}

export interface ReviewRow {
  id: string;
  transactionDate?: string;
  amount: number;
  rawDescription: string;
  normalizedDescription: string;
  parsedApartmentCode?: string;
  matchedApartmentCode?: string;
  matchStatus: MatchStatus;
  matchConfidence: number;
  matchReason: string;
  ownerName?: string;
  approved: boolean;
  manualApartmentCode?: string;
  reviewNote?: string;
  senderName?: string;
  senderAccount?: string;
  transactionId?: string;
  suggestions: string[];
}

export interface ReviewSummary {
  totalTransactions: number;
  totalAmount: number;
  classifiedAmount: number;
  amountGap: number;
  ignoredCount: number;
  ignoredAmount: number;
  matchedCount: number;
  matchedAmount: number;
  needReviewCount: number;
  needReviewAmount: number;
  invalidCount: number;
  invalidAmount: number;
  unparsedCount: number;
  unparsedAmount: number;
  approvedCount: number;
  pendingAmount: number;
}

export interface AnalyzeResponse {
  workbookInfo: {
    customerCount: number;
    sheetNames: string[];
  };
  validApartmentCodes: string[];
  customerOptions: Array<{
    code: string;
    ownerName?: string;
  }>;
  rows: ReviewRow[];
  summary: ReviewSummary;
}

export interface ExportPayload {
  rows: ReviewRow[];
}

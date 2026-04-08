import { ReviewRow, ReviewSummary } from "@/lib/types";

export function summarizeRows(rows: ReviewRow[]): ReviewSummary {
  const relevantRows = rows.filter((row) => row.matchStatus !== "IGNORED_INTERNAL");
  const approvedCount = relevantRows.filter((row) => row.approved).length;
  const matchedRows = relevantRows.filter((row) =>
    ["EXACT_MATCH", "NORMALIZED_MATCH", "MANUAL_FIXED", "APPROVED"].includes(row.matchStatus)
  );
  const pendingRows = relevantRows.filter((row) => !row.approved);

  return {
    totalTransactions: relevantRows.length,
    ignoredCount: rows.length - relevantRows.length,
    matchedCount: matchedRows.length,
    needReviewCount: relevantRows.filter((row) => ["NEED_REVIEW", "MULTI_MATCH"].includes(row.matchStatus)).length,
    invalidCount: relevantRows.filter((row) => row.matchStatus === "INVALID_CODE").length,
    unparsedCount: relevantRows.filter((row) => row.matchStatus === "UNPARSED").length,
    approvedCount,
    matchedAmount: matchedRows.reduce((sum, row) => sum + row.amount, 0),
    pendingAmount: pendingRows.reduce((sum, row) => sum + row.amount, 0)
  };
}

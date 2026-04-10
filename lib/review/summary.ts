import { ReviewRow, ReviewSummary } from "@/lib/types";
import { isMatchedStatus, isNeedReviewStatus } from "@/lib/review/presentation";

export function summarizeRows(rows: ReviewRow[]): ReviewSummary {
  const approvedCount = rows.filter((row) => row.approved).length;
  const matchedRows = rows.filter((row) => isMatchedStatus(row.matchStatus));
  const needReviewRows = rows.filter((row) => isNeedReviewStatus(row.matchStatus));
  const invalidRows = rows.filter((row) => row.matchStatus === "INVALID_CODE");
  const unparsedRows = rows.filter((row) => row.matchStatus === "UNPARSED");
  const ignoredRows = rows.filter((row) => row.matchStatus === "IGNORED_INTERNAL");
  const pendingRows = rows.filter((row) => !row.approved && row.matchStatus !== "IGNORED_INTERNAL");
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  const classifiedAmount =
    matchedRows.reduce((sum, row) => sum + row.amount, 0) +
    needReviewRows.reduce((sum, row) => sum + row.amount, 0) +
    invalidRows.reduce((sum, row) => sum + row.amount, 0) +
    unparsedRows.reduce((sum, row) => sum + row.amount, 0) +
    ignoredRows.reduce((sum, row) => sum + row.amount, 0);

  return {
    totalTransactions: rows.length,
    totalAmount,
    classifiedAmount,
    amountGap: totalAmount - classifiedAmount,
    ignoredCount: ignoredRows.length,
    ignoredAmount: ignoredRows.reduce((sum, row) => sum + row.amount, 0),
    matchedCount: matchedRows.length,
    matchedAmount: matchedRows.reduce((sum, row) => sum + row.amount, 0),
    needReviewCount: needReviewRows.length,
    needReviewAmount: needReviewRows.reduce((sum, row) => sum + row.amount, 0),
    invalidCount: invalidRows.length,
    invalidAmount: invalidRows.reduce((sum, row) => sum + row.amount, 0),
    unparsedCount: unparsedRows.length,
    unparsedAmount: unparsedRows.reduce((sum, row) => sum + row.amount, 0),
    approvedCount,
    pendingAmount: pendingRows.reduce((sum, row) => sum + row.amount, 0)
  };
}

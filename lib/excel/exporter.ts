import * as XLSX from "xlsx";
import { ReviewRow } from "@/lib/types";
import { summarizeRows } from "@/lib/review/summary";

function reviewedSheetRows(rows: ReviewRow[]) {
  return rows
    .filter((row) => row.approved)
    .map((row, index) => ({
      STT: index + 1,
      "Mã căn hộ chuẩn": row.manualApartmentCode || row.matchedApartmentCode || "",
      "Tên chủ hộ": row.ownerName || "",
      "Ngày giao dịch": row.transactionDate || "",
      "Số tiền": row.amount,
      "Nội dung chuyển khoản gốc": row.rawDescription,
      "Nội dung chuẩn hóa": row.normalizedDescription,
      "Trạng thái match": row.matchStatus,
      "Ghi chú xử lý": row.reviewNote || "",
      "Người dùng đã duyệt": row.approved ? "YES" : "NO"
    }));
}

function needReviewRows(rows: ReviewRow[]) {
  return rows
    .filter(
      (row) =>
        !row.approved ||
        ["UNPARSED", "INVALID_CODE", "MULTI_MATCH", "NEED_REVIEW"].includes(row.matchStatus)
    )
    .map((row, index) => ({
      STT: index + 1,
      "Ngày giao dịch": row.transactionDate || "",
      "Số tiền": row.amount,
      "Nội dung gốc": row.rawDescription,
      "Mã căn parse": row.parsedApartmentCode || "",
      "Mã căn đã match": row.matchedApartmentCode || "",
      "Trạng thái": row.matchStatus,
      "Lý do": row.matchReason,
      "Gợi ý": row.suggestions.join(", "),
      "Đã duyệt": row.approved ? "YES" : "NO",
      "Ghi chú": row.reviewNote || ""
    }));
}

function ignoredRows(rows: ReviewRow[]) {
  return rows
    .filter((row) => row.matchStatus === "IGNORED_INTERNAL")
    .map((row, index) => ({
      STT: index + 1,
      "Ngày giao dịch": row.transactionDate || "",
      "Số tiền": row.amount,
      "Nội dung gốc": row.rawDescription,
      "Nội dung chuẩn hóa": row.normalizedDescription,
      "Lý do": row.matchReason
    }));
}

function originalTransactionRows(rows: ReviewRow[]) {
  return rows.map((row, index) => ({
    STT: index + 1,
    transaction_date: row.transactionDate || "",
    amount: row.amount,
    raw_description: row.rawDescription,
    normalized_description: row.normalizedDescription,
    parsed_apartment_code: row.parsedApartmentCode || "",
    matched_apartment_code: row.manualApartmentCode || row.matchedApartmentCode || "",
    match_status: row.matchStatus,
    match_confidence: row.matchConfidence,
    match_reason: row.matchReason,
    owner_name: row.ownerName || "",
    sender_name: row.senderName || "",
    sender_account: row.senderAccount || "",
    transaction_id: row.transactionId || "",
    approved: row.approved ? "YES" : "NO",
    review_note: row.reviewNote || ""
  }));
}

function summaryRows(rows: ReviewRow[]) {
  const summary = summarizeRows(rows);
  return [
    { Metric: "Tổng số giao dịch liên quan căn hộ", Value: summary.totalTransactions },
    { Metric: "Số lệnh đã lọc bỏ", Value: summary.ignoredCount },
    { Metric: "Số dòng matched", Value: summary.matchedCount },
    { Metric: "Số dòng cần rà soát", Value: summary.needReviewCount },
    { Metric: "Số dòng invalid", Value: summary.invalidCount },
    { Metric: "Số dòng unparsed", Value: summary.unparsedCount },
    { Metric: "Số dòng đã duyệt", Value: summary.approvedCount },
    { Metric: "Tổng số tiền matched", Value: summary.matchedAmount },
    { Metric: "Tổng số tiền chưa xác nhận", Value: summary.pendingAmount }
  ];
}

export function exportReviewWorkbook(rows: ReviewRow[]): Buffer {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(reviewedSheetRows(rows)),
    "Lich su dong phi_reviewed"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(needReviewRows(rows)), "Need_review");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ignoredRows(rows)), "Ignored_internal");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(originalTransactionRows(rows)),
    "Original_transactions"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows(rows)), "Summary");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

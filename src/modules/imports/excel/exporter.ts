import * as XLSX from "xlsx";
import { ReviewRow } from "@/src/modules/shared/types";
import {
  getCategoryLabel,
  getRowCategory,
  getStatusLabel,
} from "@/src/modules/transactions/review/presentation";
import { buildTransactionAllocations } from "@/src/modules/transactions/review/allocations";
import { summarizeRows } from "@/src/modules/transactions/review/summary";

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
      "Hạng mục": getCategoryLabel(getRowCategory(row)),
      "Trạng thái xử lý": getStatusLabel(row.matchStatus),
      "Ghi chú xử lý": row.reviewNote || "",
      "Người dùng đã duyệt": row.approved ? "ĐÃ DUYỆT" : "CHƯA DUYỆT"
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
      "Hạng mục": getCategoryLabel(getRowCategory(row)),
      "Trạng thái": getStatusLabel(row.matchStatus),
      "Lý do": row.matchReason,
      "Gợi ý": row.suggestions.join(", "),
      "Đã duyệt": row.approved ? "ĐÃ DUYỆT" : "CHƯA DUYỆT",
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
    review_category: getCategoryLabel(getRowCategory(row)),
    match_status: getStatusLabel(row.matchStatus),
    match_confidence: row.matchConfidence,
    match_reason: row.matchReason,
    owner_name: row.ownerName || "",
    sender_name: row.senderName || "",
    sender_account: row.senderAccount || "",
    transaction_id: row.transactionId || "",
    approved: row.approved ? "ĐÃ DUYỆT" : "CHƯA DUYỆT",
    review_note: row.reviewNote || ""
  }));
}

function allocationRows(rows: ReviewRow[]) {
  return buildTransactionAllocations(rows).map((item, index) => ({
    STT: index + 1,
    "Ngày tháng": item.transactionDate || "",
    "Nội dung chuyển khoản": item.rawDescription,
    "Tên căn": item.apartmentCode,
    "Số tiền": item.amount,
    "Ghi chú": item.allocationNote,
    "Loại phân bổ":
      item.allocationKind === "SINGLE"
        ? "Một căn"
        : item.allocationKind === "MULTI_EXACT"
          ? "Nhiều căn, khớp phí chuẩn"
          : "Nhiều căn, phân bổ theo tỷ trọng",
    "Mã dòng nguồn": item.sourceRowId
  }));
}

function summaryRows(rows: ReviewRow[]) {
  const summary = summarizeRows(rows);
  const allocations = buildTransactionAllocations(rows);
  const allocatedAmount = allocations.reduce((sum, item) => sum + item.amount, 0);
  return [
    { Metric: "Tổng số giao dịch", Value: summary.totalTransactions },
    { Metric: "Tổng số tiền", Value: summary.totalAmount },
    { Metric: "Tổng tiền đã phân loại", Value: summary.classifiedAmount },
    { Metric: "Chênh lệch tổng tiền", Value: summary.amountGap },
    { Metric: `${getCategoryLabel("MATCHED")} - số đơn`, Value: summary.matchedCount },
    { Metric: `${getCategoryLabel("MATCHED")} - số tiền`, Value: summary.matchedAmount },
    { Metric: `${getCategoryLabel("REVIEW")} - số đơn`, Value: summary.needReviewCount },
    { Metric: `${getCategoryLabel("REVIEW")} - số tiền`, Value: summary.needReviewAmount },
    { Metric: `${getCategoryLabel("INVALID")} - số đơn`, Value: summary.invalidCount },
    { Metric: `${getCategoryLabel("INVALID")} - số tiền`, Value: summary.invalidAmount },
    { Metric: `${getCategoryLabel("UNPARSED")} - số đơn`, Value: summary.unparsedCount },
    { Metric: `${getCategoryLabel("UNPARSED")} - số tiền`, Value: summary.unparsedAmount },
    { Metric: `${getCategoryLabel("IGNORED")} - số đơn`, Value: summary.ignoredCount },
    { Metric: `${getCategoryLabel("IGNORED")} - số tiền`, Value: summary.ignoredAmount },
    { Metric: "Số dòng đã duyệt", Value: summary.approvedCount },
    { Metric: "Tổng số tiền chưa xác nhận", Value: summary.pendingAmount },
    { Metric: "Số dòng phân bổ giao dịch", Value: allocations.length },
    { Metric: "Tổng tiền đã phân bổ", Value: allocatedAmount }
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
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(allocationRows(rows)), "Phan_bo_giao_dich");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(originalTransactionRows(rows)),
    "Original_transactions"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows(rows)), "Summary");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

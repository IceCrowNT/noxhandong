import { MatchStatus, ReviewRow } from "@/lib/types";

export type ReviewCategory =
  | "ALL"
  | "MATCHED"
  | "REVIEW"
  | "INVALID"
  | "UNPARSED"
  | "IGNORED"
  | "UNAPPROVED";

const MATCHED_STATUSES: MatchStatus[] = ["EXACT_MATCH", "NORMALIZED_MATCH", "MANUAL_FIXED", "APPROVED"];
const REVIEW_STATUSES: MatchStatus[] = ["NEED_REVIEW", "MULTI_MATCH"];

export function isMatchedStatus(status: MatchStatus): boolean {
  return MATCHED_STATUSES.includes(status);
}

export function isNeedReviewStatus(status: MatchStatus): boolean {
  return REVIEW_STATUSES.includes(status);
}

export function getCategoryLabel(category: Exclude<ReviewCategory, "ALL" | "UNAPPROVED">): string {
  switch (category) {
    case "MATCHED":
      return "Khớp căn hộ";
    case "REVIEW":
      return "Cần rà soát";
    case "INVALID":
      return "Mã căn không hợp lệ";
    case "UNPARSED":
      return "Chưa nhận diện được căn";
    case "IGNORED":
      return "Không liên quan căn hộ";
  }
}

export function getStatusLabel(status: MatchStatus): string {
  switch (status) {
    case "EXACT_MATCH":
      return "Khớp trực tiếp";
    case "NORMALIZED_MATCH":
      return "Khớp sau chuẩn hóa";
    case "MANUAL_FIXED":
      return "Đã sửa tay";
    case "APPROVED":
      return "Đã duyệt";
    case "MULTI_MATCH":
    case "NEED_REVIEW":
      return "Cần rà soát";
    case "INVALID_CODE":
      return "Mã căn không hợp lệ";
    case "UNPARSED":
      return "Chưa nhận diện được căn";
    case "IGNORED_INTERNAL":
      return "Không liên quan căn hộ";
  }
}

export function getRowCategory(row: ReviewRow): Exclude<ReviewCategory, "ALL" | "UNAPPROVED"> {
  if (isMatchedStatus(row.matchStatus)) {
    return "MATCHED";
  }

  if (isNeedReviewStatus(row.matchStatus)) {
    return "REVIEW";
  }

  if (row.matchStatus === "INVALID_CODE") {
    return "INVALID";
  }

  if (row.matchStatus === "UNPARSED") {
    return "UNPARSED";
  }

  return "IGNORED";
}


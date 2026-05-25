export function adminRoleLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Quản trị cao nhất",
    MANAGER: "Quản lý",
    TECHNICIAN: "Kỹ thuật",
  };
  return value ? labels[value] || value : "-";
}

export function accountStatusLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    DANG_HOAT_DONG: "Đang hoạt động",
    BI_KHOA: "Đã khóa",
  };
  return value ? labels[value] || value : "-";
}

export function apartmentTypeLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    CHUNG_CU: "Chung cư",
    LIEN_KE: "Liền kề",
  };
  return value ? labels[value] || value : "-";
}

export function apartmentStatusLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    DANG_O: "Đang ở",
    TRONG: "Trống",
    KHOA: "Khóa",
  };
  return value ? labels[value] || value : "-";
}

export function contactRoleLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    CHU_HO: "Chủ hộ",
    CHU_MOI: "Chủ mới",
    CHU_CU: "Chủ cũ",
    KHACH_THUE: "Khách thuê",
    NGUOI_THAN: "Người thân",
    NGUOI_NHAN_THONG_BAO: "Người nhận thông báo",
    DONG_HO: "Đồng hộ",
    MOI_GIOI: "Môi giới",
    KHAC: "Khác",
  };
  return value ? labels[value] || value : "-";
}

export function contactReviewStatusLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    CHUA_DUYET: "Chưa duyệt",
    DA_DUYET: "Đã duyệt",
    TU_CHOI: "Từ chối",
  };
  return value ? labels[value] || value : "-";
}

export function contactStatusLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    DANG_DUNG: "Đang dùng",
    CAN_XAC_MINH: "Cần xác minh",
    NGUNG_DUNG: "Ngừng dùng",
  };
  return value ? labels[value] || value : "-";
}

export function importSourceLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    MASTER_CAN_HO: "Danh sách căn hộ master",
    WORKBOOK_THEO_DOI_THU_PHI: "File theo dõi thu phí",
    SAO_KE_NGAN_HANG: "Sao kê ngân hàng",
    MANAGEMENT_WORKBOOK: "File quản lý",
    BANK_STATEMENT: "Sao kê ngân hàng",
    RECEIPT_IMPORT: "Import phiếu thu",
  };
  return value ? labels[value] || value : "-";
}

export function importStatusLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    CHO_XU_LY: "Chờ xử lý",
    DANG_XU_LY: "Đang xử lý",
    HOAN_TAT: "Hoàn tất",
    LOI: "Lỗi",
    PENDING: "Chờ xử lý",
    COMPLETED: "Hoàn tất",
    FAILED: "Lỗi",
  };
  return value ? labels[value] || value : "-";
}

export function publicBatchStatusLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    NHAP: "Bản nháp",
    DA_KIEM_TRA: "Đã kiểm tra",
    DA_PUBLIC: "Đã công khai",
    HUY: "Đã hủy",
  };
  return value ? labels[value] || value : "-";
}

export function reviewFlagLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    MISSING_PHONE: "Thiếu số điện thoại",
    MULTIPLE_PHONES: "Nhiều số điện thoại",
    RAW_NOTE_ONLY: "Chỉ có ghi chú gốc",
    NAME_PHONE_MISMATCH: "Tên/SĐT chưa chắc chắn",
    NEEDS_MANUAL_REVIEW: "Cần rà soát thủ công",
  };
  if (!value) return "-";
  return labels[value] || value.toLowerCase().replace(/_/g, " ");
}

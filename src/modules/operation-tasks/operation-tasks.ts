import type {
  BoPhanCongViecVanHanh,
  HanhDongNhatKyCongViecVanHanh,
  TrangThaiDongCongViecVanHanh,
} from "@prisma/client";

export const OPERATION_TASK_DEPARTMENTS = [
  { value: "KY_THUAT", label: "Kỹ thuật" },
  { value: "VE_SINH", label: "Vệ sinh" },
] as const satisfies ReadonlyArray<{ value: BoPhanCongViecVanHanh; label: string }>;

export const OPERATION_TASK_CLOSE_STATUSES = [
  { value: "HOAN_THANH", label: "Hoàn thành" },
  { value: "BO_QUA", label: "Bỏ qua" },
  { value: "THAY_DOI", label: "Thay đổi" },
] as const satisfies ReadonlyArray<{ value: Exclude<TrangThaiDongCongViecVanHanh, "DANG_MO">; label: string }>;

export type OperationTaskStatusFilter = "open" | "waiting-review" | "overdue" | "closed" | "all";
export type OperationTaskSortKey = "stt" | "assignedAt" | "task" | "department" | "deadline" | "status";
export type SortDirection = "asc" | "desc";

export function operationTaskDepartmentLabel(value: string | null | undefined) {
  return OPERATION_TASK_DEPARTMENTS.find((item) => item.value === value)?.label || value || "-";
}

export function operationTaskCloseStatusLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    DANG_MO: "Đang mở",
    HOAN_THANH: "Hoàn thành",
    BO_QUA: "Bỏ qua",
    THAY_DOI: "Thay đổi",
  };
  return value ? labels[value] || value : "-";
}

export function operationTaskLogActionLabel(value: HanhDongNhatKyCongViecVanHanh | string | null | undefined) {
  const labels: Record<string, string> = {
    TAO: "Tạo công việc",
    SUA: "Sửa công việc",
    BAO_XONG: "Báo xong",
    DONG_VIEC: "Đóng công việc",
    MO_LAI: "Mở lại",
    XOA_MEM: "Xóa công việc",
  };
  return value ? labels[value] || value : "-";
}

export function parseOperationTaskStatusFilter(value: string | null | undefined): OperationTaskStatusFilter {
  if (value === "waiting-review" || value === "overdue" || value === "closed" || value === "all") {
    return value;
  }
  return "open";
}

export function parseOperationTaskSortKey(value: string | null | undefined): OperationTaskSortKey {
  if (value === "assignedAt" || value === "task" || value === "department" || value === "deadline" || value === "status") {
    return value;
  }
  return "deadline";
}

export function parseSortDirection(value: string | null | undefined): SortDirection {
  return value === "desc" ? "desc" : "asc";
}

export function isOperationTaskOverdue(task: { deadline: Date; trang_thai_dong: TrangThaiDongCongViecVanHanh }, now = new Date()) {
  return task.trang_thai_dong === "DANG_MO" && task.deadline.getTime() < now.getTime();
}

export function operationTaskComputedStatus(
  task: { deadline: Date; da_bao_xong: boolean; trang_thai_dong: TrangThaiDongCongViecVanHanh },
  now = new Date()
) {
  if (task.trang_thai_dong !== "DANG_MO") return operationTaskCloseStatusLabel(task.trang_thai_dong);
  if (task.da_bao_xong) return "Chờ nghiệm thu";
  if (isOperationTaskOverdue(task, now)) return "Quá deadline";
  return "Đang làm";
}

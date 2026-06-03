export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatVietnamDateTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "-";

  return date.toLocaleString("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    hour12: false,
  });
}

export function formatVietnamDate(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "-";

  return date.toLocaleDateString("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
  });
}


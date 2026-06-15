export type MonthlyReconciliationRow = {
  id: number;
  transactionId: number;
  maCan: string;
  soTien: number;
  ngayGiaoDich: Date | null;
  nguoiChuyen: string;
  thamChieu: string;
  daPublic: boolean;
  cachPhanBo: string | null;
};

export type MonthlyReconciliationSort = "apartment" | "amount" | "payer" | "date" | "status";
export type MonthlyReconciliationDirection = "asc" | "desc";

export function sortMonthlyReconciliationRows(
  rows: MonthlyReconciliationRow[],
  sort: MonthlyReconciliationSort,
  direction: MonthlyReconciliationDirection,
) {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    let result = 0;
    if (sort === "apartment") {
      result = left.maCan.localeCompare(right.maCan, "vi", { numeric: true, sensitivity: "base" });
    } else if (sort === "amount") {
      result = left.soTien - right.soTien;
    } else if (sort === "payer") {
      result = left.nguoiChuyen.localeCompare(right.nguoiChuyen, "vi", { sensitivity: "base" });
    } else if (sort === "status") {
      result = Number(left.daPublic) - Number(right.daPublic);
    } else {
      result = (left.ngayGiaoDich?.getTime() || 0) - (right.ngayGiaoDich?.getTime() || 0);
    }

    if (result === 0) result = left.id - right.id;
    return result * multiplier;
  });
}

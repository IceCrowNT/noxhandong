import { describe, expect, it } from "vitest";

import {
  sortMonthlyReconciliationRows,
  type MonthlyReconciliationRow,
} from "@/src/modules/transactions/review/monthly-reconciliation-sort";

const rows: MonthlyReconciliationRow[] = [
  {
    id: 1,
    transactionId: 10,
    maCan: "L4A.20",
    soTien: 250_000,
    ngayGiaoDich: new Date("2026-06-10T00:00:00Z"),
    nguoiChuyen: "Bình",
    thamChieu: "B",
    daPublic: true,
    cachPhanBo: null,
  },
  {
    id: 2,
    transactionId: 11,
    maCan: "L4A.3",
    soTien: 1_500_000,
    ngayGiaoDich: new Date("2026-06-11T00:00:00Z"),
    nguoiChuyen: "An",
    thamChieu: "A",
    daPublic: false,
    cachPhanBo: null,
  },
];

describe("monthly reconciliation sorting", () => {
  it("sắp xếp mã căn theo thứ tự số tự nhiên", () => {
    expect(sortMonthlyReconciliationRows(rows, "apartment", "asc").map((row) => row.maCan)).toEqual([
      "L4A.3",
      "L4A.20",
    ]);
  });

  it("sắp xếp số tiền và ngày theo hai chiều", () => {
    expect(sortMonthlyReconciliationRows(rows, "amount", "desc")[0].soTien).toBe(1_500_000);
    expect(sortMonthlyReconciliationRows(rows, "date", "asc")[0].id).toBe(1);
  });

  it("đưa trạng thái chưa public lên trước khi tăng dần", () => {
    expect(sortMonthlyReconciliationRows(rows, "status", "asc")[0].daPublic).toBe(false);
  });
});

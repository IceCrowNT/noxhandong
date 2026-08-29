import { describe, expect, it } from "vitest";

import { isOperationTaskOverdue, operationTaskComputedStatus } from "@/src/modules/operation-tasks/operation-tasks";

describe("operation task status helpers", () => {
  it("derives overdue only for open tasks past deadline", () => {
    const now = new Date("2026-08-27T10:00:00+07:00");

    expect(
      isOperationTaskOverdue({
        deadline: new Date("2026-08-27T09:00:00+07:00"),
        trang_thai_dong: "DANG_MO",
      }, now)
    ).toBe(true);

    expect(
      isOperationTaskOverdue({
        deadline: new Date("2026-08-27T09:00:00+07:00"),
        trang_thai_dong: "HOAN_THANH",
      }, now)
    ).toBe(false);
  });

  it("prioritizes waiting review before overdue", () => {
    const now = new Date("2026-08-27T10:00:00+07:00");

    expect(
      operationTaskComputedStatus({
        deadline: new Date("2026-08-27T09:00:00+07:00"),
        da_bao_xong: true,
        trang_thai_dong: "DANG_MO",
      }, now)
    ).toBe("Chờ nghiệm thu");
  });
});

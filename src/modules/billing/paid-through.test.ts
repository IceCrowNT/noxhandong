import { describe, expect, it } from "vitest";

import {
  buildPaidThroughInfo,
  calculatePaidThroughAdvance,
  parsePaidThroughValue,
  resolveRelativeMonth,
} from "@/src/modules/billing/paid-through";

describe("paid-through billing", () => {
  it("carries a partial payment into the next batch", () => {
    expect(
      calculatePaidThroughAdvance({
        baseNumericMonth: 5,
        previousCarryAmount: 100_000,
        newPaymentAmount: 150_000,
        unitFee: 250_000,
      }),
    ).toEqual({
      previousCarryAmount: 100_000,
      newPaymentAmount: 150_000,
      availableAmount: 250_000,
      addedMonths: 1,
      remainderAmount: 0,
      nextNumericMonth: 6,
    });
  });

  it("keeps a remainder after advancing full months", () => {
    const result = calculatePaidThroughAdvance({
      baseNumericMonth: 5,
      previousCarryAmount: 50_000,
      newPaymentAmount: 500_000,
      unitFee: 250_000,
    });
    expect(result.addedMonths).toBe(2);
    expect(result.remainderAmount).toBe(50_000);
    expect(result.nextNumericMonth).toBe(7);
  });

  it("resolves months outside the base year", () => {
    expect(resolveRelativeMonth(14)).toEqual({ month: 2, year: 2027 });
    expect(buildPaidThroughInfo(-1, "TEST").displayText).toBe("đã đóng hết tháng 11 năm 2025");
  });

  it("uses the same parser for Excel paid-through values", () => {
    expect(parsePaidThroughValue("Đã đóng hết tháng 14").displayText).toBe(
      "đã đóng hết tháng 2 năm 2027",
    );
    expect(parsePaidThroughValue("Đã đóng hết tháng 3,5").kind).toBe("PARTIAL_PAYMENT");
  });
});

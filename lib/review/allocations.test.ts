import { describe, expect, it } from "vitest";
import { buildTransactionAllocations, suggestTransactionAllocations } from "@/lib/review/allocations";
import { ReviewRow } from "@/lib/types";

function makeRow(overrides: Partial<ReviewRow>): ReviewRow {
  return {
    id: "row-1",
    transactionDate: "2026-04-12 01:25:33",
    amount: 0,
    rawDescription: "test",
    normalizedDescription: "TEST",
    matchStatus: "UNPARSED",
    matchConfidence: 0.1,
    matchReason: "test",
    approved: false,
    suggestions: [],
    ...overrides
  };
}

describe("buildTransactionAllocations", () => {
  it("suggests all 15 apartments without truncating the allocation form", () => {
    const codes = [
      "L1.217",
      "L1.415",
      "L1.420",
      "L1.422",
      "L1.502",
      "L3.303",
      "L3.315",
      "L4A.211A",
      "L4A.309",
      "L4A.402",
      "L4B.202",
      "L4B.211B",
      "L4B.408",
      "L4C.211A",
      "L4B.305",
    ];

    const feeByApartmentCode = new Map(codes.map((code) => [code, 250000]));
    const allocations = suggestTransactionAllocations(codes, 3750000, feeByApartmentCode);

    expect(allocations).toHaveLength(15);
    expect(allocations.every((item) => item.amount === 250000)).toBe(true);
    expect(allocations.reduce((sum, item) => sum + item.amount, 0)).toBe(3750000);
  });

  it("uses configured DB fee weights instead of inferring fees from apartment codes", () => {
    const allocations = suggestTransactionAllocations(
      ["L2.212", "LK2.24"],
      450000,
      new Map([
        ["L2.212", 250000],
        ["LK2.24", 200000],
      ]),
    );

    expect(allocations).toEqual([
      { code: "L2.212", amount: 250000 },
      { code: "LK2.24", amount: 200000 },
    ]);
  });

  it("allocates one-month standard apartment fees exactly across many apartments", () => {
    const rows: ReviewRow[] = [
      makeRow({
        amount: 1000000,
        matchStatus: "MULTI_MATCH",
        suggestions: ["L4C.305", "L4A.401", "L4A.325", "L1.423"],
        rawDescription: "04 can ho L4C.305; L4A.401; L4A.325; L1.423"
      })
    ];

    const allocations = buildTransactionAllocations(
      rows,
      new Map([
        ["L4C.305", 250000],
        ["L4A.401", 250000],
        ["L4A.325", 250000],
        ["L1.423", 250000],
      ]),
    );

    expect(allocations.map((item) => [item.apartmentCode, item.amount])).toEqual([
      ["L4C.305", 250000],
      ["L4A.401", 250000],
      ["L4A.325", 250000],
      ["L1.423", 250000]
    ]);
    expect(allocations.every((item) => item.allocationKind === "MULTI_EXACT")).toBe(true);
  });

  it("allocates mixed standard and liền kề apartments proportionally when amount is off-standard", () => {
    const rows: ReviewRow[] = [
      makeRow({
        amount: 430000,
        matchStatus: "MULTI_MATCH",
        suggestions: ["L2.212", "LK2.24"],
        rawDescription: "L2.212 LK2.24 nop phi"
      })
    ];

    const allocations = buildTransactionAllocations(
      rows,
      new Map([
        ["L2.212", 250000],
        ["LK2.24", 200000],
      ]),
    );

    expect(allocations.map((item) => item.apartmentCode)).toEqual(["L2.212", "LK2.24"]);
    expect(allocations.reduce((sum, item) => sum + item.amount, 0)).toBe(430000);
    expect(allocations[0].allocationKind).toBe("MULTI_PRORATED");
    expect(allocations[0].allocationNote).toContain("lệch chuẩn");
  });

  it("keeps single matched rows as one allocation", () => {
    const rows: ReviewRow[] = [
      makeRow({
        amount: 250000,
        matchedApartmentCode: "L4B.308",
        matchStatus: "EXACT_MATCH",
        rawDescription: "L4B.308 phi QLVH"
      })
    ];

    const allocations = buildTransactionAllocations(rows);

    expect(allocations).toEqual([
      expect.objectContaining({
        apartmentCode: "L4B.308",
        amount: 250000,
        allocationKind: "SINGLE"
      })
    ]);
  });
});

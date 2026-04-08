import { describe, expect, it } from "vitest";
import { parsePdfTransactionGroup } from "@/lib/pdf/statement-pdf-reader";

describe("parsePdfTransactionGroup", () => {
  it("parses a line with amount and balance columns", () => {
    const record = parsePdfTransactionGroup(
      "08/04/2026 CK tu Nguyen Van A noi dung L4A-511A dong phi 3.500.000 25.000.000"
    );

    expect(record).toMatchObject({
      transactionDate: "2026-04-08",
      amount: 3500000
    });
    expect(record?.description).toContain("L4A-511A");
  });

  it("parses a group with time and trailing reference", () => {
    const record = parsePdfTransactionGroup(
      "08/04/2026 09:11 FT24123ABCDEF CK 307/L4A nop phi cc 2,500,000 10,500,000"
    );

    expect(record).toMatchObject({
      transactionDate: "2026-04-08",
      amount: 2500000,
      transactionId: "FT24123ABCDEF"
    });
    expect(record?.description).toContain("307/L4A");
  });
});

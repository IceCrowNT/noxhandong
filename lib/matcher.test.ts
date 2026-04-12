import { describe, expect, it } from "vitest";
import { buildReviewRows } from "@/lib/matcher";
import { parseApartmentCode } from "@/lib/parser/apartment-parser";
import { CustomerRecord, TransactionRecord } from "@/lib/types";

function makeTransaction(description: string, amount: number): TransactionRecord {
  return {
    transactionDate: "2026-04-10 09:12:32",
    amount,
    description,
    rawRow: {}
  };
}

describe("buildReviewRows", () => {
  it("does not ignore resident payment statements that mention BQT in beneficiary text", () => {
    const description =
      "CT DEN:164T2640EYHE7QZ7 MBVCB.13721932683.882491.L4B 519 0399219857 nop phi QLVH thang 4 den t5 2026 " +
      "CT tu 0031000283712 BAN THI NGUYET toi 116002961023 BQT KHU NHA O XA HOI TAI XA AN DONG tai VIETINBANK";
    const customers: CustomerRecord[] = [{ apartmentCode: "L4B.519", ownerName: "Ban Thi Nguyet", rawRow: {} }];

    const [row] = buildReviewRows([makeTransaction(description, 500000)], [parseApartmentCode(description)], customers);

    expect(row.matchStatus).toBe("EXACT_MATCH");
    expect(row.matchedApartmentCode).toBe("L4B.519");
  });

  it("keeps generic fast-transfer rows without apartment context in ignored bucket", () => {
    const description = "Mai Anh Vu chuyen khoan nhanh qua Zalo";
    const [row] = buildReviewRows([makeTransaction(description, 250000)], [parseApartmentCode(description)], []);

    expect(row.matchStatus).toBe("IGNORED_INTERNAL");
    expect(row.matchReason).toContain("CHUYEN KHOAN NHANH");
  });

  it("keeps zero-amount rows in ignored bucket", () => {
    const description = "CT DI:164K2640DTH7FQ8J bqt noxh an dong tt dv an ninh t3.2026";
    const [row] = buildReviewRows([makeTransaction(description, 0)], [parseApartmentCode(description)], []);

    expect(row.matchStatus).toBe("IGNORED_INTERNAL");
    expect(row.matchReason).toContain("số tiền nhỏ hơn hoặc bằng 0");
  });
});

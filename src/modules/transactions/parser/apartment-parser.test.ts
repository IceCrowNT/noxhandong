import { describe, expect, it } from "vitest";

import {
  classifyApartmentTransaction,
  parseApartmentCode,
} from "@/src/modules/transactions/parser/apartment-parser";

describe("apartment parser bank statement edge cases", () => {
  it("prefers LK house number over nearby fee month", () => {
    const result = parseApartmentCode(
      "164D60709Y9TDGYQ phi QLVH thang 7 LK1 so nha 52 FT26190859883305",
    );

    expect(result.parsedApartmentCode).toBe("LK1.52");
    expect(result.candidates.map((candidate) => candidate.code)).toContain("LK1.52");
    expect(result.candidates.map((candidate) => candidate.code)).not.toContain("LK1.7");
  });

  it("parses split suffix block with Long prefix", () => {
    const result = parseApartmentCode(
      "CT DEN:164T2670DPY7WZUW MBVCB.15035494538.557230.LongL4 C-406A dong phi cc t7",
    );

    expect(result.parsedApartmentCode).toBe("L4C.406A");
  });

  it("does not classify a valid split suffix block transaction as internal", () => {
    const result = classifyApartmentTransaction(
      {
        description:
          "CT DEN:164T2670DPY7WZUW MBVCB.15035494538.557230.LongL4 C-406A dong phi cc t7 toi 116002961023 BQT KHU NHA O XA HOI TAI XA AN DONG",
        amount: 250_000,
      },
      new Set(["L4C.406A"]),
    );

    expect(result.status).not.toBe("KHONG_LIEN_QUAN_CAN_HO");
    expect(result.matchedCode).toBe("L4C.406A");
  });

  it("classifies same-LK-block room lists as multi-apartment transactions", () => {
    const description =
      "CT DEN:164T2671EJBTR72K MBVCB.15350932105.739652.LK1 46 va 48 0963161864 nop phi QLVH.CT tu 0031000231186 NGUYEN VINH TINH";
    const parsed = parseApartmentCode(description);

    expect(parsed.candidates.map((candidate) => candidate.code)).toEqual(["LK1.46", "LK1.48"]);

    const result = classifyApartmentTransaction(
      { description, amount: 2_400_000 },
      new Set(["LK1.46", "LK1.48"]),
      parsed,
    );

    expect(result.status).toBe("NHIEU_CAN");
    expect(result.matchedCode).toBeNull();
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.suggestions).toEqual(["LK1.46", "LK1.48"]);
  });
});

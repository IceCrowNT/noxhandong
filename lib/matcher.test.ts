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

  it("does not ignore a resident payment when the room is glued to the payment word", () => {
    const description =
      "CT DEN:164T2660EZNKK4KS MBVCB.14602563142.072494.LE THI PHUONG chuyen tien327.L4b " +
      "phicot5,6,7,8,9,10/2026.CT tu 1016824424 LE THI PHUONG toi 116002961023 " +
      "BQT KHU NHA O XA HOI TAI XA AN DONG tai VIETINBANK";
    const customers: CustomerRecord[] = [{ apartmentCode: "L4B.327", ownerName: "Le Thi Phuong", rawRow: {} }];

    const [row] = buildReviewRows([makeTransaction(description, 1500000)], [parseApartmentCode(description)], customers);

    expect(row.matchStatus).toBe("NORMALIZED_MATCH");
    expect(row.matchedApartmentCode).toBe("L4B.327");
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

  it("prioritizes parsed apartment rows before internal filtering", () => {
    const customers: CustomerRecord[] = [
      { apartmentCode: "L2.131", ownerName: "Duong Hoang Nam", rawRow: {} },
      { apartmentCode: "L4C.234", ownerName: "Pham Thi Thu Huong", rawRow: {} },
      { apartmentCode: "L4B.308", ownerName: "Nguyen Thi Thu Luong", rawRow: {} }
    ];
    const transactions = [
      makeTransaction(
        "CT DEN:164T2640A1ZC3ULE MBVCB.13680497981.997609.L2.131 .CT tu 0031000224700 DUONG HOANG NAM toi 116002961023 BQT KHU NHA O XA HOI TAI XA AN DONG tai VIETINBANK",
        1500000
      ),
      makeTransaction(
        "CT DEN:164T26407EY96MQN MBVCB.13660639968.002585.PHAM THI THU HUONG chuyen tien so 234/l4c hoang huy an dong hp.CT tu 0031000384697 PHAM THI THU HUONG toi 116002961023 BQT KHU NHA O XA HOI TAI XA AN DONG tai VIETINBANK",
        250000
      ),
      makeTransaction(
        "CT DEN:164T26403CTGAFZF MBVCB.13623575830.879831.L4B.308 + 0584249755 + phi QLVH T1.2026.CT tu 9896319703 NGUYEN THI THU LUONG toi 116002961023 BQT KHU NHA O XA HOI TAI XA AN DONG tai VIETINBANK",
        250000
      )
    ];

    const rows = buildReviewRows(transactions, transactions.map((item) => parseApartmentCode(item.description)), customers);

    expect(rows.map((row) => row.matchStatus)).toEqual(["EXACT_MATCH", "NORMALIZED_MATCH", "EXACT_MATCH"]);
    expect(rows.map((row) => row.matchedApartmentCode)).toEqual(["L2.131", "L4C.234", "L4B.308"]);
  });
});

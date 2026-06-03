import { describe, expect, it } from "vitest";
import { parseApartmentCode } from "@/lib/parser/apartment-parser";
import { normalizeApartmentCode } from "@/src/modules/shared/utils/text";

describe("parseApartmentCode", () => {
  const cases: Array<[string, string]> = [
    ["L1 222 phi QLVH t4 2026", "L1.222"],
    ["L1-222", "L1.222"],
    ["L1222 nop phi", "L1.222"],
    ["311A L4C dong phi ql T4", "L4C.311A"],
    ["426L4c nop tien phi van hanh", "L4C.426"],
    ["L4A-511A ck tien QLVH thang 3", "L4A.511A"],
    ["can ho L2 314 nop phi cc tu thang 3 2026 den thang 8 2026", "L2.314"],
    ["L2.406b nop phi cc", "L2.406B"],
    ["toa nha L4a can ho 520 dong phi", "L4A.520"],
    ["l4a511a", "L4A.511A"],
    ["122512520958-0983679158-L2205", "L2.205"],
    ["Pqlcc 106b L1thang 3 -4 -2026", "L1.106B"],
    ["L4C 118 nopphi t3+t4", "L4C.118"],
    ["can ho 403 l4C nop phi", "L4C.403"],
    ["307/L4A nop phi cc", "L4A.307"],
    ["L1A 111C nop phi", "L1A.111C"],
    ["111B L1B dong phi", "L1B.111B"],
    ["l2a205f", "L2A.205F"],
    ["LK2-24 nop phi", "LK2.24"],
    ["lk2 26 nop phi ql", "LK2.26"],
    ["phi trung cu can L2 so nha 128", "L2.128"],
    ["107lo2 co k phi chung cu t42026", "L2.107"],
    ["IBFT L4B 424nop phi cc den t8 2026", "L4B.424"],
    ["IK2-25 nop phi QLVH thang 1-4-2026 den 30-9-2026", "LK2.25"]
  ];

  it.each(cases)("parses %s", (input, expected) => {
    const result = parseApartmentCode(input);
    expect(result.parsedApartmentCode).toBe(expected);
  });

  it("does not create false multi-match from adjacent account numbers", () => {
    const result = parseApartmentCode(
      "CT DEN 164T2631G57WGEKN MBVCB 13590264132 100558 L4B 114 0906018679 nop phi"
    );

    expect(result.candidates.map((candidate) => candidate.code)).toEqual(["L4B.114"]);
  });

  it("prefers L2.432 for compact L2432 form", () => {
    const result = parseApartmentCode("CT DEN 164T2631FYH4Z9FQ L2432 nop phi");

    expect(result.candidates.map((candidate) => candidate.code)).toEqual(["L2.432"]);
  });

  it("does not treat phone numbers as apartment suffix", () => {
    const result = parseApartmentCode("L1 222 0868889423 phi QLVH t4 2026");

    expect(result.candidates.map((candidate) => candidate.code)).toEqual(["L1.222"]);
  });

  it("does not keep shortened room when suffixed room exists", () => {
    const result = parseApartmentCode("Le Thi Thu Huyen L4a-511a ck tien QLVH thang 3");

    expect(result.candidates.map((candidate) => candidate.code)).toEqual(["L4A.511A"]);
  });

  it("parses room-block compact tokens from real statements", () => {
    expect(parseApartmentCode("CT DEN 164T2631DYYQBS12 426L4c nop tien phi van hanh").parsedApartmentCode).toBe("L4C.426");
    expect(parseApartmentCode("CT DEN 608618055777 212L4a nop phi").parsedApartmentCode).toBe("L4A.212");
  });

  it("parses compact block-room tokens like L111B as L1.111B", () => {
    const result = parseApartmentCode("ck can ho L111B nop phi 012026");
    expect(result.parsedApartmentCode).toBe("L1.111B");
  });

  it("does not infer block suffix from following words", () => {
    expect(parseApartmentCode("can 421 l2 dong 6 thang phi").candidates.map((candidate) => candidate.code)).toEqual(["L2.421"]);
    expect(parseApartmentCode("Bich Ngoc ck phi chung cu 209 L3 tu t12-t5").candidates.map((candidate) => candidate.code)).toEqual(["L3.209"]);
  });

  it("does not over-generate cross-linked candidates in multi-apartment lists", () => {
    const result = parseApartmentCode("Dong phi chung cu T03.2026 04 can ho L4C.305; L4A.401; L4A.325; L1.423");

    expect(result.candidates.map((candidate) => candidate.code)).toEqual(["L4C.305", "L4A.401", "L4A.325", "L1.423"]);
  });

  it("parses apartment code when valid block-room is followed by long numeric tail before payment keywords", () => {
    const result = parseApartmentCode("CT DEN 164T2640MXHUKY0K L23070912435236 nop phi QLVH tu 032023 den thang 082026");

    expect(result.candidates.map((candidate) => candidate.code)).toEqual(["L2.307"]);
    expect(result.parsedApartmentCode).toBe("L2.307");
  });

  it("parses resident-style room and tower/block aliases", () => {
    expect(parseApartmentCode("can 124 lo 4b").parsedApartmentCode).toBe("L4B.124");
    expect(parseApartmentCode("căn 124 lô 4b").parsedApartmentCode).toBe("L4B.124");
    expect(parseApartmentCode("phong 124 toa 4b").parsedApartmentCode).toBe("L4B.124");
    expect(parseApartmentCode("lo 4b can 124").parsedApartmentCode).toBe("L4B.124");
    expect(parseApartmentCode("toa 4b phong 124").parsedApartmentCode).toBe("L4B.124");
    expect(parseApartmentCode("124lo4b").parsedApartmentCode).toBe("L4B.124");
  });

  it("parses resident-style Vietnamese word-number block aliases", () => {
    expect(parseApartmentCode("lo hai 306").parsedApartmentCode).toBe("L2.306");
    expect(parseApartmentCode("lô hai căn 306").parsedApartmentCode).toBe("L2.306");
    expect(parseApartmentCode("can 306 lo hai").parsedApartmentCode).toBe("L2.306");
    expect(parseApartmentCode("306lohai").parsedApartmentCode).toBe("L2.306");
    expect(parseApartmentCode("lo bon b can 124").parsedApartmentCode).toBe("L4B.124");
    expect(parseApartmentCode("lô tư b căn 124").parsedApartmentCode).toBe("L4B.124");
  });
  it("normalizes LKV apartment codes from fee tracking workbooks", () => {
    expect(normalizeApartmentCode("LKV.47")).toBe("LKV.47");
    expect(normalizeApartmentCode("lkv47")).toBe("LKV.47");
  });

  it("parses LKV linked-house codes from bank statements", () => {
    expect(parseApartmentCode("Hairent - TT phi quan ly Pruksa Hai Phong tu 01.05 - 31.10.26- LKV.47").parsedApartmentCode).toBe("LKV.47");
    expect(parseApartmentCode("Hairent - TT phi quan ly Pruksa Hai Phong tu 01.05 - 31.10.26- LKV.47").candidates.map((candidate) => candidate.code)).toEqual(["LKV.47"]);
    expect(parseApartmentCode("Hairent TT phi quan ly LKV 47").parsedApartmentCode).toBe("LKV.47");
    expect(parseApartmentCode("Hairent TT phi quan ly LKV-47").parsedApartmentCode).toBe("LKV.47");
    expect(parseApartmentCode("Hairent TT phi quan ly LKV47").parsedApartmentCode).toBe("LKV.47");
    expect(parseApartmentCode("Hairent TT phi quan ly LK V 47").parsedApartmentCode).toBe("LKV.47");
    expect(parseApartmentCode("47 LKV phi quan ly").parsedApartmentCode).toBe("LKV.47");
  });

  it("parses real bank statement variants from six-month statements", () => {
    expect(parseApartmentCode("L3 P505 dong phi QL T12, T1, T2/2026").parsedApartmentCode).toBe("L3.505");
    expect(parseApartmentCode("Toa nha L2 _ so can ho 211B_ sdt 0357046014 nop phi QLVH").parsedApartmentCode).toBe("L2.211B");
    expect(parseApartmentCode("Toa L2. so can 208 0336177271. nop phi QLVH").parsedApartmentCode).toBe("L2.208");
    expect(parseApartmentCode("L2- P508-phi chung cu").parsedApartmentCode).toBe("L2.508");
    expect(parseApartmentCode("L 1 , 118 , 0899289266 , nop phi QLVH").parsedApartmentCode).toBe("L1.118");
    expect(parseApartmentCode("Toa LA4 so 210 nop phi QLVH").parsedApartmentCode).toBe("L4A.210");
    expect(parseApartmentCode("L4C 506 a tu thang 1 den thang 6 nam 2026").parsedApartmentCode).toBe("L4C.506A");
    expect(parseApartmentCode("117l4 b . thangs 1.2.3 dt 0563788383").parsedApartmentCode).toBe("L4B.117");
    expect(parseApartmentCode("phi cc can ho 530 l4 b.0904471356").parsedApartmentCode).toBe("L4B.530");
    expect(parseApartmentCode("L3p509 0763469636 phi QLVH ki 5-2026 den 10-2026").parsedApartmentCode).toBe("L3.509");
  });

  it("parses manual-review candidates with explicit apartment signals", () => {
    expect(parseApartmentCode("L4C_sonha303_0963666694_nopphi QLVN tu 01.05.2026 den 30.10.2026").parsedApartmentCode).toBe("L4C.303");
    expect(parseApartmentCode("CT DEN:614310746618 303- Lo L4B 0973609092 nop phi QLVH").parsedApartmentCode).toBe("L4B.303");
    expect(parseApartmentCode("Dao Xan Van L4b-110chuyen phi ccT5-2026").parsedApartmentCode).toBe("L4B.110");
  });

  it("parses additional May final manual-review patterns", () => {
    expect(parseApartmentCode("CT DEN:612220678743 CkL4a 318 nop phi QLVH .t4.5.6 -2026 dt0987112519").parsedApartmentCode).toBe("L4A.318");
    expect(parseApartmentCode("CT DEN:612520611064 Nop phi QLVH Thang 5, 6 .2026 . P205 L4C CCHH An Dong").parsedApartmentCode).toBe("L4C.205");
    expect(parseApartmentCode("CT DEN:164T2650DSNXSRVK LE THI THU chuyen tien phi cc117l4b. thang 4.5.6 dt : 0563788383").parsedApartmentCode).toBe("L4B.117");
    expect(parseApartmentCode("CT DEN:612920851187 LK 2 - 1 nop phi QLVH tu 1-5 den 30-10-2026").parsedApartmentCode).toBe("LK2.1");
    expect(parseApartmentCode("CT DEN:612914931307 sn118L4C sdt0982451303 phiQLVH t5 va t6").parsedApartmentCode).toBe("L4C.118");
    expect(parseApartmentCode("CT DEN:164T2650FTCBBSGE toa nha L4B4260977817446ki phi QLVH thang 52026 den thang 102026").parsedApartmentCode).toBe("L4B.426");
    expect(parseApartmentCode("CT DEN:613100616505 can ho 411A toa L4C nop phi QLVH thang 5, 6.2026").parsedApartmentCode).toBe("L4C.411A");
    expect(parseApartmentCode("CT DEN:613410615125 4B220 0982526706 ky phi QLVH thang 05 2026 den tha").parsedApartmentCode).toBe("L4B.220");
    expect(parseApartmentCode("CT DEN:164T2650SXQ0RKJZ L4B419ky phi qlvh T51026").parsedApartmentCode).toBe("L4B.419");
    expect(parseApartmentCode("Nha 435 toa L4B 0768318688 dong phi QLVH tu t5-2026 den t10 -2026").parsedApartmentCode).toBe("L4B.435");
    expect(parseApartmentCode("CT DEN:164T2650WSGZBVES MBVCB.14285176883.638469.lo 4a so nha 114, thang 4,thang5 nam2026").parsedApartmentCode).toBe("L4A.114");
    expect(parseApartmentCode("CT DEN:614001162405 shophouse lk 1 35 0936516839 chi phi QLVH t5 2026 den t10 2026").parsedApartmentCode).toBe("LK1.35");
    expect(parseApartmentCode("CT DEN:164T2650Z5B5TMF 111A L4A nop phi QLVH thang 510").parsedApartmentCode).toBe("L4A.111A");
    expect(parseApartmentCode("CT DEN:614207718825 L4A_541 0779602958 nop phi QL tu thang 5 den thang 10/2025").parsedApartmentCode).toBe("L4A.541");
    expect(parseApartmentCode("Toa LA4 so 210nop phi QLVH tu thang 6 -2026 den thang 12-2026").parsedApartmentCode).toBe("L4A.210");
  });

  it("does not infer missing block from separated L and room code", () => {
    expect(parseApartmentCode("ck can ho L 111B nop phi 012026 062026").parsedApartmentCode).toBeUndefined();
  });
});

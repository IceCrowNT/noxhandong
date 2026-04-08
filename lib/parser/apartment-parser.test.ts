import { describe, expect, it } from "vitest";
import { parseApartmentCode } from "@/lib/parser/apartment-parser";

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
    ["l2a205f", "L2A.205F"]
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
});

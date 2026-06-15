import { describe, expect, it } from "vitest";
import {
  parsePublicLookupInput,
  PUBLIC_LOOKUP_MAX_LENGTH,
} from "@/src/modules/billing/fee-status";

describe("parsePublicLookupInput", () => {
  const cases: Array<[string, string]> = [
    ["L1.115", "L1.115"],
    ["l1.115", "L1.115"],
    [" L1.115 ", "L1.115"],
    ["L1 115", "L1.115"],
    ["L1-115", "L1.115"],
    ["L1115", "L1.115"],
    ["can ho L1 115", "L1.115"],
    ["căn hộ L1.115", "L1.115"],
    ["can 124 lo 4b", "L4B.124"],
    ["căn 124 lô 4b", "L4B.124"],
    ["phong 124 toa 4b", "L4B.124"],
    ["lo 4b can 124", "L4B.124"],
    ["124lo4b", "L4B.124"],
    ["can L1/115", "L1.115"],
    ["L1_115", "L1.115"],
    ["L1,115", "L1.115"],
    ["L1.115 dong phi", "L1.115"],
    ["toi muon tra cuu can ho L1 115", "L1.115"],
    ["L4A.311A", "L4A.311A"],
    ["l4a311a", "L4A.311A"],
    ["L4A 311A", "L4A.311A"],
    ["L4A-311A", "L4A.311A"],
    ["311A L4A", "L4A.311A"],
    ["311A/L4A", "L4A.311A"],
    ["can 311A toa L4A", "L4A.311A"],
    ["L4C.506B", "L4C.506B"],
    ["L4C506B", "L4C.506B"],
    ["506B L4C", "L4C.506B"],
    ["LK2.24", "LK2.24"],
    ["lk2 24", "LK2.24"],
    ["LK2-24", "LK2.24"],
    ["IK2-24", "LK2.24"],
    ["24 LK2", "LK2.24"],
    ["LKV.45", "LKV.45"],
  ];

  it.each(cases)("parses public lookup input %s", (input, expected) => {
    const result = parsePublicLookupInput(input);
    expect(result.ok).toBe(true);
    expect(result.candidates[0]).toBe(expected);
  });

  const wordBlockInputs = [
    { aliases: ["mot", "một", "nhat", "nhất"], block: "L1", room: "115" },
    { aliases: ["hai"], block: "L2", room: "306" },
    { aliases: ["ba"], block: "L3", room: "209" },
    { aliases: ["bon", "bốn", "tu", "tư"], block: "L4", room: "212" },
    { aliases: ["nam", "năm"], block: "L5", room: "321" },
    { aliases: ["sau", "sáu"], block: "L6", room: "318" },
    { aliases: ["bay", "bảy"], block: "L7", room: "415" },
    { aliases: ["tam", "tám"], block: "L8", room: "416" },
    { aliases: ["chin", "chín"], block: "L9", room: "417" },
  ];
  const wordBlockTemplates = [
    ({ alias, room }: { alias: string; room: string }) => `lo ${alias} ${room}`,
    ({ alias, room }: { alias: string; room: string }) => `lô ${alias} căn ${room}`,
    ({ alias, room }: { alias: string; room: string }) => `toa ${alias} phong ${room}`,
    ({ alias, room }: { alias: string; room: string }) => `block ${alias} so ${room}`,
    ({ alias, room }: { alias: string; room: string }) => `can ${room} lo ${alias}`,
    ({ alias, room }: { alias: string; room: string }) => `căn ${room} lô ${alias}`,
    ({ alias, room }: { alias: string; room: string }) => `${room} lo ${alias}`,
    ({ alias, room }: { alias: string; room: string }) => `${room}lo${alias}`,
  ];
  const generatedWordBlockCases: Array<[string, string]> = wordBlockInputs.flatMap(({ aliases, block, room }) =>
    aliases.flatMap((alias) =>
      wordBlockTemplates.map((template) => [template({ alias, room }), `${block}.${room}`] as [string, string])
    )
  );

  it("covers at least 100 resident-style word-number block lookup cases", () => {
    expect(generatedWordBlockCases.length).toBeGreaterThanOrEqual(100);
  });

  it.each(generatedWordBlockCases)("parses word-number block lookup %s", (input, expected) => {
    const result = parsePublicLookupInput(input);
    expect(result.ok).toBe(true);
    expect(result.candidates[0]).toBe(expected);
  });

  it.each([
    ["lo bon b can 124", "L4B.124"],
    ["lô bốn b căn 124", "L4B.124"],
    ["lo tu b can 124", "L4B.124"],
    ["lô tư b căn 124", "L4B.124"],
    ["can 124 lo bon b", "L4B.124"],
    ["căn 124 lô bốn b", "L4B.124"],
    ["124 lo tu b", "L4B.124"],
    ["124lo4b", "L4B.124"],
  ])("parses word-number block suffix lookup %s", (input, expected) => {
    const result = parsePublicLookupInput(input);
    expect(result.ok).toBe(true);
    expect(result.candidates[0]).toBe(expected);
  });

  it("returns all candidates for multi-code input without inventing SQL-like behavior", () => {
    const result = parsePublicLookupInput("L4C.305; L4A.401; L1.423");

    expect(result.ok).toBe(true);
    expect(result.candidates).toEqual(["L4C.305", "L4A.401", "L1.423"]);
  });

  it("rejects very long input before parsing", () => {
    const result = parsePublicLookupInput("L1.115 ".repeat(20));

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected invalid lookup input.");
    expect(result.error).toBe("TOO_LONG");
    expect(result.sanitizedInput.length).toBe(PUBLIC_LOOKUP_MAX_LENGTH);
  });

  it("rejects unsupported characters", () => {
    const result = parsePublicLookupInput("L1.115' OR 1=1 --");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected invalid lookup input.");
    expect(result.error).toBe("UNSAFE_CHARACTERS");
  });

  it("rejects input without apartment code", () => {
    const result = parsePublicLookupInput("toi muon tra cuu phi");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected invalid lookup input.");
    expect(result.error).toBe("NO_APARTMENT_CODE");
  });
});

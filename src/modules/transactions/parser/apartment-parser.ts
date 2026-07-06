import { ApartmentParseCandidate, ApartmentParseResult } from "@/src/modules/shared/types";
import {
  normalizeApartmentCode,
  normalizeFreeText,
  removeVietnameseDiacritics,
} from "@/src/modules/shared/utils/text";

export const APARTMENT_CODE_PARSER_VERSION = "apartment-code-parser-v0.8-unified";

export const APARTMENT_TRANSACTION_FILTER_RULES = {
  hardInternalKeywords: [
    "TRA LAI TAI KHOAN",
    "DDA",
    "BHXH",
    "BHYT",
    "BHTN",
    "LUONG",
    "THU LAO"
  ],
  softInternalKeywords: ["BQT", "NOXH", "BAN QUAN TRI"],
  genericNonApartmentKeywords: [
    "CHUYEN KHOAN NHANH",
    "QUA ZALO",
    "CHUYEN KHOAN",
    "CK NHANH",
    "NHANH QUA",
    "NAP TIEN",
    "HOAN TIEN"
  ],
  apartmentContextKeywords: [
    "CAN",
    "CAN HO",
    "PHI",
    "QLVH",
    "QLCC",
    "DONG",
    "NOP",
    "THANG",
    "CHUNG CU",
    "CC"
  ],
  residentPaymentKeywords: [
    "PHI",
    "QLVH",
    "QLCC",
    "PQLCC",
    "CAN HO",
    "CHUNG CU",
    "NOP PHI",
    "DONG PHI",
    "TU THANG",
    "DEN THANG"
  ],
  minimumResidentAmount: 100000
} as const;

export type ApartmentTransactionStatus =
  | "KHOP_TRUC_TIEP"
  | "KHOP_SAU_CHUAN_HOA"
  | "NHIEU_CAN"
  | "MA_CAN_KHONG_HOP_LE"
  | "KHONG_LIEN_QUAN_CAN_HO"
  | "CHUA_NHAN_DIEN_DUOC_CAN";

export interface ApartmentTransactionClassification {
  status: ApartmentTransactionStatus;
  confidence: number;
  matchedCode: string | null;
  reason: string;
  suggestions: string[];
}

interface ApartmentTransactionInput {
  description: string;
  amount: number;
}

interface ApartmentSuggestionSource {
  ma_can: string;
}

export interface ApartmentMentionRange {
  start: number;
  end: number;
  apartmentCode: string;
}

const BLOCK_CAPTURE = "([1-9][A-C]?)";
const ROOM_CAPTURE = "([1-9]\\d{2}[A-Z]?)";
const LK_BLOCK_CAPTURE = "(LK[1-9])";
const LK_BLOCK_ALIAS_CAPTURE = "((?:LK|IK)[1-9])";
const LK_ROOM_CAPTURE = "([1-9]\\d?)";
const LKV_BLOCK_ALIAS_CAPTURE = "(LKV|LK\\s+V)";
const LKV_ROOM_CAPTURE = "([1-9]\\d{0,2}[A-Z]?)";
const BLOCK_WORD_CAPTURE = "(MOT|NHAT|HAI|BA|BON|TU|NAM|SAU|BAY|TAM|CHIN)";

const BLOCK_WORD_VALUES: Record<string, string> = {
  MOT: "1",
  NHAT: "1",
  HAI: "2",
  BA: "3",
  BON: "4",
  TU: "4",
  NAM: "5",
  SAU: "6",
  BAY: "7",
  TAM: "8",
  CHIN: "9",
};

function normalizeTextWithSourceMap(value: string) {
  let normalized = "";
  const sourceStarts: number[] = [];
  const sourceEnds: number[] = [];

  for (let index = 0; index < value.length; ) {
    const codePoint = value.codePointAt(index);
    const character = String.fromCodePoint(codePoint ?? 0);
    const nextIndex = index + character.length;
    const normalizedCharacter = removeVietnameseDiacritics(character)
      .replace(/[Đđ]/g, "D")
      .toUpperCase();

    for (const item of normalizedCharacter) {
      normalized += /[A-Z0-9]/.test(item) ? item : " ";
      sourceStarts.push(index);
      sourceEnds.push(nextIndex);
    }

    index = nextIndex;
  }

  return { normalized, sourceStarts, sourceEnds };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function apartmentMentionPatterns(apartmentCode: string) {
  const normalizedCode = normalizeApartmentCode(apartmentCode);
  if (!normalizedCode) return [];

  const [block, room] = normalizedCode.split(".");
  const separator = "[^A-Z0-9]*";
  const contextWord = "(?:CAN|HO|TOA|NHA|LO|SO|PHONG|BLOCK|BLK|P)";
  const context = `(?:${contextWord}${separator})`;
  const optionalContext = `(?:${context}){0,5}`;
  const blockPattern = block
    .split("")
    .map(escapeRegex)
    .join(separator);
  const roomPattern = room
    .split("")
    .map(escapeRegex)
    .join(separator);

  return [
    new RegExp(`\\b${optionalContext}${blockPattern}${separator}${optionalContext}${roomPattern}\\b`, "g"),
    new RegExp(`(?<![0-9])${optionalContext}${roomPattern}${separator}${optionalContext}${blockPattern}\\b`, "g"),
  ];
}

/**
 * Locates the original text fragments that identify an apartment.
 * The patterns intentionally live beside the parser so preview/highlight logic
 * cannot drift into a second apartment-code algorithm.
 */
export function findApartmentMentionRanges(
  content: string,
  apartmentCodes: readonly string[],
): ApartmentMentionRange[] {
  if (!content || !apartmentCodes.length) return [];

  const { normalized, sourceStarts, sourceEnds } = normalizeTextWithSourceMap(content);
  const ranges: ApartmentMentionRange[] = [];

  for (const rawCode of apartmentCodes) {
    const apartmentCode = normalizeApartmentCode(rawCode);
    if (!apartmentCode) continue;

    for (const pattern of apartmentMentionPatterns(apartmentCode)) {
      for (const match of normalized.matchAll(pattern)) {
        const normalizedStart = match.index ?? -1;
        const normalizedEnd = normalizedStart + match[0].length;
        if (normalizedStart < 0 || normalizedEnd <= normalizedStart) continue;

        let firstMeaningful = normalizedStart;
        let lastMeaningful = normalizedEnd - 1;
        while (firstMeaningful < normalizedEnd && normalized[firstMeaningful] === " ") firstMeaningful += 1;
        while (lastMeaningful >= firstMeaningful && normalized[lastMeaningful] === " ") lastMeaningful -= 1;
        if (firstMeaningful > lastMeaningful) continue;

        ranges.push({
          start: sourceStarts[firstMeaningful],
          end: sourceEnds[lastMeaningful],
          apartmentCode,
        });
      }
    }
  }

  return ranges
    .sort((left, right) => left.start - right.start || right.end - left.end)
    .filter((range, index, allRanges) => {
      return !allRanges
        .slice(0, index)
        .some((existing) => existing.start <= range.start && existing.end >= range.end);
    });
}

function normalizeBlockAlias(block: string, suffix = "") {
  const normalizedBlock = BLOCK_WORD_VALUES[block] || block;
  return `${normalizedBlock}${suffix || ""}`;
}

function formatApartmentCode(block: string, room: string, prefix = "L"): string {
  return `${prefix}${block}.${room}`;
}

function buildCandidate(block: string, room: string, reason: string, score: number, prefix = "L") {
  const shorthandBlock = prefix === "L" && block === "4" && /^[1-9]\d{2}[A-C]$/.test(room)
    ? `4${room.at(-1)}`
    : block;
  const normalized = normalizeApartmentCode(formatApartmentCode(shorthandBlock, room, prefix));
  if (!normalized) {
    return undefined;
  }

  return {
    code: normalized,
    reason,
    score
  } satisfies ApartmentParseCandidate;
}

function buildLkCandidate(block: string, room: string, reason: string, score: number) {
  const normalizedBlock = block.startsWith("IK") ? `LK${block.slice(2)}` : block;
  const normalized = normalizeApartmentCode(`${normalizedBlock}.${room}`);
  if (!normalized) {
    return undefined;
  }

  return {
    code: normalized,
    reason,
    score
  } satisfies ApartmentParseCandidate;
}

function buildLkvCandidate(block: string, room: string, reason: string, score: number) {
  const normalizedBlock = block.replace(/\s+/g, "");
  const normalized = normalizeApartmentCode(`${normalizedBlock}.${room}`);
  if (!normalized) {
    return undefined;
  }

  return {
    code: normalized,
    reason,
    score
  } satisfies ApartmentParseCandidate;
}

function buildCompactBlockRoomCandidate(token: string, reason: string, score: number) {
  if (!token.startsWith("L")) {
    return undefined;
  }

  const compactPhongMatch = token.match(/^L([1-9][A-C]?)P([1-9]\d{2}[A-Z]?)$/);
  if (compactPhongMatch) {
    return buildCandidate(compactPhongMatch[1], compactPhongMatch[2], "BLOCK_ROOM_COMPACT_PHONG_ALIAS", score);
  }

  const shorthandMatch = token.match(/^L([1-9])(\d{2}[A-Z])$/);
  if (shorthandMatch) {
    return buildCandidate(shorthandMatch[1], `${shorthandMatch[1]}${shorthandMatch[2]}`, reason, score - 0.01);
  }

  const body = token.slice(1);
  const blockCandidates = [body.slice(0, 1), body.slice(0, 2)];

  for (const block of blockCandidates) {
    const room = body.slice(block.length);
    const candidate = buildCandidate(block, room, reason, score);
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
}

function buildCompactRoomBlockCandidate(token: string, reason: string, score: number) {
  const lIndex = token.indexOf("L");
  if (lIndex <= 0) {
    return undefined;
  }

  const room = token.slice(0, lIndex);
  const block = token.slice(lIndex + 1);
  return buildCandidate(block, room, reason, score);
}

function splitNumericWordBoundaryToken(token: string): string[] {
  return token
    .replace(/([0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([0-9])/g, "$1 $2")
    .split(" ")
    .filter(Boolean);
}

function collectCandidates(normalizedDescription: string): ApartmentParseCandidate[] {
  const candidates: ApartmentParseCandidate[] = [];
  const push = (candidate?: ApartmentParseCandidate) => {
    if (!candidate || candidates.some((item) => item.code === candidate.code)) {
      return;
    }
    candidates.push(candidate);
  };

  const fillerWordPattern = "(?:CAN|CANHO|HO|TOA|TOANHA|NHA|CHUNGCU|CC|PHI|DONG|NOP|TIEN|THANG|T|QLVH|PQLCC|QLCC|PHONG|P|SO|SDT)";
  const dotPattern = new RegExp(`\\bL${BLOCK_CAPTURE}\\s+${ROOM_CAPTURE}(?=${fillerWordPattern}|\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(dotPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_SPACED", 0.98));
  }

  const separatedLBlockPattern = new RegExp(`\\bL\\s+${BLOCK_CAPTURE}\\s+${ROOM_CAPTURE}(?=${fillerWordPattern}|\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(separatedLBlockPattern)) {
    push(buildCandidate(match[1], match[2], "L_BLOCK_ROOM_SPACED", 0.97));
  }

  const prefixedLBlockThenRoomPattern = new RegExp(`\\b[A-Z]{1,5}L${BLOCK_CAPTURE}\\s+${ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(prefixedLBlockThenRoomPattern)) {
    push(buildCandidate(match[1], match[2], "PREFIXED_L_BLOCK_ROOM_SPACED", 0.94));
  }

  const blockThenRoomFlexiblePattern = new RegExp(
    `\\bL${BLOCK_CAPTURE}\\b(?:\\s+${fillerWordPattern}){0,4}\\s+${ROOM_CAPTURE}(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(blockThenRoomFlexiblePattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_FLEXIBLE", 0.9));
  }

  const blockThenPhongRoomPattern = new RegExp(`\\bL${BLOCK_CAPTURE}\\s*(?:P|PHONG)\\s*${ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(blockThenPhongRoomPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_PHONG_ALIAS", 0.96));
  }

  const blockRoomDetachedSuffixPattern = new RegExp(`\\bL${BLOCK_CAPTURE}\\s+([1-9]\\d{2})\\s+([A-F])(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(blockRoomDetachedSuffixPattern)) {
    push(buildCandidate(match[1], `${match[2]}${match[3]}`, "BLOCK_ROOM_DETACHED_SUFFIX", 0.95));
  }

  const la4RoomPattern = new RegExp(`\\bLA4\\b(?:\\s+${fillerWordPattern}){0,4}\\s+${ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(la4RoomPattern)) {
    push(buildCandidate("4A", match[1], "LA4_BLOCK_ALIAS", 0.93));
  }

  const la4RoomTrailingWordPattern = new RegExp(`\\bLA4\\b(?:\\s+${fillerWordPattern}){0,4}\\s+([1-9]\\d{2})(?=[A-Z]{2,}\\b)`, "g");
  for (const match of normalizedDescription.matchAll(la4RoomTrailingWordPattern)) {
    push(buildCandidate("4A", match[1], "LA4_BLOCK_ALIAS_TRAILING_WORD", 0.91));
  }

  const roomThenBlockPattern = new RegExp(`\\b${ROOM_CAPTURE}\\s+L${BLOCK_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(roomThenBlockPattern)) {
    push(buildCandidate(match[2], match[1], "ROOM_BLOCK_SPACED", 0.95));
  }

  const apartmentRoomThenTowerBuildingPattern = new RegExp(
    `\\b(?:CAN\\s+HO|CANHO)\\s+${ROOM_CAPTURE}\\s+(?:TOA\\s+NHA|TOANHA|TOA|LO)\\s+L?\\s*${BLOCK_CAPTURE}(?=\\b|[^A-Z])`,
    "g",
  );
  for (const match of normalizedDescription.matchAll(apartmentRoomThenTowerBuildingPattern)) {
    push(buildCandidate(match[2], match[1], "APARTMENT_ROOM_TOWER_BUILDING", 0.99));
  }

  const paymentWordRoomThenBlockPattern = new RegExp(
    `\\b(?:TIEN|PHI|CAN|CANHO|PHONG|SO|NHA)${ROOM_CAPTURE}\\s+L${BLOCK_CAPTURE}(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(paymentWordRoomThenBlockPattern)) {
    push(buildCandidate(match[2], match[1], "PAYMENT_WORD_ROOM_BLOCK_SPACED", 0.95));
  }

  const prefixedRoomThenBlockPattern = new RegExp(`\\b(?:CC|CAN|CANHO|P|PHONG|SO|SN|NHA)?\\s*${ROOM_CAPTURE}\\s+L\\s*([1-9])\\s*([A-C])?(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(prefixedRoomThenBlockPattern)) {
    push(buildCandidate(`${match[2]}${match[3] || ""}`, match[1], "PREFIXED_ROOM_L_BLOCK_SPACED", 0.94));
  }

  const prefixedRoomThenCompactBlockPattern = new RegExp(`\\b(?:CC|CAN|CANHO|P|PHONG|SO|SN|NHA)?${ROOM_CAPTURE}L([1-9])\\s*([A-C])(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(prefixedRoomThenCompactBlockPattern)) {
    push(buildCandidate(`${match[2]}${match[3]}`, match[1], "PREFIXED_ROOM_L_BLOCK_COMPACT", 0.94));
  }

  const roomThenBlockFlexiblePattern = new RegExp(
    `\\b${ROOM_CAPTURE}\\s+L${BLOCK_CAPTURE}(?=${fillerWordPattern}|\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(roomThenBlockFlexiblePattern)) {
    push(buildCandidate(match[2], match[1], "ROOM_BLOCK_FLEXIBLE", 0.94));
  }

  const roomThenLoLBlockPattern = new RegExp(`\\b${ROOM_CAPTURE}\\s+LO\\s+L${BLOCK_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(roomThenLoLBlockPattern)) {
    push(buildCandidate(match[2], match[1], "ROOM_LO_L_BLOCK_ALIAS", 0.95));
  }

  const roomThenSplitBlockSuffixPattern = new RegExp(`\\b${ROOM_CAPTURE}\\s*L\\s*([1-9])\\s+([A-C])(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(roomThenSplitBlockSuffixPattern)) {
    push(buildCandidate(`${match[2]}${match[3]}`, match[1], "ROOM_L_BLOCK_SPLIT_SUFFIX", 0.95));
  }

  const lkvPattern = new RegExp(`\\b${LKV_BLOCK_ALIAS_CAPTURE}\\s+${LKV_ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(lkvPattern)) {
    push(buildLkvCandidate(match[1], match[2], "LKV_BLOCK_ROOM_SPACED", 0.99));
  }

  const lkvCompactPattern = new RegExp(`\\bLKV${LKV_ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(lkvCompactPattern)) {
    push(buildLkvCandidate("LKV", match[1], "LKV_BLOCK_ROOM_COMPACT", 0.98));
  }

  const roomThenLkvPattern = new RegExp(`\\b${LKV_ROOM_CAPTURE}\\s+${LKV_BLOCK_ALIAS_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(roomThenLkvPattern)) {
    push(buildLkvCandidate(match[2], match[1], "LKV_ROOM_BLOCK_SPACED", 0.96));
  }

  const lkPattern = new RegExp(`\\b${LK_BLOCK_ALIAS_CAPTURE}\\s+${LK_ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(lkPattern)) {
    push(buildLkCandidate(match[1], match[2], "LK_BLOCK_ROOM_SPACED", 0.98));
  }

  const separatedLkPattern = new RegExp(`\\b(?:LK|IK)\\s+([1-9])\\s+${LK_ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(separatedLkPattern)) {
    push(buildLkCandidate(`LK${match[1]}`, match[2], "LK_BLOCK_ROOM_SEPARATED", 0.97));
  }

  const lkCompactPattern = new RegExp(`\\b${LK_BLOCK_ALIAS_CAPTURE}${LK_ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(lkCompactPattern)) {
    push(buildLkCandidate(match[1], match[2], "LK_BLOCK_ROOM_COMPACT", 0.96));
  }

  const roomThenLkPattern = new RegExp(`\\b${LK_ROOM_CAPTURE}\\s+${LK_BLOCK_ALIAS_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(roomThenLkPattern)) {
    push(buildLkCandidate(match[2], match[1], "LK_ROOM_BLOCK_SPACED", 0.95));
  }

  const loBlockPattern = new RegExp(`\\b${LK_ROOM_CAPTURE}\\s+LO\\s*([1-9])(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(loBlockPattern)) {
    push(buildCandidate(match[2], match[1], "ROOM_LO_ALIAS", 0.93));
  }

  const compactLoBlockPattern = new RegExp(`\\b([1-9]\\d{2})LO([1-9])(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(compactLoBlockPattern)) {
    push(buildCandidate(match[2], match[1], "ROOM_LO_COMPACT_ALIAS", 0.94));
  }

  const roomThenTowerBlockPattern = new RegExp(
    `\\b(?:CAN\\s+HO|CAN|CANHO|HO|PHONG|SO|NHA)?\\s*${ROOM_CAPTURE}\\s+(?:LO|TOA|BLOCK|BLK)\\s+L?\\s*${BLOCK_CAPTURE}(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(roomThenTowerBlockPattern)) {
    push(buildCandidate(match[2], match[1], "ROOM_TOWER_BLOCK_ALIAS", 0.95));
  }

  const roomThenTowerSplitBlockPattern = new RegExp(
    `\\b(?:CAN\\s+HO|CAN|CANHO|HO|PHONG|SO|NHA)?\\s*${ROOM_CAPTURE}\\s+(?:LO|TOA|BLOCK|BLK|L)\\s+L?\\s*([1-9])\\s+([A-C])(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(roomThenTowerSplitBlockPattern)) {
    push(buildCandidate(`${match[2]}${match[3]}`, match[1], "ROOM_TOWER_SPLIT_BLOCK_ALIAS", 0.95));
  }

  const towerBlockGluedContextThenRoomPattern = new RegExp(
    `\\b(?:LO|TOA|BLOCK|BLK)\\s+L?\\s*${BLOCK_CAPTURE}\\s*(?:CAN\\s+HO|CANHO|CAN|HO|PHONG|SO|NHA)\\s*${ROOM_CAPTURE}(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(towerBlockGluedContextThenRoomPattern)) {
    push(buildCandidate(match[1], match[2], "TOWER_BLOCK_GLUED_CONTEXT_ROOM_ALIAS", 0.95));
  }

  const towerBlockThenRoomPattern = new RegExp(
    `\\b(?:LO|TOA|BLOCK|BLK)\\s+L?\\s*${BLOCK_CAPTURE}\\s+(?:CAN\\s+HO|SO\\s+NHA|CAN|CANHO|HO|PHONG|SO|NHA)?\\s*${ROOM_CAPTURE}(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(towerBlockThenRoomPattern)) {
    push(buildCandidate(match[1], match[2], "TOWER_BLOCK_ROOM_ALIAS", 0.95));
  }

  const towerSplitBlockThenRoomPattern = new RegExp(
    `\\b(?:LO|TOA|BLOCK|BLK|L)\\s+L?\\s*([1-9])\\s+([A-C])\\s+(?:CAN\\s+HO|SO\\s+NHA|CAN|CANHO|HO|PHONG|SO|NHA)?\\s*${ROOM_CAPTURE}(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(towerSplitBlockThenRoomPattern)) {
    push(buildCandidate(`${match[1]}${match[2]}`, match[3], "TOWER_SPLIT_BLOCK_ROOM_ALIAS", 0.95));
  }
  const roomThenTowerBlockWordPattern = new RegExp(
    `\\b(?:CAN|CANHO|HO|PHONG|SO|NHA)?\\s*${ROOM_CAPTURE}\\s+(?:LO|TOA|BLOCK|BLK)\\s+${BLOCK_WORD_CAPTURE}\\s*([A-C])?(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(roomThenTowerBlockWordPattern)) {
    push(buildCandidate(normalizeBlockAlias(match[2], match[3]), match[1], "ROOM_TOWER_BLOCK_WORD_ALIAS", 0.94));
  }

  const towerBlockWordThenRoomPattern = new RegExp(
    `\\b(?:LO|TOA|BLOCK|BLK)\\s+${BLOCK_WORD_CAPTURE}\\s*([A-C])?\\s+(?:CAN|CANHO|HO|PHONG|SO|NHA)?\\s*${ROOM_CAPTURE}(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(towerBlockWordThenRoomPattern)) {
    push(buildCandidate(normalizeBlockAlias(match[1], match[2]), match[3], "TOWER_BLOCK_WORD_ROOM_ALIAS", 0.94));
  }

  const compactRoomTowerBlockWordPattern = new RegExp(
    `\\b${ROOM_CAPTURE}(?:LO|TOA|BLOCK|BLK)${BLOCK_WORD_CAPTURE}([A-C])?(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(compactRoomTowerBlockWordPattern)) {
    push(buildCandidate(normalizeBlockAlias(match[2], match[3]), match[1], "ROOM_TOWER_BLOCK_WORD_COMPACT_ALIAS", 0.92));
  }

  const compactRoomTowerBlockPattern = new RegExp(
    `\\b${ROOM_CAPTURE}(?:LO|TOA|BLOCK|BLK)${BLOCK_CAPTURE}(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(compactRoomTowerBlockPattern)) {
    push(buildCandidate(match[2], match[1], "ROOM_TOWER_BLOCK_COMPACT_ALIAS", 0.94));
  }

  const compactSuffixBlockRoomPattern = new RegExp(`\\b([1-9][A-C])\\s*${ROOM_CAPTURE}(?=\\b|[A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(compactSuffixBlockRoomPattern)) {
    push(buildCandidate(match[1], match[2], "SUFFIX_BLOCK_ROOM_COMPACT", 0.91));
  }

  const blockSoNhaPattern = new RegExp(`\\bL${BLOCK_CAPTURE}\\b(?:\\s+(?:SO|NHA|SO NHA)){1,2}\\s+${ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(blockSoNhaPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_SO_NHA_ROOM", 0.95));
  }

  const blockSoNhaCompactPattern = new RegExp(`\\bL${BLOCK_CAPTURE}\\s+(?:SO|NHA|SONHA|SO NHA)${ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(blockSoNhaCompactPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_SO_NHA_COMPACT_ROOM", 0.94));
  }

  const blockRoomTrailingWordPattern = new RegExp(`\\bL${BLOCK_CAPTURE}\\s+([1-9]\\d{2})(?=[A-Z]{2,}\\b)`, "g");
  for (const match of normalizedDescription.matchAll(blockRoomTrailingWordPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_TRAILING_WORD", 0.9));
  }

  const compactBlockRoomTrailingWordPattern = new RegExp(`\\bL${BLOCK_CAPTURE}${ROOM_CAPTURE}(?=[A-Z]{2,}\\b)`, "g");
  for (const match of normalizedDescription.matchAll(compactBlockRoomTrailingWordPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_COMPACT_TRAILING_WORD", 0.9));
  }

  const compactWithTrailingDigitsPattern = new RegExp(
    `\\bL${BLOCK_CAPTURE}${ROOM_CAPTURE}(\\d{6,})(?=\\s+(?:NOP|PHI|QLVH|QLCC|PQLCC|DONG|CAN|CC|THANG)\\b)`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(compactWithTrailingDigitsPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_TRAILING_DIGITS", 0.89));
  }

  const compactWithTrailingDigitsAndWordPattern = new RegExp(
    `\\bL${BLOCK_CAPTURE}${ROOM_CAPTURE}\\d{6,}[A-Z]{0,3}(?=\\s+(?:NOP|PHI|QLVH|QLCC|PQLCC|DONG|CAN|CC|THANG)\\b)`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(compactWithTrailingDigitsAndWordPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_TRAILING_DIGITS_WORD", 0.88));
  }

  for (const token of normalizedDescription.split(" ").filter(Boolean)) {
    push(buildCompactBlockRoomCandidate(token, "BLOCK_ROOM_COMPACT_TOKEN", 0.93));
    push(buildCompactRoomBlockCandidate(token, "ROOM_BLOCK_COMPACT_TOKEN", 0.92));

    const tokenParts = splitNumericWordBoundaryToken(token);
    if (tokenParts.length > 1) {
      for (const part of tokenParts) {
        push(buildCompactBlockRoomCandidate(part, "BLOCK_ROOM_SPLIT_TOKEN", 0.91));
        push(buildCompactRoomBlockCandidate(part, "ROOM_BLOCK_SPLIT_TOKEN", 0.9));
      }
    }
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const [candidateBlock, candidateRoom] = candidate.code.split(".");
    if (
      candidate.reason === "LKV_ROOM_BLOCK_SPACED" &&
      candidates.some((other) => other.reason.startsWith("LKV_BLOCK_ROOM") && other.code !== candidate.code)
    ) {
      return false;
    }

    if (candidateBlock.startsWith("LK")) {
      return true;
    }

    const splitSuffixBlockCandidate = candidates.find((other) => {
      if (other.code === candidate.code) {
        return false;
      }

      const [otherBlock, otherRoom] = other.code.split(".");
      return candidateBlock === "L4" && otherBlock.startsWith("L4") && otherBlock.length === 3 && otherRoom === candidateRoom;
    });

    if (splitSuffixBlockCandidate) {
      return false;
    }

    const unsuffixedLoCandidate = candidates.find((other) => {
      if (other.code === candidate.code || other.reason !== "ROOM_LO_L_BLOCK_ALIAS") {
        return false;
      }

      const [otherBlock, otherRoom] = other.code.split(".");
      return (
        candidate.reason === "ROOM_TOWER_SPLIT_BLOCK_ALIAS" &&
        /^L[1-9][A-C]$/.test(candidateBlock) &&
        otherBlock === candidateBlock.slice(0, 2) &&
        otherRoom === candidateRoom &&
        other.score >= candidate.score
      );
    });

    if (unsuffixedLoCandidate) {
      return false;
    }

    if (candidate.reason.startsWith("ROOM_BLOCK")) {
      const strongerSameRoomCandidate = candidates.find((other) => {
        if (other.code === candidate.code || !other.reason.startsWith("BLOCK_ROOM")) {
          return false;
        }

        const [, otherRoom] = other.code.split(".");
        return otherRoom === candidateRoom && other.score >= candidate.score;
      });

      if (strongerSameRoomCandidate) {
        return false;
      }
    }

    if (candidate.reason === "BLOCK_ROOM_FLEXIBLE") {
      const [candidateBlock] = candidate.code.split(".");
      const strongerSameBlockRoomFirstCandidate = candidates.find((other) => {
        if (other.code === candidate.code || !other.reason.startsWith("ROOM_BLOCK")) {
          return false;
        }

        const [otherBlock] = other.code.split(".");
        return otherBlock === candidateBlock && other.score > candidate.score;
      });

      if (strongerSameBlockRoomFirstCandidate) {
        return false;
      }
    }

    const exactWithSuffix = candidates.find((other) => {
      if (other.code === candidate.code) {
        return false;
      }

      const [otherBlock, otherRoom] = other.code.split(".");
      return candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}A`
        || candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}B`
        || candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}C`
        || candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}D`
        || candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}E`
        || candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}F`
        || candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom.length === 4 && otherRoom.startsWith(candidateRoom);
    });

    return !exactWithSuffix;
  });

  return filteredCandidates.sort((left, right) => right.score - left.score);
}

export function parseApartmentCode(rawDescription: string): ApartmentParseResult {
  const normalizedDescription = normalizeFreeText(rawDescription);
  const candidates = collectCandidates(normalizedDescription);

  if (candidates.length === 0) {
    return {
      rawDescription,
      normalizedDescription,
      parsedApartmentCode: undefined,
      candidates,
      matchReason: "No apartment pattern detected"
    };
  }

  if (candidates.length === 1) {
    return {
      rawDescription,
      normalizedDescription,
      parsedApartmentCode: candidates[0].code,
      candidates,
      matchReason: candidates[0].reason
    };
  }

  return {
    rawDescription,
    normalizedDescription,
    parsedApartmentCode: candidates[0].code,
    candidates,
    matchReason: `Multiple candidates: ${candidates.map((item) => item.code).join(", ")}`
  };
}

function hasApartmentContext(parseResult: ApartmentParseResult): boolean {
  const content = parseResult.normalizedDescription;
  return (
    parseResult.candidates.length > 0 ||
    /\bL[1-9][A-C]?\b/.test(content) ||
    APARTMENT_TRANSACTION_FILTER_RULES.apartmentContextKeywords.some((keyword) => content.includes(keyword))
  );
}

function hasResidentPaymentSignal(
  transaction: ApartmentTransactionInput,
  parseResult: ApartmentParseResult,
  hasValidApartmentCode: boolean
): boolean {
  const content = `${transaction.description} ${parseResult.normalizedDescription}`.toUpperCase();
  return (
    (parseResult.candidates.length > 0 || hasValidApartmentCode) &&
    APARTMENT_TRANSACTION_FILTER_RULES.residentPaymentKeywords.some((keyword) => content.includes(keyword))
  );
}

function detectInternalReason(
  transaction: ApartmentTransactionInput,
  parseResult: ApartmentParseResult,
  hasValidApartmentCode: boolean
): string | undefined {
  if (transaction.amount <= 0) {
    return "Bị lọc vì số tiền nhỏ hơn hoặc bằng 0.";
  }

  const rules = APARTMENT_TRANSACTION_FILTER_RULES;
  const content = `${transaction.description} ${parseResult.normalizedDescription}`.toUpperCase();
  const hasResidentSignal = hasResidentPaymentSignal(transaction, parseResult, hasValidApartmentCode);
  const hardKeyword = rules.hardInternalKeywords.find((keyword) => content.includes(keyword));

  if (hardKeyword) {
    return `Bị lọc vì chứa từ khóa nội bộ cứng: ${hardKeyword}.`;
  }
  if (!hasResidentSignal && transaction.amount < rules.minimumResidentAmount) {
    return `Bị lọc vì số tiền nhỏ hơn ngưỡng tối thiểu ${rules.minimumResidentAmount.toLocaleString("vi-VN")} và không có tín hiệu cư dân đóng phí.`;
  }

  const softKeyword = rules.softInternalKeywords.find((keyword) => content.includes(keyword));
  if (!hasResidentSignal && softKeyword) {
    return `Bị lọc vì chứa từ khóa nội bộ mềm: ${softKeyword}, trong khi không có tín hiệu cư dân đóng phí.`;
  }

  const genericKeyword = rules.genericNonApartmentKeywords.find((keyword) => content.includes(keyword));
  if (!hasResidentSignal && !hasApartmentContext(parseResult) && genericKeyword) {
    return `Bị lọc vì là giao dịch chuyển khoản chung chung (${genericKeyword}) và không có ngữ cảnh căn hộ.`;
  }

  return undefined;
}

export function classifyApartmentTransaction(
  transaction: ApartmentTransactionInput,
  validCodes: ReadonlySet<string>,
  existingParseResult?: ApartmentParseResult
): ApartmentTransactionClassification {
  const parseResult = existingParseResult ?? parseApartmentCode(transaction.description);
  const suggestions = [...new Set(parseResult.candidates.map((candidate) => candidate.code))];
  const parsedCode = parseResult.parsedApartmentCode
    ? normalizeApartmentCode(parseResult.parsedApartmentCode)
    : undefined;
  const hasValidCode = parsedCode ? validCodes.has(parsedCode) : false;

  if (suggestions.length > 1) {
    return {
      status: "NHIEU_CAN",
      confidence: 0.45,
      matchedCode: null,
      reason: parseResult.matchReason,
      suggestions
    };
  }

  if (parsedCode) {
    if (!hasValidCode) {
      return {
        status: "MA_CAN_KHONG_HOP_LE",
        confidence: 0.4,
        matchedCode: parsedCode,
        reason: `Parsed apartment code ${parsedCode} does not exist in apartment list`,
        suggestions
      };
    }

    const normalizedRaw = normalizeFreeText(transaction.description);
    const isDirect =
      normalizedRaw.includes(parsedCode) ||
      normalizedRaw.includes(parsedCode.replace(".", " "));
    return {
      status: isDirect ? "KHOP_TRUC_TIEP" : "KHOP_SAU_CHUAN_HOA",
      confidence: isDirect ? 0.99 : 0.9,
      matchedCode: parsedCode,
      reason: parseResult.matchReason,
      suggestions
    };
  }

  const internalReason = detectInternalReason(transaction, parseResult, hasValidCode);
  if (internalReason) {
    return {
      status: "KHONG_LIEN_QUAN_CAN_HO",
      confidence: 0.05,
      matchedCode: null,
      reason: internalReason,
      suggestions
    };
  }

  return {
    status: "CHUA_NHAN_DIEN_DUOC_CAN",
    confidence: 0.1,
    matchedCode: null,
    reason: parseResult.matchReason,
    suggestions
  };
}

export function suggestPartialApartmentCandidates(
  description: string,
  validApartments: readonly ApartmentSuggestionSource[]
) {
  const normalized = normalizeFreeText(description);
  const roomMatches = new Set<string>();
  const patterns = [
    /\bL\s+(\d{3}[A-C]?)\b/g,
    /\bCAN\s+(\d{3}[A-C]?)\b/g,
    /\bPHONG\s+(\d{3}[A-C]?)\b/g
  ];

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      if (match[1]) roomMatches.add(match[1]);
    }
  }

  if (!roomMatches.size) return [];

  return validApartments
    .filter((apartment) => {
      const suffix = apartment.ma_can.split(".").pop();
      return suffix && roomMatches.has(suffix);
    })
    .slice(0, 20)
    .map((apartment, index) => ({
      code: apartment.ma_can,
      score: 10,
      reason: `Gợi ý yếu: nội dung chỉ có số căn ${apartment.ma_can.split(".").pop()}, thiếu lô. Cần admin duyệt.`,
      rank: index + 1
    }));
}

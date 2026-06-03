import { ApartmentParseCandidate, ApartmentParseResult } from "@/src/modules/shared/types";
import { normalizeApartmentCode, normalizeFreeText } from "@/src/modules/shared/utils/text";

export const APARTMENT_CODE_PARSER_VERSION = "apartment-code-parser-v0.5-lkv";

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

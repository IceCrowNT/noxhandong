import { ApartmentParseCandidate, ApartmentParseResult } from "@/lib/types";
import { normalizeApartmentCode, normalizeFreeText } from "@/lib/utils/text";

const BLOCK_CAPTURE = "([1-9][A-C]?)";
const ROOM_CAPTURE = "([1-9]\\d{2}[A-Z]?)";
const LK_BLOCK_CAPTURE = "(LK[1-9])";
const LK_BLOCK_ALIAS_CAPTURE = "((?:LK|IK)[1-9])";
const LK_ROOM_CAPTURE = "([1-9]\\d?)";

function formatApartmentCode(block: string, room: string, prefix = "L"): string {
  return `${prefix}${block}.${room}`;
}

function buildCandidate(block: string, room: string, reason: string, score: number, prefix = "L") {
  const normalized = normalizeApartmentCode(formatApartmentCode(block, room, prefix));
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

function buildCompactBlockRoomCandidate(token: string, reason: string, score: number) {
  if (!token.startsWith("L")) {
    return undefined;
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

  const fillerWordPattern = "(?:CAN|CANHO|HO|TOA|TOANHA|NHA|CHUNGCU|CC|PHI|DONG|NOP|TIEN|THANG|T|QLVH|PQLCC)";
  const dotPattern = new RegExp(`\\bL${BLOCK_CAPTURE}\\s+${ROOM_CAPTURE}(?=${fillerWordPattern}|\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(dotPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_SPACED", 0.98));
  }

  const blockThenRoomFlexiblePattern = new RegExp(
    `\\bL${BLOCK_CAPTURE}\\b(?:\\s+${fillerWordPattern}){0,4}\\s+${ROOM_CAPTURE}(?=\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(blockThenRoomFlexiblePattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_FLEXIBLE", 0.96));
  }

  const roomThenBlockPattern = new RegExp(`\\b${ROOM_CAPTURE}\\s+L${BLOCK_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(roomThenBlockPattern)) {
    push(buildCandidate(match[2], match[1], "ROOM_BLOCK_SPACED", 0.95));
  }

  const roomThenBlockFlexiblePattern = new RegExp(
    `\\b${ROOM_CAPTURE}\\s+L${BLOCK_CAPTURE}(?=${fillerWordPattern}|\\b|[^A-Z])`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(roomThenBlockFlexiblePattern)) {
    push(buildCandidate(match[2], match[1], "ROOM_BLOCK_FLEXIBLE", 0.94));
  }

  const lkPattern = new RegExp(`\\b${LK_BLOCK_ALIAS_CAPTURE}\\s+${LK_ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(lkPattern)) {
    push(buildLkCandidate(match[1], match[2], "LK_BLOCK_ROOM_SPACED", 0.98));
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

  const blockSoNhaPattern = new RegExp(`\\bL${BLOCK_CAPTURE}\\b(?:\\s+(?:SO|NHA|SO NHA)){1,2}\\s+${ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(blockSoNhaPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_SO_NHA_ROOM", 0.95));
  }

  const compactWithTrailingDigitsPattern = new RegExp(
    `\\bL${BLOCK_CAPTURE}${ROOM_CAPTURE}(\\d{6,})(?=\\s+(?:NOP|PHI|QLVH|QLCC|PQLCC|DONG|CAN|CC|THANG)\\b)`,
    "g"
  );
  for (const match of normalizedDescription.matchAll(compactWithTrailingDigitsPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_TRAILING_DIGITS", 0.89));
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
    if (candidateBlock.startsWith("LK")) {
      return true;
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

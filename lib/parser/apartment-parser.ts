import { ApartmentParseCandidate, ApartmentParseResult } from "@/lib/types";
import { normalizeApartmentCode, normalizeFreeText } from "@/lib/utils/text";

const BLOCK_CAPTURE = "([1-9][A-C]?)";
const ROOM_CAPTURE = "([1-9]\\d{2}[A-Z]?)";

function formatApartmentCode(block: string, room: string): string {
  return `L${block}.${room}`;
}

function buildCandidate(block: string, room: string, reason: string, score: number) {
  const normalized = normalizeApartmentCode(formatApartmentCode(block, room));
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

function collectCandidates(normalizedDescription: string): ApartmentParseCandidate[] {
  const candidates: ApartmentParseCandidate[] = [];
  const push = (candidate?: ApartmentParseCandidate) => {
    if (!candidate || candidates.some((item) => item.code === candidate.code)) {
      return;
    }
    candidates.push(candidate);
  };

  const dotPattern = new RegExp(`\\bL${BLOCK_CAPTURE}\\s+${ROOM_CAPTURE}(?=\\b|[^A-Z])`, "g");
  for (const match of normalizedDescription.matchAll(dotPattern)) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_SPACED", 0.98));
  }

  const fillerWordPattern = "(?:CAN|CANHO|HO|TOA|TOANHA|NHA|CHUNGCU|CC|PHI|DONG|NOP|TIEN|THANG|T|QLVH|PQLCC)";
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

  for (const token of normalizedDescription.split(" ").filter(Boolean)) {
    push(buildCompactBlockRoomCandidate(token, "BLOCK_ROOM_COMPACT_TOKEN", 0.93));
    push(buildCompactRoomBlockCandidate(token, "ROOM_BLOCK_COMPACT_TOKEN", 0.92));
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const [candidateBlock, candidateRoom] = candidate.code.split(".");
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

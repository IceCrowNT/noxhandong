import { parseApartmentCode } from "@/src/modules/transactions/parser/apartment-parser";

export const PUBLIC_LOOKUP_MAX_LENGTH = 80;

const SAFE_LOOKUP_PATTERN = /^[\p{L}\p{N}\s.,;:/\\_\-+()#]*$/u;
const DIRECT_CODE_PATTERNS = [
  /\bLKV\s*[._\-\\/ ]\s*([1-9]\d{0,2}[A-Z]?)\b/giu,
  /\b(LK[1-9])\s*[._\-\\/ ]\s*([1-9]\d?[A-Z]?)\b/giu,
  /\b(L[1-9][A-Z]?)\s*[._\-\\/ ]\s*([1-9]\d{2}[A-Z]?)\b/giu,
];
const ROOM_THEN_BLOCK_PATTERN =
  /\b([1-9]\d{2}[A-Z]?)\b(?:\s+(?:CAN|CANHO|CAN HO|TOA|TOANHA|TOA NHA|LO|NHA)){0,4}\s+\b(L[1-9][A-Z]?)\b/giu;

export type PublicLookupInput =
  | {
      ok: true;
      rawInput: string;
      sanitizedInput: string;
      candidates: string[];
      primaryCode?: string;
      reason: string;
    }
  | {
      ok: false;
      rawInput: string;
      sanitizedInput: string;
      candidates: string[];
      error: "TOO_LONG" | "UNSAFE_CHARACTERS" | "NO_APARTMENT_CODE";
      message: string;
    };

function unique(values: string[]) {
  return [...new Set(values)];
}

function collectDirectCandidates(value: string) {
  const candidates: string[] = [];

  for (const pattern of DIRECT_CODE_PATTERNS) {
    for (const match of value.matchAll(pattern)) {
      if (match[0].toUpperCase().startsWith("LKV")) {
        candidates.push(`LKV.${match[1].toUpperCase()}`);
      } else {
        candidates.push(`${match[1].toUpperCase()}.${match[2].toUpperCase()}`);
      }
    }
  }

  for (const match of value.matchAll(ROOM_THEN_BLOCK_PATTERN)) {
    candidates.push(`${match[2].toUpperCase()}.${match[1].toUpperCase()}`);
  }

  return unique(candidates);
}

export function parsePublicLookupInput(value: string): PublicLookupInput {
  const rawInput = String(value || "");
  const sanitizedInput = rawInput.trim().slice(0, PUBLIC_LOOKUP_MAX_LENGTH);

  if (rawInput.trim().length > PUBLIC_LOOKUP_MAX_LENGTH) {
    return {
      ok: false,
      rawInput,
      sanitizedInput,
      candidates: [],
      error: "TOO_LONG",
      message: `Mã căn hoặc nội dung tra cứu tối đa ${PUBLIC_LOOKUP_MAX_LENGTH} ký tự.`,
    };
  }

  if (!SAFE_LOOKUP_PATTERN.test(sanitizedInput)) {
    return {
      ok: false,
      rawInput,
      sanitizedInput,
      candidates: [],
      error: "UNSAFE_CHARACTERS",
      message: "Nội dung tra cứu chứa ký tự không được hỗ trợ.",
    };
  }

  const result = parseApartmentCode(sanitizedInput);
  const candidates = unique([
    ...collectDirectCandidates(sanitizedInput),
    ...result.candidates.map((candidate) => candidate.code),
  ]);

  if (candidates.length === 0) {
    return {
      ok: false,
      rawInput,
      sanitizedInput,
      candidates,
      error: "NO_APARTMENT_CODE",
      message: "Không nhận diện được mã căn từ nội dung đã nhập.",
    };
  }

  return {
    ok: true,
    rawInput,
    sanitizedInput,
    candidates,
    primaryCode: result.parsedApartmentCode,
    reason: result.matchReason,
  };
}

export function publicFeeDisplayText(payload: unknown, fallback: string | null) {
  if (
    payload &&
    typeof payload === "object" &&
    "publicDisplayText" in payload &&
    typeof payload.publicDisplayText === "string" &&
    payload.publicDisplayText.trim()
  ) {
    return payload.publicDisplayText.trim();
  }

  return fallback || "Chưa có dữ liệu tháng đã đóng.";
}

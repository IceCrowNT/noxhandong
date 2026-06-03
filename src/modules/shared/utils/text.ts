export function removeVietnameseDiacritics(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeFreeText(value: string): string {
  const noAccent = removeVietnameseDiacritics(value).toUpperCase();
  return normalizeWhitespace(
    noAccent.replace(/[._\-\\/]+/g, " ").replace(/[^A-Z0-9 ]+/g, " ")
  );
}

export function normalizeHeader(value: string): string {
  return normalizeWhitespace(removeVietnameseDiacritics(value).toLowerCase());
}

const APARTMENT_BLOCK_PATTERN = "(L[1-9][A-C]?|LK[1-9])";
const APARTMENT_ROOM_PATTERN = "([1-9]\\d{2}[A-Z]?)";
const LK_ROOM_PATTERN = "([1-9]\\d?)";
const LKV_ROOM_PATTERN = "([1-9]\\d{0,2}[A-Z]?)";

export function normalizeApartmentCode(value: string): string | undefined {
  const normalized = normalizeFreeText(value).replace(/\s+/g, "");
  const standardMatch = normalized.match(new RegExp(`^(L[1-9][A-C]?)${APARTMENT_ROOM_PATTERN}$`));
  if (standardMatch) {
    return `${standardMatch[1]}.${standardMatch[2]}`;
  }

  const lkMatch = normalized.match(new RegExp(`^(LK[1-9])${LK_ROOM_PATTERN}$`));
  if (lkMatch) {
    return `${lkMatch[1]}.${lkMatch[2]}`;
  }

  const lkvMatch = normalized.match(new RegExp(`^(LKV)${LKV_ROOM_PATTERN}$`));
  if (lkvMatch) {
    return `${lkvMatch[1]}.${lkvMatch[2]}`;
  }

  const dotted = value.trim().toUpperCase().replace(/\s+/g, "");
  const dottedStandardMatch = dotted.match(new RegExp(`^(L[1-9][A-C]?)\\.${APARTMENT_ROOM_PATTERN}$`));
  if (dottedStandardMatch) {
    return `${dottedStandardMatch[1]}.${dottedStandardMatch[2]}`;
  }

  const dottedLkMatch = dotted.match(new RegExp(`^(LK[1-9])\\.${LK_ROOM_PATTERN}$`));
  if (dottedLkMatch) {
    return `${dottedLkMatch[1]}.${dottedLkMatch[2]}`;
  }

  const dottedLkvMatch = dotted.match(new RegExp(`^(LKV)\\.${LKV_ROOM_PATTERN}$`));
  if (dottedLkvMatch) {
    return `${dottedLkvMatch[1]}.${dottedLkvMatch[2]}`;
  }

  return undefined;
}

export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

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

const APARTMENT_BLOCK_PATTERN = "L([1-9][A-Z]?)";
const APARTMENT_ROOM_PATTERN = "([1-9]\\d{2}[A-Z]?)";

export function normalizeApartmentCode(value: string): string | undefined {
  const normalized = normalizeFreeText(value).replace(/\s+/g, "");
  const match = normalized.match(new RegExp(`^${APARTMENT_BLOCK_PATTERN}${APARTMENT_ROOM_PATTERN}$`));
  if (match) {
    return `L${match[1]}.${match[2]}`;
  }

  const dotted = value.trim().toUpperCase().replace(/\s+/g, "");
  const dottedMatch = dotted.match(new RegExp(`^${APARTMENT_BLOCK_PATTERN}\\.${APARTMENT_ROOM_PATTERN}$`));
  if (dottedMatch) {
    return `L${dottedMatch[1]}.${dottedMatch[2]}`;
  }

  return undefined;
}

export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

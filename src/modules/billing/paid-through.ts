export const FEE_BASE_YEAR = 2026;

export type PaidThroughInfo = {
  rawText: string;
  rawMonth: string | null;
  numericMonth: number | null;
  kind: "EMPTY" | "UNPARSED" | "PARTIAL_PAYMENT" | "BASE_YEAR_MONTH" | "OUTSIDE_BASE_YEAR";
  needsReview: boolean;
  isPartialPayment: boolean;
  isOutsideBaseYear: boolean;
  resolvedMonth?: number;
  resolvedYear?: number;
  displayText: string;
  source: string;
};

function recordValue(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function resolveRelativeMonth(relativeMonth: number, baseYear = FEE_BASE_YEAR) {
  const zeroBasedMonthIndex = relativeMonth - 1;
  return {
    year: baseYear + Math.floor(zeroBasedMonthIndex / 12),
    month: ((zeroBasedMonthIndex % 12) + 12) % 12 + 1,
  };
}

export function extractNumericPaidThrough(payload: unknown, fallback?: string | null) {
  const payloadRecord = recordValue(payload);
  const paidThrough = recordValue(payloadRecord?.paidThrough);
  const fromPayload =
    numericValue(paidThrough?.numericMonth) ??
    numericValue(payloadRecord?.numericMonth);
  if (fromPayload !== null) return Math.floor(fromPayload);

  const match = String(fallback || "").match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? Math.floor(parsed) : null;
}

export function extractCarryAmount(payload: unknown) {
  const payloadRecord = recordValue(payload);
  return Math.max(
    0,
    numericValue(payloadRecord?.remainderAmount) ??
      numericValue(payloadRecord?.carryAmount) ??
      0,
  );
}

export function buildPaidThroughInfo(
  numericMonth: number | null,
  source: string,
  baseYear = FEE_BASE_YEAR,
): PaidThroughInfo {
  if (numericMonth === null) {
    return {
      rawText: "",
      rawMonth: null,
      numericMonth: null,
      kind: "EMPTY",
      needsReview: false,
      isPartialPayment: false,
      isOutsideBaseYear: false,
      displayText: "Chưa có dữ liệu tháng đã đóng.",
      source,
    };
  }

  const resolved = resolveRelativeMonth(numericMonth, baseYear);
  return {
    rawText: `Hết tháng ${numericMonth}`,
    rawMonth: String(numericMonth),
    numericMonth,
    kind: resolved.year === baseYear ? "BASE_YEAR_MONTH" : "OUTSIDE_BASE_YEAR",
    needsReview: false,
    isPartialPayment: false,
    isOutsideBaseYear: resolved.year !== baseYear,
    resolvedMonth: resolved.month,
    resolvedYear: resolved.year,
    displayText: `đã đóng hết tháng ${resolved.month} năm ${resolved.year}`,
    source,
  };
}

export function parsePaidThroughValue(
  value: unknown,
  source = "FEE_TRACKING_EXCEL",
  baseYear = FEE_BASE_YEAR,
): PaidThroughInfo {
  const rawText = String(value || "").trim();
  if (!rawText) return buildPaidThroughInfo(null, source, baseYear);

  const normalized = rawText
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
  const match = normalized.match(/het thang\s*(-?\d+(?:[,.]\d+)?)/);
  if (!match) {
    return {
      rawText,
      rawMonth: null,
      numericMonth: null,
      kind: "UNPARSED",
      needsReview: true,
      isPartialPayment: false,
      isOutsideBaseYear: false,
      displayText: rawText,
      source,
    };
  }

  const rawMonth = match[1];
  const numericMonth = Number(rawMonth.replace(",", "."));
  if (!Number.isFinite(numericMonth)) {
    return {
      rawText,
      rawMonth,
      numericMonth: null,
      kind: "UNPARSED",
      needsReview: true,
      isPartialPayment: false,
      isOutsideBaseYear: false,
      displayText: rawText,
      source,
    };
  }

  if (!Number.isInteger(numericMonth)) {
    return {
      rawText,
      rawMonth,
      numericMonth,
      kind: "PARTIAL_PAYMENT",
      needsReview: false,
      isPartialPayment: true,
      isOutsideBaseYear: false,
      displayText: `đã đóng lẻ tiền, tương đương ${rawMonth} tháng trong năm ${baseYear}`,
      source,
    };
  }

  return {
    ...buildPaidThroughInfo(numericMonth, source, baseYear),
    rawText,
    rawMonth,
  };
}

export function calculatePaidThroughAdvance(input: {
  baseNumericMonth: number | null;
  previousCarryAmount?: number;
  newPaymentAmount: number;
  unitFee: number;
}) {
  const previousCarryAmount = Math.max(0, input.previousCarryAmount || 0);
  const newPaymentAmount = Math.max(0, input.newPaymentAmount || 0);
  const availableAmount = previousCarryAmount + newPaymentAmount;
  const addedMonths = input.unitFee > 0 ? Math.floor(availableAmount / input.unitFee) : 0;
  const remainderAmount =
    input.unitFee > 0 ? availableAmount - addedMonths * input.unitFee : availableAmount;
  const nextNumericMonth =
    input.baseNumericMonth === null ? null : input.baseNumericMonth + addedMonths;

  return {
    previousCarryAmount,
    newPaymentAmount,
    availableAmount,
    addedMonths,
    remainderAmount,
    nextNumericMonth,
  };
}

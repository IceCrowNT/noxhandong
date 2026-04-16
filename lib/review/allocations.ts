import { AllocationDraft, ReviewRow, TransactionAllocation } from "@/lib/types";

const STANDARD_MONTHLY_FEE = 250000;
const LK_MONTHLY_FEE = 200000;

function getApartmentMonthlyFee(apartmentCode: string): number {
  return apartmentCode.startsWith("LK") ? LK_MONTHLY_FEE : STANDARD_MONTHLY_FEE;
}

function uniqueCodes(codes: string[]): string[] {
  return codes.filter((code, index) => code && codes.indexOf(code) === index);
}

function splitAmountByWeights(totalAmount: number, weights: number[]): number[] {
  const rawAllocations = weights.map((weight) => (totalAmount * weight) / weights.reduce((sum, value) => sum + value, 0));
  const rounded = rawAllocations.map((value) => Math.floor(value));
  let remainder = totalAmount - rounded.reduce((sum, value) => sum + value, 0);

  const indicesByFraction = rawAllocations
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((left, right) => right.fraction - left.fraction);

  for (const item of indicesByFraction) {
    if (remainder <= 0) {
      break;
    }

    rounded[item.index] += 1;
    remainder -= 1;
  }

  return rounded;
}

function buildSingleAllocation(row: ReviewRow, apartmentCode: string): TransactionAllocation {
  return {
    sourceRowId: row.id,
    transactionDate: row.transactionDate,
    rawDescription: row.rawDescription,
    apartmentCode,
    amount: row.amount,
    allocationKind: "SINGLE",
    allocationNote: row.reviewNote || "Giao dịch một căn."
  };
}

function buildMultiAllocationMeta(row: ReviewRow, apartmentCodes: string[]) {
  const weights = apartmentCodes.map(getApartmentMonthlyFee);
  const expectedTotal = weights.reduce((sum, value) => sum + value, 0);
  const exactMatch = row.amount === expectedTotal;
  const allocatedAmounts = exactMatch ? weights : splitAmountByWeights(row.amount, weights);
  const note = exactMatch
    ? `Phân bổ nhiều căn theo phí chuẩn 1 tháng. Tổng chuẩn = ${expectedTotal.toLocaleString("vi-VN")}.`
    : `Phân bổ theo tỷ trọng phí chuẩn 1 tháng vì số tiền thực nhận lệch chuẩn. Tổng chuẩn = ${expectedTotal.toLocaleString("vi-VN")}, số tiền thực nhận = ${row.amount.toLocaleString("vi-VN")}.`;

  return {
    exactMatch,
    allocatedAmounts,
    note
  };
}

export function buildSuggestedAllocationDrafts(row: ReviewRow): AllocationDraft[] {
  const apartmentCodes = uniqueCodes(row.suggestions);
  if (row.matchStatus !== "MULTI_MATCH" || apartmentCodes.length === 0) {
    return [];
  }

  const { allocatedAmounts, note } = buildMultiAllocationMeta(row, apartmentCodes);
  return apartmentCodes.map((apartmentCode, index) => ({
    apartmentCode,
    amount: allocatedAmounts[index],
    note
  }));
}

export function hasValidAllocationDrafts(row: ReviewRow): boolean {
  if (row.matchStatus !== "MULTI_MATCH") {
    return false;
  }

  const drafts = row.allocationDrafts ?? [];
  if (drafts.length === 0) {
    return false;
  }

  const uniqueDraftCodes = uniqueCodes(drafts.map((item) => item.apartmentCode));
  if (uniqueDraftCodes.length !== drafts.length) {
    return false;
  }

  return drafts.reduce((sum, item) => sum + item.amount, 0) === row.amount;
}

function buildMultiAllocations(row: ReviewRow, apartmentCodes: string[]): TransactionAllocation[] {
  const draftMap = new Map((row.allocationDrafts ?? []).map((item) => [item.apartmentCode, item]));
  const hasUsableDrafts = apartmentCodes.length > 0 && apartmentCodes.every((code) => draftMap.has(code)) && hasValidAllocationDrafts(row);
  const meta = buildMultiAllocationMeta(row, apartmentCodes);
  return apartmentCodes.map((apartmentCode, index) => ({
    sourceRowId: row.id,
    transactionDate: row.transactionDate,
    rawDescription: row.rawDescription,
    apartmentCode,
    amount: hasUsableDrafts ? draftMap.get(apartmentCode)?.amount ?? 0 : meta.allocatedAmounts[index],
    allocationKind: hasUsableDrafts ? "MULTI_PRORATED" : meta.exactMatch ? "MULTI_EXACT" : "MULTI_PRORATED",
    allocationNote: hasUsableDrafts
      ? row.reviewNote || draftMap.get(apartmentCode)?.note || "Phân bổ nhiều căn được xác nhận trên giao diện."
      : row.reviewNote
        ? `${meta.note} Ghi chú: ${row.reviewNote}`
        : meta.note
  }));
}

export function buildTransactionAllocations(rows: ReviewRow[]): TransactionAllocation[] {
  return rows.flatMap((row) => {
    const chosenCode = row.manualApartmentCode || row.matchedApartmentCode;
    if (chosenCode) {
      return [buildSingleAllocation(row, chosenCode)];
    }

    if (row.matchStatus !== "MULTI_MATCH") {
      return [];
    }

    const apartmentCodes = uniqueCodes(row.suggestions);
    if (apartmentCodes.length === 0) {
      return [];
    }

    return buildMultiAllocations(row, apartmentCodes);
  });
}

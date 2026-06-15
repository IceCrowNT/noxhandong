import { normalizeApartmentCode } from "@/src/modules/shared/utils/text";

export type AllocationEditorRow = {
  code: string;
  amount: string;
};

export function parseAllocationCodeList(value: string): string[] {
  const candidates = value
    .split(/[\n,;\t]+/)
    .flatMap((part) => {
      const trimmed = part.trim();
      if (!trimmed) return [];
      if (normalizeApartmentCode(trimmed)) return [trimmed];

      const whitespaceParts = trimmed.split(/\s+/).filter(Boolean);
      return whitespaceParts.length > 1 && whitespaceParts.every((item) => normalizeApartmentCode(item))
        ? whitespaceParts
        : [trimmed];
    })
    .map((item) => normalizeApartmentCode(item))
    .filter((item): item is string => Boolean(item));

  return [...new Set(candidates)];
}

export function splitAllocationAmount(totalAmount: number, rowCount: number): number[] {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0 || !Number.isInteger(rowCount) || rowCount <= 0) {
    return [];
  }

  const roundedTotal = Math.round(totalAmount);
  const baseAmount = Math.floor(roundedTotal / rowCount);
  const remainder = roundedTotal - baseAmount * rowCount;

  return Array.from({ length: rowCount }, (_, index) => baseAmount + (index < remainder ? 1 : 0));
}

export function allocationTotal(rows: AllocationEditorRow[]): number {
  return rows.reduce((sum, row) => {
    const normalized = row.amount.replace(/\D/g, "");
    const amount = Number(normalized);
    return sum + (Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0);
  }, 0);
}

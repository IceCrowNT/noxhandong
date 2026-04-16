import * as XLSX from "xlsx";
import {
  DEFAULT_CUSTOMER_COLUMN_ALIASES,
  MANAGEMENT_SHEET_NAMES,
} from "@/src/modules/shared/constants";
import { CustomerRecord, ManagementWorkbookData } from "@/src/modules/shared/types";
import {
  normalizeApartmentCode,
  normalizeHeader,
  safeString,
} from "@/src/modules/shared/utils/text";

function matchAliasScore(cellValue: string, aliases: readonly string[]): number {
  const normalizedCell = normalizeHeader(cellValue)
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedCell) {
    return 0;
  }

  let score = 0;
  for (const alias of aliases) {
    if (normalizedCell === alias) {
      score += 6;
      continue;
    }

    if (normalizedCell.includes(alias) || alias.includes(normalizedCell)) {
      score += 3;
    }
  }

  return score;
}

function scoreHeaderRow(row: unknown[]): number {
  const apartmentScore = row.reduce<number>((sum, cell) => {
    return sum + matchAliasScore(safeString(cell), DEFAULT_CUSTOMER_COLUMN_ALIASES.apartmentCode);
  }, 0);
  const ownerScore = row.reduce<number>((sum, cell) => {
    return sum + matchAliasScore(safeString(cell), DEFAULT_CUSTOMER_COLUMN_ALIASES.ownerName);
  }, 0);
  const statusScore = row.reduce<number>((sum, cell) => {
    return sum + matchAliasScore(safeString(cell), DEFAULT_CUSTOMER_COLUMN_ALIASES.status);
  }, 0);
  const noteScore = row.reduce<number>((sum, cell) => {
    return sum + matchAliasScore(safeString(cell), DEFAULT_CUSTOMER_COLUMN_ALIASES.note);
  }, 0);

  return apartmentScore + ownerScore + statusScore + noteScore;
}

function inferApartmentColumn(rows: unknown[][], startRow: number): number {
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  let bestColumn = -1;
  let bestScore = 0;

  for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
    let apartmentLikeCount = 0;
    let checkedRows = 0;

    for (const row of rows.slice(startRow, startRow + 30)) {
      const value = safeString(row[columnIndex]);
      if (!value) {
        continue;
      }

      checkedRows += 1;
      if (normalizeApartmentCode(value)) {
        apartmentLikeCount += 1;
      }
    }

    if (apartmentLikeCount > bestScore && apartmentLikeCount >= 2) {
      bestScore = apartmentLikeCount;
      bestColumn = columnIndex;
    }
  }

  return bestColumn;
}

function detectHeaderRow(rows: unknown[][]): number {
  let bestIndex = -1;
  let bestScore = 0;

  for (const [index, row] of rows.slice(0, 20).entries()) {
    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  if (bestIndex >= 0 && bestScore >= 3) {
    return bestIndex;
  }

  const inferredApartmentColumn = inferApartmentColumn(rows, 0);
  if (inferredApartmentColumn >= 0) {
    const firstDataRowIndex = rows.findIndex((row) => normalizeApartmentCode(safeString(row[inferredApartmentColumn])));
    if (firstDataRowIndex > 0) {
      return firstDataRowIndex - 1;
    }
  }

  return -1;
}

function findColumnIndex(headers: string[], aliases: readonly string[]): number {
  return headers.findIndex((header) => matchAliasScore(header, aliases) > 0);
}

export function readManagementWorkbook(buffer: ArrayBuffer): ManagementWorkbookData {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[MANAGEMENT_SHEET_NAMES.customers];

  if (!sheet) {
    throw new Error(`Không tìm thấy sheet "${MANAGEMENT_SHEET_NAMES.customers}" trong file quản lý.`);
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: ""
  });
  const headerRowIndex = detectHeaderRow(matrix);

  if (headerRowIndex < 0) {
    throw new Error(`Không nhận diện được header của sheet "${MANAGEMENT_SHEET_NAMES.customers}".`);
  }

  const headers = matrix[headerRowIndex].map((cell) => safeString(cell));
  const apartmentCodeIndex =
    findColumnIndex(headers, DEFAULT_CUSTOMER_COLUMN_ALIASES.apartmentCode) >= 0
      ? findColumnIndex(headers, DEFAULT_CUSTOMER_COLUMN_ALIASES.apartmentCode)
      : inferApartmentColumn(matrix, headerRowIndex + 1);
  const ownerNameIndex = findColumnIndex(headers, DEFAULT_CUSTOMER_COLUMN_ALIASES.ownerName);
  const residentInfoIndex = findColumnIndex(headers, DEFAULT_CUSTOMER_COLUMN_ALIASES.residentInfo);
  const statusIndex = findColumnIndex(headers, DEFAULT_CUSTOMER_COLUMN_ALIASES.status);
  const noteIndex = findColumnIndex(headers, DEFAULT_CUSTOMER_COLUMN_ALIASES.note);

  if (apartmentCodeIndex < 0) {
    throw new Error("Không tìm thấy cột mã căn hộ trong sheet Danh sách khách hàng.");
  }

  const customers: CustomerRecord[] = matrix.slice(headerRowIndex + 1).flatMap((row) => {
    const apartmentCode = normalizeApartmentCode(safeString(row[apartmentCodeIndex]));
    if (!apartmentCode) {
      return [];
    }

    const rawRow = headers.reduce<Record<string, unknown>>((accumulator, header, index) => {
      accumulator[header || `COLUMN_${index + 1}`] = row[index];
      return accumulator;
    }, {});

    return [
      {
        apartmentCode,
        ownerName: ownerNameIndex >= 0 ? safeString(row[ownerNameIndex]) : undefined,
        residentInfo: residentInfoIndex >= 0 ? safeString(row[residentInfoIndex]) : undefined,
        status: statusIndex >= 0 ? safeString(row[statusIndex]) : undefined,
        note: noteIndex >= 0 ? safeString(row[noteIndex]) : undefined,
        rawRow
      }
    ];
  });

  return {
    customers,
    workbookSheetNames: workbook.SheetNames
  };
}

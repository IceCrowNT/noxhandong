#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const XLSX = require("xlsx");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in .env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_INPUT = "docs/Theo dõi thu phí T4.xlsx";
const TARGET_SHEET = "Lịch sử đóng phí";
const PREVIEW_DIR = "docs/preview-theo-doi-thu-phi";
const BASE_YEAR = 2026;

function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function normalizeText(value) {
  return safeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeApartmentCode(value) {
  const raw = safeString(value).toUpperCase();
  if (!raw) {
    return null;
  }

  if (/^LKV\.\d{1,3}[A-Z]?$/i.test(raw)) {
    return raw;
  }

  if (/^LK\d+[A-Z]?\.\d{1,3}[A-Z]?$/i.test(raw)) {
    return raw;
  }

  if (/^L\d+[A-Z]?\.\d{3}[A-Z]?$/i.test(raw)) {
    return raw;
  }

  return null;
}

function fileHash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function normalizeJsonValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeJsonValue(item)])
    );
  }
  return value;
}

function rowToMappedObject(headers, values) {
  return headers.reduce((mapped, header, index) => {
    const key = safeString(header) || `__EMPTY_${index}`;
    mapped[key] = values[index] ?? "";
    return mapped;
  }, {});
}

function findHeaderRow(rows) {
  for (let index = 0; index < rows.length; index += 1) {
    const normalized = rows[index].map(normalizeText);
    const codeIndex = normalized.findIndex((header) => header === "so can ho");
    const paidThroughIndex = normalized.findIndex((header) =>
      header.includes("thang da dong den hien tai")
    );

    if (codeIndex >= 0 && paidThroughIndex >= 0) {
      return { rowIndex: index, codeIndex, paidThroughIndex };
    }
  }

  throw new Error(`Cannot find fee tracking header row in sheet "${TARGET_SHEET}"`);
}

function parsePaidThroughMonth(value) {
  const text = normalizeText(value);
  const match = text.match(/het thang\s*(-?\d+(?:[,.]\d+)?)/);
  if (!match) {
    return null;
  }

  const rawMonth = match[1];
  const month = Number(rawMonth.replace(",", "."));
  if (!Number.isFinite(month)) {
    return null;
  }

  return { rawMonth, month };
}

function resolveRelativeMonth(relativeMonth) {
  const zeroBasedMonthIndex = relativeMonth - 1;
  const year = BASE_YEAR + Math.floor(zeroBasedMonthIndex / 12);
  const month = ((zeroBasedMonthIndex % 12) + 12) % 12 + 1;
  return { year, month };
}

function buildPaidThroughInfo(value) {
  const text = safeString(value);
  if (!text) {
    return {
      rawText: "",
      rawMonth: null,
      numericMonth: null,
      kind: "EMPTY",
      needsReview: false,
      isPartialPayment: false,
      isOutsideBaseYear: false,
      displayText: null,
    };
  }

  const parsed = parsePaidThroughMonth(text);
  if (!parsed) {
    return {
      rawText: text,
      rawMonth: null,
      numericMonth: null,
      kind: "UNPARSED",
      needsReview: true,
      isPartialPayment: false,
      isOutsideBaseYear: false,
      displayText: text,
    };
  }

  if (!Number.isInteger(parsed.month)) {
    return {
      rawText: text,
      rawMonth: parsed.rawMonth,
      numericMonth: parsed.month,
      kind: "PARTIAL_PAYMENT",
      needsReview: false,
      isPartialPayment: true,
      isOutsideBaseYear: false,
      displayText: `đã đóng lẻ tiền, tương đương ${parsed.rawMonth} tháng trong năm ${BASE_YEAR}`,
    };
  }

  const resolved = resolveRelativeMonth(parsed.month);
  return {
    rawText: text,
    rawMonth: parsed.rawMonth,
    numericMonth: parsed.month,
    kind: resolved.year === BASE_YEAR ? "BASE_YEAR_MONTH" : "OUTSIDE_BASE_YEAR",
    needsReview: false,
    isPartialPayment: false,
    isOutsideBaseYear: resolved.year !== BASE_YEAR,
    resolvedMonth: resolved.month,
    resolvedYear: resolved.year,
    displayText: `đã đóng hết tháng ${resolved.month} năm ${resolved.year}`,
  };
}

function csvEscape(value) {
  const text = safeString(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, headers, rows) {
  const content = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
  fs.writeFileSync(filePath, `${content}\n`, "utf8");
}

async function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const resolvedPath = path.resolve(process.cwd(), inputPath);

  const workbook = XLSX.readFile(resolvedPath, { cellDates: true });
  const sheet = workbook.Sheets[TARGET_SHEET];

  if (!sheet) {
    throw new Error(`Cannot find sheet "${TARGET_SHEET}" in ${resolvedPath}`);
  }

  const table = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  const headerInfo = findHeaderRow(table);
  const headers = table[headerInfo.rowIndex] ?? [];
  const dataRows = table
    .slice(headerInfo.rowIndex + 1)
    .map((values, index) => {
      const excelRow = headerInfo.rowIndex + 2 + index;
      const mappedRow = rowToMappedObject(headers, values);
      const rawCode = values[headerInfo.codeIndex];
      return {
        excelRow,
        values,
        mappedRow,
        rawCode,
        maCan: normalizeApartmentCode(rawCode),
        paidThrough: safeString(values[headerInfo.paidThroughIndex]),
      };
    })
    .filter((row) => safeString(row.rawCode) !== "");

  const apartmentCodes = new Set(
    (
      await prisma.canHo.findMany({
        select: { ma_can: true },
      })
    ).map((item) => item.ma_can)
  );

  const invalidApartmentRows = [];
  const missingPaidThroughRows = [];
  const unparsedPaidThroughRows = [];
  const partialPaymentRows = [];
  const outsideBaseYearRows = [];

  for (const row of dataRows) {
    const paidThroughInfo = buildPaidThroughInfo(row.paidThrough);

    if (!row.maCan || !apartmentCodes.has(row.maCan)) {
      invalidApartmentRows.push({
        excel_row: row.excelRow,
        raw_code: row.rawCode,
        normalized_code: row.maCan || "",
        paid_through: row.paidThrough,
      });
    }

    if (!row.paidThrough) {
      missingPaidThroughRows.push({
        excel_row: row.excelRow,
        raw_code: row.rawCode,
        normalized_code: row.maCan || "",
      });
    }

    if (paidThroughInfo.kind === "UNPARSED") {
      unparsedPaidThroughRows.push({
        excel_row: row.excelRow,
        raw_code: row.rawCode,
        normalized_code: row.maCan || "",
        paid_through: row.paidThrough,
      });
    }

    if (paidThroughInfo.isPartialPayment) {
      partialPaymentRows.push({
        excel_row: row.excelRow,
        raw_code: row.rawCode,
        normalized_code: row.maCan || "",
        paid_through: row.paidThrough,
        display_text: paidThroughInfo.displayText,
      });
    }

    if (paidThroughInfo.isOutsideBaseYear) {
      outsideBaseYearRows.push({
        excel_row: row.excelRow,
        raw_code: row.rawCode,
        normalized_code: row.maCan || "",
        paid_through: row.paidThrough,
        resolved_month: paidThroughInfo.resolvedMonth,
        resolved_year: paidThroughInfo.resolvedYear,
        display_text: paidThroughInfo.displayText,
      });
    }
  }

  const batch = await prisma.loNhapDuLieu.create({
    data: {
      loai_nguon: "WORKBOOK_THEO_DOI_THU_PHI",
      ten_file: path.basename(resolvedPath),
      ma_bam_file: fileHash(resolvedPath),
      so_dong: dataRows.length,
      trang_thai: "CHO_XU_LY",
      metadata_json: {
        sourcePath: inputPath,
        sheetName: TARGET_SHEET,
        headerRow: headerInfo.rowIndex + 1,
        apartmentCodeColumn: headerInfo.codeIndex + 1,
        paidThroughColumn: headerInfo.paidThroughIndex + 1,
      },
    },
  });

  for (const row of dataRows) {
    const paidThroughInfo = buildPaidThroughInfo(row.paidThrough);

    await prisma.dongTheoDoiThuPhiTho.create({
      data: {
        lo_nhap_du_lieu_id: batch.id,
        ten_sheet: TARGET_SHEET,
        so_dong_nguon: row.excelRow,
        header_values_json: normalizeJsonValue(headers),
        values_json: normalizeJsonValue(row.values),
        mapped_row_json: normalizeJsonValue(row.mappedRow),
        ma_can: row.maCan,
        thang_da_dong_den_hien_tai: row.paidThrough || null,
        payload_json: {
          sourceRowIndex: row.excelRow,
          rowType: "FEE_TRACKING_HISTORY",
          rawApartmentCode: row.rawCode,
          apartmentCodeExists: row.maCan ? apartmentCodes.has(row.maCan) : false,
          missingPaidThrough: !row.paidThrough,
          paidThrough: paidThroughInfo,
        },
      },
    });
  }

  const issueSummary = {
    invalidApartmentRows: invalidApartmentRows.length,
    missingPaidThroughRows: missingPaidThroughRows.length,
    unparsedPaidThroughRows: unparsedPaidThroughRows.length,
    partialPaymentRows: partialPaymentRows.length,
    outsideBaseYearRows: outsideBaseYearRows.length,
  };

  await prisma.loNhapDuLieu.update({
    where: { id: batch.id },
    data: {
      trang_thai: "HOAN_TAT",
      tong_quan_loi:
        issueSummary.invalidApartmentRows ||
        issueSummary.missingPaidThroughRows ||
        issueSummary.unparsedPaidThroughRows
          ? JSON.stringify(issueSummary)
          : null,
    },
  });

  const previewDir = path.resolve(process.cwd(), PREVIEW_DIR);
  fs.mkdirSync(previewDir, { recursive: true });
  writeCsv(
    path.join(previewDir, "ma-can-khong-map-duoc.csv"),
    ["excel_row", "raw_code", "normalized_code", "paid_through"],
    invalidApartmentRows
  );
  writeCsv(
    path.join(previewDir, "thieu-thang-da-dong.csv"),
    ["excel_row", "raw_code", "normalized_code"],
    missingPaidThroughRows
  );
  writeCsv(
    path.join(previewDir, "thang-da-dong-khong-parse-duoc.csv"),
    ["excel_row", "raw_code", "normalized_code", "paid_through"],
    unparsedPaidThroughRows
  );
  writeCsv(
    path.join(previewDir, "thang-da-dong-bat-thuong.csv"),
    ["excel_row", "raw_code", "normalized_code", "paid_through"],
    unparsedPaidThroughRows
  );
  writeCsv(
    path.join(previewDir, "dong-le-tien.csv"),
    ["excel_row", "raw_code", "normalized_code", "paid_through", "display_text"],
    partialPaymentRows
  );
  writeCsv(
    path.join(previewDir, "ngoai-nam-2026.csv"),
    [
      "excel_row",
      "raw_code",
      "normalized_code",
      "paid_through",
      "resolved_month",
      "resolved_year",
      "display_text",
    ],
    outsideBaseYearRows
  );
  fs.writeFileSync(
    path.join(previewDir, "summary.json"),
    JSON.stringify(
      {
        batchId: batch.id,
        fileName: path.basename(resolvedPath),
        sheetName: TARGET_SHEET,
        headerRow: headerInfo.rowIndex + 1,
        sourceRows: dataRows.length,
        importedRows: dataRows.length,
        ...issueSummary,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        batchId: batch.id,
        fileName: path.basename(resolvedPath),
        sheetName: TARGET_SHEET,
        headerRow: headerInfo.rowIndex + 1,
        sourceRows: dataRows.length,
        importedRows: dataRows.length,
        previewDir: PREVIEW_DIR,
        ...issueSummary,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

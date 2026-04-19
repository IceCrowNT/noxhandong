#!/usr/bin/env node

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong .env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_CUSTOMER_COLUMN_ALIASES = {
  apartmentCode: [
    "mã căn hộ",
    "ma can ho",
    "mã căn",
    "ma can",
    "số căn hộ",
    "so can ho",
    "số căn",
    "so can",
  ],
  ownerName: ["họ và tên chủ hộ", "ho va ten chu ho", "chủ hộ", "chu ho"],
  residentInfo: ["thông tin cư dân", "thong tin cu dan"],
  status: ["tình trạng", "tinh trang"],
  note: ["ghi chú", "ghi chu"],
};

function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function normalizeHeader(value) {
  return safeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchAliasScore(cellValue, aliases) {
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

function scoreHeaderRow(row) {
  const apartmentScore = row.reduce((sum, cell) => sum + matchAliasScore(safeString(cell), DEFAULT_CUSTOMER_COLUMN_ALIASES.apartmentCode), 0);
  const ownerScore = row.reduce((sum, cell) => sum + matchAliasScore(safeString(cell), DEFAULT_CUSTOMER_COLUMN_ALIASES.ownerName), 0);
  const statusScore = row.reduce((sum, cell) => sum + matchAliasScore(safeString(cell), DEFAULT_CUSTOMER_COLUMN_ALIASES.status), 0);
  const noteScore = row.reduce((sum, cell) => sum + matchAliasScore(safeString(cell), DEFAULT_CUSTOMER_COLUMN_ALIASES.note), 0);

  return apartmentScore + ownerScore + statusScore + noteScore;
}

function normalizeApartmentCodeForImport(value) {
  const raw = safeString(value).toUpperCase();
  if (!raw) {
    return undefined;
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

  return undefined;
}

function detectHeaderRow(rows) {
  let bestIndex = -1;
  let bestScore = 0;

  for (const [index, row] of rows.slice(0, 20).entries()) {
    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function findColumnIndex(headers, aliases) {
  return headers.findIndex((header) => matchAliasScore(header, aliases) > 0);
}

function inferApartmentColumn(rows, startRow) {
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  let bestColumn = -1;
  let bestScore = 0;

  for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
    let apartmentLikeCount = 0;

    for (const row of rows.slice(startRow, startRow + 40)) {
      const value = safeString(row[columnIndex]);
      if (!value) {
        continue;
      }

      if (normalizeApartmentCodeForImport(value)) {
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

function parsePhone(text) {
  const normalized = safeString(text).replace(/[^\d]/g, " ");
  const matches = normalized.match(/(?:0|\+?84)\d{8,10}/g);
  if (!matches || matches.length === 0) {
    return undefined;
  }

  return matches[0];
}

function apartmentTypeFromCode(code) {
  return code.startsWith("LK") || code.startsWith("LKV.") ? "LIEN_KE" : "CHUNG_CU";
}

function splitApartmentCode(code) {
  const [blockCode, roomCode] = code.split(".");
  return { blockCode, roomCode };
}

async function findOrCreateResident({ fullName, phoneNumber, note }) {
  const trimmedName = safeString(fullName);
  if (!trimmedName) {
    return null;
  }

  const existing = await prisma.resident.findFirst({
    where: {
      fullName: trimmedName,
      phoneNumber: phoneNumber || null,
    },
  });

  if (existing) {
    return prisma.resident.update({
      where: { id: existing.id },
      data: {
        note: note || existing.note,
        isActive: true,
      },
    });
  }

  return prisma.resident.create({
    data: {
      fullName: trimmedName,
      phoneNumber,
      note,
      isActive: true,
    },
  });
}

async function main() {
  const batchId = process.argv[2];

  const batch = batchId
    ? await prisma.importBatch.findUnique({ where: { id: batchId } })
    : await prisma.importBatch.findFirst({
        where: { sourceType: "MANAGEMENT_WORKBOOK" },
        orderBy: { importedAt: "desc" },
      });

  if (!batch) {
    throw new Error("Không tìm thấy batch import workbook quản lý.");
  }

  const rawRows = await prisma.rawManagementRow.findMany({
    where: {
      batchId: batch.id,
      sheetName: "Danh sách khách hàng",
    },
    orderBy: { rowIndex: "asc" },
  });

  if (rawRows.length === 0) {
    throw new Error(`Batch ${batch.id} không có dòng nào cho sheet Danh sách khách hàng.`);
  }

  const matrix = rawRows.map((row) => Array.isArray(row.payload.values) ? row.payload.values : []);
  const headerRowIndex = detectHeaderRow(matrix);

  if (headerRowIndex < 0) {
    throw new Error("Không nhận diện được header từ raw_management_rows.");
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
    throw new Error("Không tìm thấy cột mã căn hộ trong raw_management_rows.");
  }

  const candidates = matrix.slice(headerRowIndex + 1).map((row, index) => {
    const code = normalizeApartmentCodeForImport(row[apartmentCodeIndex]);
    return {
      sourceRowIndex: rawRows[headerRowIndex + 1 + index].rowIndex,
      code,
      ownerName: ownerNameIndex >= 0 ? safeString(row[ownerNameIndex]) : "",
      residentInfo: residentInfoIndex >= 0 ? safeString(row[residentInfoIndex]) : "",
      statusText: statusIndex >= 0 ? safeString(row[statusIndex]) : "",
      note: noteIndex >= 0 ? safeString(row[noteIndex]) : "",
    };
  });

  const validRows = candidates.filter((row) => row.code);
  const invalidRows = candidates.filter((row) => !row.code);

  let apartmentCount = 0;
  let residentCount = 0;
  let occupancyCount = 0;

  for (const row of validRows) {
    const code = row.code;
    const apartmentType = apartmentTypeFromCode(code);
    const { blockCode, roomCode } = splitApartmentCode(code);

    const apartment = await prisma.apartment.upsert({
      where: { code },
      update: {
        apartmentType,
        blockCode,
        roomCode,
        note: row.note || undefined,
      },
      create: {
        code,
        apartmentType,
        blockCode,
        roomCode,
        note: row.note || undefined,
      },
    });

    apartmentCount += 1;

    const resident = await findOrCreateResident({
      fullName: row.ownerName,
      phoneNumber: parsePhone(row.residentInfo),
      note: row.residentInfo || row.note || undefined,
    });

    if (!resident) {
      continue;
    }

    residentCount += 1;

    const existingOccupancy = await prisma.occupancy.findFirst({
      where: {
        apartmentId: apartment.id,
        residentId: resident.id,
        role: "CHU_HO",
        isCurrent: true,
      },
    });

    if (!existingOccupancy) {
      await prisma.occupancy.create({
        data: {
          apartmentId: apartment.id,
          residentId: resident.id,
          role: "CHU_HO",
          isCurrent: true,
          note: row.statusText || row.note || undefined,
        },
      });
      occupancyCount += 1;
    }
  }

  const apartmentTotal = await prisma.apartment.count();
  const residentTotal = await prisma.resident.count();
  const occupancyTotal = await prisma.occupancy.count();

  console.log(JSON.stringify({
    batchId: batch.id,
    headerRowIndex: rawRows[headerRowIndex].rowIndex,
    validRows: validRows.length,
    invalidRows: invalidRows.length,
    apartmentWrites: apartmentCount,
    residentTouches: residentCount,
    occupancyCreates: occupancyCount,
    apartmentTotal,
    residentTotal,
    occupancyTotal,
    invalidSamples: invalidRows.slice(0, 10),
  }, null, 2));
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

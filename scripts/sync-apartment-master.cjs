#!/usr/bin/env node

const path = require("node:path");
require("dotenv").config();
const XLSX = require("xlsx");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong .env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_INPUT = "docs/Danh_Sach_Can_Ho_Master.xlsx";
const DEFAULT_SHEET = "MASTER DATA";

function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
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

function apartmentTypeFromCode(code) {
  return code.startsWith("LK") || code.startsWith("LKV.") ? "LIEN_KE" : "CHUNG_CU";
}

function splitApartmentCode(code) {
  const [blockCode, roomCode] = code.split(".");
  return { blockCode, roomCode };
}

function parseArea(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = Number(String(value).replace(/,/g, "."));
  if (Number.isNaN(normalized) || normalized <= 0) {
    return null;
  }

  return normalized.toFixed(2);
}

function buildApartmentNote(row) {
  const parts = [];

  if (row.loaiHinh) {
    parts.push(`Loại hình: ${row.loaiHinh}`);
  }

  if (row.trangThaiSuDung) {
    parts.push(`Trạng thái sử dụng: ${row.trangThaiSuDung}`);
  }

  if (row.thongTinPhu) {
    parts.push(`Thông tin phụ: ${row.thongTinPhu}`);
  }

  if (row.ghiChu) {
    parts.push(`Ghi chú: ${row.ghiChu}`);
  }

  return parts.join(" | ") || null;
}

async function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const resolvedPath = path.resolve(process.cwd(), inputPath);

  const workbook = XLSX.readFile(resolvedPath);
  const sheet = workbook.Sheets[DEFAULT_SHEET];

  if (!sheet) {
    throw new Error(`Không tìm thấy sheet "${DEFAULT_SHEET}" trong file ${resolvedPath}`);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: true
  });

  let updated = 0;
  let created = 0;
  const invalidRows = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const code = normalizeApartmentCodeForImport(row["Mã Căn Hộ"]);

    if (!code) {
      invalidRows.push({
        excelRow: index + 2,
        maCanHo: row["Mã Căn Hộ"] ?? ""
      });
      continue;
    }

    const { blockCode, roomCode } = splitApartmentCode(code);
    const apartmentType = apartmentTypeFromCode(code);
    const areaM2 = parseArea(row["Diện tích (m2)"]);
    const note = buildApartmentNote({
      loaiHinh: safeString(row["Loại Hình"]),
      trangThaiSuDung: safeString(row["Trạng Thái Sử Dụng (Auto)"]),
      thongTinPhu: safeString(row["Thông tin phụ (Khách thuê/Chuyển nhượng)"]),
      ghiChu: safeString(row["Ghi chú"])
    });

    const existing = await prisma.apartment.findUnique({
      where: { code },
      select: { id: true }
    });

    await prisma.apartment.upsert({
      where: { code },
      update: {
        apartmentType,
        blockCode,
        roomCode,
        areaM2,
        note
      },
      create: {
        code,
        apartmentType,
        blockCode,
        roomCode,
        areaM2,
        note
      }
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  const apartmentTotal = await prisma.apartment.count();

  console.log(
    JSON.stringify(
      {
        fileName: path.basename(resolvedPath),
        sheetName: DEFAULT_SHEET,
        sourceRows: rows.length,
        created,
        updated,
        apartmentTotal,
        invalidRows: invalidRows.slice(0, 20)
      },
      null,
      2
    )
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

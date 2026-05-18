#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
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
  const [maLo, maSo] = code.split(".");
  return { maLo, maSo };
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

function fileHash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function rowToMappedObject(headers, values) {
  return headers.reduce((mapped, header, index) => {
    const key = safeString(header) || `__EMPTY_${index}`;
    mapped[key] = values[index] ?? "";
    return mapped;
  }, {});
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

function buildApartmentNote(mappedRow) {
  const parts = [];

  const thongTinPhu = safeString(mappedRow["Thông tin phụ (Khách thuê/Chuyển nhượng)"]);
  const ghiChu = safeString(mappedRow["Ghi chú"]);

  if (thongTinPhu) {
    parts.push(`Thông tin phụ: ${thongTinPhu}`);
  }

  if (ghiChu) {
    parts.push(`Ghi chú: ${ghiChu}`);
  }

  return parts.join(" | ") || null;
}

async function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const resolvedPath = path.resolve(process.cwd(), inputPath);

  const workbook = XLSX.readFile(resolvedPath, { cellDates: true });
  const sheet = workbook.Sheets[DEFAULT_SHEET];

  if (!sheet) {
    throw new Error(`Không tìm thấy sheet "${DEFAULT_SHEET}" trong file ${resolvedPath}`);
  }

  const table = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  const headers = table[0] ?? [];
  const dataRows = table
    .slice(1)
    .map((values, index) => ({
      excelRow: index + 2,
      values,
      mappedRow: rowToMappedObject(headers, values),
    }))
    .filter(({ values }) => values.some((value) => safeString(value) !== ""));

  const batch = await prisma.loNhapDuLieu.create({
    data: {
      loai_nguon: "WORKBOOK_QUAN_LY",
      ten_file: path.basename(resolvedPath),
      ma_bam_file: fileHash(resolvedPath),
      so_dong: dataRows.length,
      trang_thai: "CHO_XU_LY",
      metadata_json: {
        sheetName: DEFAULT_SHEET,
        sourcePath: inputPath,
      },
    },
  });

  let created = 0;
  let updated = 0;
  const invalidRows = [];

  for (const row of dataRows) {
    const mappedRow = row.mappedRow;
    const code = normalizeApartmentCodeForImport(mappedRow["Mã Căn Hộ"]);

    const rawRow = await prisma.dongDuLieuQuanLyTho.create({
      data: {
        lo_nhap_du_lieu_id: batch.id,
        ten_sheet: DEFAULT_SHEET,
        so_dong_nguon: row.excelRow,
        loai_dong: "DANH_SACH_KHACH_HANG",
        header_values_json: normalizeJsonValue(headers),
        values_json: normalizeJsonValue(row.values),
        mapped_row_json: normalizeJsonValue(mappedRow),
        payload_json: {
          sourceRowIndex: row.excelRow,
          rowType: "MASTER_DATA_CAN_HO",
        },
      },
    });

    if (!code) {
      invalidRows.push({
        excelRow: row.excelRow,
        maCanHo: mappedRow["Mã Căn Hộ"] ?? "",
      });
      continue;
    }

    const { maLo, maSo } = splitApartmentCode(code);
    const loaiCan = apartmentTypeFromCode(code);
    const dienTichM2 = parseArea(mappedRow["Diện tích (m2)"]);
    const existing = await prisma.canHo.findUnique({
      where: { ma_can: code },
      select: { id: true },
    });

    await prisma.canHo.upsert({
      where: { ma_can: code },
      update: {
        loai_can: loaiCan,
        ma_lo: maLo,
        ma_so: maSo,
        dien_tich_m2: dienTichM2,
        toa_lo_goc: safeString(mappedRow["Tòa/Lô"]) || null,
        loai_hinh_goc: safeString(mappedRow["Loại Hình"]) || null,
        chu_ho_ten_goc: safeString(mappedRow["Chủ Hộ (Tên)"]) || null,
        trang_thai_su_dung_goc: safeString(mappedRow["Trạng Thái Sử Dụng (Auto)"]) || null,
        tinh_trang_goc: safeString(mappedRow["TÌNH TRẠNG"]) || null,
        ghi_chu: buildApartmentNote(mappedRow),
      },
      create: {
        ma_can: code,
        loai_can: loaiCan,
        ma_lo: maLo,
        ma_so: maSo,
        dien_tich_m2: dienTichM2,
        toa_lo_goc: safeString(mappedRow["Tòa/Lô"]) || null,
        loai_hinh_goc: safeString(mappedRow["Loại Hình"]) || null,
        chu_ho_ten_goc: safeString(mappedRow["Chủ Hộ (Tên)"]) || null,
        trang_thai_su_dung_goc: safeString(mappedRow["Trạng Thái Sử Dụng (Auto)"]) || null,
        tinh_trang_goc: safeString(mappedRow["TÌNH TRẠNG"]) || null,
        ghi_chu: buildApartmentNote(mappedRow),
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  await prisma.loNhapDuLieu.update({
    where: { id: batch.id },
    data: {
      trang_thai: invalidRows.length > 0 ? "THAT_BAI" : "HOAN_TAT",
      tong_quan_loi: invalidRows.length > 0 ? `Có ${invalidRows.length} dòng không nhận diện được mã căn` : null,
    },
  });

  const apartmentTotal = await prisma.canHo.count();
  const apartmentTypeCounts = await prisma.canHo.groupBy({
    by: ["loai_can"],
    _count: { _all: true },
    orderBy: { loai_can: "asc" },
  });

  console.log(
    JSON.stringify(
      {
        batchId: batch.id,
        fileName: path.basename(resolvedPath),
        sheetName: DEFAULT_SHEET,
        sourceRows: dataRows.length,
        rawRowsCreated: dataRows.length,
        created,
        updated,
        apartmentTotal,
        apartmentTypeCounts: apartmentTypeCounts.map((item) => ({
          loai_can: item.loai_can,
          count: item._count._all,
        })),
        invalidRows: invalidRows.slice(0, 20),
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

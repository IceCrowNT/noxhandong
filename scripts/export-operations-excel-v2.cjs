#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");

if (!process.env.DATABASE_URL) {
  throw new Error("Thieu DATABASE_URL trong moi truong.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function toCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype) {
    return JSON.stringify(value);
  }
  if (typeof value === "object" && typeof value.toString === "function") {
    return value.toString();
  }
  return value;
}

function rowsToSheet(rows) {
  return XLSX.utils.json_to_sheet(
    rows.map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [key, toCellValue(value)])),
    ),
  );
}

function timestampForFile() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

async function main() {
  const exportDir = path.resolve(process.env.EXPORT_DIR || ".local/exports");
  fs.mkdirSync(exportDir, { recursive: true });

  const [apartments, contacts, adminAccounts, currentBatch, recentImports] = await Promise.all([
    prisma.canHo.findMany({
      orderBy: { ma_can: "asc" },
      select: {
        id: true,
        ma_can: true,
        loai_can: true,
        ma_lo: true,
        ma_so: true,
        dien_tich_m2: true,
        toa_lo_goc: true,
        loai_hinh_goc: true,
        chu_ho_ten_goc: true,
        trang_thai_su_dung_goc: true,
        tinh_trang_goc: true,
        trang_thai: true,
        ghi_chu: true,
      },
    }),
    prisma.lienHeCanHo.findMany({
      orderBy: [{ can_ho_id: "asc" }, { la_lien_he_chinh: "desc" }, { id: "asc" }],
      select: {
        id: true,
        can_ho: { select: { ma_can: true } },
        can_ho_id: true,
        ten_hien_thi: true,
        so_dien_thoai: true,
        la_lien_he_chinh: true,
        nhan_thong_bao: true,
        vai_tro_lien_he: true,
        trang_thai_lien_he: true,
        nguon_du_lieu: true,
        co_can_ra_soat: true,
        ghi_chu: true,
      },
    }),
    prisma.taiKhoanQuanTri.findMany({
      orderBy: [{ vai_tro: "asc" }, { ten_dang_nhap: "asc" }],
      select: {
        id: true,
        ten_dang_nhap: true,
        so_dien_thoai: true,
        email: true,
        ten_hien_thi: true,
        vai_tro: true,
        trang_thai: true,
        lan_dang_nhap_cuoi: true,
        ngay_tao: true,
      },
    }),
    prisma.batchTrangThaiPhiPublic.findFirst({
      where: { la_batch_public_hien_hanh: true },
      orderBy: { id: "desc" },
      include: {
        trang_thai_phi: {
          orderBy: { ma_can: "asc" },
          select: {
            ma_can: true,
            thang_da_dong_den_hien_tai: true,
            ky_du_lieu: true,
            ghi_chu_public: true,
            ngay_tao: true,
          },
        },
      },
    }),
    prisma.loNhapDuLieu.findMany({
      orderBy: { thoi_diem_nhap: "desc" },
      take: 50,
      select: {
        id: true,
        loai_nguon: true,
        ten_file: true,
        trang_thai: true,
        so_dong: true,
        tong_quan_loi: true,
        metadata_json: true,
        thoi_diem_nhap: true,
      },
    }),
  ]);

  const workbook = XLSX.utils.book_new();
  const contactsForExport = contacts.map(({ can_ho, ...contact }) => ({
    ...contact,
    ma_can: can_ho.ma_can,
  }));
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(apartments), "can_ho");
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(contactsForExport), "lien_he_can_ho");
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(adminAccounts), "tai_khoan_quan_tri");
  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(currentBatch?.trang_thai_phi || []),
    "phi_public_hien_hanh",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    rowsToSheet(
      currentBatch
        ? [
            {
              id: currentBatch.id,
              ky_du_lieu: currentBatch.ky_du_lieu,
              ten_file_nguon: currentBatch.ten_file_nguon,
              trang_thai: currentBatch.trang_thai,
              tong_so_can: currentBatch.tong_so_can,
              public_luc: currentBatch.public_luc,
            },
          ]
        : [],
    ),
    "batch_public",
  );
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(recentImports), "lo_nhap_du_lieu");

  const outputPath = path.join(exportDir, `operations-export-${timestampForFile()}.xlsx`);
  XLSX.writeFile(workbook, outputPath);

  console.log("Export Excel hoan thanh:");
  console.log(outputPath);
  console.log({
    can_ho: apartments.length,
    lien_he_can_ho: contacts.length,
    tai_khoan_quan_tri: adminAccounts.length,
    phi_public_hien_hanh: currentBatch?.trang_thai_phi.length || 0,
    lo_nhap_du_lieu: recentImports.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

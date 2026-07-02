require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Thieu DATABASE_URL trong moi truong.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const batches = await prisma.batchTrangThaiPhiPublic.findMany({
    select: {
      id: true,
      ky_du_lieu: true,
      trang_thai: true,
      la_batch_public_hien_hanh: true,
      public_luc: true,
      ngay_tao: true,
    },
    orderBy: { ngay_tao: "desc" },
  });

  const publicRows = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { ma_can: { in: ["L4A.126", "L4A.127"] } },
    select: {
      batch_id: true,
      ma_can: true,
      ky_du_lieu: true,
      thang_da_dong_den_hien_tai: true,
    },
    orderBy: [{ batch_id: "desc" }, { ma_can: "asc" }],
  });

  const historyRows = await prisma.lichSuDongPhiCanHo.findMany({
    where: {
      can_ho: { ma_can: { in: ["L4A.126", "L4A.127"] } },
    },
    select: {
      id: true,
      ky_du_lieu: true,
      thang_ap_dung: true,
      so_tien: true,
      loai_nguon: true,
      batch_phi_public_id: true,
      can_ho: {
        select: { ma_can: true },
      },
    },
    orderBy: { id: "desc" },
  });

  const closingRows = await prisma.soChotCanHo.findMany({
    where: { ma_can: { in: ["L4A.126", "L4A.127"] } },
    select: {
      id: true,
      ma_can: true,
      thang_da_dong_den_hien_tai: true,
      so_tien_thang: true,
      so_du_chua_du_thang: true,
      nguon: true,
      so_chot_thang: {
        select: {
          id: true,
          ky_du_lieu: true,
          trang_thai: true,
          ngay_chot: true,
          ten_file_excel_chot: true,
        },
      },
    },
    orderBy: [{ so_chot_thang_id: "desc" }, { ma_can: "asc" }],
  });

  const apartmentRows = await prisma.canHo.findMany({
    where: { ma_can: { in: ["L4A.126", "L4A.127"] } },
    select: {
      id: true,
      ma_can: true,
      ma_lo: true,
      ma_so: true,
      loai_can: true,
      toa_lo_goc: true,
      chu_ho_ten_goc: true,
      ghi_chu: true,
    },
  });

  console.log("=== BATCHES ===");
  console.log(JSON.stringify(batches, null, 2));
  console.log("=== PUBLIC_ROWS ===");
  console.log(JSON.stringify(publicRows, null, 2));
  console.log("=== HISTORY_ROWS ===");
  console.log(JSON.stringify(historyRows, null, 2));
  console.log("=== CLOSING_ROWS ===");
  console.log(JSON.stringify(closingRows, null, 2));
  console.log("=== APARTMENT_ROWS ===");
  console.log(JSON.stringify(apartmentRows, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

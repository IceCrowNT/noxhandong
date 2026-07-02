require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const batches = await prisma.batchTrangThaiPhiPublic.findMany({
    orderBy: [{ id: "desc" }],
    take: 20,
    select: {
      id: true,
      ky_du_lieu: true,
      trang_thai: true,
      la_batch_public_hien_hanh: true,
      public_luc: true,
    },
  });

  const julyHistory = await prisma.lichSuDongPhiCanHo.findMany({
    where: { ky_du_lieu: { startsWith: "T7-2026" } },
    orderBy: { id: "desc" },
    take: 30,
    select: {
      id: true,
      can_ho_id: true,
      ky_du_lieu: true,
      so_tien: true,
      loai_nguon: true,
      giao_dich_ngan_hang_id: true,
      batch_phi_public_id: true,
      ngay_tao: true,
    },
  });

  const l4b318 = await prisma.giaoDichNganHang.findFirst({
    where: { noi_dung_goc: { contains: "L4B.318" } },
    orderBy: { id: "desc" },
    select: {
      id: true,
      so_tien: true,
      noi_dung_goc: true,
      trang_thai_duyet: true,
      ngay_giao_dich: true,
      ngay_tao: true,
      ma_can_duoc_chon: true,
    },
  });

  console.log(JSON.stringify({ batches, julyHistory, l4b318 }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

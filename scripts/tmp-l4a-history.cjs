require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
(async () => {
  const rows = await prisma.lichSuDongPhiCanHo.findMany({
    where: { can_ho_id: { in: [442, 443] } },
    select: {
      id: true,
      can_ho_id: true,
      ky_du_lieu: true,
      thang_ap_dung: true,
      so_tien: true,
      loai_nguon: true,
      batch_phi_public_id: true,
      giao_dich_ngan_hang_id: true,
      phan_bo_giao_dich_id: true,
      ngay_tao: true,
    },
    orderBy: { id: 'asc' }
  });
  console.log(JSON.stringify(rows, null, 2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await prisma.$disconnect()});

require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
(async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const rows = await prisma.lichSuDongPhiCanHo.findMany({
    where: { id: { in: [318, 319] } },
    select: {
      id: true,
      can_ho_id: true,
      ky_du_lieu: true,
      thang_ap_dung: true,
      so_tien: true,
      loai_nguon: true,
      giao_dich_ngan_hang_id: true,
      phan_bo_giao_dich_id: true,
      batch_phi_public_id: true,
      ghi_chu: true,
      ngay_tao: true,
    },
    orderBy: { id: 'asc' },
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})();

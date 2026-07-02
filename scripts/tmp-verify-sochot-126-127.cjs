require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
(async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const rows = await prisma.soChotCanHo.findMany({
    where: { ma_can: { in: ['L4A.126','L4A.127'] }, so_chot_thang: { ky_du_lieu: 'T6-2026' } },
    select: { id: true, ma_can: true, thang_da_dong_den_hien_tai: true, so_chot_thang_id: true },
    orderBy: [{ so_chot_thang_id: 'asc' }, { ma_can: 'asc' }],
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})();

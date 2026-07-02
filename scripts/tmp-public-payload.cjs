require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
(async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const rows = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { ma_can: { in: ['L4A.126', 'L4A.127'] }, batch_id: { in: [42,43,44] } },
    select: { batch_id: true, ma_can: true, thang_da_dong_den_hien_tai: true, payload_public_json: true },
    orderBy: [{ batch_id: 'asc' }, { ma_can: 'asc' }],
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})();

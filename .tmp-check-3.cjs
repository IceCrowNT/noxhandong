const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.$queryRawUnsafe(`select id, ky_du_lieu, trang_thai, la_batch_public_hien_hanh, ten_file_nguon, public_luc from batch_trang_thai_phi_public order by public_luc desc nulls last, id desc`);
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

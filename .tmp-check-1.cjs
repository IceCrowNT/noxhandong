const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.$queryRawUnsafe(`select id, ngay_giao_dich, so_tien, ten_nguoi_chuyen, tham_chieu_ngan_hang, noi_dung_goc, trang_thai_duyet, trang_thai_khop, lo_nhap_du_lieu_id from giao_dich_ngan_hang where noi_dung_goc ilike '%L4B.318%' or noi_dung_goc ilike '%QUE ANH%' order by ngay_giao_dich desc`);
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

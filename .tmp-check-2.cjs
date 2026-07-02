const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.$queryRawUnsafe(`select id, ky_du_lieu, can_ho_id, so_tien, loai_nguon, giao_dich_ngan_hang_id, phan_bo_giao_dich_id, batch_phi_public_id, ngay_tao from lich_su_dong_phi_can_ho where can_ho_id = (select id from can_ho where upper(ma_can)='L4B.318') order by ngay_tao desc, id desc`);
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

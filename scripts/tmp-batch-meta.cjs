const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
(async () => {
  const adapter = new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL }));
  const prisma = new PrismaClient({ adapter });
  const batches = await prisma.batchTrangThaiPhiPublic.findMany({
    where: { id: { in: [42, 43, 44] } },
    select: {
      id: true,
      ky_du_lieu: true,
      ten_file_nguon: true,
      trang_thai: true,
      la_batch_public_hien_hanh: true,
      tong_so_can: true,
      metadata_json: true,
      public_luc: true,
      ngay_tao: true,
      so_chot_thang_id: true,
      nguoi_public_id: true,
    },
    orderBy: { id: 'asc' },
  });
  const closings = await prisma.soChotThang.findMany({
    where: { id: { in: [28, 29] } },
    select: {
      id: true,
      ky_du_lieu: true,
      lo_excel_chot_id: true,
      lo_sao_ke_id: true,
      ten_file_excel_chot: true,
      tong_tien_excel: true,
      tong_tien_sao_ke: true,
      chenhlech_tien: true,
      tong_so_can: true,
      so_can_khop: true,
      so_can_can_ra_soat: true,
      trang_thai: true,
      ghi_chu: true,
      metadata_json: true,
      ngay_chot: true,
      ngay_tao: true,
    },
    orderBy: { id: 'asc' },
  });
  console.log('=== BATCH 42/43/44 ===');
  console.log(JSON.stringify(batches, null, 2));
  console.log('=== SO_CHOT 28/29 ===');
  console.log(JSON.stringify(closings, null, 2));
  await prisma.$disconnect();
})();

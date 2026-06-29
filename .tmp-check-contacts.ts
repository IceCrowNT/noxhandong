import { prisma } from "./src/modules/database/prisma";

async function main() {
  const [officialCount, candidateCount, apartmentCount] = await Promise.all([
    prisma.lienHeCanHo.count(),
    prisma.ungVienLienHeCanHo.count(),
    prisma.canHo.count(),
  ]);

  const officialSample = await prisma.lienHeCanHo.findMany({
    take: 5,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      can_ho_id: true,
      ten_hien_thi: true,
      so_dien_thoai: true,
      ghi_chu: true,
      trang_thai_lien_he: true,
      la_lien_he_chinh: true,
      nhan_thong_bao: true,
    },
  });

  const candidateSample = await prisma.ungVienLienHeCanHo.findMany({
    take: 5,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      ma_can: true,
      ten_chu_ho_goc: true,
      thong_tin_cu_dan_goc: true,
      so_dien_thoai_goc: true,
      ghi_chu_goc: true,
      trang_thai_duyet: true,
    },
  });

  console.log(JSON.stringify({ officialCount, candidateCount, apartmentCount, officialSample, candidateSample }, null, 2));
}

main().finally(async () => {
  await prisma.$disconnect();
});

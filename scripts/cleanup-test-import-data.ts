import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL in .env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const shouldApply = process.argv.includes("--apply");

async function countRows() {
  const [
    importBatches,
    feeRawRows,
    statementRawRows,
    bankTransactions,
    matchCandidates,
    allocations,
    evidences,
    publicBatches,
    publicRows,
    closings,
    closingRows,
  ] = await Promise.all([
    prisma.loNhapDuLieu.count(),
    prisma.dongTheoDoiThuPhiTho.count(),
    prisma.dongSaoKeTho.count(),
    prisma.giaoDichNganHang.count(),
    prisma.ungVienKhopGiaoDich.count(),
    prisma.phanBoGiaoDich.count(),
    prisma.chungTuDoiSoat.count(),
    prisma.batchTrangThaiPhiPublic.count(),
    prisma.trangThaiPhiCanHoPublic.count(),
    prisma.soChotThang.count(),
    prisma.soChotCanHo.count(),
  ]);

  return {
    importBatches,
    feeRawRows,
    statementRawRows,
    bankTransactions,
    matchCandidates,
    allocations,
    evidences,
    publicBatches,
    publicRows,
    closings,
    closingRows,
  };
}

async function main() {
  const currentPublicBatch = await prisma.batchTrangThaiPhiPublic.findFirst({
    where: { la_batch_public_hien_hanh: true },
    orderBy: { id: "desc" },
    select: { id: true, so_chot_thang_id: true, ky_du_lieu: true, ten_file_nguon: true },
  });

  const latestClosing =
    (currentPublicBatch?.so_chot_thang_id
      ? await prisma.soChotThang.findUnique({
          where: { id: currentPublicBatch.so_chot_thang_id },
          select: { id: true, ky_du_lieu: true, metadata_json: true },
        })
      : null) ||
    (await prisma.soChotThang.findFirst({
      where: { trang_thai: "DA_CHOT" },
      orderBy: { id: "desc" },
      select: { id: true, ky_du_lieu: true, metadata_json: true },
    }));

  const keepPublicBatchId = currentPublicBatch?.id ?? null;
  const keepClosingId = latestClosing?.id ?? null;

  const before = await countRows();

  const summary = {
    mode: shouldApply ? "apply" : "dry-run",
    keepPublicBatch: currentPublicBatch,
    keepClosing: latestClosing,
    before,
  };

  if (!shouldApply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.batchTrangThaiPhiPublic.deleteMany({
      where: keepPublicBatchId ? { id: { not: keepPublicBatchId } } : {},
    });

    await tx.soChotThang.deleteMany({
      where: keepClosingId ? { id: { not: keepClosingId } } : {},
    });

    await tx.lichSuDongPhiCanHo.deleteMany({
      where: {
        OR: [{ giao_dich_ngan_hang_id: { not: null } }, { phan_bo_giao_dich_id: { not: null } }],
      },
    });

    await tx.giaoDichNganHang.deleteMany({});

    await tx.loNhapDuLieu.deleteMany({
      where: {
        loai_nguon: {
          in: ["WORKBOOK_THEO_DOI_THU_PHI", "SAO_KE_NGAN_HANG"],
        },
      },
    });
  });

  const after = await countRows();

  console.log(
    JSON.stringify(
      {
        ...summary,
        after,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

#!/usr/bin/env node

require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in .env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function parseArgs() {
  const args = process.argv.slice(2);
  const batchArg = args.find((arg) => arg.startsWith("--batch-id="));
  const usernameArg = args.find((arg) => arg.startsWith("--admin="));

  return {
    batchId: batchArg ? Number(batchArg.split("=")[1]) : null,
    adminUsername: usernameArg ? usernameArg.split("=")[1] : "admin",
  };
}

async function main() {
  const args = parseArgs();

  const admin = await prisma.taiKhoanQuanTri.findUnique({
    where: { ten_dang_nhap: args.adminUsername },
  });

  if (!admin || admin.vai_tro !== "SUPER_ADMIN" || admin.trang_thai !== "DANG_HOAT_DONG") {
    throw new Error(`Admin "${args.adminUsername}" is not an active SUPER_ADMIN`);
  }

  const batch = args.batchId
    ? await prisma.batchTrangThaiPhiPublic.findUnique({ where: { id: args.batchId } })
    : await prisma.batchTrangThaiPhiPublic.findFirst({
        where: { trang_thai: { in: ["NHAP", "DA_KIEM_TRA"] } },
        orderBy: { id: "desc" },
      });

  if (!batch) {
    throw new Error("Cannot find a draft public fee batch");
  }

  if (!["NHAP", "DA_KIEM_TRA", "DA_PUBLIC"].includes(batch.trang_thai)) {
    throw new Error(`Batch ${batch.id} cannot be published from status ${batch.trang_thai}`);
  }

  const snapshotCount = await prisma.trangThaiPhiCanHoPublic.count({
    where: { batch_id: batch.id },
  });

  if (snapshotCount <= 0) {
    throw new Error(`Batch ${batch.id} has no apartment fee snapshots`);
  }

  const metadata = batch.metadata_json && typeof batch.metadata_json === "object" ? batch.metadata_json : {};
  const historyRecordIds = Array.isArray(metadata.historyRecordIds)
    ? metadata.historyRecordIds.filter((id) => Number.isInteger(id) && id > 0)
    : [];

  const published = await prisma.$transaction(async (tx) => {
    await tx.batchTrangThaiPhiPublic.updateMany({
      where: {
        la_batch_public_hien_hanh: true,
        id: { not: batch.id },
      },
      data: {
        la_batch_public_hien_hanh: false,
      },
    });

    const nextBatch = await tx.batchTrangThaiPhiPublic.update({
      where: { id: batch.id },
      data: {
        trang_thai: "DA_PUBLIC",
        la_batch_public_hien_hanh: true,
        nguoi_public_id: admin.id,
        public_luc: new Date(),
      },
    });

    if (historyRecordIds.length) {
      await tx.lichSuDongPhiCanHo.updateMany({
        where: {
          id: { in: historyRecordIds },
          batch_phi_public_id: null,
        },
        data: {
          batch_phi_public_id: batch.id,
        },
      });
    }

    return nextBatch;
  });

  const currentPublicBatchCount = await prisma.batchTrangThaiPhiPublic.count({
    where: { la_batch_public_hien_hanh: true },
  });

  console.log(
    JSON.stringify(
      {
        publicBatchId: published.id,
        status: published.trang_thai,
        isCurrentPublicBatch: published.la_batch_public_hien_hanh,
        publicBy: admin.ten_dang_nhap,
        publicAt: published.public_luc,
        snapshotCount,
        historyRowsLinked: historyRecordIds.length,
        currentPublicBatchCount,
      },
      null,
      2
    )
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

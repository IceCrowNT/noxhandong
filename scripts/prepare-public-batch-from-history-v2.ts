#!/usr/bin/env node

import "dotenv/config";
import type { Prisma } from "@prisma/client";

import {
  buildPaidThroughInfo,
  calculatePaidThroughAdvance,
  extractCarryAmount,
  extractNumericPaidThrough,
} from "@/src/modules/billing/paid-through";
import { prisma } from "@/src/modules/database";
import { feePeriodFromDate, parseFeePeriodLabel } from "@/src/modules/transactions/review/period";

function parsePeriod(value: string) {
  const period = parseFeePeriodLabel(value);
  if (!period) throw new Error("Period must use format T6-2026");
  return period;
}

function periodFromArguments() {
  const periodArg = process.argv.slice(2).find((arg) => arg.startsWith("--period="));
  return parsePeriod(periodArg?.split("=").slice(1).join("=").trim() || feePeriodFromDate(new Date()).label);
}

async function main() {
  const period = periodFromArguments();
  const currentBatch = await prisma.batchTrangThaiPhiPublic.findFirst({
    where: { la_batch_public_hien_hanh: true },
    orderBy: { public_luc: "desc" },
    select: { id: true, ky_du_lieu: true },
  });
  if (!currentBatch) {
    throw new Error("Cannot find current public fee batch to use as opening balance");
  }

  const [apartments, currentRows, feeRules, histories] = await Promise.all([
    prisma.canHo.findMany({
      orderBy: { ma_can: "asc" },
      select: { id: true, ma_can: true, loai_can: true },
    }),
    prisma.trangThaiPhiCanHoPublic.findMany({
      where: { batch_id: currentBatch.id },
      select: {
        can_ho_id: true,
        thang_da_dong_den_hien_tai: true,
        payload_public_json: true,
      },
    }),
    prisma.quyTacPhi.findMany({
      where: { dang_ap_dung: true, ma_phi: "QLVH" },
      orderBy: { hieu_luc_tu_ngay: "desc" },
      select: { loai_can: true, so_tien: true },
    }),
    prisma.lichSuDongPhiCanHo.findMany({
      where: {
        batch_phi_public_id: null,
        OR: [
          {
            loai_nguon: "GIAO_DICH_DA_DUYET",
            ky_du_lieu: { in: [period.label, period.historyLabel] },
          },
          {
            loai_nguon: "BO_SUNG_QUA_KHU",
          },
        ],
      },
      orderBy: { ngay_tao: "asc" },
      select: {
        id: true,
        can_ho_id: true,
        so_tien: true,
      },
    }),
  ]);

  const currentByApartmentId = new Map(currentRows.map((row) => [row.can_ho_id, row]));
  const feeByType = new Map(feeRules.map((rule) => [rule.loai_can, Number(rule.so_tien)]));
  const historiesByApartmentId = new Map<number, typeof histories>();
  for (const history of histories) {
    const list = historiesByApartmentId.get(history.can_ho_id) || [];
    list.push(history);
    historiesByApartmentId.set(history.can_ho_id, list);
  }

  const snapshotRows: Prisma.TrangThaiPhiCanHoPublicCreateManyBatchInput[] = [];
  const historyRecordIds: number[] = [];
  const changedApartmentCodes: string[] = [];
  let totalApprovedAmount = 0;
  let totalCarryAmount = 0;

  for (const apartment of apartments) {
    const baseRow = currentByApartmentId.get(apartment.id);
    const baseNumericMonth = baseRow
      ? extractNumericPaidThrough(baseRow.payload_public_json, baseRow.thang_da_dong_den_hien_tai)
      : null;
    const previousCarryAmount = baseRow ? extractCarryAmount(baseRow.payload_public_json) : 0;
    const unitFee = feeByType.get(apartment.loai_can) || 0;
    const apartmentHistories = historiesByApartmentId.get(apartment.id) || [];
    const newPaymentAmount = apartmentHistories.reduce((sum, item) => sum + Number(item.so_tien), 0);
    const advance = calculatePaidThroughAdvance({
      baseNumericMonth,
      previousCarryAmount,
      newPaymentAmount,
      unitFee,
    });
    const paidThroughInfo = buildPaidThroughInfo(
      advance.nextNumericMonth,
      "APPROVED_PAYMENT_HISTORY",
    );

    totalApprovedAmount += newPaymentAmount;
    totalCarryAmount += advance.remainderAmount;
    if (apartmentHistories.length > 0) {
      historyRecordIds.push(...apartmentHistories.map((item) => item.id));
    }

    const hasSnapshotChange =
      apartmentHistories.length > 0 &&
      (advance.nextNumericMonth !== baseNumericMonth ||
        advance.remainderAmount !== previousCarryAmount ||
        newPaymentAmount !== 0);

    if (hasSnapshotChange) {
      changedApartmentCodes.push(apartment.ma_can);
    }

    snapshotRows.push({
      can_ho_id: apartment.id,
      ma_can: apartment.ma_can,
      thang_da_dong_den_hien_tai:
        advance.nextNumericMonth === null ? null : `Hết tháng ${advance.nextNumericMonth}`,
      ky_du_lieu: period.label,
      payload_public_json: {
        source: "APPROVED_PAYMENT_HISTORY",
        previousPublicBatchId: currentBatch.id,
        previousPublicPeriod: currentBatch.ky_du_lieu,
        baseNumericMonth,
        previousCarryAmount: advance.previousCarryAmount,
        newPaymentAmount: advance.newPaymentAmount,
        availableAmount: advance.availableAmount,
        addedMonths: advance.addedMonths,
        approvedPaymentAmount: newPaymentAmount,
        unitFee,
        remainderAmount: advance.remainderAmount,
        includedHistoryIds: apartmentHistories.map((item) => item.id),
        paidThrough: paidThroughInfo,
        publicDisplayText: paidThroughInfo.displayText,
        needsReview: false,
        isPartialPayment: advance.remainderAmount > 0,
        isOutsideBaseYear: paidThroughInfo.isOutsideBaseYear,
      },
    });
  }

  const draftBatch = await prisma.$transaction(async (tx) => {
    await tx.batchTrangThaiPhiPublic.deleteMany({
      where: {
        trang_thai: "NHAP",
        la_batch_public_hien_hanh: false,
        ky_du_lieu: period.label,
        metadata_json: {
          path: ["source"],
          equals: "APPROVED_PAYMENT_HISTORY",
        },
      },
    });

    return tx.batchTrangThaiPhiPublic.create({
      data: {
        ky_du_lieu: period.label,
        ten_file_nguon: "Lịch sử đóng phí đã duyệt",
        trang_thai: "NHAP",
        la_batch_public_hien_hanh: false,
        tong_so_can: snapshotRows.length,
        metadata_json: {
          source: "APPROVED_PAYMENT_HISTORY",
          previousPublicBatchId: currentBatch.id,
          previousPublicPeriod: currentBatch.ky_du_lieu,
          historyRecordIds,
          approvedHistoryRows: histories.length,
          changedApartmentCount: changedApartmentCodes.length,
          changedApartmentCodes: changedApartmentCodes.slice(0, 100),
          totalApprovedAmount,
          totalCarryAmount,
        },
        trang_thai_phi: {
          createMany: { data: snapshotRows },
        },
      },
    });
  });

  console.log(
    JSON.stringify(
      {
        draftPublicBatchId: draftBatch.id,
        period: period.label,
        previousPublicBatchId: currentBatch.id,
        snapshotRows: snapshotRows.length,
        approvedHistoryRows: histories.length,
        changedApartmentCount: changedApartmentCodes.length,
        totalApprovedAmount,
        totalCarryAmount,
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

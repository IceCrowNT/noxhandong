require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

function toPaidThroughMonth6(payload) {
  const next = { ...(payload || {}) };
  next.unitFee = 250000;
  next.addedMonths = 0;
  next.availableAmount = 0;
  next.remainderAmount = 0;
  next.baseNumericMonth = 6;
  next.previousCarryAmount = 0;
  next.newPaymentAmount = 0;
  next.approvedPaymentAmount = 0;
  next.includedHistoryIds = [];
  next.isPartialPayment = false;
  next.isOutsideBaseYear = false;
  next.needsReview = false;
  next.publicDisplayText = 'da dong het thang 6 nam 2026';
  next.paidThrough = {
    kind: 'BASE_YEAR_MONTH',
    source: 'APPROVED_PAYMENT_HISTORY',
    rawText: 'H?t tháng 6',
    rawMonth: '6',
    displayText: 'dã dóng h?t tháng 6 nam 2026',
    needsReview: false,
    numericMonth: 6,
    resolvedYear: 2026,
    resolvedMonth: 6,
    isPartialPayment: false,
    isOutsideBaseYear: false,
  };
  return next;
}

(async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) });
  const targets = ['L4A.126', 'L4A.127'];

  const publicRows = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { ma_can: { in: targets }, batch_id: { in: [43, 44] } },
    select: { id: true, batch_id: true, ma_can: true, payload_public_json: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const row of publicRows) {
      await tx.trangThaiPhiCanHoPublic.update({
        where: { id: row.id },
        data: {
          thang_da_dong_den_hien_tai: 'H?t tháng 6',
          payload_public_json: toPaidThroughMonth6(row.payload_public_json),
        },
      });
    }

    await tx.soChotCanHo.updateMany({
      where: {
        ma_can: { in: targets },
        so_chot_thang: { ky_du_lieu: 'T6-2026' },
      },
      data: {
        thang_da_dong_den_hien_tai: 'H?t tháng 6',
      },
    });
  });

  const verify = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { ma_can: { in: targets }, batch_id: { in: [43, 44] } },
    select: { batch_id: true, ma_can: true, thang_da_dong_den_hien_tai: true },
    orderBy: [{ batch_id: 'asc' }, { ma_can: 'asc' }],
  });
  console.log(JSON.stringify(verify, null, 2));
  await prisma.$disconnect();
})();

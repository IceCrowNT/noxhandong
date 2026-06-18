import { LoaiCan } from "@prisma/client";

import { prisma } from "@/src/modules/database";

export const PERIOD_PATTERN = /^T(?:[1-9]|1[0-2])-\d{4}$/;
export const PAID_THROUGH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export type FeeNoticeTargetRow = {
  maCan: string;
  paidThroughText: string | null;
  lot: string;
  block: string;
  room: string;
  apartmentType: LoaiCan;
  monthlyFee: number;
  totalFee: number;
};

export type FeeNoticeDataset = {
  batchId: number;
  period: string;
  paidThrough: string;
  paidThroughMonth: number;
  paidThroughYear: number;
  notice: {
    noticeType: "FEE_NOTICE" | "POWER_CUT";
    titleText: string;
    startLabel: string;
    endLabel: string;
    fullLabel: string;
    startDateText: string;
    endDateText: string;
    dueDateText: string;
    documentDateText: string;
    transferContentHint: string;
    overdueFromText: string;
    overdueToText: string;
  };
  rows: FeeNoticeTargetRow[];
  lotGroups: Array<{
    lot: string;
    rows: FeeNoticeTargetRow[];
  }>;
};

function recordValue(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function exactPaidThroughKey(payload: unknown, fallback: string | null) {
  const payloadRecord = recordValue(payload);
  const paidThrough = recordValue(payloadRecord?.paidThrough);
  const numericMonth =
    numericValue(paidThrough?.numericMonth) ??
    numericValue(payloadRecord?.numericMonth) ??
    (() => {
      const match = String(fallback || "").match(/-?\d+(?:[.,]\d+)?/);
      return match ? Number(match[0].replace(",", ".")) : null;
    })();

  if (numericMonth === null || !Number.isInteger(numericMonth)) return null;

  const month = numericValue(paidThrough?.resolvedMonth) ?? ((((numericMonth - 1) % 12) + 12) % 12) + 1;
  const year = numericValue(paidThrough?.resolvedYear) ?? 2026 + Math.floor((numericMonth - 1) / 12);
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parsePeriod(period: string) {
  const match = period.match(/^T(1[0-2]|[1-9])-(\d{4})$/);
  if (!match) {
    throw new Error("Kỳ dữ liệu không hợp lệ.");
  }

  return {
    month: Number(match[1]),
    year: Number(match[2]),
  };
}

function toMonthYear(year: number, month: number, offset: number) {
  const total = year * 12 + (month - 1) + offset;
  return {
    year: Math.floor(total / 12),
    month: (total % 12) + 1,
  };
}

function monthDistance(fromYear: number, fromMonth: number, toYear: number, toMonth: number) {
  return toYear * 12 + toMonth - (fromYear * 12 + fromMonth);
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function monthLabel(year: number, month: number) {
  return `T${month}/${year}`;
}

function fullDateText(year: number, month: number, day: number) {
  return `${pad2(day)}/${pad2(month)}/${year}`;
}

function currentDocumentDateText() {
  const now = new Date();
  return `An Hải, ngày ${pad2(now.getDate())} tháng ${pad2(now.getMonth() + 1)} năm ${now.getFullYear()}`;
}

function buildNoticePeriod(
  paidThroughYear: number,
  paidThroughMonth: number,
  currentPeriodYear: number,
  currentPeriodMonth: number,
): FeeNoticeDataset["notice"] {
  const start = toMonthYear(paidThroughYear, paidThroughMonth, 1);
  const end = toMonthYear(paidThroughYear, paidThroughMonth, 6);
  const overdueFrom = toMonthYear(paidThroughYear, paidThroughMonth, 1);
  const overdueTo = end;
  const noticeRound = Math.max(1, monthDistance(start.year, start.month, currentPeriodYear, currentPeriodMonth) + 1);

  return {
    noticeType: noticeRound >= 4 ? "POWER_CUT" : "FEE_NOTICE",
    titleText: noticeRound <= 1 ? "THÔNG BÁO" : `THÔNG BÁO LẦN ${noticeRound}`,
    startLabel: monthLabel(start.year, start.month),
    endLabel: monthLabel(end.year, end.month),
    fullLabel: `${monthLabel(start.year, start.month)} - ${monthLabel(end.year, end.month)}`,
    startDateText: fullDateText(start.year, start.month, 1),
    endDateText: fullDateText(end.year, end.month, lastDayOfMonth(end.year, end.month)),
    dueDateText: fullDateText(currentPeriodYear, currentPeriodMonth, 25),
    documentDateText: currentDocumentDateText(),
    transferContentHint: `Tòa/lô + số căn hộ + Số điện thoại + nộp phí QLVH từ ${fullDateText(start.year, start.month, 1)} đến ${fullDateText(end.year, end.month, lastDayOfMonth(end.year, end.month))}`,
    overdueFromText: `${pad2(overdueFrom.month)}/${overdueFrom.year}`,
    overdueToText: `${pad2(overdueTo.month)}/${overdueTo.year}`,
  };
}

async function getMonthlyFeeMap() {
  const rules = await prisma.quyTacPhi.findMany({
    where: {
      ma_phi: "QLVH",
      dang_ap_dung: true,
    },
    orderBy: [{ hieu_luc_tu_ngay: "desc" }, { id: "desc" }],
    select: {
      loai_can: true,
      so_tien: true,
    },
  });

  const feeMap = new Map<LoaiCan, number>();
  for (const rule of rules) {
    if (!feeMap.has(rule.loai_can)) {
      feeMap.set(rule.loai_can, Number(rule.so_tien));
    }
  }

  feeMap.set(LoaiCan.CHUNG_CU, feeMap.get(LoaiCan.CHUNG_CU) ?? 250_000);
  feeMap.set(LoaiCan.LIEN_KE, feeMap.get(LoaiCan.LIEN_KE) ?? 200_000);
  return feeMap;
}

export async function getFeeNoticeDataset(period: string, paidThrough: string): Promise<FeeNoticeDataset> {
  const normalizedPeriod = period.toUpperCase();
  const match = paidThrough.match(PAID_THROUGH_PATTERN);
  if (!PERIOD_PATTERN.test(normalizedPeriod) || !match) {
    throw new Error("Kỳ dữ liệu hoặc mốc tháng đã đóng không hợp lệ.");
  }

  const batch = await prisma.batchTrangThaiPhiPublic.findFirst({
    where: { ky_du_lieu: normalizedPeriod, trang_thai: "DA_PUBLIC" },
    orderBy: [{ la_batch_public_hien_hanh: "desc" }, { id: "desc" }],
    select: { id: true },
  });

  if (!batch) {
    throw new Error("Không tìm thấy kỳ dữ liệu đã công khai.");
  }

  const feeByType = await getMonthlyFeeMap();
  const paidThroughYear = Number(match[1]);
  const paidThroughMonth = Number(match[2]);
  const currentPeriod = parsePeriod(normalizedPeriod);
  const notice = buildNoticePeriod(
    paidThroughYear,
    paidThroughMonth,
    currentPeriod.year,
    currentPeriod.month,
  );

  const rows = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { batch_id: batch.id },
    orderBy: [{ can_ho: { toa_lo_goc: "asc" } }, { ma_can: "asc" }],
    select: {
      ma_can: true,
      thang_da_dong_den_hien_tai: true,
      payload_public_json: true,
      can_ho: {
        select: {
          ma_lo: true,
          ma_so: true,
          toa_lo_goc: true,
          loai_can: true,
        },
      },
    },
  });

  const targetRows = rows
    .filter((row) => exactPaidThroughKey(row.payload_public_json, row.thang_da_dong_den_hien_tai) === paidThrough)
    .map((row) => {
      const monthlyFee = feeByType.get(row.can_ho.loai_can) ?? 0;
      return {
        maCan: row.ma_can,
        paidThroughText: row.thang_da_dong_den_hien_tai,
        lot: row.can_ho.toa_lo_goc || row.can_ho.ma_lo || "Chưa xác định",
        block: row.can_ho.ma_lo,
        room: row.can_ho.ma_so,
        apartmentType: row.can_ho.loai_can,
        monthlyFee,
        totalFee: monthlyFee * 6,
      };
    });

  const groups = targetRows.reduce<Map<string, FeeNoticeTargetRow[]>>((map, row) => {
    const existing = map.get(row.lot) || [];
    existing.push(row);
    map.set(row.lot, existing);
    return map;
  }, new Map());

  const lotGroups = [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "vi-VN", { numeric: true }))
    .map(([lot, groupRows]) => ({
      lot,
      rows: [...groupRows].sort((left, right) => left.maCan.localeCompare(right.maCan, "vi-VN", { numeric: true })),
    }));

  return {
    batchId: batch.id,
    period: normalizedPeriod,
    paidThrough,
    paidThroughMonth,
    paidThroughYear,
    notice,
    rows: lotGroups.flatMap((group) => group.rows),
    lotGroups,
  };
}

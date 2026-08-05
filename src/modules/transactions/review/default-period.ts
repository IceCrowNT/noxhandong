import { prisma } from "@/src/modules/database";
import { feePeriodFromDate, parseFeePeriodLabel } from "@/src/modules/transactions/review/period";

function monthInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  })
    .format(date)
    .split("-");
  return `${parts[0]}-${parts[1]}`;
}

export async function getDefaultReviewPeriod() {
  const unpublishedHistoryGroups = await prisma.lichSuDongPhiCanHo.groupBy({
    by: ["ky_du_lieu"],
    where: {
      batch_phi_public_id: null,
      loai_nguon: { in: ["GIAO_DICH_DA_DUYET", "BO_SUNG_QUA_KHU"] },
    },
    _count: { _all: true },
  });
  const unpublishedPeriods = [
    ...unpublishedHistoryGroups
      .map((group) => {
        const period = parseFeePeriodLabel(group.ky_du_lieu);
        if (!period) return null;
        return {
          ...period,
          count: group._count._all,
          sortKey: period.year * 12 + period.month,
        };
      })
      .filter((period): period is NonNullable<typeof period> => Boolean(period))
      .reduce((byLabel, period) => {
        const existing = byLabel.get(period.label);
        byLabel.set(period.label, {
          ...period,
          count: (existing?.count || 0) + period.count,
        });
        return byLabel;
      }, new Map<string, { month: number; year: number; label: string; historyLabel: string; count: number; sortKey: number }>())
      .values(),
  ].sort((a, b) => a.sortKey - b.sortKey);

  const earliestUnpublishedPeriod = unpublishedPeriods[0] || null;
  if (earliestUnpublishedPeriod) {
    const date = new Date(`${earliestUnpublishedPeriod.year}-${String(earliestUnpublishedPeriod.month).padStart(2, "0")}-01T00:00:00+07:00`);
    return {
      month: earliestUnpublishedPeriod.month,
      year: earliestUnpublishedPeriod.year,
      label: earliestUnpublishedPeriod.label,
      historyLabel: earliestUnpublishedPeriod.historyLabel,
      value: monthInputValue(date),
      unpublishedPeriods,
    };
  }

  const latestReviewableTransaction = await prisma.giaoDichNganHang.findFirst({
    where: {
      so_tien: { gt: 0 },
      ngay_giao_dich: { not: null },
      trang_thai_duyet: { in: ["CHUA_DUYET", "DA_RA_SOAT", "DA_DUYET"] },
    },
    orderBy: [{ ngay_giao_dich: "desc" }, { id: "desc" }],
    select: { ngay_giao_dich: true },
  });

  const date = latestReviewableTransaction?.ngay_giao_dich || new Date();
  const period = feePeriodFromDate(date);
  return {
    ...period,
    value: monthInputValue(date),
    unpublishedPeriods,
  };
}

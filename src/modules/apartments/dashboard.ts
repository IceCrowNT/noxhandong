import { prisma } from "@/src/modules/database";
import {
  parsePublicLookupInput,
  publicFeeDisplayText,
} from "@/src/modules/billing/fee-status";
import { extractNumericPaidThrough, resolveRelativeMonth } from "@/src/modules/billing/paid-through";
import type { Prisma } from "@prisma/client";

const MAX_SEARCH_LENGTH = 80;
const RESULT_LIMIT = 20;
const BASE_YEAR = 2026;

export type ApartmentDashboardData = Awaited<ReturnType<typeof getApartmentDashboardData>>;

function formatDecimal(value: { toString(): string } | null) {
  return value ? value.toString() : null;
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function jsonArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function publicPayloadText(payload: unknown, fallback: string | null) {
  return publicFeeDisplayText(payload, fallback);
}

function recordValue(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parsePeriod(period: string | null | undefined) {
  const match = String(period || "").match(/T\s*(\d{1,2})\s*[-/]\s*(\d{4})/i);
  if (!match) {
    return { month: 12, year: BASE_YEAR, label: period || "Kỳ hiện tại" };
  }

  return {
    month: Number(match[1]),
    year: Number(match[2]),
    label: `T${Number(match[1])}-${match[2]}`,
  };
}

function internalMonthLabel(monthIndex: number) {
  const month = (((monthIndex - 1) % 12) + 12) % 12 + 1;
  const year = BASE_YEAR + Math.floor((monthIndex - 1) / 12);
  return `tháng ${month}/${year}`;
}

function noticePeriodAfterPaidThrough(month: number, year: number) {
  const startIndex = year * 12 + month;
  const endIndex = startIndex + 5;
  const startMonth = (startIndex % 12) + 1;
  const startYear = Math.floor(startIndex / 12);
  const endMonth = (endIndex % 12) + 1;
  const endYear = Math.floor(endIndex / 12);
  return {
    label: `T${startMonth}/${startYear} - T${endMonth}/${endYear}`,
    startMonth,
    startYear,
    endMonth,
    endYear,
  };
}

function extractPaidThrough(payload: unknown, fallback: string | null) {
  const payloadRecord = recordValue(payload);
  const paidThrough = recordValue(payloadRecord?.paidThrough);
  const numericMonth = extractNumericPaidThrough(payload, fallback);

  const flooredMonth = numericMonth === null ? null : Math.floor(numericMonth);
  const resolvedMonth = numericValue(paidThrough?.resolvedMonth);
  const resolvedYear = numericValue(paidThrough?.resolvedYear);
  const isPartialPayment =
    paidThrough?.isPartialPayment === true ||
    payloadRecord?.isPartialPayment === true ||
    (numericMonth !== null && !Number.isInteger(numericMonth));
  const displayText = stringValue(payloadRecord?.publicDisplayText) || stringValue(paidThrough?.displayText);

  if (flooredMonth === null) {
    return {
      numericMonth,
      flooredMonth,
      resolvedMonth: null,
      resolvedYear: null,
      isPartialPayment,
      label: "Chưa có dữ liệu",
      displayText,
      sortKey: -9999,
    };
  }

  const resolved = resolveRelativeMonth(flooredMonth);
  const monthForLabel = resolvedMonth ?? resolved.month;
  const yearForLabel = resolvedYear ?? resolved.year;

  return {
    numericMonth,
    flooredMonth,
    resolvedMonth: monthForLabel,
    resolvedYear: yearForLabel,
    isPartialPayment,
    label: `Hết tháng ${monthForLabel}/${yearForLabel}`,
    displayText,
    sortKey: yearForLabel * 100 + monthForLabel,
  };
}

async function getFeeOverview(
  currentBatchId: number | null,
  currentPeriodLabel: string | null | undefined,
  requestedPaidThrough?: string,
) {
  if (!currentBatchId) {
    const currentPeriod = parsePeriod(currentPeriodLabel);
    const powerCutSoonMonth = currentPeriod.month - 4;
    return {
      currentPeriod,
      powerCutPolicy: {
        soonPaidThroughLabel: internalMonthLabel(powerCutSoonMonth),
        overdueFromLabel: internalMonthLabel(powerCutSoonMonth + 1),
      },
      total: 0,
      completedCount: 0,
      notCompletedCount: 0,
      noDataCount: 0,
      partialRoundedCount: 0,
      completionPercent: 0,
      distribution: [],
      exactPaidThroughOptions: [],
      selectedNoticeGroup: null,
      attentionRows: [],
    };
  }

  const currentPeriod = parsePeriod(currentPeriodLabel);
  const powerCutSoonMonth = currentPeriod.month - 4;
  const feeRows = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { batch_id: currentBatchId },
    select: {
      ma_can: true,
      thang_da_dong_den_hien_tai: true,
      payload_public_json: true,
      can_ho: {
        select: {
          ma_lo: true,
          toa_lo_goc: true,
        },
      },
    },
  });

  const exactPaidThroughCounts = new Map<
    number,
    { label: string; count: number; sortKey: number }
  >();
  const attentionRows: Array<{
    ma_can: string;
    label: string;
    displayText: string;
    kind: "POWER_CUT" | "POWER_CUT_SOON";
  }> = [];
  const exactPaidThroughGroups = new Map<
    string,
    {
      key: string;
      label: string;
      month: number;
      year: number;
      apartments: Array<{ code: string; lot: string }>;
    }
  >();

  let completedCount = 0;
  let noDataCount = 0;
  let partialRoundedCount = 0;
  for (const row of feeRows) {
    const paidThrough = extractPaidThrough(row.payload_public_json, row.thang_da_dong_den_hien_tai);
    const monthIndex = paidThrough.flooredMonth;
    const isCompleted = monthIndex !== null && monthIndex >= currentPeriod.month;

    if (isCompleted) completedCount += 1;
    if (monthIndex === null) noDataCount += 1;
    if (paidThrough.isPartialPayment) partialRoundedCount += 1;

    if (monthIndex !== null) {
      const existing = exactPaidThroughCounts.get(monthIndex);
      exactPaidThroughCounts.set(monthIndex, {
        label: paidThrough.label,
        count: (existing?.count || 0) + 1,
        sortKey: paidThrough.sortKey,
      });
    }

    if (
      !paidThrough.isPartialPayment &&
      paidThrough.resolvedMonth !== null &&
      paidThrough.resolvedYear !== null
    ) {
      const exactKey = `${paidThrough.resolvedYear}-${String(paidThrough.resolvedMonth).padStart(2, "0")}`;
      const exactGroup = exactPaidThroughGroups.get(exactKey) || {
        key: exactKey,
        label: paidThrough.label,
        month: paidThrough.resolvedMonth,
        year: paidThrough.resolvedYear,
        apartments: [],
      };
      exactGroup.apartments.push({
        code: row.ma_can,
        lot: row.can_ho.toa_lo_goc || row.can_ho.ma_lo || "Chưa xác định",
      });
      exactPaidThroughGroups.set(exactKey, exactGroup);
    }

    if (monthIndex !== null && monthIndex === powerCutSoonMonth) {
      attentionRows.push({
        ma_can: row.ma_can,
        label: "Cắt tháng này",
        displayText: `${paidThrough.displayText || paidThrough.label}. Chậm phí từ ${internalMonthLabel(powerCutSoonMonth + 1)}.`,
        kind: "POWER_CUT_SOON",
      });
    } else if (monthIndex === null || monthIndex < powerCutSoonMonth) {
      attentionRows.push({
        ma_can: row.ma_can,
        label: "Đã cắt điện",
        displayText:
          monthIndex === null
            ? "Chưa có mốc tháng đã đóng trong dữ liệu public."
            : `${paidThrough.displayText || paidThrough.label}. Đóng thiếu trước ngưỡng cắt tháng này.`,
        kind: "POWER_CUT",
      });
    }
  }

  const total = feeRows.length;
  const notCompletedCount = Math.max(total - completedCount - noDataCount, 0);
  const currentMonthIndex = (currentPeriod.year - BASE_YEAR) * 12 + currentPeriod.month;
  const distribution: Array<{ label: string; count: number; sortKey: number; isCurrentOrLater: boolean }> = [];

  if (completedCount > 0) {
    distribution.push({
      label: `Đã đóng hết ${internalMonthLabel(currentMonthIndex)} trở lên`,
      count: completedCount,
      sortKey: 999999,
      isCurrentOrLater: true,
    });
  }

  const monthIndexesBeforeCurrent = [...exactPaidThroughCounts.keys()]
    .filter((monthIndex) => monthIndex < currentMonthIndex)
    .sort((a, b) => b - a);
  const thresholdIndexes = new Set<number>();
  if (notCompletedCount > 0 || noDataCount > 0) {
    thresholdIndexes.add(currentMonthIndex - 1);
  }
  for (const monthIndex of monthIndexesBeforeCurrent) {
    thresholdIndexes.add(monthIndex);
  }

  let previousThresholdCount: number | null = null;
  [...thresholdIndexes]
    .sort((a, b) => b - a)
    .forEach((threshold) => {
      const count =
        noDataCount +
        [...exactPaidThroughCounts.entries()].reduce(
          (sum, [monthIndex, item]) => (monthIndex <= threshold ? sum + item.count : sum),
          0,
        );
      if (count === 0 || count === previousThresholdCount) return;
      previousThresholdCount = count;
      distribution.push({
        label: `Chưa đóng hết ${internalMonthLabel(threshold)}`,
        count,
        sortKey: threshold,
        isCurrentOrLater: false,
      });
    });

  const exactPaidThroughOptions = [...exactPaidThroughGroups.values()]
    .sort((a, b) => b.year - a.year || b.month - a.month)
    .map((group) => ({
      key: group.key,
      label: group.label,
      count: group.apartments.length,
    }));
  const selectedExactGroup =
    exactPaidThroughGroups.get(requestedPaidThrough || "") ||
    exactPaidThroughGroups.get(`${BASE_YEAR}-05`) ||
    exactPaidThroughGroups.values().next().value ||
    null;

  return {
    currentPeriod,
    powerCutPolicy: {
      soonPaidThroughLabel: internalMonthLabel(powerCutSoonMonth),
      overdueFromLabel: internalMonthLabel(powerCutSoonMonth + 1),
    },
    total,
    completedCount,
    notCompletedCount,
    noDataCount,
    partialRoundedCount,
    completionPercent: total ? Math.round((completedCount / total) * 100) : 0,
    distribution: distribution.map((item) => ({
      ...item,
      percent: total ? Math.round((item.count / total) * 100) : 0,
    })),
    exactPaidThroughOptions,
    selectedNoticeGroup: selectedExactGroup
      ? {
          key: selectedExactGroup.key,
          label: selectedExactGroup.label,
          count: selectedExactGroup.apartments.length,
          apartmentGroups: Object.entries(
            selectedExactGroup.apartments.reduce<Record<string, string[]>>((groups, apartment) => {
              groups[apartment.lot] ||= [];
              groups[apartment.lot].push(apartment.code);
              return groups;
            }, {}),
          )
            .sort(([left], [right]) => left.localeCompare(right, "vi-VN", { numeric: true }))
            .map(([lot, apartmentCodes]) => ({
              lot,
              apartmentCodes: apartmentCodes.sort((a, b) => a.localeCompare(b, "vi-VN", { numeric: true })),
            })),
          noticePeriod: noticePeriodAfterPaidThrough(selectedExactGroup.month, selectedExactGroup.year),
        }
      : null,
    attentionRows: attentionRows.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "POWER_CUT_SOON" ? -1 : 1;
      return a.ma_can.localeCompare(b.ma_can, "vi-VN", { numeric: true });
    }),
  };
}

function normalizeSearchCandidates(rawQuery: string) {
  const query = rawQuery.trim().slice(0, MAX_SEARCH_LENGTH);
  if (!query) {
    return {
      query,
      candidates: [],
      searchText: "",
      parseMessage: null,
    };
  }

  const parsed = parsePublicLookupInput(query);
  return {
    query,
    candidates: parsed.candidates,
    searchText: query.toUpperCase(),
    parseMessage: parsed.ok ? null : parsed.message,
  };
}

export async function getApartmentDashboardData(
  rawQuery: string,
  requestedFeePeriod?: string,
  requestedPaidThrough?: string,
) {
  const { query, candidates, searchText, parseMessage } = normalizeSearchCandidates(rawQuery);

  const [
    totalApartments,
    apartmentTypes,
    contactReviewCount,
    approvedContactCount,
    currentBatch,
    publishedFeeBatches,
    latestImports,
    transactionReviewStats,
    transactionParseStats,
  ] = await Promise.all([
    prisma.canHo.count(),
    prisma.canHo.groupBy({
      by: ["loai_can"],
      _count: { _all: true },
      orderBy: { loai_can: "asc" },
    }),
    prisma.ungVienLienHeCanHo.count({
      where: {
        OR: [{ co_can_ra_soat: true }, { trang_thai_duyet: "CHUA_DUYET" }],
      },
    }),
    prisma.lienHeCanHo.count(),
    prisma.batchTrangThaiPhiPublic.findFirst({
      where: { la_batch_public_hien_hanh: true },
      orderBy: { public_luc: "desc" },
      select: {
        id: true,
        ky_du_lieu: true,
        ten_file_nguon: true,
        tong_so_can: true,
        public_luc: true,
        trang_thai: true,
      },
    }),
    prisma.batchTrangThaiPhiPublic.findMany({
      where: { trang_thai: "DA_PUBLIC" },
      orderBy: [{ public_luc: "desc" }, { id: "desc" }],
      distinct: ["ky_du_lieu"],
      select: {
        id: true,
        ky_du_lieu: true,
        public_luc: true,
        la_batch_public_hien_hanh: true,
      },
    }),
    prisma.loNhapDuLieu.findMany({
      orderBy: { thoi_diem_nhap: "desc" },
      take: 8,
      select: {
        id: true,
        loai_nguon: true,
        ten_file: true,
        so_dong: true,
        trang_thai: true,
        thoi_diem_nhap: true,
      },
    }),
    prisma.giaoDichNganHang.groupBy({
      by: ["trang_thai_duyet"],
      _count: { _all: true },
    }),
    prisma.giaoDichNganHang.groupBy({
      by: ["trang_thai_khop"],
      _count: { _all: true },
      where: { trang_thai_khop: { not: null } },
    }),
  ]);

  const selectedFeeBatch =
    publishedFeeBatches.find((batch) => batch.ky_du_lieu === requestedFeePeriod) ||
    publishedFeeBatches.find((batch) => batch.la_batch_public_hien_hanh) ||
    publishedFeeBatches[0] ||
    null;
  const feeOverview = await getFeeOverview(
    selectedFeeBatch?.id ?? null,
    selectedFeeBatch?.ky_du_lieu,
    requestedPaidThrough,
  );

  const searchWhere: Prisma.CanHoWhereInput[] = [{ ma_can: { contains: searchText } }];
  if (candidates.length) {
    searchWhere.unshift({ ma_can: { in: candidates } });
  }

  const searchResults = query
    ? await prisma.canHo.findMany({
        where: { OR: searchWhere },
        orderBy: { ma_can: "asc" },
        take: RESULT_LIMIT,
        select: {
          id: true,
          ma_can: true,
          loai_can: true,
          ma_lo: true,
          ma_so: true,
          chu_ho_ten_goc: true,
          trang_thai_su_dung_goc: true,
          tinh_trang_goc: true,
        },
      })
    : [];

  const selectedApartment =
    searchResults.length === 1
      ? await getApartmentDetail(searchResults[0].id)
      : candidates.length
        ? await prisma.canHo
            .findFirst({
              where: { ma_can: { in: candidates } },
              select: { id: true },
            })
            .then((apartment) => (apartment ? getApartmentDetail(apartment.id) : null))
        : null;

  return {
    summary: {
      totalApartments,
      apartmentTypes: apartmentTypes.map((item) => ({
        type: item.loai_can,
        count: item._count._all,
      })),
      contactReviewCount,
      approvedContactCount,
      currentBatch: currentBatch
        ? {
            ...currentBatch,
            public_luc: formatDate(currentBatch.public_luc),
          }
        : null,
      feeOverview,
      selectedFeePeriod: selectedFeeBatch?.ky_du_lieu || null,
      publishedFeePeriods: publishedFeeBatches.map((batch) => ({
        id: batch.id,
        period: batch.ky_du_lieu,
        publicAt: formatDate(batch.public_luc),
        isCurrent: batch.la_batch_public_hien_hanh,
      })),
      transactionReviewStats: transactionReviewStats.map((item) => ({
        status: item.trang_thai_duyet,
        count: item._count._all,
      })),
      transactionParseStats: transactionParseStats.map((item) => ({
        status: item.trang_thai_khop || "CHUA_CO_KET_QUA_PARSE",
        count: item._count._all,
      })),
    },
    latestImports: latestImports.map((item) => ({
      ...item,
      thoi_diem_nhap: formatDate(item.thoi_diem_nhap),
    })),
    search: {
      query,
      candidates,
      parseMessage,
      resultLimit: RESULT_LIMIT,
      results: searchResults,
      selectedApartment,
    },
  };
}

async function getApartmentDetail(apartmentId: number) {
  const apartment = await prisma.canHo.findUnique({
    where: { id: apartmentId },
    select: {
      id: true,
      ma_can: true,
      loai_can: true,
      ma_lo: true,
      ma_so: true,
      dien_tich_m2: true,
      toa_lo_goc: true,
      loai_hinh_goc: true,
      chu_ho_ten_goc: true,
      trang_thai_su_dung_goc: true,
      tinh_trang_goc: true,
      trang_thai: true,
      ghi_chu: true,
      lien_he: {
        orderBy: [{ la_lien_he_chinh: "desc" }, { thu_tu_uu_tien: "asc" }, { id: "asc" }],
        take: 10,
        select: {
          id: true,
          ten_hien_thi: true,
          so_dien_thoai: true,
          la_lien_he_chinh: true,
          nhan_thong_bao: true,
          vai_tro_lien_he: true,
          trang_thai_lien_he: true,
          co_can_ra_soat: true,
          ghi_chu: true,
        },
      },
      trang_thai_phi_public: {
        where: {
          batch: { la_batch_public_hien_hanh: true },
        },
        orderBy: { ngay_tao: "desc" },
        take: 1,
        select: {
          ma_can: true,
          thang_da_dong_den_hien_tai: true,
          ky_du_lieu: true,
          ghi_chu_public: true,
          payload_public_json: true,
          ngay_tao: true,
          batch: {
            select: {
              id: true,
              ky_du_lieu: true,
              public_luc: true,
              ten_file_nguon: true,
            },
          },
        },
      },
      lich_su_dong_phi: {
        orderBy: { ngay_tao: "desc" },
        take: 5,
        select: {
          id: true,
          ky_du_lieu: true,
          thang_ap_dung: true,
          so_tien: true,
          loai_nguon: true,
          ghi_chu: true,
          ngay_tao: true,
          batch_phi_public_id: true,
          giao_dich_ngan_hang: {
            select: {
              id: true,
              ngay_giao_dich: true,
              so_tien: true,
              noi_dung_goc: true,
              tham_chieu_ngan_hang: true,
              ten_nguoi_chuyen: true,
              lo_nhap_du_lieu: {
                select: {
                  id: true,
                  ten_file: true,
                  loai_nguon: true,
                },
              },
              chung_tu_doi_soat: {
                orderBy: { ngay_tao: "desc" },
                take: 3,
                select: {
                  id: true,
                  loai_chung_tu: true,
                  duong_dan_file: true,
                  ten_file_goc: true,
                  ghi_chu: true,
                  ngay_tao: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!apartment) {
    return null;
  }

  const candidates = await prisma.ungVienLienHeCanHo.findMany({
    where: { ma_can: apartment.ma_can },
    orderBy: [
      { co_can_ra_soat: "desc" },
      { trang_thai_duyet: "asc" },
      { thu_tu_nguon: "asc" },
      { id: "asc" },
    ],
    take: 20,
    select: {
      id: true,
      ten_chu_ho_goc: true,
      thong_tin_cu_dan_goc: true,
      ten_hien_thi_parse: true,
      so_dien_thoai_parse: true,
      ten_nguoi_su_dung_goc: true,
      so_dien_thoai_goc: true,
      thong_tin_phu_goc: true,
      ghi_chu_goc: true,
      co_can_ra_soat: true,
      ly_do_ra_soat: true,
      flags_json: true,
      ghi_chu_nghiep_vu: true,
      trang_thai_duyet: true,
    },
  });
  const evidenceNeededTransactions = await prisma.giaoDichNganHang.findMany({
    where: {
      trang_thai_duyet: "DA_RA_SOAT",
      OR: [
        { ma_can_duoc_chon: apartment.ma_can },
        { ma_can_parse: apartment.ma_can },
        { ung_vien_khop: { some: { ma_can: apartment.ma_can } } },
      ],
    },
    orderBy: [{ ngay_giao_dich: "desc" }, { id: "desc" }],
    take: 10,
    select: {
      id: true,
      ngay_giao_dich: true,
      so_tien: true,
      noi_dung_goc: true,
      ten_nguoi_chuyen: true,
      tham_chieu_ngan_hang: true,
      ma_can_parse: true,
      ma_can_duoc_chon: true,
      ghi_chu_duyet: true,
      do_tin_cay: true,
      chung_tu_doi_soat: {
        orderBy: { ngay_tao: "desc" },
        take: 3,
        select: {
          id: true,
          loai_chung_tu: true,
          duong_dan_file: true,
          ten_file_goc: true,
          ghi_chu: true,
          ngay_tao: true,
        },
      },
    },
  });

  const feeStatus = apartment.trang_thai_phi_public[0] ?? null;

  return {
    ...apartment,
    dien_tich_m2: formatDecimal(apartment.dien_tich_m2),
    trang_thai_phi_public: undefined,
    lich_su_dong_phi: undefined,
    currentFeeStatus: feeStatus
      ? {
          ma_can: feeStatus.ma_can,
          thang_da_dong_den_hien_tai: feeStatus.thang_da_dong_den_hien_tai,
          ky_du_lieu: feeStatus.ky_du_lieu,
          ghi_chu_public: feeStatus.ghi_chu_public,
          display_text: publicPayloadText(
            feeStatus.payload_public_json,
            feeStatus.thang_da_dong_den_hien_tai
          ),
          ngay_tao: formatDate(feeStatus.ngay_tao),
          batch: {
            ...feeStatus.batch,
            public_luc: formatDate(feeStatus.batch.public_luc),
          },
        }
      : null,
    latestPaymentHistory: apartment.lich_su_dong_phi.map((history) => ({
      id: history.id,
      ky_du_lieu: history.ky_du_lieu,
      thang_ap_dung: history.thang_ap_dung,
      so_tien: formatDecimal(history.so_tien),
      loai_nguon: history.loai_nguon,
      ghi_chu: history.ghi_chu,
      ngay_tao: formatDate(history.ngay_tao),
      batch_phi_public_id: history.batch_phi_public_id,
      giao_dich_ngan_hang: history.giao_dich_ngan_hang
        ? {
            ...history.giao_dich_ngan_hang,
            ngay_giao_dich: formatDate(history.giao_dich_ngan_hang.ngay_giao_dich),
            so_tien: formatDecimal(history.giao_dich_ngan_hang.so_tien),
            chung_tu_doi_soat: history.giao_dich_ngan_hang.chung_tu_doi_soat.map((item) => ({
              ...item,
              ngay_tao: formatDate(item.ngay_tao),
            })),
          }
        : null,
    })),
    contactCandidates: candidates.map((candidate) => ({
      ...candidate,
      flags: jsonArray(candidate.flags_json),
      flags_json: undefined,
    })),
    evidenceNeededTransactions: evidenceNeededTransactions.map((transaction) => ({
      ...transaction,
      ngay_giao_dich: formatDate(transaction.ngay_giao_dich),
      so_tien: formatDecimal(transaction.so_tien),
      do_tin_cay: formatDecimal(transaction.do_tin_cay),
      chung_tu_doi_soat: transaction.chung_tu_doi_soat.map((item) => ({
        ...item,
        ngay_tao: formatDate(item.ngay_tao),
      })),
    })),
  };
}

import { prisma } from "@/src/modules/database";
import {
  parsePublicLookupInput,
  publicFeeDisplayText,
} from "@/src/modules/billing/fee-status";
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

function extractPaidThrough(payload: unknown, fallback: string | null) {
  const payloadRecord = recordValue(payload);
  const paidThrough = recordValue(payloadRecord?.paidThrough);
  const numericMonth =
    numericValue(paidThrough?.numericMonth) ??
    numericValue(payloadRecord?.numericMonth) ??
    (() => {
      const match = String(fallback || "").match(/-?\d+(?:[.,]\d+)?/);
      return match ? Number(match[0].replace(",", ".")) : null;
    })();

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

  const monthForLabel = resolvedMonth ?? (((flooredMonth - 1) % 12) + 12) % 12 + 1;
  const yearForLabel = resolvedYear ?? BASE_YEAR + Math.floor((flooredMonth - 1) / 12);

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

async function getFeeOverview(currentBatchId: number | null, currentPeriodLabel: string | null | undefined) {
  if (!currentBatchId) {
    return {
      currentPeriod: parsePeriod(currentPeriodLabel),
      total: 0,
      completedCount: 0,
      notCompletedCount: 0,
      noDataCount: 0,
      partialRoundedCount: 0,
      completionPercent: 0,
      distribution: [],
      attentionRows: [],
    };
  }

  const currentPeriod = parsePeriod(currentPeriodLabel);
  const feeRows = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { batch_id: currentBatchId },
    select: {
      ma_can: true,
      thang_da_dong_den_hien_tai: true,
      payload_public_json: true,
    },
  });

  const groups = new Map<
    string,
    { label: string; count: number; sortKey: number; isCurrentOrLater: boolean }
  >();
  const attentionRows: Array<{
    ma_can: string;
    label: string;
    displayText: string;
    kind: "PARTIAL" | "OVERDUE" | "NO_DATA";
  }> = [];

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

    const groupKey = `${paidThrough.sortKey}:${paidThrough.label}`;
    const existing = groups.get(groupKey);
    groups.set(groupKey, {
      label: paidThrough.label,
      count: (existing?.count || 0) + 1,
      sortKey: paidThrough.sortKey,
      isCurrentOrLater: existing?.isCurrentOrLater || isCompleted,
    });

    if (attentionRows.length < 8) {
      if (paidThrough.isPartialPayment) {
        attentionRows.push({
          ma_can: row.ma_can,
          label: paidThrough.label,
          displayText:
            paidThrough.displayText ||
            `Đóng lẻ, dashboard làm tròn xuống tháng ${monthIndex ?? "-"}`,
          kind: "PARTIAL",
        });
      } else if (monthIndex !== null && monthIndex < currentPeriod.month - 6) {
        attentionRows.push({
          ma_can: row.ma_can,
          label: paidThrough.label,
          displayText: paidThrough.displayText || "Đóng phí chậm so với kỳ hiện tại.",
          kind: "OVERDUE",
        });
      } else if (monthIndex === null) {
        attentionRows.push({
          ma_can: row.ma_can,
          label: paidThrough.label,
          displayText: "Chưa có mốc tháng đã đóng.",
          kind: "NO_DATA",
        });
      }
    }
  }

  const total = feeRows.length;
  const notCompletedCount = Math.max(total - completedCount - noDataCount, 0);

  return {
    currentPeriod,
    total,
    completedCount,
    notCompletedCount,
    noDataCount,
    partialRoundedCount,
    completionPercent: total ? Math.round((completedCount / total) * 100) : 0,
    distribution: [...groups.values()]
      .sort((a, b) => b.sortKey - a.sortKey)
      .map((item) => ({
        ...item,
        percent: total ? Math.round((item.count / total) * 100) : 0,
      })),
    attentionRows,
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

export async function getApartmentDashboardData(rawQuery: string) {
  const { query, candidates, searchText, parseMessage } = normalizeSearchCandidates(rawQuery);

  const [
    totalApartments,
    apartmentTypes,
    contactReviewCount,
    approvedContactCount,
    currentBatch,
    latestImports,
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
  ]);

  const feeOverview = await getFeeOverview(currentBatch?.id ?? null, currentBatch?.ky_du_lieu);

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

  const feeStatus = apartment.trang_thai_phi_public[0] ?? null;

  return {
    ...apartment,
    dien_tich_m2: formatDecimal(apartment.dien_tich_m2),
    trang_thai_phi_public: undefined,
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
    contactCandidates: candidates.map((candidate) => ({
      ...candidate,
      flags: jsonArray(candidate.flags_json),
      flags_json: undefined,
    })),
  };
}

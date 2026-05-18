import { prisma } from "@/src/modules/database";
import {
  parsePublicLookupInput,
  publicFeeDisplayText,
} from "@/src/modules/billing/fee-status";
import type { Prisma } from "@prisma/client";

const MAX_SEARCH_LENGTH = 80;
const RESULT_LIMIT = 20;

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
      take: 6,
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

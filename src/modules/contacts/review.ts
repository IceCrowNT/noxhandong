import type { Prisma, TrangThaiDuyetUngVien, VaiTroLienHe } from "@prisma/client";

import { prisma } from "@/src/modules/database";

export const CONTACT_REVIEW_PAGE_SIZE = 30;

export type ContactReviewStatusFilter = TrangThaiDuyetUngVien | "ALL";
export type ContactReviewNeedsFilter = "ALL" | "NEEDS_REVIEW" | "CLEAN";

export type ContactReviewFilters = {
  maCan?: string;
  status?: ContactReviewStatusFilter;
  needs?: ContactReviewNeedsFilter;
  page?: number;
};

export type ApproveContactInput = {
  candidateId: number;
  displayName: string;
  phoneNumber?: string;
  role?: VaiTroLienHe;
  isPrimary: boolean;
  receivesNotification: boolean;
  note?: string;
  reviewedBy: string;
};

export type RejectContactInput = {
  candidateId: number;
  note?: string;
  reviewedBy: string;
};

const REVIEW_STATUS_VALUES: TrangThaiDuyetUngVien[] = ["CHUA_DUYET", "DA_DUYET", "TU_CHOI"];
const CONTACT_ROLE_VALUES: VaiTroLienHe[] = [
  "CHU_HO",
  "CHU_MOI",
  "CHU_CU",
  "KHACH_THUE",
  "NGUOI_THAN",
  "NGUOI_NHAN_THONG_BAO",
  "DONG_HO",
  "MOI_GIOI",
  "KHAC",
];

export function isContactReviewStatus(value: string): value is TrangThaiDuyetUngVien {
  return REVIEW_STATUS_VALUES.includes(value as TrangThaiDuyetUngVien);
}

export function isContactRole(value: string): value is VaiTroLienHe {
  return CONTACT_ROLE_VALUES.includes(value as VaiTroLienHe);
}

function cleanPhone(value: string | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits || null;
}

function normalizePage(value: number | undefined) {
  return Number.isInteger(value) && value && value > 0 ? value : 1;
}

function buildWhere(filters: ContactReviewFilters): Prisma.UngVienLienHeCanHoWhereInput {
  const where: Prisma.UngVienLienHeCanHoWhereInput = {};
  const maCan = filters.maCan?.trim().toUpperCase();

  if (maCan) {
    where.ma_can = { contains: maCan };
  }

  if (filters.status && filters.status !== "ALL") {
    where.trang_thai_duyet = filters.status;
  }

  if (filters.needs === "NEEDS_REVIEW") {
    where.co_can_ra_soat = true;
  }

  if (filters.needs === "CLEAN") {
    where.co_can_ra_soat = false;
  }

  return where;
}

function jsonArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export async function getContactReviewData(filters: ContactReviewFilters) {
  const page = normalizePage(filters.page);
  const where = buildWhere(filters);
  const skip = (page - 1) * CONTACT_REVIEW_PAGE_SIZE;

  const [total, statusCounts, reviewCounts, candidates] = await Promise.all([
    prisma.ungVienLienHeCanHo.count({ where }),
    prisma.ungVienLienHeCanHo.groupBy({
      by: ["trang_thai_duyet"],
      _count: { _all: true },
      orderBy: { trang_thai_duyet: "asc" },
    }),
    prisma.ungVienLienHeCanHo.groupBy({
      by: ["co_can_ra_soat"],
      _count: { _all: true },
      orderBy: { co_can_ra_soat: "desc" },
    }),
    prisma.ungVienLienHeCanHo.findMany({
      where,
      orderBy: [
        { trang_thai_duyet: "asc" },
        { co_can_ra_soat: "desc" },
        { ma_can: "asc" },
        { thu_tu_nguon: "asc" },
        { id: "asc" },
      ],
      skip,
      take: CONTACT_REVIEW_PAGE_SIZE,
      select: {
        id: true,
        ma_can: true,
        ten_chu_ho_goc: true,
        thong_tin_cu_dan_goc: true,
        thu_tu_nguon: true,
        ten_nguoi_su_dung_goc: true,
        so_dien_thoai_goc: true,
        thong_tin_phu_goc: true,
        trang_thai_su_dung_goc: true,
        tinh_trang_goc: true,
        ghi_chu_goc: true,
        ten_hien_thi_parse: true,
        so_dien_thoai_parse: true,
        la_lien_he_chinh_du_doan: true,
        vai_tro_du_doan: true,
        nhan_thong_bao_du_doan: true,
        co_can_ra_soat: true,
        ly_do_ra_soat: true,
        flags_json: true,
        ghi_chu_nghiep_vu: true,
        trang_thai_duyet: true,
        ghi_chu_duyet: true,
      },
    }),
  ]);

  return {
    filters: {
      maCan: filters.maCan?.trim() || "",
      status: filters.status || "CHUA_DUYET",
      needs: filters.needs || "ALL",
      page,
    },
    pagination: {
      total,
      page,
      pageSize: CONTACT_REVIEW_PAGE_SIZE,
      pageCount: Math.max(1, Math.ceil(total / CONTACT_REVIEW_PAGE_SIZE)),
    },
    summary: {
      statusCounts: statusCounts.map((item) => ({
        status: item.trang_thai_duyet,
        count: item._count._all,
      })),
      reviewCounts: reviewCounts.map((item) => ({
        needsReview: item.co_can_ra_soat,
        count: item._count._all,
      })),
    },
    candidates: candidates.map((candidate) => ({
      ...candidate,
      flags: jsonArray(candidate.flags_json),
      flags_json: undefined,
    })),
  };
}

export async function approveContactCandidate(input: ApproveContactInput) {
  const displayName = input.displayName.trim();
  if (!displayName) {
    throw new Error("Thiếu tên liên hệ.");
  }

  return prisma.$transaction(async (tx) => {
    const candidate = await tx.ungVienLienHeCanHo.findUnique({
      where: { id: input.candidateId },
    });

    if (!candidate) {
      throw new Error("Không tìm thấy contact candidate.");
    }

    if (!candidate.ma_can) {
      throw new Error("Candidate chưa có mã căn.");
    }

    const apartment = await tx.canHo.findUnique({
      where: { ma_can: candidate.ma_can },
      select: { id: true },
    });

    if (!apartment) {
      throw new Error("Không tìm thấy căn hộ tương ứng.");
    }

    const sourceKey = `UNG_VIEN_LIEN_HE_CAN_HO:${candidate.id}`;
    const existing = await tx.lienHeCanHo.findFirst({
      where: {
        can_ho_id: apartment.id,
        nguon_du_lieu: sourceKey,
      },
      select: { id: true },
    });

    const payloadDuyet = {
      action: "APPROVE",
      reviewedBy: input.reviewedBy,
      reviewedAt: new Date().toISOString(),
      displayName,
      phoneNumber: cleanPhone(input.phoneNumber),
      role: input.role || null,
      isPrimary: input.isPrimary,
      receivesNotification: input.receivesNotification,
      note: input.note?.trim() || null,
    };

    if (!existing) {
      await tx.lienHeCanHo.create({
        data: {
          can_ho_id: apartment.id,
          ten_hien_thi: displayName,
          so_dien_thoai: cleanPhone(input.phoneNumber),
          la_lien_he_chinh: input.isPrimary,
          nhan_thong_bao: input.receivesNotification,
          vai_tro_lien_he: input.role || candidate.vai_tro_du_doan || null,
          trang_thai_lien_he: candidate.co_can_ra_soat ? "CAN_XAC_MINH" : "DANG_DUNG",
          thu_tu_uu_tien: candidate.thu_tu_nguon,
          nguon_du_lieu: sourceKey,
          nguon_dong_du_lieu_tho_id: candidate.dong_du_lieu_tho_id,
          co_can_ra_soat: candidate.co_can_ra_soat,
          ghi_chu: input.note?.trim() || candidate.ghi_chu_nghiep_vu || candidate.ly_do_ra_soat,
        },
      });
    }

    return tx.ungVienLienHeCanHo.update({
      where: { id: candidate.id },
      data: {
        trang_thai_duyet: "DA_DUYET",
        ten_hien_thi_parse: displayName,
        so_dien_thoai_parse: cleanPhone(input.phoneNumber),
        vai_tro_du_doan: input.role || candidate.vai_tro_du_doan,
        la_lien_he_chinh_du_doan: input.isPrimary,
        nhan_thong_bao_du_doan: input.receivesNotification,
        ghi_chu_duyet: input.note?.trim() || null,
        payload_duyet_json: payloadDuyet,
      },
    });
  });
}

export async function rejectContactCandidate(input: RejectContactInput) {
  const payloadDuyet = {
    action: "REJECT",
    reviewedBy: input.reviewedBy,
    reviewedAt: new Date().toISOString(),
    note: input.note?.trim() || null,
  };

  return prisma.ungVienLienHeCanHo.update({
    where: { id: input.candidateId },
    data: {
      trang_thai_duyet: "TU_CHOI",
      ghi_chu_duyet: input.note?.trim() || null,
      payload_duyet_json: payloadDuyet,
    },
  });
}

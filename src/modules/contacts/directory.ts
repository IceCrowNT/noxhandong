import type { Prisma, TrangThaiLienHe, VaiTroLienHe } from "@prisma/client";

import { prisma } from "@/src/modules/database";

export const CONTACT_DIRECTORY_PAGE_SIZE = 40;

export type ContactDirectoryStatusFilter = TrangThaiLienHe | "ALL";

export type ContactDirectoryFilters = {
  query?: string;
  status?: ContactDirectoryStatusFilter;
  page?: number;
};

export type ContactDirectoryUpsertInput = {
  contactId?: number;
  maCan?: string;
  displayName: string;
  phoneNumber?: string;
  isPrimary: boolean;
  receivesNotification: boolean;
  zaloLink?: string;
  role?: VaiTroLienHe | null;
  status?: TrangThaiLienHe;
  note?: string;
};

const CONTACT_STATUS_VALUES: TrangThaiLienHe[] = ["DANG_DUNG", "CAN_XAC_MINH", "CU"];
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

export function isContactDirectoryStatus(value: string): value is TrangThaiLienHe {
  return CONTACT_STATUS_VALUES.includes(value as TrangThaiLienHe);
}

export function isContactRole(value: string): value is VaiTroLienHe {
  return CONTACT_ROLE_VALUES.includes(value as VaiTroLienHe);
}

function normalizePage(value: number | undefined) {
  return Number.isInteger(value) && value && value > 0 ? value : 1;
}

function normalizeQuery(value: string | undefined) {
  return value?.trim().slice(0, 80) || "";
}

function normalizePhone(value: string | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits || null;
}

function cleanText(value: string | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function buildWhere(filters: ContactDirectoryFilters): Prisma.LienHeCanHoWhereInput {
  const where: Prisma.LienHeCanHoWhereInput = {};
  const query = normalizeQuery(filters.query);
  const queryDigits = query.replace(/\D/g, "");

  if (query) {
    where.OR = [
      { ten_hien_thi: { contains: query, mode: "insensitive" } },
      { ghi_chu: { contains: query, mode: "insensitive" } },
      { can_ho: { ma_can: { contains: query.toUpperCase(), mode: "insensitive" } } },
      { can_ho: { toa_lo_goc: { contains: query, mode: "insensitive" } } },
      ...(queryDigits
        ? [{ so_dien_thoai: { contains: queryDigits } as Prisma.StringNullableFilter }]
        : []),
    ];
  }

  if (filters.status && filters.status !== "ALL") {
    where.trang_thai_lien_he = filters.status;
  }

  return where;
}

export async function getContactDirectoryData(filters: ContactDirectoryFilters) {
  const page = normalizePage(filters.page);
  const where = buildWhere(filters);
  const skip = (page - 1) * CONTACT_DIRECTORY_PAGE_SIZE;

  const [total, primaryCount, reviewCount, apartmentGroups, contacts] = await Promise.all([
    prisma.lienHeCanHo.count({ where }),
    prisma.lienHeCanHo.count({ where: { ...where, la_lien_he_chinh: true } }),
    prisma.lienHeCanHo.count({ where: { ...where, trang_thai_lien_he: "CAN_XAC_MINH" } }),
    prisma.lienHeCanHo.groupBy({
      by: ["can_ho_id"],
      where,
      _count: { _all: true },
    }),
    prisma.lienHeCanHo.findMany({
      where,
      orderBy: [
        { can_ho: { ma_can: "asc" } },
        { la_lien_he_chinh: "desc" },
        { thu_tu_uu_tien: "asc" },
        { id: "asc" },
      ],
      skip,
      take: CONTACT_DIRECTORY_PAGE_SIZE,
      select: {
        id: true,
        can_ho_id: true,
        ten_hien_thi: true,
        so_dien_thoai: true,
        la_lien_he_chinh: true,
        nhan_thong_bao: true,
        zalo_link: true,
        vai_tro_lien_he: true,
        trang_thai_lien_he: true,
        thu_tu_uu_tien: true,
        nguon_du_lieu: true,
        co_can_ra_soat: true,
        ghi_chu: true,
        ngay_tao: true,
        ngay_cap_nhat: true,
        can_ho: {
          select: {
            id: true,
            ma_can: true,
            ma_lo: true,
            ma_so: true,
            toa_lo_goc: true,
            chu_ho_ten_goc: true,
            tinh_trang_goc: true,
            trang_thai_su_dung_goc: true,
          },
        },
      },
    }),
  ]);

  return {
    filters: {
      query: normalizeQuery(filters.query),
      status: filters.status || "ALL",
      page,
    },
    pagination: {
      total,
      page,
      pageSize: CONTACT_DIRECTORY_PAGE_SIZE,
      pageCount: Math.max(1, Math.ceil(total / CONTACT_DIRECTORY_PAGE_SIZE)),
    },
    summary: {
      total,
      primaryCount,
      reviewCount,
      apartmentCount: apartmentGroups.length,
    },
    contacts,
  };
}

async function resolveApartmentId(tx: Prisma.TransactionClient, maCan: string | undefined) {
  const normalized = String(maCan || "").trim().toUpperCase();
  if (!normalized) {
    throw new Error("Thiếu mã căn.");
  }

  const apartment = await tx.canHo.findUnique({
    where: { ma_can: normalized },
    select: { id: true },
  });

  if (!apartment) {
    throw new Error("Không tìm thấy căn hộ tương ứng.");
  }

  return apartment.id;
}

async function clearPrimaryContact(
  tx: Prisma.TransactionClient,
  canHoId: number,
  exceptId?: number,
) {
  await tx.lienHeCanHo.updateMany({
    where: {
      can_ho_id: canHoId,
      la_lien_he_chinh: true,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    data: { la_lien_he_chinh: false },
  });
}

export async function createDirectoryContact(input: ContactDirectoryUpsertInput) {
  const displayName = input.displayName.trim();
  if (!displayName) {
    throw new Error("Thiếu tên hiển thị.");
  }

  return prisma.$transaction(async (tx) => {
    const canHoId = await resolveApartmentId(tx, input.maCan);

    if (input.isPrimary) {
      await clearPrimaryContact(tx, canHoId);
    }

    const created = await tx.lienHeCanHo.create({
      data: {
        can_ho_id: canHoId,
        ten_hien_thi: displayName,
        so_dien_thoai: normalizePhone(input.phoneNumber),
        la_lien_he_chinh: input.isPrimary,
        nhan_thong_bao: input.receivesNotification,
        zalo_link: cleanText(input.zaloLink),
        vai_tro_lien_he: input.role || null,
        trang_thai_lien_he: input.status || "DANG_DUNG",
        nguon_du_lieu: "DANH_BA_CU_DAN",
        co_can_ra_soat: false,
        ghi_chu: cleanText(input.note),
      },
      select: { id: true },
    });

    return created;
  });
}

export async function updateDirectoryContact(input: ContactDirectoryUpsertInput & { contactId: number }) {
  const displayName = input.displayName.trim();
  if (!displayName) {
    throw new Error("Thiếu tên hiển thị.");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.lienHeCanHo.findUnique({
      where: { id: input.contactId },
      select: { id: true, can_ho_id: true },
    });

    if (!existing) {
      throw new Error("Không tìm thấy liên hệ.");
    }

    if (input.isPrimary) {
      await clearPrimaryContact(tx, existing.can_ho_id, existing.id);
    }

    return tx.lienHeCanHo.update({
      where: { id: input.contactId },
      data: {
        ten_hien_thi: displayName,
        so_dien_thoai: normalizePhone(input.phoneNumber),
        la_lien_he_chinh: input.isPrimary,
        nhan_thong_bao: input.receivesNotification,
        zalo_link: cleanText(input.zaloLink),
        vai_tro_lien_he: input.role || null,
        trang_thai_lien_he: input.status || "DANG_DUNG",
        ghi_chu: cleanText(input.note),
      },
      select: { id: true },
    });
  });
}

export async function deleteDirectoryContact(contactId: number) {
  return prisma.lienHeCanHo.delete({
    where: { id: contactId },
    select: { id: true },
  });
}

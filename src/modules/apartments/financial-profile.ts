import { prisma } from "@/src/modules/database/prisma";
import { parsePublicLookupInput } from "@/src/modules/billing/fee-status";

export type FinancialEvent = {
  id: string;
  type: "BANK_TRANSFER" | "MANUAL_ADJUSTMENT" | "MONTHLY_CLOSING" | "OTHER";
  date: Date;
  amount: number;
  description: string;
  period: string | null;
  evidences: Array<{
    url: string;
    type: string;
    note?: string | null;
  }>;
};

export type ApartmentFinancialProfile = {
  apartment: {
    ma_can: string;
    chu_ho: string;
    dien_tich: number;
  };
  events: FinancialEvent[];
};

export async function getApartmentFinancialProfile(maCan: string): Promise<ApartmentFinancialProfile | null> {
  const normalizedMaCan = maCan.trim().toUpperCase();

  const canHo = await prisma.canHo.findUnique({
    where: { ma_can: normalizedMaCan },
    include: {
      lien_he: {
        where: { la_lien_he_chinh: true },
        take: 1,
      },
    },
  });

  if (!canHo) {
    return null;
  }

  const feeHistory = await prisma.lichSuDongPhiCanHo.findMany({
    where: { can_ho_id: canHo.id },
    include: {
      giao_dich_ngan_hang: {
        include: {
          chung_tu_doi_soat: true,
        },
      },
      bo_sung_qua_khu: true,
    },
    orderBy: {
      ngay_tao: "desc",
    },
  });

  const debts = await prisma.soChotCanHo.findMany({
    where: { can_ho_id: canHo.id },
    include: {
      so_chot_thang: true,
    },
    orderBy: {
      ngay_tao: "desc",
    },
  });

  const events: FinancialEvent[] = [];

  for (const item of feeHistory) {
    if (item.giao_dich_ngan_hang) {
      events.push({
        id: `fee-${item.id}`,
        type: "BANK_TRANSFER",
        date: item.giao_dich_ngan_hang.ngay_giao_dich || item.ngay_tao,
        amount: Number(item.so_tien),
        description: item.giao_dich_ngan_hang.noi_dung_chuan_hoa || item.giao_dich_ngan_hang.noi_dung_goc,
        period: item.ky_du_lieu,
        evidences: item.giao_dich_ngan_hang.chung_tu_doi_soat
          .filter((e) => e.duong_dan_file || e.ghi_chu)
          .map((e) => ({
            url: e.duong_dan_file || "",
            type: e.loai_chung_tu,
            note: e.ghi_chu,
          })),
      });
    } else if (item.bo_sung_qua_khu) {
      events.push({
        id: `fee-${item.id}`,
        type: "MANUAL_ADJUSTMENT",
        date: item.bo_sung_qua_khu.ngay_giao_dich_goc || item.ngay_tao,
        amount: Number(item.so_tien),
        description: item.bo_sung_qua_khu.ghi_chu_noi_bo || "Giao dịch bổ sung",
        period: item.ky_du_lieu,
        evidences: item.bo_sung_qua_khu.duong_dan_file || item.bo_sung_qua_khu.ghi_chu_noi_bo || item.bo_sung_qua_khu.noi_dung_xac_minh
          ? [
              {
                url: item.bo_sung_qua_khu.duong_dan_file || "",
                type: item.bo_sung_qua_khu.loai_bang_chung,
                note: item.bo_sung_qua_khu.ghi_chu_noi_bo || item.bo_sung_qua_khu.noi_dung_xac_minh,
              },
            ]
          : [],
      });
    } else {
      events.push({
        id: `fee-${item.id}`,
        type: "OTHER",
        date: item.ngay_tao,
        amount: Number(item.so_tien),
        description: item.ghi_chu || "Ghi nhận đóng phí",
        period: item.ky_du_lieu,
        evidences: [],
      });
    }
  }

  for (const debt of debts) {
    events.push({
      id: `debt-${debt.id}`,
      type: "MONTHLY_CLOSING",
      date: debt.so_chot_thang.ngay_chot || debt.ngay_tao,
      amount: -Number(debt.so_tien_thang || 0), // Negative for fee obligation
      description: `Chốt sổ tháng - Cần thu: ${Number(
        debt.so_tien_thang || 0,
      ).toLocaleString("vi-VN")}đ - Số dư chuyển kỳ sau: ${Number(debt.so_du_chua_du_thang || 0).toLocaleString(
        "vi-VN",
      )}đ`,
      period: debt.so_chot_thang.ky_du_lieu,
      evidences: [],
    });
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Lọc bỏ những dòng giao dịch 0đ
  const filteredEvents = events.filter((e) => e.amount !== 0);

  return {
    apartment: {
      ma_can: canHo.ma_can,
      chu_ho: canHo.lien_he[0]?.ten_hien_thi || "Chưa có chủ hộ",
      dien_tich: Number(canHo.dien_tich_m2 || 0),
    },
    events: filteredEvents,
  };
}

export type GlobalSearchResult = {
  apartmentProfile: ApartmentFinancialProfile | null;
  transactions: any[];
  boSung: any[];
};

export async function searchGlobalFinancialData(keyword: string): Promise<GlobalSearchResult> {
  const sanitized = keyword.trim();
  if (!sanitized) {
    return { apartmentProfile: null, transactions: [], boSung: [] };
  }

  // 1. Parser căn hộ
  const parsed = parsePublicLookupInput(sanitized);
  let apartmentProfile: ApartmentFinancialProfile | null = null;
  
  if (parsed.ok && parsed.candidates.length > 0) {
    // Chỉ lấy hồ sơ của căn đầu tiên nhận diện được để tránh UI quá dài
    const profile = await getApartmentFinancialProfile(parsed.candidates[0]);
    if (profile) {
      apartmentProfile = profile;
    }
  }

  // 2. Tìm kiếm Giao dịch ngân hàng (tối đa 50 kết quả)
  const transactions = await prisma.giaoDichNganHang.findMany({
    where: {
      OR: [
        { noi_dung_goc: { contains: sanitized, mode: "insensitive" } },
        { ten_nguoi_chuyen: { contains: sanitized, mode: "insensitive" } },
        { tai_khoan_nguoi_chuyen: { contains: sanitized, mode: "insensitive" } },
      ],
    },
    include: {
      chung_tu_doi_soat: true,
    },
    orderBy: { ngay_giao_dich: "desc" },
    take: 50,
  });

  // 3. Tìm kiếm Giao dịch bổ sung (tối đa 50 kết quả)
  const boSung = await prisma.boSungGiaoDichQuaKhu.findMany({
    where: {
      OR: [
        { ghi_chu_noi_bo: { contains: sanitized, mode: "insensitive" } },
        { noi_dung_xac_minh: { contains: sanitized, mode: "insensitive" } },
      ],
    },
    include: { can_ho: true },
    orderBy: { ngay_tao: "desc" },
    take: 50,
  });

  return {
    apartmentProfile,
    transactions,
    boSung,
  };
}

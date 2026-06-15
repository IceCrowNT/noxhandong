import { prisma } from "@/src/modules/database";
import type { MonthlyReconciliationRow } from "@/src/modules/transactions/review/monthly-reconciliation-sort";

export async function getMonthlyReconciliation(from: Date, to: Date) {
  const transactions = await prisma.giaoDichNganHang.findMany({
    where: {
      so_tien: { gt: 0 },
      trang_thai_duyet: "DA_DUYET",
      ngay_giao_dich: { gte: from, lt: to },
      lich_su_dong_phi: {
        some: { loai_nguon: "GIAO_DICH_DA_DUYET" },
      },
    },
    orderBy: [{ ngay_giao_dich: "desc" }, { id: "desc" }],
    take: 1000,
    include: {
      lich_su_dong_phi: {
        where: { loai_nguon: "GIAO_DICH_DA_DUYET" },
        orderBy: { id: "asc" },
        include: {
          can_ho: { select: { ma_can: true } },
          phan_bo_giao_dich: { select: { cach_phan_bo: true } },
        },
      },
    },
  });

  const rows: MonthlyReconciliationRow[] = transactions.flatMap((transaction) =>
    transaction.lich_su_dong_phi.map((history) => ({
      id: history.id,
      transactionId: transaction.id,
      maCan: history.can_ho.ma_can,
      soTien: Number(history.so_tien || 0),
      ngayGiaoDich: transaction.ngay_giao_dich,
      nguoiChuyen:
        transaction.ten_nguoi_chuyen ||
        transaction.tai_khoan_nguoi_chuyen ||
        "-",
      thamChieu:
        transaction.tham_chieu_ngan_hang ||
        transaction.ma_giao_dich_text ||
        "-",
      daPublic: Boolean(history.batch_phi_public_id),
      cachPhanBo: history.phan_bo_giao_dich?.cach_phan_bo || null,
    })),
  );

  return {
    rows,
    transactionCount: transactions.length,
    apartmentCount: new Set(rows.map((row) => row.maCan)).size,
    totalAmount: rows.reduce((sum, row) => sum + row.soTien, 0),
    unpublishedCount: rows.filter((row) => !row.daPublic).length,
  };
}

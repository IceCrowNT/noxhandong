import { prisma } from "@/src/modules/database";
import type { MonthlyReconciliationRow } from "@/src/modules/transactions/review/monthly-reconciliation-sort";

export async function getMonthlyReconciliation(from: Date, to: Date) {
const transactions = await prisma.giaoDichNganHang.findMany({
    where: {
      so_tien: { gt: 0 },
      trang_thai_duyet: "DA_DUYET",
      ngay_giao_dich: { gte: from, lt: to },
      lich_su_dong_phi: {
        some: { loai_nguon: { in: ["GIAO_DICH_DA_DUYET", "BO_SUNG_QUA_KHU"] } },
      },
    },
    orderBy: [{ ngay_giao_dich: "desc" }, { id: "desc" }],
    take: 1000,
    include: {
      lich_su_dong_phi: {
        where: { loai_nguon: { in: ["GIAO_DICH_DA_DUYET", "BO_SUNG_QUA_KHU"] } },
        orderBy: { id: "asc" },
        include: {
          can_ho: { select: { ma_can: true } },
          phan_bo_giao_dich: { select: { cach_phan_bo: true } },
        },
      },
    },
  });

  const manualHistories = await prisma.lichSuDongPhiCanHo.findMany({
    where: {
      loai_nguon: "BO_SUNG_QUA_KHU",
      ngay_tao: { gte: from, lt: to },
    },
    orderBy: { ngay_tao: "desc" },
    include: {
      can_ho: { select: { ma_can: true } },
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

  const manualRows: MonthlyReconciliationRow[] = manualHistories.map((history) => ({
    id: history.id,
    transactionId: 0,
    maCan: history.can_ho.ma_can,
    soTien: Number(history.so_tien || 0),
    ngayGiaoDich: history.ngay_tao,
    nguoiChuyen: "Giao dịch bổ sung quá khứ",
    thamChieu: history.ghi_chu || "-",
    daPublic: Boolean(history.batch_phi_public_id),
    cachPhanBo: "CHINH_TAY",
  }));

  const allRows = [...rows, ...manualRows].sort((a, b) => (b.ngayGiaoDich?.getTime() || 0) - (a.ngayGiaoDich?.getTime() || 0));

  return {
    rows: allRows,
    transactionCount: transactions.length + manualHistories.length,
    apartmentCount: new Set(allRows.map((row) => row.maCan)).size,
    totalAmount: allRows.reduce((sum, row) => sum + row.soTien, 0),
    unpublishedCount: allRows.filter((row) => !row.daPublic).length,
  };
}

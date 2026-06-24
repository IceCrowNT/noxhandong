import Link from "next/link";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Copy, ShieldAlert, Upload } from "lucide-react";

import {
  prepareApprovedPaymentHistoryPublicBatchAction,
  publishPreparedPublicBatchAction,
} from "@/app/admin/import/actions";
import {
  approveMultiTransactionAction,
  approveTransactionAction,
  approveTransactionWithEvidenceAction,
  markTransactionNeedsEvidenceAction,
  rejectTransactionAction,
  reserveTransactionAction,
} from "@/app/admin/transactions/review/actions";
import { AdminFrame } from "@/components/admin/admin-frame";
import { MultiAllocationEditor } from "@/components/admin/multi-allocation-editor";
import { ReviewScrollMemory, ReviewTransactionList } from "@/components/admin/review-scroll-memory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import {
  adminRoleLabel,
  evidenceTypeLabel,
  transactionMatchStatusLabel,
  transactionReviewStatusLabel,
} from "@/src/modules/shared/labels";
import { formatVietnamDate, formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";
import { suggestTransactionAllocations } from "@/src/modules/transactions/review/allocations";
import { getMonthlyReconciliation } from "@/src/modules/transactions/review/monthly-reconciliation";
import {
  sortMonthlyReconciliationRows,
  type MonthlyReconciliationDirection,
  type MonthlyReconciliationSort,
} from "@/src/modules/transactions/review/monthly-reconciliation-sort";

type ReviewPageProps = {
  searchParams?: Promise<{
    transactionId?: string;
    status?: string;
    batchId?: string;
    from?: string;
    q?: string;
    approved?: string;
    approvedWithEvidence?: string;
    multiApproved?: string;
    needsEvidence?: string;
    reserved?: string;
    rejected?: string;
    error?: string;
    historyPreviewed?: string;
    historyPublished?: string;
    historyPreviewCancelled?: string;
    publicBatchId?: string;
    rows?: string;
    changedApartmentCount?: string;
    historyRowsLinked?: string;
    historyPublishError?: string;
    month?: string;
    monthSort?: string;
    monthDir?: string;
    showMonthly?: string;
  }>;
};

function formatDate(value: Date | null | undefined) {
  return formatVietnamDate(value);
}

function formatDateTime(value: Date | null | undefined) {
  return formatVietnamDateTime(value);
}

function formatMoney(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString("vi-VN") : "0";
}

function parseDateTimeFilter(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDefaultMonth() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  });
  return formatter.format(now);
}

function parseMonthFilter(value: string | undefined) {
  const normalized = typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : getDefaultMonth();
  const [yearRaw, monthRaw] = normalized.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const from = new Date(`${normalized}-01T00:00:00+07:00`);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const to = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+07:00`);
  return {
    value: normalized,
    label: `T${month}-${year}`,
    from,
    to,
  };
}

function getClosingCutoffFromMetadata(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const raw = (value as { chotDenThoiDiem?: unknown }).chotDenThoiDiem;
  if (typeof raw !== "string" || !raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function shortText(value: string | null | undefined, max = 96) {
  if (!value) return "-";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function confidenceQuality(value: unknown) {
  const score = Number(value || 0);
  if (score >= 0.9 || score >= 90) return { label: "Rất chắc", tone: "success" as const };
  if (score >= 0.7 || score >= 70) return { label: "Khá chắc", tone: "secondary" as const };
  if (score >= 0.3 || score >= 30) return { label: "Cần kiểm tra", tone: "warning" as const };
  return { label: "Không đủ dữ liệu", tone: "destructive" as const };
}

function statusTone(status?: string | null) {
  if (status === "DA_DUYET" || status === "KHOP_TRUC_TIEP" || status === "KHOP_SAU_CHUAN_HOA") return "success";
  if (status === "TU_CHOI" || status === "KHONG_LIEN_QUAN_CAN_HO") return "destructive";
  if (status === "NHIEU_CAN" || status === "DA_RA_SOAT" || status === "BAO_LUU") return "warning";
  return "secondary";
}

function getParseInfo(transaction: {
  phien_ban_parser?: string | null;
  ma_can_parse?: string | null;
  trang_thai_khop?: string | null;
  ly_do_khop?: string | null;
  do_tin_cay?: unknown;
  ung_vien_khop?: Array<{ ma_can: string; diem: unknown; ly_do: string; thu_hang: number }>;
}) {
  return {
    phien_ban_parser: transaction.phien_ban_parser || null,
    ma_can_parse: transaction.ma_can_parse || null,
    trang_thai_khop: transaction.trang_thai_khop || null,
    ly_do_khop: transaction.ly_do_khop || null,
    do_tin_cay: transaction.do_tin_cay ?? null,
    ung_vien_khop: transaction.ung_vien_khop || [],
  };
}

function getLatestReview(transaction: {
  trang_thai_duyet?: string | null;
  ma_can_duoc_chon?: string | null;
  ghi_chu_duyet?: string | null;
  nguoi_duyet?: string | null;
  ngay_duyet?: Date | null;
}) {
  return transaction.trang_thai_duyet
    ? {
        id: 0,
        trang_thai_duyet: transaction.trang_thai_duyet,
        ma_can_duoc_chon: transaction.ma_can_duoc_chon || null,
        ghi_chu_duyet: transaction.ghi_chu_duyet || null,
        nguoi_duyet: transaction.nguoi_duyet || null,
        ngay_duyet: transaction.ngay_duyet || null,
      }
    : null;
}

function getParserConflict(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const conflict = (payload as Record<string, unknown>).parserConflict;
  if (!conflict || typeof conflict !== "object") return null;
  const value = conflict as Record<string, unknown>;
  return {
    previousApartmentCode:
      typeof value.previousApartmentCode === "string" ? value.previousApartmentCode : "-",
    suggestedApartmentCode:
      typeof value.suggestedApartmentCode === "string" ? value.suggestedApartmentCode : "-",
  };
}

function notice(params: Awaited<ReviewPageProps["searchParams"]>) {
  if (params?.historyPublished === "1") {
    return `Đã chốt public batch #${params.publicBatchId || "-"} từ lịch sử phí đã duyệt: ${params.rows || "0"} căn, ${params.historyRowsLinked || "0"} dòng lịch sử đã gắn vào batch.`;
  }
  if (params?.historyPreviewed === "1") {
    return `Đã tạo preview batch #${params.publicBatchId || "-"}: ${params.rows || "0"} căn, ${params.changedApartmentCount || "0"} căn có thay đổi. Dữ liệu chưa công khai.`;
  }
  if (params?.historyPreviewCancelled === "1") return "Đã hủy preview batch nháp.";
  if (params?.historyPublishError === "invalid_period") return "Kỳ dữ liệu cần dùng định dạng T6-2026.";
  if (params?.historyPublishError === "invalid_batch") return "Batch public cần chốt không hợp lệ.";
  if (params?.historyPublishError === "preview_failed") return "Không tạo được preview batch public từ lịch sử phí đã duyệt.";
  if (params?.historyPublishError === "publish_failed") return "Không chốt được batch public từ lịch sử phí đã duyệt.";
  if (params?.historyPublishError === "cancel_failed") return "Không hủy được preview batch nháp.";
  if (params?.approved === "1") return "Đã duyệt giao dịch và ghi lịch sử phí.";
  if (params?.approvedWithEvidence === "1") return "Đã duyệt giao dịch, lưu bằng chứng và ghi lịch sử phí.";
  if (params?.multiApproved === "1") return "Đã duyệt giao dịch, phân bổ nhiều căn và ghi lịch sử phí.";
  if (params?.needsEvidence === "1") return "Đã đánh dấu giao dịch cần bổ sung bằng chứng.";
  if (params?.reserved === "1") return "Đã chuyển giao dịch sang danh sách bảo lưu.";
  if (params?.rejected === "1") return "Đã đánh dấu giao dịch không liên quan/từ chối.";
  if (params?.error === "invalid_apartment") return "Mã căn không hợp lệ hoặc không tồn tại.";
  if (params?.error === "invalid_allocation") return "Phân bổ nhiều căn cần ít nhất 2 căn hợp lệ.";
  if (params?.error === "duplicate_allocation") return "Danh sách phân bổ có mã căn bị trùng.";
  if (params?.error === "allocation_sum_mismatch") return "Tổng tiền phân bổ phải bằng đúng số tiền giao dịch.";
  if (params?.error === "already_public") return "Giao dịch này đã được đưa vào batch public, không sửa trực tiếp tại màn duyệt.";
  if (params?.error === "already_reviewed") return "Giao dịch đã hoàn tất xử lý. Hệ thống đã chặn thao tác lặp.";
  if (params?.error === "evidence_too_large") return "File bằng chứng quá lớn. Giới hạn hiện tại 8 MB.";
  if (params?.error) return "Không xử lý được thao tác. Kiểm tra lại dữ liệu nhập.";
  return null;
}

export default async function TransactionReviewPage({ searchParams }: ReviewPageProps) {
  const account = await requireAdmin();
  const params = await searchParams;
  const canReview = account.vai_tro === "SUPER_ADMIN";
  const showReserveUi = false;
  const selectedId = Number(params?.transactionId || 0);
  const statusFilter = params?.status || "CAN_XU_LY";
  const requestedBatchId = Number(params?.batchId || 0);
  const q = (params?.q || "").trim();
  const monthFilter = parseMonthFilter(params?.month);
  const showMonthlyPanel = params?.showMonthly === "1";
  const monthlySortOptions: MonthlyReconciliationSort[] = ["apartment", "amount", "payer", "date", "status"];
  const monthlySort: MonthlyReconciliationSort = monthlySortOptions.includes(params?.monthSort as MonthlyReconciliationSort)
    ? (params?.monthSort as MonthlyReconciliationSort)
    : "date";
  const monthlyDirection: MonthlyReconciliationDirection =
    params?.monthDir === "asc" || params?.monthDir === "desc"
      ? params.monthDir
      : monthlySort === "date"
        ? "desc"
        : "asc";
  const message = notice(params);

  const [statementBatches, latestClosings, pendingApprovedPayments] = await Promise.all([
    prisma.loNhapDuLieu.findMany({
      where: { loai_nguon: "SAO_KE_NGAN_HANG" },
      orderBy: { id: "desc" },
      take: 12,
      select: {
        id: true,
        ten_file: true,
        so_dong: true,
        thoi_diem_nhap: true,
        _count: { select: { giao_dich_ngan_hang: true } },
      },
    }),
    prisma.soChotThang.findMany({
      where: { trang_thai: "DA_CHOT" },
      orderBy: { id: "desc" },
      take: 20,
      select: { id: true, ky_du_lieu: true, metadata_json: true },
    }),
    prisma.lichSuDongPhiCanHo.count({
      where: {
        loai_nguon: "GIAO_DICH_DA_DUYET",
        batch_phi_public_id: null,
      },
    }),
  ]);
  const latestClosing = latestClosings.find((closing) => getClosingCutoffFromMetadata(closing.metadata_json));
  const importBatchesWithTransactions = statementBatches.filter((batch) => batch._count.giao_dich_ngan_hang > 0);
  const requestedBatch = statementBatches.find((batch) => batch.id === requestedBatchId) || null;
  const selectedBatch =
    requestedBatch && requestedBatch._count.giao_dich_ngan_hang > 0 ? requestedBatch : null;
  const defaultFrom = getClosingCutoffFromMetadata(latestClosing?.metadata_json);
  const from = typeof params?.from === "string" ? params.from.trim() : defaultFrom;
  const fromDate = parseDateTimeFilter(from);

  const where: Record<string, unknown> = {
    so_tien: { gt: 0 },
  };

  if (selectedBatch) {
    where.lo_nhap_du_lieu_id = selectedBatch.id;
  }

  if (fromDate) {
    where.ngay_giao_dich = { gt: fromDate };
  }

  if (q) {
    where.OR = [
      { noi_dung_goc: { contains: q, mode: "insensitive" } },
      { ten_nguoi_chuyen: { contains: q, mode: "insensitive" } },
      { tham_chieu_ngan_hang: { contains: q, mode: "insensitive" } },
      { ma_giao_dich_text: { contains: q, mode: "insensitive" } },
      { ma_can_parse: { contains: q, mode: "insensitive" } },
      { ma_can_duoc_chon: { contains: q, mode: "insensitive" } },
      { ung_vien_khop: { some: { ma_can: { contains: q, mode: "insensitive" } } } },
      {
        phan_bo_giao_dich: {
          some: { can_ho: { ma_can: { contains: q, mode: "insensitive" } } },
        },
      },
    ];
  }

  if (statusFilter !== "TAT_CA" && statusFilter !== "CAN_XU_LY") {
    where.trang_thai_duyet = statusFilter;
  }

  const [summary, transactions, monthlyReconciliation] = await Promise.all([
    prisma.giaoDichNganHang.groupBy({
      by: ["trang_thai_duyet"],
      _count: { _all: true },
      where: {
        so_tien: { gt: 0 },
        ...(selectedBatch ? { lo_nhap_du_lieu_id: selectedBatch.id } : {}),
        ...(fromDate ? { ngay_giao_dich: { gt: fromDate } } : {}),
      },
    }),
    prisma.giaoDichNganHang.findMany({
      where,
      orderBy: [{ ngay_giao_dich: "desc" }, { id: "desc" }],
      take: 120,
      include: {
        lo_nhap_du_lieu: { select: { id: true, ten_file: true, thoi_diem_nhap: true } },
        ung_vien_khop: { orderBy: { thu_hang: "asc" } },
        phan_bo_giao_dich: { include: { can_ho: { select: { ma_can: true } } } },
        chung_tu_doi_soat: { orderBy: { id: "desc" }, take: 5 },
      },
    }),
    getMonthlyReconciliation(monthFilter.from, monthFilter.to),
  ]);

  const visibleTransactions =
    statusFilter === "CAN_XU_LY"
      ? transactions.filter((transaction) => {
          const latest = getLatestReview(transaction);
          return !latest || latest.trang_thai_duyet === "CHUA_DUYET" || latest.trang_thai_duyet === "DA_RA_SOAT";
        })
      : transactions;

  const selected =
    visibleTransactions.find((item) => item.id === selectedId) ||
    (statusFilter !== "CAN_XU_LY" ? transactions.find((item) => item.id === selectedId) : null) ||
    visibleTransactions[0] ||
    (statusFilter !== "CAN_XU_LY" ? transactions[0] : null) ||
    null;

  const candidateCodes = Array.from(
    new Set(
      [
        selected ? getParseInfo(selected).ma_can_parse : null,
        ...(getLatestReview(selected || ({} as never))
          ?.ma_can_duoc_chon?.split(",")
          .map((code) => code.trim())
          .filter(Boolean) || []),
        ...(selected ? getParseInfo(selected).ung_vien_khop.map((candidate) => candidate.ma_can) : []),
        ...(selected?.phan_bo_giao_dich.map((allocation) => allocation.can_ho.ma_can) || []),
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  const feeEffectiveAt = selected?.ngay_giao_dich || new Date();
  const [candidateApartments, candidateContacts, activeFeeRules] = await Promise.all([
    candidateCodes.length
      ? prisma.canHo.findMany({
          where: { ma_can: { in: candidateCodes } },
          include: {
            lien_he: {
              orderBy: [{ la_lien_he_chinh: "desc" }, { thu_tu_uu_tien: "asc" }],
              take: 3,
            },
          },
        })
      : Promise.resolve([]),
    candidateCodes.length
      ? prisma.ungVienLienHeCanHo.findMany({
          where: { ma_can: { in: candidateCodes } },
          orderBy: [{ trang_thai_duyet: "asc" }, { id: "asc" }],
          take: 40,
          select: {
            ma_can: true,
            ten_hien_thi_parse: true,
            so_dien_thoai_parse: true,
            ten_chu_ho_goc: true,
            so_dien_thoai_goc: true,
            trang_thai_duyet: true,
          },
        })
      : Promise.resolve([]),
    prisma.quyTacPhi.findMany({
      where: {
        ma_phi: "QLVH",
        dang_ap_dung: true,
        hieu_luc_tu_ngay: { lte: feeEffectiveAt },
        OR: [{ hieu_luc_den_ngay: null }, { hieu_luc_den_ngay: { gte: feeEffectiveAt } }],
      },
      orderBy: { hieu_luc_tu_ngay: "desc" },
      select: { loai_can: true, so_tien: true },
    }),
  ]);

  const contactByApartment = new Map<string, typeof candidateContacts>();
  for (const contact of candidateContacts) {
    if (!contact.ma_can) continue;
    contactByApartment.set(contact.ma_can, [...(contactByApartment.get(contact.ma_can) || []), contact]);
  }

  const selectedReview = selected ? getLatestReview(selected) : null;
  const selectedParserConflict = selected ? getParserConflict(selected.payload_goc_json) : null;
  const canActOnSelected =
    canReview &&
    Boolean(selected) &&
    selected?.trang_thai_duyet !== "DA_DUYET" &&
    selected?.trang_thai_duyet !== "BAO_LUU" &&
    selected?.trang_thai_duyet !== "TU_CHOI";
  const selectedParse = selected ? getParseInfo(selected) : null;
  const selectedQuality = selectedParse?.trang_thai_khop
    ? confidenceQuality(selectedParse.do_tin_cay)
    : { label: "Không đủ dữ liệu", tone: "destructive" as const };
  const feeByApartmentType = new Map<string, number>();
  for (const rule of activeFeeRules) {
    if (!feeByApartmentType.has(rule.loai_can)) {
      feeByApartmentType.set(rule.loai_can, Number(rule.so_tien));
    }
  }
  const feeByApartmentCode = new Map(
    candidateApartments.flatMap((apartment) => {
      const fee = feeByApartmentType.get(apartment.loai_can);
      return fee ? [[apartment.ma_can, fee] as const] : [];
    }),
  );
  const allocationSuggestions = selected
    ? suggestTransactionAllocations(candidateCodes, Number(selected.so_tien), feeByApartmentCode)
    : [];

  const summaryMap = new Map(summary.map((item) => [item.trang_thai_duyet, item._count._all]));
  const summaryItems = [
    ["Chưa duyệt", summaryMap.get("CHUA_DUYET") || 0],
    ["Đã rà soát", summaryMap.get("DA_RA_SOAT") || 0],
    ["Đã duyệt", summaryMap.get("DA_DUYET") || 0],
    ["Từ chối", summaryMap.get("TU_CHOI") || 0],
  ] as const;

  const monthlyRows = monthlyReconciliation.rows;
  const monthlyApartmentCount = monthlyReconciliation.apartmentCount;
  const monthlyTotalAmount = monthlyReconciliation.totalAmount;
  const monthlyUnpublishedCount = monthlyReconciliation.unpublishedCount;
  const monthlyVisibleRows = sortMonthlyReconciliationRows(monthlyRows, monthlySort, monthlyDirection);
  const reviewQuery = new URLSearchParams({
    batchId: selectedBatch ? String(selectedBatch.id) : "",
    status: statusFilter,
    from,
    q,
    month: monthFilter.value,
    monthSort: monthlySort,
    monthDir: monthlyDirection,
  });
  if (showMonthlyPanel) {
    reviewQuery.set("showMonthly", "1");
  }
  const selectedIndex = visibleTransactions.findIndex((transaction) => transaction.id === selected?.id);
  const nextTransaction =
    visibleTransactions[selectedIndex + 1] ||
    visibleTransactions.find((transaction) => transaction.id !== selected?.id) ||
    null;
  if (nextTransaction) {
    reviewQuery.set("transactionId", String(nextTransaction.id));
  } else {
    reviewQuery.delete("transactionId");
  }
  const returnToAfterAction = `/admin/transactions/review?${reviewQuery.toString()}`;
  const monthlySortHref = (sort: MonthlyReconciliationSort) => {
    const query = new URLSearchParams({
      transactionId: selected?.id ? String(selected.id) : "",
      batchId: selectedBatch?.id ? String(selectedBatch.id) : "",
      status: statusFilter,
      from,
      q,
      month: monthFilter.value,
      monthSort: sort,
      showMonthly: "1",
      monthDir:
        monthlySort === sort
          ? monthlyDirection === "asc"
            ? "desc"
            : "asc"
          : sort === "date"
            ? "desc"
            : "asc",
    });
    return `/admin/transactions/review?${query.toString()}`;
  };
  const monthlySortIcon = (sort: MonthlyReconciliationSort) =>
    monthlySort !== sort ? (
      <ArrowUpDown size={13} aria-hidden="true" />
    ) : monthlyDirection === "asc" ? (
      <ArrowUp size={13} aria-hidden="true" />
    ) : (
      <ArrowDown size={13} aria-hidden="true" />
    );

  return (
    <AdminFrame
      activeKey="transactions"
      badge={adminRoleLabel(account.vai_tro)}
      title="Duyệt sao kê"
      description="Màn hình PC-first để rà soát giao dịch mới, chọn căn hộ và lưu bằng chứng khi cần."
      headerActions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/import">Nhập sao kê</Link>
        </Button>
      }
    >
      <ReviewScrollMemory />
      {message ? (
        <Notice tone={params?.error ? "error" : "success"}>{message}</Notice>
      ) : null}

      <form className="mb-4 grid gap-3 rounded-xl border border-[var(--line)] bg-white/90 p-3 xl:grid-cols-[minmax(240px,0.8fr)_minmax(420px,1.2fr)_auto] xl:items-center">
        <div className="min-w-0 text-sm leading-6 text-[var(--muted)]">
          <div className="font-semibold text-[var(--text)]">Giao dịch cần duyệt</div>
          <div className="truncate">
            {selectedBatch
              ? `Lô #${selectedBatch.id} · ${selectedBatch._count.giao_dich_ngan_hang.toLocaleString("vi-VN")} giao dịch thu`
              : `${importBatchesWithTransactions.length.toLocaleString("vi-VN")} lô · tất cả giao dịch sau mốc chốt`}
          </div>
          {fromDate ? (
            <div className="truncate">
              Sau {formatDateTime(fromDate)}{latestClosing ? ` · sổ #${latestClosing.id} ${latestClosing.ky_du_lieu}` : ""}
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 md:grid-cols-[170px_minmax(260px,1fr)_auto]">
          <input type="hidden" name="month" value={monthFilter.value} />
          <input type="hidden" name="monthSort" value={monthlySort} />
          <input type="hidden" name="monthDir" value={monthlyDirection} />
          {showMonthlyPanel ? <input type="hidden" name="showMonthly" value="1" /> : null}
          <Select name="status" defaultValue={showReserveUi || statusFilter !== "BAO_LUU" ? statusFilter : "CAN_XU_LY"}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CAN_XU_LY">Cần xử lý</SelectItem>
              <SelectItem value="CHUA_DUYET">Chưa duyệt</SelectItem>
              <SelectItem value="DA_RA_SOAT">Đã rà soát</SelectItem>
              <SelectItem value="DA_DUYET">Đã duyệt</SelectItem>
              {showReserveUi ? <SelectItem value="BAO_LUU">Bảo lưu</SelectItem> : null}
              <SelectItem value="TU_CHOI">Từ chối</SelectItem>
              <SelectItem value="TAT_CA">Tất cả</SelectItem>
            </SelectContent>
          </Select>
          <Input
            name="q"
            defaultValue={q}
            placeholder="Tìm mã căn, nội dung, người chuyển, tham chiếu..."
          />
          <SubmitButton pendingText="Đang lọc...">Lọc</SubmitButton>
        </div>

        <div className="flex flex-wrap gap-2 2xl:justify-end">
          {summaryItems.map(([label, value]) => (
            <span key={label} className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
              {label}: <b className="text-[var(--text)]">{formatMoney(value)}</b>
            </span>
          ))}
        </div>
        <details className="rounded-lg border border-dashed border-[var(--line)] bg-white/70 p-3 xl:col-span-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--muted)]">
            Lọc nâng cao khi cần mở lại lô cũ hoặc kiểm tra mốc chốt
          </summary>
          <div className="mt-3 grid gap-2 md:grid-cols-[minmax(220px,1fr)_220px_auto]">
            <Select name="batchId" defaultValue={selectedBatch ? String(selectedBatch.id) : "0"}>
              <SelectTrigger>
                <SelectValue placeholder="Lô sao kê" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Tất cả giao dịch sau mốc chốt</SelectItem>
                {statementBatches.length
                  ? statementBatches.map((batch) => (
                    <SelectItem key={batch.id} value={String(batch.id)}>
                      #{batch.id} · {formatDateTime(batch.thoi_diem_nhap)}
                    </SelectItem>
                  ))
                  : null}
              </SelectContent>
            </Select>
            <Input name="from" type="datetime-local" defaultValue={from} title="Chỉ hiện giao dịch từ thời điểm này" />
            <SubmitButton variant="secondary" pendingText="Đang lọc...">Áp dụng nâng cao</SubmitButton>
          </div>
        </details>
      </form>

      <details open={showMonthlyPanel} className="mb-4 rounded-xl border border-[var(--line)] bg-white/90">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-6 py-4">
          <span>
            <span className="block text-lg font-semibold">Đối soát theo tháng</span>
            <span className="mt-1 block text-sm text-[var(--muted)]">
              Dùng khi cần tổng hợp tháng hoặc so sánh với bảng theo dõi thu phí.
            </span>
          </span>
          <span className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
            {monthFilter.label} · {monthlyApartmentCount.toLocaleString("vi-VN")} căn
          </span>
        </summary>
        <div className="border-t border-[var(--line)]">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle className="text-lg">Đối soát theo tháng</CardTitle>
              <CardDescription>
                Lọc các căn đã có giao dịch được duyệt trong tháng để so sánh với sao kê hoặc bảng theo dõi thu phí.
              </CardDescription>
            </div>
            <form className="flex w-full gap-2 sm:w-auto">
              <input type="hidden" name="transactionId" value={selected?.id || ""} />
              <input type="hidden" name="batchId" value={selectedBatch?.id || ""} />
              <input type="hidden" name="status" value={statusFilter} />
              <input type="hidden" name="from" value={from} />
              <input type="hidden" name="q" value={q} />
              <input type="hidden" name="monthSort" value={monthlySort} />
              <input type="hidden" name="monthDir" value={monthlyDirection} />
              <input type="hidden" name="showMonthly" value="1" />
              <Input className="w-full sm:w-[170px]" name="month" type="month" defaultValue={monthFilter.value} />
              <SubmitButton variant="secondary" pendingText="Đang lọc...">Xem tháng</SubmitButton>
            </form>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid items-stretch gap-3 md:grid-cols-4">
            <div className="flex h-full min-h-[96px] flex-col justify-between rounded-lg border border-[var(--line)] bg-white p-3">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Kỳ đang xem</span>
              <strong className="mt-1 block text-xl">{monthFilter.label}</strong>
            </div>
            <div className="flex h-full min-h-[96px] flex-col justify-between rounded-lg border border-[var(--line)] bg-white p-3">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Căn khác nhau đã ghi nhận</span>
              <strong className="mt-1 block text-xl">{monthlyApartmentCount.toLocaleString("vi-VN")}</strong>
              <span className="text-xs text-[var(--muted)]">
                {monthlyRows.length.toLocaleString("vi-VN")} dòng phí từ {monthlyReconciliation.transactionCount.toLocaleString("vi-VN")} giao dịch
              </span>
            </div>
            <div className="flex h-full min-h-[96px] flex-col justify-between rounded-lg border border-[var(--line)] bg-white p-3">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Tổng tiền đã duyệt</span>
              <strong className="mt-1 block text-xl">{formatMoney(monthlyTotalAmount)}</strong>
            </div>
            <div className="flex h-full min-h-[96px] flex-col justify-between rounded-lg border border-[var(--line)] bg-white p-3">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Chưa public</span>
              <strong className="mt-1 block text-xl">{monthlyUnpublishedCount.toLocaleString("vi-VN")}</strong>
            </div>
          </div>

          <div
            data-testid="monthly-reconciliation-scroll"
            className="max-h-[480px] overflow-auto rounded-xl border border-[var(--line)] bg-white"
          >
            <div className="min-w-[820px]">
              <div className="sticky top-0 z-10 grid grid-cols-[110px_120px_minmax(0,1fr)_140px_120px] gap-3 border-b border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)] shadow-sm">
                <Link className="flex items-center gap-1 hover:text-[var(--accent)]" href={monthlySortHref("apartment")} scroll={false}>
                  Căn {monthlySortIcon("apartment")}
                </Link>
                <Link className="flex items-center gap-1 hover:text-[var(--accent)]" href={monthlySortHref("amount")} scroll={false}>
                  Số tiền {monthlySortIcon("amount")}
                </Link>
                <Link className="flex items-center gap-1 hover:text-[var(--accent)]" href={monthlySortHref("payer")} scroll={false}>
                  Người chuyển / tham chiếu {monthlySortIcon("payer")}
                </Link>
                <Link className="flex items-center gap-1 hover:text-[var(--accent)]" href={monthlySortHref("date")} scroll={false}>
                  Ngày {monthlySortIcon("date")}
                </Link>
                <Link className="flex items-center gap-1 hover:text-[var(--accent)]" href={monthlySortHref("status")} scroll={false}>
                  Trạng thái {monthlySortIcon("status")}
                </Link>
              </div>
              {monthlyVisibleRows.length ? (
                monthlyVisibleRows.map((row) => (
                  <Link
                    key={row.id}
                    href={`/admin/transactions/review?transactionId=${row.transactionId}&month=${monthFilter.value}&monthSort=${monthlySort}&monthDir=${monthlyDirection}&showMonthly=1&batchId=${selectedBatch?.id || ""}&status=${statusFilter}&from=${encodeURIComponent(from)}&q=${encodeURIComponent(q)}`}
                    scroll={false}
                    className="grid grid-cols-[110px_120px_minmax(0,1fr)_140px_120px] gap-3 border-b border-[var(--line)] px-3 py-2 text-sm last:border-b-0 hover:bg-[var(--accent-soft)]"
                  >
                    <span className="font-semibold">{row.maCan}</span>
                    <span>{formatMoney(row.soTien)}</span>
                    <span className="min-w-0 truncate">
                      {row.nguoiChuyen} · {row.thamChieu}
                    </span>
                    <span>{formatDate(row.ngayGiaoDich)}</span>
                    <span>
                      <Badge variant={row.daPublic ? "success" : "secondary"}>{row.daPublic ? "Đã public" : "Chưa public"}</Badge>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-[var(--muted)]">
                  Chưa có lịch sử phí được duyệt trong {monthFilter.label}. Hãy duyệt sao kê trước, sau đó quay lại lọc tháng.
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Hiển thị toàn bộ {monthlyRows.length.toLocaleString("vi-VN")} dòng trong khung cuộn. Bấm tiêu đề cột để đổi thứ tự.
          </p>
        </CardContent>
        </div>
      </details>

      {canReview ? (
        <Card className="mb-4 bg-white/90">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Công khai dữ liệu sau duyệt</CardTitle>
            <CardDescription>
              Dùng cuối kỳ sau khi đã duyệt xong sao kê. Hệ thống tạo preview trước, cư dân chỉ thấy dữ liệu mới sau khi xác nhận public.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)_auto] xl:items-end">
            <div className="rounded-lg border border-[var(--line)] bg-white p-3">
              <span className="text-xs font-semibold uppercase text-[var(--muted)]">Chờ công khai</span>
              <strong className="mt-1 block text-2xl">{pendingApprovedPayments.toLocaleString("vi-VN")}</strong>
              <span className="text-sm text-[var(--muted)]">dòng lịch sử phí đã duyệt</span>
            </div>

            {params?.historyPreviewed === "1" && params.publicBatchId ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
                <strong className="block text-emerald-950">Preview batch #{params.publicBatchId} đã sẵn sàng</strong>
                Snapshot có {params.rows || "0"} căn, {params.changedApartmentCount || "0"} căn thay đổi.
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <a href={`/admin/import/public-preview?batchId=${params.publicBatchId}`}>Xem preview</a>
                  </Button>
                  <form action={publishPreparedPublicBatchAction}>
                    <input type="hidden" name="publicBatchId" value={params.publicBatchId} />
                    <SubmitButton size="sm" pendingText="Đang chốt...">
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Xác nhận public
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ) : (
              <form action={prepareApprovedPaymentHistoryPublicBatchAction} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-end">
                <Label className="grid gap-2">
                  Kỳ dữ liệu
                  <Input name="period" defaultValue="T6-2026" maxLength={16} placeholder="T6-2026" />
                </Label>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                  Tạo preview trước để kiểm tra thay đổi từng căn. Chưa public ngay.
                </div>
                <SubmitButton pendingText="Đang tạo preview...">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Tạo preview
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      ) : null}

      {!selected ? (
        <Card className="bg-white/90">
          <CardContent className="p-6 text-sm text-[var(--muted)]">
            {statusFilter === "CAN_XU_LY"
              ? "Không còn giao dịch cần xử lý trong bộ lọc hiện tại."
              : "Chưa có giao dịch sao kê phù hợp với bộ lọc hiện tại."}
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)_360px]">
          <Card className="bg-white/90 lg:sticky lg:top-20 lg:self-start">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Danh sách giao dịch</CardTitle>
              <CardDescription>{visibleTransactions.length} giao dịch trong bộ lọc hiện tại.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewTransactionList>
              {visibleTransactions.map((transaction) => {
                const latest = getLatestReview(transaction);
                const parseInfo = getParseInfo(transaction);
                const active = transaction.id === selected.id;
                return (
                  <Link
                    key={transaction.id}
                    data-testid={`review-transaction-${transaction.id}`}
                    href={`/admin/transactions/review?transactionId=${transaction.id}&month=${monthFilter.value}&monthSort=${monthlySort}&monthDir=${monthlyDirection}${showMonthlyPanel ? "&showMonthly=1" : ""}&batchId=${selectedBatch?.id || ""}&status=${statusFilter}&from=${encodeURIComponent(from)}&q=${encodeURIComponent(q)}`}
                    scroll={false}
                    className={
                      active
                        ? "block rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-3"
                        : "block rounded-xl border border-[var(--line)] bg-white p-3 hover:border-[var(--accent)]"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{formatDate(transaction.ngay_giao_dich)}</div>
                        <div className="mt-1 text-lg font-bold">{formatMoney(transaction.so_tien)}</div>
                      </div>
                      <Badge variant={statusTone(latest?.trang_thai_duyet) as never}>
                        {transactionReviewStatusLabel(latest?.trang_thai_duyet)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant={statusTone(parseInfo.trang_thai_khop) as never}>
                        {transactionMatchStatusLabel(parseInfo.trang_thai_khop)}
                      </Badge>
                      {parseInfo.ma_can_parse ? (
                        <Badge variant="outline">{parseInfo.ma_can_parse}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 truncate text-sm text-[var(--muted)]">{transaction.ten_nguoi_chuyen || transaction.tai_khoan_nguoi_chuyen || "Không rõ người chuyển"}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{transaction.noi_dung_goc}</p>
                  </Link>
                );
              })}
              </ReviewTransactionList>
            </CardContent>
          </Card>

          <div className="grid min-w-0 gap-4">
            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Giao dịch #{selected.id}</CardTitle>
                    <CardDescription>{selected.lo_nhap_du_lieu.ten_file}</CardDescription>
                  </div>
                  <Badge variant={selectedQuality.tone}>{selectedQuality.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {selectedParserConflict ? (
                  <Notice tone="warning">
                    Parser hiện tại gợi ý {selectedParserConflict.suggestedApartmentCode}, khác với kết quả đã lưu{" "}
                    {selectedParserConflict.previousApartmentCode}. Hệ thống giữ nguyên quyết định cũ để tránh tự
                    thay đổi dữ liệu đã rà soát.
                  </Notice>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                  <Info label="Số tiền" value={formatMoney(selected.so_tien)} strong />
                  <Info label="Ngày giao dịch" value={formatDateTime(selected.ngay_giao_dich)} />
                  <Info label="Người chuyển" value={selected.ten_nguoi_chuyen || "-"} />
                  <Info label="Tài khoản/SĐT" value={selected.tai_khoan_nguoi_chuyen || "-"} />
                  <Info label="Mã tham chiếu" value={selected.tham_chieu_ngan_hang || selected.ma_giao_dich_text || "-"} breakAll />
                  <Info label="Lô import" value={`#${selected.lo_nhap_du_lieu.id} · ${formatDateTime(selected.lo_nhap_du_lieu.thoi_diem_nhap)}`} />
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold">Nội dung chuyển khoản gốc</h2>
                    <Copy size={16} className="text-[var(--muted)]" aria-hidden="true" />
                  </div>
                  <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text)]">
                    {selected.noi_dung_goc}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <h2 className="text-sm font-semibold">Kết quả parser</h2>
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                    <Info label="Trạng thái" value={transactionMatchStatusLabel(selectedParse?.trang_thai_khop)} />
                    <Info label="Mã căn parser" value={selectedParse?.ma_can_parse || "Chưa nhận diện chắc"} />
                    <Info label="Độ tin cậy" value={String(selectedParse?.do_tin_cay ?? "-")} />
                    <div className="md:col-span-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Lý do</div>
                      <p className="mt-1 whitespace-pre-wrap break-words leading-6">{selectedParse?.ly_do_khop || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold">Gợi ý căn hộ</h2>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                        Đối chiếu parser, chủ hộ và dữ liệu Excel trước khi duyệt.
                      </p>
                    </div>
                    <Badge variant={candidateApartments.length ? "secondary" : "destructive"}>
                      {candidateApartments.length ? `${candidateApartments.length} ứng viên` : "Không có gợi ý"}
                    </Badge>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {candidateApartments.length ? (
                      candidateApartments.map((apartment) => {
                        const parserCandidate = selectedParse?.ung_vien_khop.find((item) => item.ma_can === apartment.ma_can);
                        const firstContact = apartment.lien_he[0];
                        const excelContact = contactByApartment.get(apartment.ma_can)?.[0];
                        return (
                          <div key={apartment.id} className="rounded-lg border border-[var(--line)] bg-white p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <strong className="text-base">{apartment.ma_can}</strong>
                                <p className="truncate text-sm text-[var(--muted)]">
                                  {apartment.chu_ho_ten_goc || firstContact?.ten_hien_thi || excelContact?.ten_hien_thi_parse || "-"}
                                </p>
                              </div>
                              <Badge variant={Number(parserCandidate?.diem || 0) >= 70 ? "success" : "warning"}>
                                {parserCandidate ? `${parserCandidate.diem}/100` : "Đã chọn"}
                              </Badge>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                              {parserCandidate?.ly_do || "Căn đã được chọn/đã phân bổ trước đó."}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-lg border border-dashed border-[var(--line)] p-3 text-sm text-[var(--muted)] md:col-span-2">
                        Không có căn gợi ý. Cần nhập tay mã căn hoặc duyệt kèm bằng chứng.
                      </div>
                    )}
                  </div>
                </div>

                <Card className="bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Bằng chứng đã lưu</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {selected.chung_tu_doi_soat.length ? (
                      selected.chung_tu_doi_soat.map((evidence) => (
                        <div key={evidence.id} className="rounded-lg border border-[var(--line)] p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <strong>{evidenceTypeLabel(evidence.loai_chung_tu)}</strong>
                            <span className="text-xs text-[var(--muted)]">{formatDateTime(evidence.ngay_tao)}</span>
                          </div>
                          <p className="mt-1 text-[var(--muted)]">{evidence.ghi_chu || "Không có ghi chú."}</p>
                          {evidence.duong_dan_file ? (
                            <a className="mt-2 inline-block text-sm font-semibold text-[var(--accent)] underline" href={evidence.duong_dan_file} target="_blank">
                              Mở file bằng chứng
                            </a>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--muted)]">Chưa có bằng chứng.</p>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-w-0 gap-4 lg:col-start-2 2xl:col-start-auto 2xl:sticky 2xl:top-20 2xl:self-start">
            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle>Thao tác duyệt</CardTitle>
                <CardDescription>
                  {canActOnSelected
                    ? "Chọn thao tác phù hợp với giao dịch đang mở."
                    : selected?.trang_thai_duyet === "DA_DUYET" ||
                        selected?.trang_thai_duyet === "BAO_LUU" ||
                        selected?.trang_thai_duyet === "TU_CHOI"
                      ? "Giao dịch đã hoàn tất xử lý và chỉ còn ở chế độ xem."
                      : "Tài khoản hiện tại chỉ được xem."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {canActOnSelected ? (
                  <>
                    <form action={approveTransactionAction} className="grid gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-3">
                      <input type="hidden" name="transactionId" value={selected.id} />
                      <input type="hidden" name="returnTo" value={returnToAfterAction} />
                      <h3 className="text-sm font-semibold">Duyệt nhanh</h3>
                      <div className="grid gap-2">
                        <Input
                          key={`quick-apartment-${selected.id}`}
                          name="apartmentCode"
                          defaultValue={selectedReview?.ma_can_duoc_chon || selectedParse?.ma_can_parse || ""}
                          placeholder="Ví dụ L4B.303"
                        />
                        <SubmitButton pendingText="Đang duyệt...">
                          <CheckCircle2 size={16} aria-hidden="true" />
                          Duyệt
                        </SubmitButton>
                      </div>
                    </form>

                    <details className="rounded-xl border border-[var(--line)] bg-white p-3">
                      <summary className="cursor-pointer text-sm font-semibold">Duyệt kèm bằng chứng</summary>
                      <form action={approveTransactionWithEvidenceAction} className="mt-3 grid gap-3">
                        <input type="hidden" name="transactionId" value={selected.id} />
                        <input type="hidden" name="returnTo" value={returnToAfterAction} />
                        <Label className="grid gap-2">
                          Mã căn xác nhận
                          <Input
                            key={`evidence-apartment-${selected.id}`}
                            name="apartmentCode"
                            defaultValue={selectedReview?.ma_can_duoc_chon || selectedParse?.ma_can_parse || ""}
                            placeholder="Ví dụ L4B.303"
                          />
                        </Label>
                        <Label className="grid gap-2">
                          Loại bằng chứng
                          <Select name="evidenceType" defaultValue="ZALO">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ZALO">Ảnh Zalo</SelectItem>
                              <SelectItem value="SAO_KE_CU_DAN">Sao kê cư dân</SelectItem>
                              <SelectItem value="GHI_CHU_THU_CONG">Ghi chú thủ công</SelectItem>
                              <SelectItem value="KHAC">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </Label>
                        <Label className="grid gap-2">
                          File bằng chứng
                          <Input name="evidenceFile" type="file" accept="image/*,.pdf" />
                        </Label>
                        <Textarea name="evidenceNote" placeholder="Ghi chú xác minh, ví dụ: cư dân xác nhận qua Zalo ngày..." rows={2} />
                        <SubmitButton pendingText="Đang duyệt...">
                          <Upload size={16} aria-hidden="true" />
                          Duyệt và lưu bằng chứng
                        </SubmitButton>
                      </form>
                    </details>

                    <details className="rounded-xl border border-[var(--line)] bg-white p-3">
                      <summary className="cursor-pointer text-sm font-semibold">Phân bổ nhiều căn</summary>
                      <form action={approveMultiTransactionAction} className="mt-3 grid gap-3" data-testid="multi-allocation-form">
                        <input type="hidden" name="transactionId" value={selected.id} />
                        <input type="hidden" name="returnTo" value={returnToAfterAction} />
                        <p className="text-xs leading-5 text-[var(--muted)]">
                          Chỉ dùng khi một giao dịch trả cho nhiều căn. Tổng phải đúng {formatMoney(selected.so_tien)}.
                        </p>
                        {allocationSuggestions.length ? (
                          <div className="flex items-center justify-between rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-xs">
                            <span>{allocationSuggestions.length} căn đã được nhận diện</span>
                            <strong>
                              Tổng gợi ý: {formatMoney(allocationSuggestions.reduce((sum, item) => sum + item.amount, 0))}
                            </strong>
                          </div>
                        ) : null}
                        <MultiAllocationEditor
                          key={`multi-allocation-${selected.id}`}
                          totalAmount={Math.round(Number(selected.so_tien))}
                          initialRows={allocationSuggestions}
                        />
                      </form>
                    </details>

                    <details className="rounded-xl border border-[var(--line)] bg-white p-3">
                      <summary className="cursor-pointer text-sm font-semibold">Cần bổ sung / từ chối</summary>
                      <div className="mt-3 grid gap-3">
                        <form action={markTransactionNeedsEvidenceAction} className="grid gap-2">
                          <input type="hidden" name="transactionId" value={selected.id} />
                          <input type="hidden" name="returnTo" value={returnToAfterAction} />
                          <Textarea name="note" placeholder="Lý do cần bổ sung" rows={2} />
                          <SubmitButton variant="secondary" pendingText="Đang đánh dấu...">
                            <ShieldAlert size={16} aria-hidden="true" />
                            Cần bổ sung bằng chứng
                          </SubmitButton>
                        </form>

                        {showReserveUi ? (
                          <form action={reserveTransactionAction} className="grid gap-2 border-t border-[var(--line)] pt-3">
                            <input type="hidden" name="transactionId" value={selected.id} />
                            <input type="hidden" name="returnTo" value={returnToAfterAction} />
                            <Textarea
                              name="note"
                              placeholder="Lý do bảo lưu, ví dụ: khoản ủng hộ hoặc chưa xác định được căn"
                              rows={2}
                            />
                            <SubmitButton variant="secondary" pendingText="Đang bảo lưu...">
                              <ShieldAlert size={16} aria-hidden="true" />
                              Bảo lưu để đối chiếu sau
                            </SubmitButton>
                          </form>
                        ) : null}

                        <form action={rejectTransactionAction} className="grid gap-2 border-t border-[var(--line)] pt-3">
                          <input type="hidden" name="transactionId" value={selected.id} />
                          <input type="hidden" name="returnTo" value={returnToAfterAction} />
                          <Textarea name="note" placeholder="Lý do từ chối" rows={2} />
                          <SubmitButton variant="destructive" pendingText="Đang xử lý...">
                            <AlertTriangle size={16} aria-hidden="true" />
                            Đánh dấu không liên quan
                          </SubmitButton>
                        </form>
                      </div>
                    </details>
                  </>
                ) : (
                  <p className="text-sm text-[var(--muted)]">Manager/Kỹ thuật có thể xem thông tin nhưng không được duyệt, từ chối hoặc upload bằng chứng.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </AdminFrame>
  );
}

function Info({ label, value, strong = false, breakAll = false }: { label: string; value: string; strong?: boolean; breakAll?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{label}</div>
      <div className={`${strong ? "text-xl font-bold" : "text-sm font-medium"} ${breakAll ? "break-all" : "truncate"}`}>
        {value}
      </div>
    </div>
  );
}

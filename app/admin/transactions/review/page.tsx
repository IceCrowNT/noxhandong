import Link from "next/link";
import { AlertTriangle, CheckCircle2, Copy, ShieldAlert, Upload } from "lucide-react";

import {
  approveMultiTransactionAction,
  approveTransactionAction,
  approveTransactionWithEvidenceAction,
  markTransactionNeedsEvidenceAction,
  rejectTransactionAction,
} from "@/app/admin/transactions/review/actions";
import { AdminFrame } from "@/components/admin/admin-frame";
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
    rejected?: string;
    error?: string;
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

function monthlyFeeForApartment(code: string) {
  return code.startsWith("LK") ? 200000 : 250000;
}

function suggestedAllocations(codes: string[], total: unknown) {
  const uniqueCodes = Array.from(new Set(codes)).slice(0, 6);
  const amount = Math.round(Number(total || 0));
  if (!uniqueCodes.length || !amount) return [];

  const standardFees = uniqueCodes.map(monthlyFeeForApartment);
  const standardTotal = standardFees.reduce((sum, value) => sum + value, 0);
  if (standardTotal === amount) {
    return uniqueCodes.map((code, index) => ({ code, amount: standardFees[index] }));
  }

  const raw = standardFees.map((fee) => (amount * fee) / standardTotal);
  const rounded = raw.map(Math.floor);
  let remainder = amount - rounded.reduce((sum, value) => sum + value, 0);
  raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
    .forEach((item) => {
      if (remainder > 0) {
        rounded[item.index] += 1;
        remainder -= 1;
      }
    });

  return uniqueCodes.map((code, index) => ({ code, amount: rounded[index] }));
}

function statusTone(status?: string | null) {
  if (status === "DA_DUYET" || status === "KHOP_TRUC_TIEP" || status === "KHOP_SAU_CHUAN_HOA") return "success";
  if (status === "TU_CHOI" || status === "KHONG_LIEN_QUAN_CAN_HO") return "destructive";
  if (status === "NHIEU_CAN" || status === "DA_RA_SOAT") return "warning";
  return "secondary";
}

function parseCandidates(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const code = typeof record.code === "string" ? record.code : typeof record.ma_can === "string" ? record.ma_can : "";
      if (!code) return null;
      return {
        ma_can: code,
        diem: Number(record.score ?? record.diem ?? 0),
        ly_do: String(record.reason ?? record.ly_do ?? ""),
        thu_hang: Number(record.rank ?? record.thu_hang ?? index + 1),
      };
    })
    .filter((item): item is { ma_can: string; diem: number; ly_do: string; thu_hang: number } => Boolean(item));
}

function getParseInfo(transaction: {
  phien_ban_parser?: string | null;
  ma_can_parse?: string | null;
  trang_thai_khop?: string | null;
  ly_do_khop?: string | null;
  do_tin_cay?: unknown;
  ung_vien_khop_json?: unknown;
  ket_qua_parse?: {
    phien_ban_parser?: string | null;
    ma_can_parse?: string | null;
    trang_thai_khop?: string | null;
    ly_do_khop?: string | null;
    do_tin_cay?: unknown;
    ung_vien_khop?: Array<{ ma_can: string; diem: unknown; ly_do: string; thu_hang: number }>;
  } | null;
}) {
  const legacy = transaction.ket_qua_parse;
  const mergedCandidates = parseCandidates(transaction.ung_vien_khop_json);
  return {
    phien_ban_parser: transaction.phien_ban_parser || legacy?.phien_ban_parser || null,
    ma_can_parse: transaction.ma_can_parse || legacy?.ma_can_parse || null,
    trang_thai_khop: transaction.trang_thai_khop || legacy?.trang_thai_khop || null,
    ly_do_khop: transaction.ly_do_khop || legacy?.ly_do_khop || null,
    do_tin_cay: transaction.do_tin_cay ?? legacy?.do_tin_cay ?? null,
    ung_vien_khop: mergedCandidates.length ? mergedCandidates : legacy?.ung_vien_khop || [],
  };
}

function getLatestReview(transaction: {
  trang_thai_duyet?: string | null;
  ma_can_duoc_chon?: string | null;
  ghi_chu_duyet?: string | null;
  nguoi_duyet?: string | null;
  ngay_duyet?: Date | null;
  duyet_giao_dich: Array<{
    id: number;
    trang_thai_duyet: string;
    ma_can_duoc_chon: string | null;
    ghi_chu_duyet: string | null;
    nguoi_duyet: string | null;
    ngay_duyet: Date | null;
  }>;
}) {
  const merged = transaction.trang_thai_duyet
    ? {
        id: 0,
        trang_thai_duyet: transaction.trang_thai_duyet,
        ma_can_duoc_chon: transaction.ma_can_duoc_chon || null,
        ghi_chu_duyet: transaction.ghi_chu_duyet || null,
        nguoi_duyet: transaction.nguoi_duyet || null,
        ngay_duyet: transaction.ngay_duyet || null,
      }
    : null;
  return merged || transaction.duyet_giao_dich[0] || null;
}

function notice(params: Awaited<ReviewPageProps["searchParams"]>) {
  if (params?.approved === "1") return "Đã duyệt giao dịch và ghi lịch sử phí.";
  if (params?.approvedWithEvidence === "1") return "Đã duyệt giao dịch, lưu bằng chứng và ghi lịch sử phí.";
  if (params?.multiApproved === "1") return "Đã duyệt giao dịch, phân bổ nhiều căn và ghi lịch sử phí.";
  if (params?.needsEvidence === "1") return "Đã đánh dấu giao dịch cần bổ sung bằng chứng.";
  if (params?.rejected === "1") return "Đã đánh dấu giao dịch không liên quan/từ chối.";
  if (params?.error === "invalid_apartment") return "Mã căn không hợp lệ hoặc không tồn tại.";
  if (params?.error === "invalid_allocation") return "Phân bổ nhiều căn cần ít nhất 2 căn hợp lệ.";
  if (params?.error === "duplicate_allocation") return "Danh sách phân bổ có mã căn bị trùng.";
  if (params?.error === "allocation_sum_mismatch") return "Tổng tiền phân bổ phải bằng đúng số tiền giao dịch.";
  if (params?.error === "already_public") return "Giao dịch này đã được đưa vào batch public, không sửa trực tiếp tại màn duyệt.";
  if (params?.error === "evidence_too_large") return "File bằng chứng quá lớn. Giới hạn hiện tại 8 MB.";
  if (params?.error) return "Không xử lý được thao tác. Kiểm tra lại dữ liệu nhập.";
  return null;
}

export default async function TransactionReviewPage({ searchParams }: ReviewPageProps) {
  const account = await requireAdmin();
  const params = await searchParams;
  const canReview = account.vai_tro === "SUPER_ADMIN";
  const selectedId = Number(params?.transactionId || 0);
  const statusFilter = params?.status || "CAN_XU_LY";
  const requestedBatchId = Number(params?.batchId || 0);
  const q = (params?.q || "").trim();
  const message = notice(params);

  const [statementBatches, latestClosings] = await Promise.all([
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
  ]);
  const latestClosing = latestClosings.find((closing) => getClosingCutoffFromMetadata(closing.metadata_json));
  const importBatchesWithTransactions = statementBatches.filter((batch) => batch._count.giao_dich_ngan_hang > 0);
  const requestedBatch = statementBatches.find((batch) => batch.id === requestedBatchId) || null;
  const selectedBatch =
    (requestedBatch && requestedBatch._count.giao_dich_ngan_hang > 0 ? requestedBatch : null) ||
    importBatchesWithTransactions[0] ||
    null;
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
    ];
  }

  if (statusFilter !== "TAT_CA" && statusFilter !== "CAN_XU_LY") {
    where.trang_thai_duyet = statusFilter;
  }

  const [summary, transactions] = await Promise.all([
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
        ket_qua_parse: {
          include: {
            ung_vien_khop: { orderBy: { thu_hang: "asc" }, take: 12 },
          },
        },
        duyet_giao_dich: { orderBy: { id: "desc" }, take: 1 },
        phan_bo_giao_dich: { include: { can_ho: { select: { ma_can: true } } } },
        chung_tu_doi_soat: { orderBy: { id: "desc" }, take: 5 },
      },
    }),
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
    transactions.find((item) => item.id === selectedId) ||
    visibleTransactions[0] ||
    transactions[0] ||
    null;

  const candidateCodes = Array.from(
    new Set(
      [
        selected ? getParseInfo(selected).ma_can_parse : null,
        getLatestReview(selected || ({ duyet_giao_dich: [] } as never))?.ma_can_duoc_chon,
        ...(selected ? getParseInfo(selected).ung_vien_khop.map((candidate) => candidate.ma_can) : []),
        ...(selected?.phan_bo_giao_dich.map((allocation) => allocation.can_ho.ma_can) || []),
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  const [candidateApartments, candidateContacts] = candidateCodes.length
    ? await Promise.all([
        prisma.canHo.findMany({
          where: { ma_can: { in: candidateCodes } },
          include: {
            lien_he: {
              orderBy: [{ la_lien_he_chinh: "desc" }, { thu_tu_uu_tien: "asc" }],
              take: 3,
            },
          },
        }),
        prisma.ungVienLienHeCanHo.findMany({
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
        }),
      ])
    : [[], []];

  const contactByApartment = new Map<string, typeof candidateContacts>();
  for (const contact of candidateContacts) {
    if (!contact.ma_can) continue;
    contactByApartment.set(contact.ma_can, [...(contactByApartment.get(contact.ma_can) || []), contact]);
  }

  const selectedReview = selected ? getLatestReview(selected) : null;
  const selectedParse = selected ? getParseInfo(selected) : null;
  const selectedQuality = selectedParse?.trang_thai_khop
    ? confidenceQuality(selectedParse.do_tin_cay)
    : { label: "Không đủ dữ liệu", tone: "destructive" as const };
  const allocationSuggestions = selected ? suggestedAllocations(candidateCodes, selected.so_tien) : [];

  const summaryMap = new Map(summary.map((item) => [item.trang_thai_duyet, item._count._all]));

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
      {message ? (
        <Notice tone={params?.error ? "error" : "success"}>{message}</Notice>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--line)] bg-white/90 p-3 text-sm text-[var(--muted)]">
        <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 font-semibold text-[var(--accent)]">Bộ lọc hiện tại</span>
        {selectedBatch ? (
          <span>Lô #{selectedBatch.id} · {selectedBatch._count.giao_dich_ngan_hang.toLocaleString("vi-VN")} giao dịch thu</span>
        ) : null}
        {fromDate ? (
          <span>Phát sinh sau {formatDateTime(fromDate)}{latestClosing ? ` · sổ #${latestClosing.id} ${latestClosing.ky_du_lieu}` : ""}</span>
        ) : null}
      </div>

      <section className="mb-3 grid gap-2 md:grid-cols-4">
        {[
          ["Chưa duyệt", summaryMap.get("CHUA_DUYET") || 0],
          ["Đã rà soát", summaryMap.get("DA_RA_SOAT") || 0],
          ["Đã duyệt", summaryMap.get("DA_DUYET") || 0],
          ["Từ chối", summaryMap.get("TU_CHOI") || 0],
        ].map(([label, value]) => (
          <Card key={label} className="bg-white/90">
            <CardContent className="flex items-center justify-between gap-3 p-3">
              <div className="text-sm text-[var(--muted)]">{label}</div>
              <div className="text-xl font-semibold">{formatMoney(value)}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <form className="mb-4 grid gap-2 rounded-xl border border-[var(--line)] bg-white/90 p-3 md:grid-cols-[240px_180px_210px_minmax(0,1fr)_auto]">
        <Select name="batchId" defaultValue={selectedBatch ? String(selectedBatch.id) : "0"}>
          <SelectTrigger>
            <SelectValue placeholder="Lô sao kê" />
          </SelectTrigger>
          <SelectContent>
            {statementBatches.length ? (
              statementBatches.map((batch) => (
                <SelectItem key={batch.id} value={String(batch.id)}>
                  #{batch.id} · {formatDateTime(batch.thoi_diem_nhap)}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="0">Chưa có lô sao kê</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Select name="status" defaultValue={statusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CAN_XU_LY">Cần xử lý</SelectItem>
            <SelectItem value="CHUA_DUYET">Chưa duyệt</SelectItem>
            <SelectItem value="DA_RA_SOAT">Đã rà soát</SelectItem>
            <SelectItem value="DA_DUYET">Đã duyệt</SelectItem>
            <SelectItem value="TU_CHOI">Từ chối</SelectItem>
            <SelectItem value="TAT_CA">Tất cả</SelectItem>
          </SelectContent>
        </Select>
        <Input name="from" type="datetime-local" defaultValue={from} title="Chỉ hiện giao dịch từ thời điểm này" />
        <Input name="q" defaultValue={q} placeholder="Tìm theo nội dung, người chuyển, mã tham chiếu..." />
        <SubmitButton pendingText="Đang lọc...">Lọc</SubmitButton>
      </form>

      {!selected ? (
        <Card className="bg-white/90">
          <CardContent className="p-6 text-sm text-[var(--muted)]">
            Chưa có giao dịch sao kê để duyệt. Hãy nhập file sao kê tại trang nhập dữ liệu.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)_440px]">
          <Card className="bg-white/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Danh sách giao dịch</CardTitle>
              <CardDescription>{visibleTransactions.length} giao dịch trong bộ lọc hiện tại.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-290px)] space-y-2 overflow-y-auto pr-1">
              {visibleTransactions.map((transaction) => {
                const latest = getLatestReview(transaction);
                const parseInfo = getParseInfo(transaction);
                const active = transaction.id === selected.id;
                return (
                  <Link
                    key={transaction.id}
                    href={`/admin/transactions/review?transactionId=${transaction.id}&batchId=${selectedBatch?.id || ""}&status=${statusFilter}&from=${encodeURIComponent(from)}&q=${encodeURIComponent(q)}`}
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

          <div className="grid min-w-0 gap-4">
            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle>Gợi ý căn hộ</CardTitle>
                <CardDescription>Dùng để đối chiếu nhanh trước khi nhập mã căn xác nhận.</CardDescription>
              </CardHeader>
              <CardContent className="max-h-72 space-y-2 overflow-y-auto pr-1">
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
                  <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                    Không có căn gợi ý. Cần nhập tay mã căn hoặc bổ sung bằng chứng.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle>Thao tác duyệt</CardTitle>
                <CardDescription>
                  {canReview ? "Chọn thao tác phù hợp với giao dịch đang mở." : "Tài khoản hiện tại chỉ được xem."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {canReview ? (
                  <>
                    <form action={approveTransactionWithEvidenceAction} className="grid gap-3 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-3">
                      <input type="hidden" name="transactionId" value={selected.id} />
                      <h3 className="text-sm font-semibold">Duyệt kèm bằng chứng</h3>
                      <Label className="grid gap-2">
                        Mã căn xác nhận
                        <Input
                          key={`evidence-apartment-${selected.id}`}
                          name="apartmentCode"
                          defaultValue={selectedReview?.ma_can_duoc_chon || selectedParse?.ma_can_parse || ""}
                          placeholder="Ví dụ L4B.303"
                        />
                      </Label>
                      <div className="grid gap-2 md:grid-cols-2">
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
                      </div>
                      <Textarea name="evidenceNote" placeholder="Ghi chú xác minh, ví dụ: cư dân xác nhận qua Zalo ngày..." rows={2} />
                      <SubmitButton pendingText="Đang duyệt...">
                        <Upload size={16} aria-hidden="true" />
                        Duyệt và lưu bằng chứng
                      </SubmitButton>
                    </form>

                    <form action={approveTransactionAction} className="grid gap-2 rounded-xl border border-[var(--line)] p-3">
                      <input type="hidden" name="transactionId" value={selected.id} />
                      <h3 className="text-sm font-semibold">Duyệt nhanh</h3>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                        <Input
                          key={`quick-apartment-${selected.id}`}
                          name="apartmentCode"
                          defaultValue={selectedReview?.ma_can_duoc_chon || selectedParse?.ma_can_parse || ""}
                          placeholder="Ví dụ L4B.303"
                        />
                        <SubmitButton variant="secondary" pendingText="Đang duyệt...">
                          <CheckCircle2 size={16} aria-hidden="true" />
                          Duyệt
                        </SubmitButton>
                      </div>
                    </form>

                    <form action={markTransactionNeedsEvidenceAction} className="grid gap-2 rounded-xl border border-[var(--line)] p-3">
                      <input type="hidden" name="transactionId" value={selected.id} />
                      <h3 className="text-sm font-semibold">Chưa đủ căn cứ</h3>
                      <Textarea name="note" placeholder="Lý do cần bổ sung" rows={2} />
                      <SubmitButton variant="secondary" pendingText="Đang đánh dấu...">
                        <ShieldAlert size={16} aria-hidden="true" />
                        Cần bổ sung bằng chứng
                      </SubmitButton>
                    </form>

                    <form action={rejectTransactionAction} className="grid gap-2 rounded-xl border border-[var(--line)] p-3">
                      <input type="hidden" name="transactionId" value={selected.id} />
                      <Textarea name="note" placeholder="Lý do từ chối" rows={2} />
                      <SubmitButton variant="destructive" pendingText="Đang xử lý...">
                        <AlertTriangle size={16} aria-hidden="true" />
                        Đánh dấu không liên quan
                      </SubmitButton>
                    </form>

                    <form action={approveMultiTransactionAction} className="grid gap-3 rounded-xl border border-[var(--line)] p-3">
                      <input type="hidden" name="transactionId" value={selected.id} />
                      <div>
                        <h3 className="text-sm font-semibold">Phân bổ nhiều căn</h3>
                        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                          Chỉ dùng khi một giao dịch trả cho nhiều căn. Tổng phải đúng {formatMoney(selected.so_tien)}.
                        </p>
                      </div>
                      <div className="grid gap-2">
                        {(allocationSuggestions.length
                          ? allocationSuggestions
                          : [
                              { code: "", amount: "" },
                              { code: "", amount: "" },
                              { code: "", amount: "" },
                              { code: "", amount: "" },
                            ]).map((item, index) => (
                          <div key={`${item.code}-${index}`} className="grid grid-cols-[minmax(0,1fr)_130px] gap-2">
                            <Input name="allocationCode" defaultValue={item.code} placeholder={`Mã căn ${index + 1}`} />
                            <Input
                              name="allocationAmount"
                              defaultValue={item.amount ? String(item.amount) : ""}
                              inputMode="numeric"
                              placeholder="Số tiền"
                            />
                          </div>
                        ))}
                      </div>
                      <Textarea name="note" placeholder="Ghi chú phân bổ nhiều căn" rows={2} />
                      <SubmitButton variant="secondary" pendingText="Đang phân bổ...">
                        <CheckCircle2 size={16} aria-hidden="true" />
                        Duyệt phân bổ nhiều căn
                      </SubmitButton>
                    </form>
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

import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Gauge,
  PhoneCall,
  Search,
  TrendingDown,
  Users
} from "lucide-react";

import { AdminFrame } from "@/components/admin/admin-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdmin } from "@/src/modules/auth/current-user";
import { getApartmentDashboardData } from "@/src/modules/apartments/dashboard";
import {
  apartmentStatusLabel,
  apartmentTypeLabel,
  contactReviewStatusLabel,
  contactRoleLabel,
  contactStatusLabel,
  importSourceLabel,
  importStatusLabel,
  publicBatchStatusLabel,
  reviewFlagLabel,
  transactionMatchStatusLabel,
  transactionReviewStatusLabel
} from "@/src/modules/shared/labels";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";

type DashboardPageProps = {
  searchParams?: Promise<{
    ma_can?: string;
  }>;
};

function formatDateTime(value: string | null) {
  return formatVietnamDateTime(value);
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "-";
}

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ"
    : "-";
}

function compactText(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

function yesNo(value: boolean | null | undefined) {
  return value ? "Có" : "Không";
}

function normalizePhone(value: string | null | undefined) {
  const phone = String(value || "").replace(/[^\d+]/g, "");
  return phone.length >= 9 ? phone : null;
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(4, Math.round((value / total) * 100));
}

function FeeCompletionRing({
  percent,
  completed,
  total,
  notCompleted,
  partialRounded,
  noData,
  periodLabel
}: {
  percent: number;
  completed: number;
  total: number;
  notCompleted: number;
  partialRounded: number;
  noData: number;
  periodLabel: string;
}) {
  const degrees = Math.min(100, Math.max(0, percent)) * 3.6;
  const remainingPercent = total ? (notCompleted / total) * 100 : 0;
  const stats = [
    ["Kỳ hiện tại", periodLabel],
    ["Còn thiếu", `${formatNumber(notCompleted)} căn · ${remainingPercent.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`],
    ["Đóng lẻ đã làm tròn", `${formatNumber(partialRounded)} căn`],
    ["Chưa có dữ liệu", `${formatNumber(noData)} căn`],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-[150px_1fr] md:items-center">
      <div
        className="grid aspect-square w-36 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--accent) ${degrees}deg, #e5f2eb 0deg)`,
        }}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-sm">
          <div>
            <strong className="block text-3xl text-[var(--accent)]">{percent}%</strong>
            <span className="text-xs font-semibold text-[var(--muted)]">hoàn thành</span>
          </div>
        </div>
      </div>
      <div className="grid gap-2 text-sm leading-6 text-[var(--muted)]">
        <p className="m-0">
          <b className="text-[var(--text)]">{formatNumber(completed)}</b> / {formatNumber(total)} căn đã đạt kỳ phí
          hiện tại.
        </p>
        <p className="m-0">Căn đóng vượt kỳ được tính là đã hoàn thành kỳ hiện tại.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[var(--line)] bg-white p-3">
              <span className="block text-[11px] font-semibold uppercase text-[var(--muted)]">{label}</span>
              <strong className="mt-1 block leading-5 text-[var(--text)]">{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeeDistributionBars({
  items,
}: {
  items: Array<{ label: string; count: number; percent: number; isCurrentOrLater: boolean }>;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(...items.map((item) => item.count), 1);
  const completed = items.reduce((sum, item) => sum + (item.isCurrentOrLater ? item.count : 0), 0);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Tổng", total],
          ["Đạt kỳ", completed],
          ["Số mốc", items.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[var(--line)] bg-white p-3">
            <span className="text-[11px] font-semibold uppercase text-[var(--muted)]">{label}</span>
            <strong className="mt-1 block text-xl">{formatNumber(Number(value))}</strong>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-white p-3">
        <div className="grid gap-3">
          {items.map((item) => {
            const width = Math.max(2, Math.round((item.count / max) * 100));
            const tone = item.isCurrentOrLater ? "bg-[var(--accent)]" : "bg-amber-500";
            const detailedPercent = total
              ? ((item.count / total) * 100).toLocaleString("vi-VN", {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: item.count > 0 && item.count < total / 100 ? 1 : 0,
                })
              : "0";

            return (
              <div key={item.label} className="grid gap-1">
                <div className="grid grid-cols-[minmax(130px,1fr)_auto] items-baseline gap-3 text-sm">
                  <span className="min-w-0 truncate font-semibold text-[var(--text)]" title={item.label}>
                    {item.label}
                  </span>
                  <span className="shrink-0 text-right font-bold">
                    {formatNumber(item.count)} căn · {detailedPercent}%
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-[var(--accent-soft)]">
                  <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
          <div className="border-t border-[var(--line)] pt-3 text-sm text-[var(--muted)]">
            Tổng các nhóm: <b className="text-[var(--text)]">{formatNumber(total)}</b> căn. Thanh xanh là đã đạt hoặc
            vượt kỳ hiện tại; thanh vàng là chưa đạt kỳ hiện tại.
          </div>
        </div>
      </div>
    </div>
  );
}

function AttentionRows({
  items,
}: {
  items: Array<{ ma_can: string; label: string; displayText: string; kind: "POWER_CUT" | "POWER_CUT_SOON" }>;
}) {
  const counts = items.reduce(
    (acc, item) => {
      acc[item.kind] += 1;
      return acc;
    },
    { POWER_CUT: 0, POWER_CUT_SOON: 0 }
  );

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <span className="text-[11px] font-semibold uppercase text-amber-700">Cắt tháng này</span>
          <strong className="mt-1 block text-2xl text-amber-900">{formatNumber(counts.POWER_CUT_SOON)}</strong>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <span className="text-[11px] font-semibold uppercase text-red-700">Đã cắt điện</span>
          <strong className="mt-1 block text-2xl text-red-900">{formatNumber(counts.POWER_CUT)}</strong>
        </div>
      </div>

      {items.length ? (
        items.map((item) => (
          <div
            key={`${item.kind}-${item.ma_can}`}
            className={
              item.kind === "POWER_CUT"
                ? "rounded-lg border border-red-200 bg-red-50 p-3 text-sm"
                : "rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
            }
          >
            <div className="flex items-center justify-between gap-3">
              <strong>{item.ma_can}</strong>
              <span
                className={
                  item.kind === "POWER_CUT"
                    ? "rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"
                    : "rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800"
                }
              >
                {item.label}
              </span>
            </div>
            <p className="mt-2 text-[var(--muted)]">{item.displayText}</p>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">
          Không có căn trong ngưỡng đã cắt điện hoặc cắt tháng này theo kỳ hiện tại.
        </div>
      )}
    </div>
  );
}

function ImportControlMatrix({
  items,
}: {
  items: Array<{
    id: number;
    loai_nguon: string;
    so_dong: number | null;
    trang_thai: string;
    thoi_diem_nhap: string | null;
  }>;
}) {
  const totalRows = items.reduce((sum, item) => sum + (item.so_dong || 0), 0);
  const completed = items.filter((item) => importStatusLabel(item.trang_thai) === "Hoàn tất").length;
  const averageRows = items.length ? Math.round(totalRows / items.length) : 0;

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Lô gần nhất", items.length],
          ["Tổng dòng", totalRows],
          ["TB/lô", averageRows],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[var(--line)] bg-white p-3">
            <span className="text-[11px] font-semibold uppercase text-[var(--muted)]">{label}</span>
            <strong className="mt-1 block text-xl">{formatNumber(Number(value))}</strong>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white">
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead>Lô</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead className="text-right">Dòng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Điểm</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 5).map((item, index) => {
              const rows = item.so_dong || 0;
              const score = Math.min(99, 72 + index * 3 + (rows > averageRows ? 8 : 0));
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold">#{item.id}</TableCell>
                  <TableCell>{importSourceLabel(item.loai_nguon)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatNumber(rows)}</TableCell>
                  <TableCell>{importStatusLabel(item.trang_thai)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-[var(--accent-soft)]">
                        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${score}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs font-semibold">{score}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell className="font-semibold" colSpan={2}>
                Tổng hợp
              </TableCell>
              <TableCell className="text-right font-semibold">{formatNumber(totalRows)}</TableCell>
              <TableCell>{completed}/{items.length} hoàn tất</TableCell>
              <TableCell>Ổn định</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ApartmentTypeBars({
  items,
  total
}: {
  items: Array<{ type: string; count: number }>;
  total: number;
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.type} className="grid grid-cols-[96px_1fr_64px] items-center gap-3 text-sm">
          <span className="font-semibold text-[var(--muted)]">{apartmentTypeLabel(item.type)}</span>
          <div className="h-3 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct(item.count, total)}%` }} />
          </div>
          <strong className="text-right">{formatNumber(item.count)}</strong>
        </div>
      ))}
    </div>
  );
}

function MobileMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white/95 p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</span>
      <strong className="mt-2 block text-2xl leading-none">{value}</strong>
      {detail ? <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

function MobileSearchResultCards({
  items,
}: {
  items: Array<{
    id: number;
    ma_can: string;
    loai_can: string;
    ma_lo: string;
    ma_so: string;
    chu_ho_ten_goc: string | null;
    trang_thai_su_dung_goc: string | null;
    tinh_trang_goc: string | null;
  }>;
}) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-white/80 p-4 text-sm text-[var(--muted)]">
        Không tìm thấy căn phù hợp.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((apartment) => (
        <Link
          href={`/admin/dashboard?ma_can=${encodeURIComponent(apartment.ma_can)}`}
          key={apartment.id}
          className="rounded-xl border border-[var(--line)] bg-white/95 p-4 transition-colors hover:border-[var(--accent)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong className="text-lg">{apartment.ma_can}</strong>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {apartmentTypeLabel(apartment.loai_can)} · Lô {apartment.ma_lo} · Số {apartment.ma_so}
              </p>
            </div>
            <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
              Xem
            </span>
          </div>
          <div className="mt-3 grid gap-1 text-sm leading-6">
            <span>Chủ hộ: <b>{compactText(apartment.chu_ho_ten_goc)}</b></span>
            <span className="text-[var(--muted)]">
              {compactText(apartment.trang_thai_su_dung_goc)} / {compactText(apartment.tinh_trang_goc)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function MobileImportHistoryCards({
  items,
}: {
  items: Array<{
    id: number;
    loai_nguon: string;
    ten_file: string | null;
    so_dong: number | null;
    trang_thai: string;
    thoi_diem_nhap: string | null;
  }>;
}) {
  return (
    <div className="grid gap-3">
      {items.slice(0, 8).map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border border-[var(--line)] bg-white/95 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <strong className="block truncate">#{item.id} · {importSourceLabel(item.loai_nguon)}</strong>
              <p className="mt-1 truncate text-sm text-[var(--muted)]">{compactText(item.ten_file)}</p>
            </div>
            <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
              {importStatusLabel(item.trang_thai)}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2 sm:gap-2">
            <span>Dòng: <b>{formatNumber(item.so_dong)}</b></span>
            <span className="min-w-0 truncate text-[var(--muted)] sm:text-right">{formatDateTime(item.thoi_diem_nhap)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestPaymentHistoryCard({
  items,
  compact = false,
}: {
  compact?: boolean;
  items: Array<{
    id: number;
    ky_du_lieu: string;
    thang_ap_dung: string | null;
    so_tien: string | null;
    loai_nguon: string;
    ghi_chu: string | null;
    ngay_tao: string | null;
    batch_phi_public_id: number | null;
    giao_dich_ngan_hang: {
      id: number;
      ngay_giao_dich: string | null;
      so_tien: string | null;
      noi_dung_goc: string;
      tham_chieu_ngan_hang: string | null;
      ten_nguoi_chuyen: string | null;
      lo_nhap_du_lieu: {
        id: number;
        ten_file: string;
        loai_nguon: string;
      };
      chung_tu_doi_soat: Array<{
        id: number;
        loai_chung_tu: string;
        duong_dan_file: string | null;
        ten_file_goc: string | null;
        ghi_chu: string | null;
        ngay_tao: string | null;
      }>;
    } | null;
  }>;
}) {
  const latest = items[0] || null;

  if (!latest) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-white/80 p-4 text-sm leading-6 text-[var(--muted)]">
        Chưa có giao dịch đã duyệt trong Phase 2 cho căn này. Dữ liệu hiện tại vẫn dựa trên batch public đã chốt từ file
        theo dõi thu phí.
      </div>
    );
  }

  const transaction = latest.giao_dich_ngan_hang;
  const evidenceCount = transaction?.chung_tu_doi_soat.length || 0;
  const rows = [
    ["Ngày giao dịch", formatDateTime(transaction?.ngay_giao_dich || latest.ngay_tao)],
    ["Số tiền", formatMoney(transaction?.so_tien || latest.so_tien)],
    ["Người chuyển", compactText(transaction?.ten_nguoi_chuyen)],
    ["Mã tham chiếu", compactText(transaction?.tham_chieu_ngan_hang)],
    ["File nguồn", compactText(transaction?.lo_nhap_du_lieu.ten_file)],
    ["Bằng chứng", evidenceCount ? `${evidenceCount} file/ghi chú` : "Chưa có"],
  ];

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border border-[var(--line)] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Giao dịch gần nhất đã duyệt</span>
            <strong className="mt-1 block text-xl">{formatMoney(transaction?.so_tien || latest.so_tien)}</strong>
          </div>
          <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
            {latest.batch_phi_public_id ? "Đã public" : "Chờ public"}
          </span>
        </div>

        <div className={compact ? "mt-3 grid gap-2 text-sm" : "mt-4 grid gap-2 text-sm md:grid-cols-2"}>
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[var(--line)] bg-[#fbfcfb] p-3">
              <span className="block text-[11px] font-semibold uppercase text-[var(--muted)]">{label}</span>
              <strong className="mt-1 block min-w-0 truncate leading-5" title={value}>
                {value}
              </strong>
            </div>
          ))}
        </div>

        {transaction?.noi_dung_goc ? (
          <div className="mt-3 rounded-lg border border-[var(--line)] bg-[#fbfcfb] p-3 text-sm leading-6 text-[var(--muted)]">
            <b className="text-[var(--text)]">Nội dung CK:</b> {transaction.noi_dung_goc}
          </div>
        ) : null}
      </div>

      {!compact && items.length > 1 ? (
        <div className="grid gap-2">
          {items.slice(1, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-white p-3 text-sm">
              <span className="min-w-0 truncate">{formatDateTime(item.giao_dich_ngan_hang?.ngay_giao_dich || item.ngay_tao)}</span>
              <strong>{formatMoney(item.giao_dich_ngan_hang?.so_tien || item.so_tien)}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TransactionQualityStats({
  reviewStats,
  parseStats,
}: {
  reviewStats: Array<{ status: string; count: number }>;
  parseStats: Array<{ status: string; count: number }>;
}) {
  const reviewTotal = reviewStats.reduce((sum, item) => sum + item.count, 0);
  const parseTotal = parseStats.reduce((sum, item) => sum + item.count, 0);
  const importantParse = ["KHOP_TRUC_TIEP", "KHOP_SAU_CHUAN_HOA", "NHIEU_CAN", "CHUA_NHAN_DIEN_DUOC_CAN", "MA_CAN_KHONG_HOP_LE"];
  const importantReview = ["CHUA_DUYET", "DA_RA_SOAT", "DA_DUYET", "TU_CHOI"];
  const parseByStatus = new Map(parseStats.map((item) => [item.status, item.count]));
  const reviewByStatus = new Map(reviewStats.map((item) => [item.status, item.count]));

  const rows = [
    ...importantReview.map((status) => ({
      label: transactionReviewStatusLabel(status),
      count: reviewByStatus.get(status) || 0,
      total: reviewTotal,
    })),
    ...importantParse.map((status) => ({
      label: transactionMatchStatusLabel(status),
      count: parseByStatus.get(status) || 0,
      total: parseTotal,
    })),
  ].filter((item) => item.count > 0 || item.label === "Chưa duyệt");

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[var(--line)] bg-white p-3">
          <span className="text-[11px] font-semibold uppercase text-[var(--muted)]">Dòng duyệt</span>
          <strong className="mt-1 block text-xl">{formatNumber(reviewTotal)}</strong>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-white p-3">
          <span className="text-[11px] font-semibold uppercase text-[var(--muted)]">Dòng parser</span>
          <strong className="mt-1 block text-xl">{formatNumber(parseTotal)}</strong>
        </div>
      </div>
      <div className="grid gap-2">
        {rows.slice(0, 8).map((item) => {
          const percent = item.total ? Math.round((item.count / item.total) * 100) : 0;
          return (
            <div key={item.label} className="grid gap-1 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-semibold">{item.label}</span>
                <span className="shrink-0">{formatNumber(item.count)} · {percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--accent-soft)]">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(2, percent)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  const account = await requireAdmin();
  const params = await searchParams;
  const data = await getApartmentDashboardData(params?.ma_can || "");
  const selected = data.search.selectedApartment;
  const hasSearch = Boolean(data.search.query);
  const feeOverview = data.summary.feeOverview;

  const details = selected
    ? [
        ["Loại căn", apartmentTypeLabel(selected.loai_can)],
        ["Diện tích", selected.dien_tich_m2 ? `${selected.dien_tich_m2} m²` : "-"],
        ["Chủ hộ gốc", compactText(selected.chu_ho_ten_goc)],
        ["Tình trạng gốc", compactText(selected.tinh_trang_goc)],
        ["Trạng thái sử dụng gốc", compactText(selected.trang_thai_su_dung_goc)],
        ["Trạng thái hệ thống", apartmentStatusLabel(selected.trang_thai)]
      ]
    : [];

  const quickPhones = selected
    ? [
        ...selected.lien_he.map((contact) => ({
          name: contact.ten_hien_thi,
          phone: normalizePhone(contact.so_dien_thoai),
          source: "Danh bạ đã duyệt",
        })),
        ...selected.contactCandidates.map((candidate) => ({
          name: candidate.ten_hien_thi_parse || candidate.ten_nguoi_su_dung_goc || candidate.ten_chu_ho_goc || "Liên hệ gốc",
          phone: normalizePhone(candidate.so_dien_thoai_parse || candidate.so_dien_thoai_goc),
          source: "Excel chưa duyệt",
        })),
      ]
        .filter((item) => item.phone)
        .filter((item, index, array) => array.findIndex((other) => other.phone === item.phone) === index)
        .slice(0, 4)
    : [];

  const feeDetails = selected?.currentFeeStatus
    ? [
        ["Kỳ dữ liệu", selected.currentFeeStatus.ky_du_lieu],
        ["Tháng đã đóng", compactText(selected.currentFeeStatus.thang_da_dong_den_hien_tai)],
        ["Lô dữ liệu", `#${selected.currentFeeStatus.batch.id}`],
        ["Công khai lúc", formatDateTime(selected.currentFeeStatus.batch.public_luc)]
      ]
    : [];

  return (
    <AdminFrame
      activeKey="dashboard"
      badge="Dashboard vận hành"
      title="Tra cứu nội bộ"
      description={
        <>
          {account.ten_hien_thi || account.ten_dang_nhap} có thể tra cứu căn hộ, trạng thái phí đã công khai và dữ liệu
          liên hệ nội bộ.
        </>
      }
    >
      <section className="lg:hidden">
        <Tabs defaultValue="lookup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="lookup">Tra cứu</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <MobileMetricCard label="Tổng căn" value={formatNumber(data.summary.totalApartments)} />
              <MobileMetricCard label="Đã đạt kỳ" value={formatNumber(feeOverview.completedCount)} />
              <MobileMetricCard label="Chưa đạt" value={formatNumber(feeOverview.notCompletedCount)} />
              <MobileMetricCard label="Liên hệ chờ" value={formatNumber(data.summary.contactReviewCount)} />
            </div>

            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Hoàn thành kỳ phí</CardTitle>
                <CardDescription>Kỳ hiện tại {feeOverview.currentPeriod.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <FeeCompletionRing
                  percent={feeOverview.completionPercent}
                  completed={feeOverview.completedCount}
                  total={feeOverview.total}
                  notCompleted={feeOverview.notCompletedCount}
                  partialRounded={feeOverview.partialRoundedCount}
                  noData={feeOverview.noDataCount}
                  periodLabel={feeOverview.currentPeriod.label}
                />
              </CardContent>
            </Card>

            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Phân bố tháng phí</CardTitle>
              </CardHeader>
              <CardContent>
                <FeeDistributionBars items={feeOverview.distribution} />
              </CardContent>
            </Card>

            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Cảnh báo cắt điện</CardTitle>
              </CardHeader>
              <CardContent>
                <AttentionRows items={feeOverview.attentionRows} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lookup" className="grid gap-4">
            <Card id="lookup-mobile" className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Tra cứu nhanh</CardTitle>
                <CardDescription>Nhập mã căn để xem phí và liên hệ ngay.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3" action="/admin/dashboard">
                  <Input defaultValue={data.search.query} maxLength={80} name="ma_can" placeholder="Ví dụ: L1.112" />
                  <SubmitButton pendingText="Đang tìm...">
                    <Search size={17} aria-hidden="true" />
                    Tìm
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>

            {data.search.parseMessage ? (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
                {data.search.parseMessage}
              </div>
            ) : null}

            {selected ? (
              <>
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardHeader className="pb-3">
                    <CardDescription className="font-semibold uppercase text-emerald-800">Tình trạng đóng phí</CardDescription>
                    <CardTitle className="text-2xl leading-tight text-emerald-950">
                      {selected.currentFeeStatus?.display_text || "Chưa có dữ liệu phí đã công khai"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm text-emerald-950/80">
                    <span>Mã căn: <b>{selected.ma_can}</b></span>
                    <span>Kỳ dữ liệu: <b>{selected.currentFeeStatus?.ky_du_lieu || "-"}</b></span>
                    <span>Nguồn: batch #{selected.currentFeeStatus?.batch.id || "-"}</span>
                  </CardContent>
                </Card>

                <Card className="bg-white/90">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Giao dịch gần nhất</CardTitle>
                    <CardDescription>Bằng chứng đối chiếu từ sao kê đã duyệt.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LatestPaymentHistoryCard items={selected.latestPaymentHistory} compact />
                  </CardContent>
                </Card>

                <Card className="bg-white/90">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Gọi nhanh</CardTitle>
                    <CardDescription>Dữ liệu lấy từ Excel/chưa duyệt và danh bạ nội bộ.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {quickPhones.length ? (
                      <div className="grid gap-2">
                        {quickPhones.map((item) => (
                          <div key={item.phone} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <strong className="block truncate">{item.name}</strong>
                            <span className="mt-1 block text-sm text-[var(--muted)]">{item.phone} · {item.source}</span>
                            <Button asChild className="mt-3 w-full" size="sm">
                              <a href={`tel:${item.phone}`}>
                                <PhoneCall size={16} aria-hidden="true" />
                                Gọi
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                        Chưa tìm thấy số điện thoại cho căn này.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/90">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Hồ sơ căn hộ</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {details.slice(0, 6).map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-3 border-b border-[var(--line)] py-2 text-sm last:border-0">
                        <span className="text-[var(--muted)]">{label}</span>
                        <strong className="text-right leading-5">{value}</strong>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-white/90">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Dữ liệu gốc Excel</CardTitle>
                    <CardDescription>Chưa phải danh bạ đã duyệt.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {selected.contactCandidates.length ? (
                      selected.contactCandidates.slice(0, 5).map((candidate) => (
                        <div key={candidate.id} className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm">
                          <strong>{compactText(candidate.ten_hien_thi_parse || candidate.ten_chu_ho_goc)}</strong>
                          <div className="mt-2 grid gap-1 leading-6 text-[var(--muted)]">
                            <span>SĐT: <b>{compactText(candidate.so_dien_thoai_parse || candidate.so_dien_thoai_goc)}</b></span>
                            <span>Người dùng: {compactText(candidate.ten_nguoi_su_dung_goc)}</span>
                            <span>{compactText(candidate.thong_tin_cu_dan_goc || candidate.thong_tin_phu_goc || candidate.ghi_chu_goc)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                        Chưa có dữ liệu liên hệ gốc từ Excel.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : hasSearch ? (
              <MobileSearchResultCards items={data.search.results} />
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-white/80 p-5 text-sm leading-6 text-[var(--muted)]">
                Mở tab này khi cần tra cứu căn hộ, kiểm tra phí hoặc gọi nhanh cho cư dân.
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="grid gap-4">
            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Ma trận nhập dữ liệu</CardTitle>
                <CardDescription>Các lô import gần nhất.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-3 gap-2 overflow-hidden">
                  {[
                    ["Lô", data.latestImports.length],
                    ["Dòng", data.latestImports.reduce((sum, item) => sum + (item.so_dong || 0), 0)],
                    ["Hoàn tất", data.latestImports.filter((item) => importStatusLabel(item.trang_thai) === "Hoàn tất").length],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-lg border border-[var(--line)] bg-white p-3 text-center">
                      <span className="block text-[11px] font-semibold uppercase text-[var(--muted)]">{label}</span>
                      <strong className="mt-1 block text-lg">{formatNumber(Number(value))}</strong>
                    </div>
                  ))}
                </div>
                <MobileImportHistoryCards items={data.latestImports} />
              </CardContent>
            </Card>

            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Chất lượng sao kê</CardTitle>
                <CardDescription>Tỷ lệ parser và trạng thái duyệt hiện tại.</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionQualityStats
                  reviewStats={data.summary.transactionReviewStats}
                  parseStats={data.summary.transactionParseStats}
                />
              </CardContent>
            </Card>

            <Card className="bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Cơ cấu căn hộ</CardTitle>
              </CardHeader>
              <CardContent>
                <ApartmentTypeBars items={data.summary.apartmentTypes} total={data.summary.totalApartments} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <div className="hidden lg:flex lg:flex-col">
      <section className="order-2 mb-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Card className="bg-white/90">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardDescription>Tổng căn hộ</CardDescription>
              <CardTitle className="mt-2 text-3xl">{formatNumber(data.summary.totalApartments)}</CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Building2 size={21} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted)]">
            {data.summary.apartmentTypes
              .map((item) => `${apartmentTypeLabel(item.type)}: ${formatNumber(item.count)}`)
              .join(" · ")}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardDescription>Đã hoàn thành kỳ {feeOverview.currentPeriod.label}</CardDescription>
              <CardTitle className="mt-2 text-3xl">{formatNumber(feeOverview.completedCount)}</CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <CheckCircle2 size={21} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-[var(--muted)]">
            {feeOverview.completionPercent}% trên batch {data.summary.currentBatch?.ky_du_lieu || "-"} ·{" "}
            {data.summary.currentBatch ? publicBatchStatusLabel(data.summary.currentBatch.trang_thai) : "Chưa có batch"}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardDescription>Chưa hoàn thành kỳ hiện tại</CardDescription>
              <CardTitle className="mt-2 text-3xl">{formatNumber(feeOverview.notCompletedCount)}</CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <TrendingDown size={21} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted)]">
            {formatNumber(feeOverview.partialRoundedCount)} căn lẻ tiền đã làm tròn xuống khi thống kê.
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardDescription>Liên hệ cần xử lý</CardDescription>
              <CardTitle className="mt-2 text-3xl">{formatNumber(data.summary.contactReviewCount)}</CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-800">
              <AlertTriangle size={21} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted)]">
            {formatNumber(data.summary.approvedContactCount)} liên hệ đã được duyệt vào danh bạ nội bộ.
          </CardContent>
        </Card>
      </section>

      <section className="order-3 mb-5 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(320px,0.8fr)]">
        <Card className="bg-white/90">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gauge className="text-[var(--accent)]" size={20} aria-hidden="true" />
              <CardTitle>Hoàn thành kỳ phí</CardTitle>
            </div>
            <CardDescription>
              Tính theo kỳ hiện tại {feeOverview.currentPeriod.label}; căn đóng vượt kỳ vẫn tính là hoàn thành.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeeCompletionRing
              percent={feeOverview.completionPercent}
              completed={feeOverview.completedCount}
              total={feeOverview.total}
              notCompleted={feeOverview.notCompletedCount}
              partialRounded={feeOverview.partialRoundedCount}
              noData={feeOverview.noDataCount}
              periodLabel={feeOverview.currentPeriod.label}
            />
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Phân bố tháng đã đóng đến</CardTitle>
            <CardDescription>Số lẻ được làm tròn xuống; mốc ngoài năm 2026 giữ đúng tháng/năm thực tế.</CardDescription>
          </CardHeader>
          <CardContent>
            <FeeDistributionBars items={feeOverview.distribution} />
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Cảnh báo cắt điện</CardTitle>
            <CardDescription>
              Theo kỳ {feeOverview.currentPeriod.label}: đóng hết {feeOverview.powerCutPolicy.soonPaidThroughLabel} là
              cắt tháng này; thấp hơn là đã cắt điện.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttentionRows items={feeOverview.attentionRows} />
          </CardContent>
        </Card>
      </section>

      <section className="order-1 mb-5 grid gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(340px,0.76fr)]">
        <Card id="lookup" className="bg-white/90">
          <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Tra cứu nhanh</CardTitle>
              <CardDescription>
                Có thể nhập nhiều kiểu mã căn như L1.115, L1 115, căn 124 lô 4B hoặc 124lo4b.
              </CardDescription>
            </div>
            <form className="flex w-full flex-col gap-2 md:w-[480px] md:flex-row" action="/admin/dashboard">
              <Input defaultValue={data.search.query} maxLength={80} name="ma_can" placeholder="Nhập mã căn" />
              <SubmitButton pendingText="Đang tìm...">
                <Search size={17} aria-hidden="true" />
                Tìm
              </SubmitButton>
            </form>
          </CardHeader>
          <CardContent>
            {data.search.parseMessage ? (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
                {data.search.parseMessage}
              </div>
            ) : null}

            {selected ? (
              <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.25fr)]">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <span className="text-xs font-bold uppercase text-emerald-800">Tình trạng đóng phí</span>
                  <strong className="mt-2 block text-2xl leading-tight text-emerald-900">
                    {selected.currentFeeStatus?.display_text || "Chưa có dữ liệu phí đã công khai"}
                  </strong>
                  <div className="mt-3 grid gap-2 text-sm text-emerald-950/80">
                    <span>Mã căn: <b>{selected.ma_can}</b></span>
                    <span>Kỳ dữ liệu: <b>{selected.currentFeeStatus?.ky_du_lieu || "-"}</b></span>
                    <span>Nguồn: batch #{selected.currentFeeStatus?.batch.id || "-"}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase text-[var(--muted)]">Liên hệ gốc từ Excel</span>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Dữ liệu dưới đây lấy từ bảng <b>ung_vien_lien_he_can_ho</b>, chưa phải danh bạ đã duyệt.
                      </p>
                    </div>
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/contacts/review?ma_can=${encodeURIComponent(selected.ma_can)}`}>Duyệt</Link>
                    </Button>
                  </div>

                  {quickPhones.length ? (
                    <div className="mb-3 grid gap-2">
                      {quickPhones.map((item) => (
                        <div
                          key={item.phone}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
                        >
                          <div className="min-w-0">
                            <strong className="block truncate">{item.name}</strong>
                            <span className="text-sm text-[var(--muted)]">{item.phone} · {item.source}</span>
                          </div>
                          <Button asChild size="sm">
                            <a href={`tel:${item.phone}`}>
                              <PhoneCall size={16} aria-hidden="true" />
                              Gọi
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid max-h-[220px] gap-2 overflow-auto pr-1">
                    {selected.contactCandidates.length ? (
                      selected.contactCandidates.slice(0, 5).map((candidate) => (
                        <div key={candidate.id} className="rounded-lg border border-[var(--line)] bg-[#fbfcfb] p-3">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            <span><b>Chủ hộ:</b> {compactText(candidate.ten_chu_ho_goc)}</span>
                            <span><b>Người dùng:</b> {compactText(candidate.ten_nguoi_su_dung_goc)}</span>
                            <span><b>SĐT:</b> {compactText(candidate.so_dien_thoai_goc || candidate.so_dien_thoai_parse)}</span>
                          </div>
                          <div className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            {compactText(candidate.thong_tin_cu_dan_goc || candidate.thong_tin_phu_goc || candidate.ghi_chu_goc)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                        Chưa có dữ liệu liên hệ gốc từ Excel cho căn này.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {hasSearch ? (
              <div className="max-h-[320px] overflow-auto rounded-xl border border-[var(--line)] bg-white">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã căn</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Lô</TableHead>
                      <TableHead>Số</TableHead>
                      <TableHead>Chủ hộ gốc</TableHead>
                      <TableHead>Tình trạng gốc</TableHead>
                      <TableHead>Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.search.results.length ? (
                      data.search.results.map((apartment) => (
                        <TableRow key={apartment.id}>
                          <TableCell className="font-semibold">{apartment.ma_can}</TableCell>
                          <TableCell>{apartmentTypeLabel(apartment.loai_can)}</TableCell>
                          <TableCell>{apartment.ma_lo}</TableCell>
                          <TableCell>{apartment.ma_so}</TableCell>
                          <TableCell>{compactText(apartment.chu_ho_ten_goc)}</TableCell>
                          <TableCell>
                            {compactText(apartment.trang_thai_su_dung_goc)} / {compactText(apartment.tinh_trang_goc)}
                          </TableCell>
                          <TableCell>
                            <Button asChild variant="secondary" size="sm">
                              <Link href={`/admin/dashboard?ma_can=${encodeURIComponent(apartment.ma_can)}`}>Xem</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="py-8 text-center text-[var(--muted)]" colSpan={7}>
                          Không tìm thấy căn phù hợp.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-white/70 p-6 text-sm leading-6 text-[var(--muted)]">
                Nhập mã căn ở ô tìm kiếm để xem kết quả. Bảng kết quả sẽ cuộn trong khung này thay vì kéo toàn bộ
                trang.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle>Ma trận nhập dữ liệu</CardTitle>
              <CardDescription>Bảng kiểm soát decor từ các lô import gần nhất.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImportControlMatrix items={data.latestImports} />
            </CardContent>
          </Card>
          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle>Chất lượng sao kê</CardTitle>
              <CardDescription>Tổng hợp parser và trạng thái duyệt giao dịch.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionQualityStats
                reviewStats={data.summary.transactionReviewStats}
                parseStats={data.summary.transactionParseStats}
              />
            </CardContent>
          </Card>
          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle>Cơ cấu căn hộ</CardTitle>
            </CardHeader>
            <CardContent>
              <ApartmentTypeBars items={data.summary.apartmentTypes} total={data.summary.totalApartments} />
            </CardContent>
          </Card>
        </div>
      </section>

      {selected ? (
        <section className="order-4 mb-5 grid gap-4 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="grid gap-4">
            <Card className="bg-white/90">
              <CardHeader>
                <p className="eyebrow">Hồ sơ căn hộ</p>
                <CardTitle>{selected.ma_can}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {details.map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[var(--line)] bg-white p-4">
                    <span className="mb-2 block text-xs font-bold uppercase text-[var(--muted)]">{label}</span>
                    <strong className="leading-6">{value}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/90">
              <CardHeader>
                <p className="eyebrow">Phí đã công khai</p>
                <CardTitle>{selected.currentFeeStatus?.display_text || "Chưa có trạng thái phí đã công khai"}</CardTitle>
              </CardHeader>
              {selected.currentFeeStatus ? (
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {feeDetails.map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-[var(--line)] bg-white p-4">
                      <span className="mb-2 block text-xs font-bold uppercase text-[var(--muted)]">{label}</span>
                      <strong className="leading-6">{value}</strong>
                    </div>
                  ))}
                </CardContent>
              ) : null}
            </Card>

            <Card className="bg-white/90">
              <CardHeader>
                <p className="eyebrow">Đối chiếu sao kê</p>
                <CardTitle>Giao dịch gần nhất đã duyệt</CardTitle>
                <CardDescription>Dùng làm bằng chứng nhanh khi quản lý/kỹ thuật cần kiểm tra tại hiện trường.</CardDescription>
              </CardHeader>
              <CardContent>
                <LatestPaymentHistoryCard items={selected.latestPaymentHistory} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card className="bg-white/90">
              <CardHeader>
                <p className="eyebrow">Liên hệ chính thức</p>
                <CardTitle>Danh bạ đã duyệt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-auto rounded-xl border border-[var(--line)] bg-white">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>SĐT</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead>Liên hệ chính</TableHead>
                        <TableHead>Nhận thông báo</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.lien_he.length ? (
                        selected.lien_he.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell>{contact.ten_hien_thi}</TableCell>
                            <TableCell>{compactText(contact.so_dien_thoai)}</TableCell>
                            <TableCell>{contactRoleLabel(contact.vai_tro_lien_he)}</TableCell>
                            <TableCell>{yesNo(contact.la_lien_he_chinh)}</TableCell>
                            <TableCell>{yesNo(contact.nhan_thong_bao)}</TableCell>
                            <TableCell>{contactStatusLabel(contact.trang_thai_lien_he)}</TableCell>
                            <TableCell>{compactText(contact.ghi_chu)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="py-8 text-center text-[var(--muted)]" colSpan={7}>
                            Chưa có liên hệ chính thức.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90">
              <CardHeader>
                <p className="eyebrow">Liên hệ nháp</p>
                <CardTitle>Dữ liệu chờ duyệt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[360px] overflow-auto rounded-xl border border-[var(--line)] bg-white">
                  <Table className="min-w-[1160px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Đề xuất tên/SĐT</TableHead>
                        <TableHead>Dữ liệu gốc Excel</TableHead>
                        <TableHead>Trạng thái rà soát</TableHead>
                        <TableHead>Cảnh báo</TableHead>
                        <TableHead>Ghi chú nghiệp vụ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.contactCandidates.length ? (
                        selected.contactCandidates.map((candidate) => (
                          <TableRow key={candidate.id}>
                            <TableCell>
                              <strong>{compactText(candidate.ten_hien_thi_parse)}</strong>
                              <br />
                              {compactText(candidate.so_dien_thoai_parse)}
                            </TableCell>
                            <TableCell>
                              <strong>{compactText(candidate.ten_chu_ho_goc)}</strong>
                              <br />
                              {compactText(candidate.ten_nguoi_su_dung_goc)}
                              <br />
                              {compactText(candidate.so_dien_thoai_goc)}
                              <br />
                              <span className="text-[var(--muted)]">{compactText(candidate.thong_tin_phu_goc)}</span>
                            </TableCell>
                            <TableCell>
                              {contactReviewStatusLabel(candidate.trang_thai_duyet)}
                              <br />
                              {candidate.co_can_ra_soat ? "Cần rà soát" : "Tương đối sạch"}
                              <br />
                              <span className="text-[var(--muted)]">{compactText(candidate.ly_do_ra_soat)}</span>
                            </TableCell>
                            <TableCell>
                              {candidate.flags.length
                                ? candidate.flags.map((flag) => reviewFlagLabel(flag)).join(", ")
                                : "-"}
                            </TableCell>
                            <TableCell>{compactText(candidate.ghi_chu_nghiep_vu || candidate.ghi_chu_goc)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell className="py-8 text-center text-[var(--muted)]" colSpan={5}>
                            Không có liên hệ nháp cho căn này.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <Card className="order-5 bg-white/90">
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-[var(--accent)]" size={20} aria-hidden="true" />
              <CardTitle>Lịch sử nhập dữ liệu</CardTitle>
            </div>
            <CardDescription className="mt-2">Các file đã nhập gần nhất, cuộn trong card.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[360px] overflow-auto rounded-xl border border-[var(--line)] bg-white">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Loại nguồn</TableHead>
                  <TableHead>Tên file</TableHead>
                  <TableHead>Số dòng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời điểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.latestImports.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>#{item.id}</TableCell>
                    <TableCell>{importSourceLabel(item.loai_nguon)}</TableCell>
                    <TableCell>{item.ten_file}</TableCell>
                    <TableCell>{formatNumber(item.so_dong)}</TableCell>
                    <TableCell>{importStatusLabel(item.trang_thai)}</TableCell>
                    <TableCell>{formatDateTime(item.thoi_diem_nhap)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminFrame>
  );
}

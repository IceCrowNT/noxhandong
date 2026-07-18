import { Database, FileSpreadsheet, FileText } from "lucide-react";

import { AdminFrame } from "@/components/admin/admin-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/src/modules/auth/current-user";
import { getApartmentDashboardData } from "@/src/modules/apartments/dashboard";
import { searchGlobalFinancialData } from "@/src/modules/apartments/financial-profile";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";
import { ApartmentFinancialProfileView } from "./apartment-financial-profile";
import { TransactionSearchResults } from "./transaction-search-results";
import { Search } from "lucide-react";

type DatabasePageProps = {
  searchParams?: Promise<{
    ky_phi?: string;
    thang_da_dong?: string;
    xuat_thang?: string;
    ma_can_tra_cuu?: string;
  }>;
};

function formatDateTime(value: string | null) {
  return formatVietnamDateTime(value);
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "-";
}

function periodToMonthInput(period: string | null | undefined) {
  const match = String(period || "").match(/^T(\d{1,2})-(\d{4})$/i);
  if (!match) return "";
  const month = String(Number(match[1])).padStart(2, "0");
  const year = match[2];
  return `${year}-${month}`;
}

function monthInputToPeriod(value: string | null | undefined) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return `T${Number(match[2])}-${match[1]}`;
}

function normalizeMonthInput(value: string | null | undefined) {
  return /^\d{4}-\d{2}$/.test(String(value || "")) ? String(value) : "";
}

function FeeNoticeList({
  options,
  selected,
  selectedPeriod,
}: {
  options: Array<{ key: string; label: string; count: number }>;
  selected: {
    key: string;
    label: string;
    count: number;
    apartmentGroups: Array<{ lot: string; apartmentCodes: string[] }>;
    noticePeriod: { label: string; paidThrough: string };
  } | null;
  selectedPeriod: string | null;
}) {
  if (!options.length || !selected) return null;

  return (
    <Card className="bg-white/90">
      <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Lập danh sách thông báo thu phí</CardTitle>
          <CardDescription>
            Lọc các căn đã đóng chính xác đến một tháng; không gồm căn đóng lẻ hoặc đã đóng vượt mốc.
          </CardDescription>
        </div>
        <form action="/admin/database" className="flex flex-wrap items-end gap-2">
          {selectedPeriod ? <input name="ky_phi" type="hidden" value={selectedPeriod} /> : null}
          <label className="grid gap-1 text-xs font-semibold text-[var(--muted)]">
            Đã đóng chính xác đến
            <select
              className="h-10 min-w-[190px] rounded-md border border-[var(--line)] bg-white px-3 text-sm font-medium"
              defaultValue={selected.key}
              name="thang_da_dong"
            >
              {options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label} · {formatNumber(option.count)} căn
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">Lọc danh sách</Button>
          {selectedPeriod ? (
            <>
              <Button asChild type="button">
                <a
                  href={`/api/export/fee-notice-list?period=${encodeURIComponent(selectedPeriod)}&paidThrough=${encodeURIComponent(
                    selected.noticePeriod.paidThrough,
                  )}`}
                >
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  Xuất Excel
                </a>
              </Button>
              <Button asChild type="button" variant="secondary">
                <a
                  href={`/api/export/fee-notice-docx?period=${encodeURIComponent(selectedPeriod)}&paidThrough=${encodeURIComponent(
                    selected.noticePeriod.paidThrough,
                  )}`}
                >
                  <FileText size={16} aria-hidden="true" />
                  Xuất Word
                </a>
              </Button>
            </>
          ) : null}
        </form>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--line)] bg-white p-3">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Mốc đã đóng</span>
            <strong className="mt-1 block text-lg">{selected.label}</strong>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-white p-3">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Kỳ thông báo 6 tháng</span>
            <strong className="mt-1 block text-lg text-[var(--accent)]">{selected.noticePeriod.label}</strong>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-white p-3">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Số căn cần thông báo</span>
            <strong className="mt-1 block text-lg">{formatNumber(selected.count)} căn</strong>
          </div>
        </div>
        <div className="max-h-96 space-y-3 overflow-y-auto overscroll-contain rounded-lg border border-[var(--line)] bg-white p-3">
          {selected.apartmentGroups.map((group) => (
            <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3" key={group.lot}>
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
                <strong className="text-base text-[var(--accent)]">Lô {group.lot}</strong>
                <span className="text-xs font-semibold text-[var(--muted)]">
                  {formatNumber(group.apartmentCodes.length)} căn
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
                {group.apartmentCodes.map((code) => (
                  <div
                    className="rounded-md border border-[var(--line)] bg-white px-2 py-2 text-center text-sm font-semibold"
                    key={code}
                  >
                    {code}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminDatabasePage({ searchParams }: DatabasePageProps) {
  const account = await requirePermission("VIEW_DASHBOARD");
  const params = searchParams ? await searchParams : undefined;
  const maCanTraCuu = params?.ma_can_tra_cuu;
  const globalSearch = maCanTraCuu ? await searchGlobalFinancialData(maCanTraCuu) : null;
  const data = await getApartmentDashboardData("", params?.ky_phi, params?.thang_da_dong);
  const latestImport = data.latestImports[0] || null;
  const feeOverview = data.summary.feeOverview;
  const defaultExportMonth =
    normalizeMonthInput(params?.xuat_thang) ||
    periodToMonthInput(data.summary.selectedFeePeriod) ||
    periodToMonthInput(data.summary.currentBatch?.ky_du_lieu) ||
    "";
  const requestedExportPeriod = monthInputToPeriod(defaultExportMonth);
  const exportPeriodExists = requestedExportPeriod
    ? data.summary.publishedFeePeriods.some((period) => period.period === requestedExportPeriod)
    : false;
  const exportPeriod =
    exportPeriodExists && requestedExportPeriod
      ? requestedExportPeriod
      : data.summary.selectedFeePeriod || data.summary.currentBatch?.ky_du_lieu || null;
  const exportPeriodLabel = exportPeriod || "Chưa chọn kỳ dữ liệu";

  return (
    <AdminFrame
      activeKey="database"
      badge="Cơ sở dữ liệu"
      title="Cơ sở dữ liệu"
      description={`${account.ten_hien_thi || account.ten_dang_nhap} có thể xuất file và lập danh sách thông báo thu phí từ dữ liệu đã công khai.`}
    >
      <section className="mb-5">
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Tra cứu thông tin tài chính căn hộ</CardTitle>
            <CardDescription>Nhập mã căn hộ để xem toàn bộ lịch sử thu phí và bằng chứng giao dịch.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/admin/database" className="flex flex-wrap items-end gap-2 max-w-md">
              <label className="grid flex-1 gap-1 text-xs font-semibold text-[var(--muted)]">
                Mã căn hộ
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted)]">
                    <Search size={16} aria-hidden="true" />
                  </div>
                  <input
                    name="ma_can_tra_cuu"
                    className="block h-10 w-full rounded-md border border-[var(--line)] bg-white py-2 pl-10 pr-3 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    placeholder="Nhập mã căn, tên người chuyển, số tài khoản, nội dung..."
                    defaultValue={maCanTraCuu || ""}
                  />
                </div>
              </label>
              <Button type="submit" variant="default">Tra cứu</Button>
            </form>

            {maCanTraCuu && globalSearch && (
              <div className="mt-6">
                {globalSearch.apartmentProfile ? (
                  <ApartmentFinancialProfileView data={globalSearch.apartmentProfile} />
                ) : null}

                {globalSearch.transactions.length > 0 || globalSearch.boSung.length > 0 ? (
                  <TransactionSearchResults transactions={globalSearch.transactions} boSung={globalSearch.boSung} />
                ) : null}

                {!globalSearch.apartmentProfile && globalSearch.transactions.length === 0 && globalSearch.boSung.length === 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    Không tìm thấy dữ liệu nào khớp với từ khóa <strong>{maCanTraCuu}</strong>.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mb-5">
        <Card className="bg-white/90">
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                <Database size={14} aria-hidden="true" />
                Cơ sở dữ liệu
              </div>
              <CardTitle>Dữ liệu mới nhất và xuất file</CardTitle>
              <CardDescription>
                {data.summary.currentBatch
                  ? `Public hiện hành: ${data.summary.currentBatch.ky_du_lieu} · ${formatDateTime(data.summary.currentBatch.public_luc)}`
                  : "Chưa có dữ liệu public hiện hành."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--line)] bg-white p-4 text-sm">
                <span className="block text-xs font-semibold uppercase text-[var(--muted)]">Public hiện hành</span>
                <strong className="mt-1 block text-lg">
                  {data.summary.currentBatch?.ky_du_lieu || data.summary.selectedFeePeriod || "-"}
                </strong>
                <span className="text-[var(--muted)]">
                  {data.summary.currentBatch?.public_luc ? formatDateTime(data.summary.currentBatch.public_luc) : "Chưa công khai"}
                </span>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-white p-4 text-sm">
                <span className="block text-xs font-semibold uppercase text-[var(--muted)]">Import gần nhất</span>
                {latestImport ? (
                  <>
                    <strong className="mt-1 block max-w-[520px] truncate" title={latestImport.ten_file}>
                      {latestImport.ten_file}
                    </strong>
                    <span className="text-[var(--muted)]">{formatDateTime(latestImport.thoi_diem_nhap)}</span>
                  </>
                ) : (
                  <span className="text-[var(--muted)]">Chưa có lịch sử import.</span>
                )}
              </div>
            </div>

            {exportPeriod ? (
              <form action="/admin/database" className="grid gap-2 lg:min-w-[420px]">
                <label className="grid gap-1 text-xs font-semibold text-[var(--muted)]">
                  Xuất theo tháng
                  <div className="flex flex-wrap gap-2">
                    {params?.ky_phi ? <input name="ky_phi" type="hidden" value={params.ky_phi} /> : null}
                    {params?.thang_da_dong ? (
                      <input name="thang_da_dong" type="hidden" value={params.thang_da_dong} />
                    ) : null}
                    <input
                      className="h-10 min-w-[220px] rounded-md border border-[var(--line)] bg-white px-3 text-sm font-medium"
                      defaultValue={defaultExportMonth}
                      name="xuat_thang"
                      type="month"
                    />
                    <Button type="submit" variant="secondary">
                      Xem kỳ
                    </Button>
                  </div>
                </label>
                <div className="text-xs text-[var(--muted)]">
                  Kỳ xuất đang dùng: <b className="text-[var(--text)]">{exportPeriodLabel}</b>
                  {!exportPeriodExists && requestedExportPeriod ? (
                    <span> · Chưa có batch public đúng tháng này, hệ thống đang dùng kỳ public gần nhất.</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button asChild type="button" variant="secondary">
                    <a href={`/api/export/monthly-fee-ledger?period=${encodeURIComponent(exportPeriod)}`}>
                      <FileSpreadsheet size={16} aria-hidden="true" />
                      Xuất Excel dữ liệu tháng
                    </a>
                  </Button>
                  <Button asChild type="button">
                    <a href={`/api/export/monthly-bank-statement?period=${encodeURIComponent(exportPeriod)}`}>
                      <FileText size={16} aria-hidden="true" />
                      Xuất sao kê tháng này
                    </a>
                  </Button>
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="mb-5">
        <FeeNoticeList
          options={feeOverview.exactPaidThroughOptions}
          selected={feeOverview.selectedNoticeGroup}
          selectedPeriod={data.summary.selectedFeePeriod}
        />
      </section>
    </AdminFrame>
  );
}

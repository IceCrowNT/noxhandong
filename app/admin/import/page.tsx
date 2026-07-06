import { CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";

import {
  createHistoricalSupplementAction,
  importBankStatementAction,
  importFeeTrackingWorkbookAction,
} from "@/app/admin/import/actions";
import { AdminFrame, ScrollPanel } from "@/components/admin/admin-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireAdminRole } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import { importSourceLabel, importStatusLabel, publicBatchStatusLabel } from "@/src/modules/shared/labels";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";

type AdminImportPageProps = {
  searchParams?: Promise<{
    checked?: string;
    imported?: string;
    published?: string;
    importBatchId?: string;
    publicBatchId?: string;
    rows?: string;
    invalidApartmentRows?: string;
    missingPaidThroughRows?: string;
    unparsedPaidThroughRows?: string;
    partialPaymentRows?: string;
    outsideBaseYearRows?: string;
    error?: string;
    statementChecked?: string;
    statementImported?: string;
    statementRows?: string;
    statementIncomeRows?: string;
    statementSkippedExpenseRows?: string;
    statementSkippedClosingRows?: string;
    statementBatchId?: string;
    statementParsedValidRows?: string;
    statementUnparsedRows?: string;
    statementMultiCandidateRows?: string;
    statementReviewRowsCreated?: string;
    statementError?: string;
    historyPreviewed?: string;
    historyPublished?: string;
    historyPreviewCancelled?: string;
    approvedHistoryRows?: string;
    changedApartmentCount?: string;
    historyRowsLinked?: string;
    historyPublishError?: string;
    historicalCreated?: string;
    historicalApartment?: string;
    historicalHistoryId?: string;
    historicalSupplementId?: string;
    historicalError?: string;
  }>;
};

type SearchParams = Awaited<AdminImportPageProps["searchParams"]>;

function formatDateTime(value: Date | null | undefined) {
  return formatVietnamDateTime(value);
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "-";
}

function numberParam(value: string | undefined) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusMessage(params?: SearchParams) {
  if (params?.published === "1") {
    return `Đã nhập file và công khai batch #${params.publicBatchId || "-"} cho cư dân tra cứu ${params.rows || "0"} căn.`;
  }
  if (params?.checked === "1" || params?.imported === "1") {
    return `Đã kiểm tra file batch #${params.importBatchId || "-"} với ${params.rows || "0"} dòng. Dữ liệu chưa công khai cho cư dân.`;
  }
  if (params?.error === "missing_file") return "Chưa chọn file Excel để nhập.";
  if (params?.error === "file_too_large") return "File quá lớn. Giới hạn hiện tại là 15 MB.";
  if (params?.error === "invalid_file_type") return "Chỉ hỗ trợ file Excel .xlsx hoặc .xls.";
  if (params?.error === "invalid_excel_confirm") return "Muốn chốt public từ Excel, cần gõ đúng mã xác nhận CHOT_EXCEL.";
  if (params?.error === "import_failed") {
    return "Không nhập được file. Kiểm tra đúng mẫu file theo dõi thu phí và sheet Lịch sử đóng phí.";
  }
  if (params?.statementChecked === "1") {
    return `Đã kiểm tra sao kê: ${params.statementIncomeRows || "0"} dòng thu, ${params.statementUnparsedRows || "0"} dòng chưa nhận diện căn. Dữ liệu chưa ghi vào DB.`;
  }
  if (params?.statementImported === "1") {
    return `Đã nhập sao kê vào staging batch #${params.statementBatchId || "-"}: ${params.statementIncomeRows || "0"} dòng thu, bỏ qua ${params.statementSkippedClosingRows || "0"} dòng đã thuộc mốc chốt, tạo ${params.statementReviewRowsCreated || "0"} dòng cần duyệt mới.`;
  }
  if (params?.historyPublished === "1") {
    return `Đã chốt public batch #${params.publicBatchId || "-"} từ lịch sử phí đã duyệt: ${params.rows || "0"} căn, ${params.historyRowsLinked || "0"} dòng lịch sử đã gắn vào batch.`;
  }
  if (params?.historyPreviewed === "1") {
    return `Đã tạo preview batch #${params.publicBatchId || "-"}: ${params.rows || "0"} căn, ${params.changedApartmentCount || "0"} căn có thay đổi. Dữ liệu chưa công khai.`;
  }
  if (params?.historyPreviewCancelled === "1") {
    return "Đã hủy preview batch nháp.";
  }
  if (params?.statementError === "missing_file") return "Chưa chọn file sao kê để nhập.";
  if (params?.statementError === "file_too_large") return "File sao kê quá lớn. Giới hạn hiện tại là 15 MB.";
  if (params?.statementError === "invalid_file_type") return "Chỉ hỗ trợ file sao kê .xlsx hoặc .xls.";
  if (params?.statementError === "import_failed") return "Không xử lý được file sao kê. Kiểm tra đúng file export từ ngân hàng.";
  if (params?.historyPublishError === "invalid_period") return "Kỳ dữ liệu cần dùng định dạng T6-2026.";
  if (params?.historyPublishError === "invalid_batch") return "Batch public cần chốt không hợp lệ.";
  if (params?.historyPublishError === "preview_failed") return "Không tạo được preview batch public từ lịch sử phí đã duyệt.";
  if (params?.historyPublishError === "publish_failed") return "Không chốt được batch public từ lịch sử phí đã duyệt.";
  if (params?.historyPublishError === "cancel_failed") return "Không hủy được preview batch nháp.";
  if (params?.historicalCreated === "1") {
    return `Đã ghi bổ sung giao dịch quá khứ cho căn ${params.historicalApartment || "-"}, tạo dòng lịch sử phí #${params.historicalHistoryId || "-"}.`;
  }
  if (params?.historicalError === "invalid") return "Thiếu mã căn hoặc số tiền bổ sung không hợp lệ.";
  if (params?.historicalError === "invalid_apartment") return "Mã căn bổ sung quá khứ không tồn tại trong DB.";
  if (params?.historicalError === "missing_evidence") return "Cần có ít nhất ghi chú xác minh hoặc file bằng chứng cho giao dịch quá khứ.";
  if (params?.historicalError === "file_too_large") return "File bằng chứng quá lớn. Giới hạn hiện tại là 15 MB.";
  if (params?.historicalError === "create_failed") return "Không tạo được bổ sung giao dịch quá khứ.";
  return null;
}

function ImportResultSummary({ params }: { params?: SearchParams }) {
  if (!params || (!params.checked && !params.imported && !params.published)) {
    return null;
  }

  const summary = [
    { label: "Tổng dòng đọc được", value: numberParam(params.rows) },
    { label: "Mã căn không khớp", value: numberParam(params.invalidApartmentRows) },
    { label: "Thiếu tháng đã đóng", value: numberParam(params.missingPaidThroughRows) },
    { label: "Không parse được tháng", value: numberParam(params.unparsedPaidThroughRows) },
    { label: "Đóng lẻ tiền", value: numberParam(params.partialPaymentRows) },
    { label: "Ngoài năm 2026", value: numberParam(params.outsideBaseYearRows) },
  ];
  const hasBlockingIssue =
    numberParam(params.invalidApartmentRows) > 0 ||
    numberParam(params.missingPaidThroughRows) > 0 ||
    numberParam(params.unparsedPaidThroughRows) > 0;

  return (
    <Card className="mb-5 bg-white/90">
      <CardHeader>
        <CardTitle>{params.published ? "Kết quả công khai dữ liệu" : "Kết quả kiểm tra file"}</CardTitle>
        <CardDescription>
          {params.published
            ? "File đã được nhập, tạo snapshot và công khai cho cư dân."
            : "File đã được đọc vào vùng kiểm tra. Cư dân chưa thấy dữ liệu này."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((item) => (
            <div key={item.label} className="rounded-md border border-[var(--line)] bg-white p-4">
              <div className="text-sm text-[var(--muted)]">{item.label}</div>
              <div className="mt-1 text-2xl font-semibold">{formatNumber(item.value)}</div>
            </div>
          ))}
        </div>
        <div
          className={
            hasBlockingIssue
              ? "rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
              : "rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
          }
        >
          {hasBlockingIssue
            ? "File có lỗi cần xử lý trước khi công khai. Hãy kiểm tra lại mã căn, cột tháng đã đóng và file nguồn."
            : "File đọc được đầy đủ mã căn và tháng đã đóng. Các dòng đóng lẻ/ngoài năm 2026 là dữ liệu cần chú ý nhưng không chặn công khai."}
        </div>
      </CardContent>
    </Card>
  );
}

function StatementResultSummary({ params }: { params?: SearchParams }) {
  if (!params || (!params.statementChecked && !params.statementImported)) {
    return null;
  }

  const summary = [
    { label: "Tổng dòng thô", value: numberParam(params.statementRows) },
    { label: "Dòng thu", value: numberParam(params.statementIncomeRows) },
    { label: "Dòng chi bỏ qua", value: numberParam(params.statementSkippedExpenseRows) },
    { label: "Đã thuộc mốc chốt", value: numberParam(params.statementSkippedClosingRows) },
    { label: "Nhận diện chắc", value: numberParam(params.statementParsedValidRows) },
    { label: "Nhiều căn", value: numberParam(params.statementMultiCandidateRows) },
    { label: "Chưa nhận diện", value: numberParam(params.statementUnparsedRows) },
  ];

  return (
    <Card className="mb-5 bg-white/90">
      <CardHeader>
        <CardTitle>{params.statementImported ? "Kết quả nhập sao kê" : "Kết quả kiểm tra sao kê"}</CardTitle>
        <CardDescription>
          Sao kê chỉ vào staging/luồng duyệt. Cư dân chưa thấy dữ liệu mới nếu chưa có bước chốt public.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((item) => (
            <div key={item.label} className="rounded-md border border-[var(--line)] bg-white p-4">
              <div className="text-sm text-[var(--muted)]">{item.label}</div>
              <div className="mt-1 text-2xl font-semibold">{formatNumber(item.value)}</div>
            </div>
          ))}
        </div>
        {params.statementImported ? (
          <Button asChild className="w-full sm:w-fit">
            <a href="/admin/transactions/review">Mở màn duyệt sao kê</a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function AdminImportPage({ searchParams }: AdminImportPageProps) {
  await requireAdminRole("SUPER_ADMIN");
  const params = await searchParams;
  const message = statusMessage(params);
  const isError = Boolean(params?.error || params?.statementError || params?.historyPublishError || params?.historicalError);

  const [imports, publicBatches, latestClosingsWithCutoff, recentHistoricalSupplements] = await Promise.all([
    prisma.loNhapDuLieu.findMany({
      orderBy: { thoi_diem_nhap: "desc" },
      take: 8,
      select: {
        id: true,
        loai_nguon: true,
        ten_file: true,
        so_dong: true,
        trang_thai: true,
        thoi_diem_nhap: true,
      },
    }),
    prisma.batchTrangThaiPhiPublic.findMany({
      orderBy: { id: "desc" },
      take: 8,
      select: {
        id: true,
        ky_du_lieu: true,
        ten_file_nguon: true,
        trang_thai: true,
        la_batch_public_hien_hanh: true,
        tong_so_can: true,
        public_luc: true,
      },
    }),
    prisma.soChotThang.findMany({
      where: {
        trang_thai: "DA_CHOT",
      },
      orderBy: { id: "desc" },
      take: 20,
      select: {
        id: true,
        ky_du_lieu: true,
        metadata_json: true,
      },
    }),
    prisma.boSungGiaoDichQuaKhu.findMany({
      orderBy: { id: "desc" },
      take: 6,
      select: {
        id: true,
        ky_du_lieu: true,
        thang_ap_dung: true,
        so_tien: true,
        ngay_giao_dich_goc: true,
        loai_bang_chung: true,
        duong_dan_file: true,
        noi_dung_xac_minh: true,
        ngay_tao: true,
        can_ho: {
          select: { ma_can: true },
        },
      },
    }),
  ]);
  const currentPublicBatch = publicBatches.find((batch) => batch.la_batch_public_hien_hanh) || publicBatches[0] || null;
  const latestClosingWithCutoff = latestClosingsWithCutoff.find((closing) => {
    const metadata = closing.metadata_json;
    return Boolean(
      metadata &&
        typeof metadata === "object" &&
        "chotDenThoiDiem" in metadata &&
        (metadata as { chotDenThoiDiem?: unknown }).chotDenThoiDiem,
    );
  });
  const rawCutoff =
    latestClosingWithCutoff?.metadata_json &&
    typeof latestClosingWithCutoff.metadata_json === "object" &&
    "chotDenThoiDiem" in latestClosingWithCutoff.metadata_json
      ? String((latestClosingWithCutoff.metadata_json as { chotDenThoiDiem?: unknown }).chotDenThoiDiem || "")
      : "";
  const closingCutoff = rawCutoff ? new Date(rawCutoff) : null;
  const hasValidClosingCutoff = Boolean(closingCutoff && !Number.isNaN(closingCutoff.getTime()));
  const afterClosingWhere = hasValidClosingCutoff
    ? { ngay_giao_dich: { gt: closingCutoff as Date } }
    : { id: { lt: 0 } };
  const [rawStatementAfterClosingCount, reviewStatsAfterClosing] = await Promise.all([
    prisma.giaoDichSaoKeThoChuan.count({
      where: {
        la_giao_dich_thu: true,
        ...afterClosingWhere,
      },
    }),
    prisma.giaoDichNganHang.groupBy({
      by: ["trang_thai_duyet"],
      _count: { _all: true },
      where: {
        so_tien: { gt: 0 },
        ...afterClosingWhere,
      },
    }),
  ]);
  const reviewMap = new Map(reviewStatsAfterClosing.map((item) => [item.trang_thai_duyet, item._count._all]));
  const pendingReviewCount = (reviewMap.get("CHUA_DUYET") || 0) + (reviewMap.get("DA_RA_SOAT") || 0);

  return (
    <AdminFrame
      activeKey="import"
      badge="Quản trị cao nhất"
      title="Nhập dữ liệu phí"
      description="Luồng chính là upload sao kê/Excel vào hệ thống. Duyệt giao dịch và chốt public nằm ở màn Duyệt sao kê."
    >
      {message ? (
        <Notice tone={isError ? "error" : "success"}>{message}</Notice>
      ) : null}

      <ImportResultSummary params={params} />
      <StatementResultSummary params={params} />

      <section className="mb-5 grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white/90">
          <CardContent className="flex h-full min-h-[118px] flex-col justify-between p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Public hiện hành</span>
            <div>
              <strong className="mt-2 block text-xl">{currentPublicBatch?.ky_du_lieu || "-"}</strong>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {currentPublicBatch ? `Batch #${currentPublicBatch.id} · ${formatNumber(currentPublicBatch.tong_so_can)} căn` : "Chưa có batch public"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="flex h-full min-h-[118px] flex-col justify-between p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Mốc Excel chuẩn</span>
            <div>
              <strong className="mt-2 block text-xl">{latestClosingWithCutoff?.ky_du_lieu || "-"}</strong>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {hasValidClosingCutoff ? formatDateTime(closingCutoff) : "Chưa có cutoff"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="flex h-full min-h-[118px] flex-col justify-between p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Chờ duyệt sau mốc chốt</span>
            <div>
              <strong className="mt-2 block text-xl">{formatNumber(pendingReviewCount)}</strong>
              <p className="mt-1 text-sm text-[var(--muted)]">chỉ tính phát sinh sau Excel chuẩn</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="flex h-full min-h-[118px] flex-col justify-between p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Sao kê phát sinh</span>
            <div>
              <strong className="mt-2 block text-xl">{formatNumber(rawStatementAfterClosingCount)}</strong>
              <p className="mt-1 text-sm text-[var(--muted)]">dòng thu sau mốc Excel chuẩn</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="mb-5 bg-white/90">
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Upload size={20} aria-hidden="true" />
          </div>
          <CardTitle>Nhập sao kê ngân hàng</CardTitle>
          <CardDescription>
            Luồng chính từ T6/2026: upload sao kê, lọc dòng thu sau mốc chốt và đưa vào màn duyệt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={importBankStatementAction} className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_auto] xl:items-end">
            <Label className="grid gap-2">
              File sao kê
              <Input
                accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="h-10"
                name="bankStatementFile"
                required
                type="file"
              />
            </Label>
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <SubmitButton className="w-full sm:w-auto" name="intent" value="import_statement" pendingText="Đang nhập sao kê...">
                <CheckCircle2 size={17} aria-hidden="true" />
                Nhập sao kê
              </SubmitButton>
            </div>
          </form>
          <div className="mt-4 grid gap-2 rounded-lg border border-[var(--border-subtle)] bg-white/70 p-4 text-sm leading-6 text-[var(--muted)] md:grid-cols-3">
            <span><b>1.</b> Lưu raw chống trùng.</span>
            <span><b>2.</b> Tạo giao dịch cần duyệt.</span>
            <span><b>3.</b> Chưa công khai cho cư dân.</span>
          </div>
        </CardContent>
      </Card>

      <details className="mb-5 overflow-hidden rounded-xl border border-[var(--line)] bg-white/90">
        <summary className="cursor-pointer list-none px-6 py-5">
          <div className="text-lg font-semibold">Cửa sau: Excel theo dõi thu phí</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Chỉ dùng khi cần chốt sổ thủ công, tạo opening balance hoặc phục hồi dữ liệu đặc biệt.
          </div>
        </summary>
        <div className="border-t border-[var(--line)] px-6 py-5">
        <CardHeader className="hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Upload size={20} aria-hidden="true" />
          </div>
          <CardTitle>Cửa sau: Excel theo dõi thu phí</CardTitle>
          <CardDescription>
            Chỉ dùng để chốt sổ thủ công, tạo opening balance hoặc phục hồi dữ liệu đặc biệt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={importFeeTrackingWorkbookAction} className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_220px_220px_auto] xl:items-end">
            <Label className="grid gap-2">
              File Excel
              <Input
                accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="h-10"
                name="feeTrackingFile"
                required
                type="file"
              />
            </Label>
            <Label className="grid gap-2">
              Excel chốt đến
              <Input name="closingCutoffAt" type="datetime-local" />
            </Label>
            <Label className="grid gap-2">
              Mã xác nhận khi chốt public
              <Input name="confirmExcelPublic" placeholder="CHOT_EXCEL" />
            </Label>
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <SubmitButton className="w-full sm:w-auto" variant="secondary" name="intent" value="import_only" pendingText="Đang kiểm tra file...">
                Kiểm tra file
              </SubmitButton>
              <SubmitButton className="w-full sm:w-auto" name="intent" value="import_and_publish" pendingText="Đang chốt public...">
                <CheckCircle2 size={17} aria-hidden="true" />
                Chốt public từ Excel
              </SubmitButton>
            </div>
          </form>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Chốt từ Excel sẽ ghi public trực tiếp. Cần nhập đúng <strong>CHOT_EXCEL</strong> để tránh bấm nhầm.
          </div>
        </CardContent>
        </div>
      </details>

      <details className="mb-5 overflow-hidden rounded-xl border border-[var(--line)] bg-white/90">
        <summary className="cursor-pointer list-none px-6 py-5">
          <div className="text-lg font-semibold">Bổ sung giao dịch quá khứ</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Mở khi cần xử lý các giao dịch cũ được cư dân xác nhận bổ sung.
          </div>
        </summary>
        <div className="border-t border-[var(--line)] px-6 py-5">
        <CardHeader className="hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <CardTitle>Bổ sung giao dịch quá khứ</CardTitle>
          <CardDescription>
            Dùng cho case chuyển khoản cũ không ghi mã căn, sau này cư dân mới xác nhận bằng Zalo hoặc sao kê riêng. Hệ thống sẽ lưu hồ sơ xác minh và sinh dòng lịch sử phí chuẩn để preview/public nhận được.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <form action={createHistoricalSupplementAction} className="grid gap-4 xl:grid-cols-2">
            <Label className="grid gap-2">
              Mã căn
              <Input name="apartmentCode" placeholder="Ví dụ L2.511A" required />
            </Label>
            <Label className="grid gap-2">
              Số tiền
              <Input name="amount" type="text" placeholder="Ví dụ 1500000 hoặc -1500000" required />
            </Label>

            <Label className="grid gap-2">
              Ngày giao dịch gốc
              <Input name="occurredAt" type="datetime-local" />
            </Label>
            <Label className="grid gap-2">
              Loại bằng chứng
              <Input name="evidenceType" defaultValue="ZALO" placeholder="ZALO / SAO_KE_CU_DAN / GHI_CHU_THU_CONG" />
            </Label>
            <Label className="grid gap-2 xl:col-span-2">
              File bằng chứng
              <Input name="evidenceFile" type="file" accept="image/*,.pdf" />
            </Label>
            <Label className="grid gap-2 xl:col-span-2">
              Nội dung xác minh
              <Textarea
                name="evidenceNote"
                placeholder="Ví dụ: cư dân xác nhận qua Zalo ngày..., đây là giao dịch T3 cho căn L2.511A."
                rows={3}
              />
            </Label>
            <Label className="grid gap-2 xl:col-span-2">
              Ghi chú nội bộ
              <Textarea
                name="internalNote"
                placeholder="Ghi chú thêm nếu muốn lưu logic xử lý nội bộ."
                rows={2}
              />
            </Label>
            <div className="xl:col-span-2">
              <SubmitButton className="w-full sm:w-auto" pendingText="Đang ghi bổ sung giao dịch...">
                Ghi bổ sung giao dịch quá khứ
              </SubmitButton>
            </div>
          </form>

          <div className="grid gap-2 rounded-lg border border-[var(--border-subtle)] bg-white/70 p-4 text-sm leading-6 text-[var(--muted)]">
            <span><b>1.</b> Không sinh giao dịch ngân hàng giả.</span>
            <span><b>2.</b> Lưu hồ sơ xác minh riêng cho case quá khứ.</span>
            <span><b>3.</b> Sinh thẳng một dòng <code>lich_su_dong_phi_can_ho</code> với nguồn <code>BO_SUNG_QUA_KHU</code>.</span>
            <span><b>4.</b> Batch preview/public sau đó sẽ cộng nguồn này như lịch sử phí hợp lệ.</span>
          </div>

          {recentHistoricalSupplements.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {recentHistoricalSupplements.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block text-base">{item.can_ho.ma_can}</strong>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {item.ky_du_lieu}
                        {item.thang_ap_dung ? ` · ${item.thang_ap_dung}` : ""}
                        {` · ${formatNumber(Number(item.so_tien))} đ`}
                      </p>
                    </div>
                    <span className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                      {item.loai_bang_chung}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-[var(--muted)]">
                    {item.noi_dung_xac_minh || "Không có ghi chú xác minh."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                    <span>Tạo lúc: <b className="text-[var(--text)]">{formatDateTime(item.ngay_tao)}</b></span>
                    {item.ngay_giao_dich_goc ? (
                      <span>GD gốc: <b className="text-[var(--text)]">{formatDateTime(item.ngay_giao_dich_goc)}</b></span>
                    ) : null}
                    {item.duong_dan_file ? (
                      <a className="font-semibold text-[var(--accent)] underline" href={item.duong_dan_file} target="_blank">
                        Mở bằng chứng
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
        </div>
      </details>

      <details className="overflow-hidden rounded-xl border border-[var(--line)] bg-white/90">
        <summary className="cursor-pointer list-none px-6 py-5">
          <div className="text-lg font-semibold">Lịch sử import và public gần đây</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Mở khi cần xem lại lịch sử lô import, batch public và dữ liệu bổ sung gần nhất.
          </div>
        </summary>
        <div className="border-t border-[var(--line)] p-6">
      <div className="grid gap-5">
        <Card className="bg-white/90">
          <CardHeader>
            <FileSpreadsheet className="text-[var(--accent)]" size={22} aria-hidden="true" />
            <CardTitle>Dữ liệu công khai gần đây</CardTitle>
            <CardDescription>Lô phí đã tạo và trạng thái công khai hiện hành.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid min-w-0 gap-3 md:hidden">
              {publicBatches.map((batch) => (
                <div key={batch.id} className="min-w-0 rounded-xl border border-[var(--line)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block text-base">#{batch.id} · {batch.ky_du_lieu}</strong>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]" title={batch.ten_file_nguon || undefined}>
                        {batch.ten_file_nguon || "Không rõ file nguồn"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                      {batch.la_batch_public_hien_hanh ? "Hiện hành" : publicBatchStatusLabel(batch.trang_thai)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-[var(--muted)]">
                    <span>Số căn: <b className="text-[var(--text)]">{formatNumber(batch.tong_so_can)}</b></span>
                    <span>Trạng thái: <b className="text-[var(--text)]">{publicBatchStatusLabel(batch.trang_thai)}</b></span>
                    <span>Công khai lúc: <b className="text-[var(--text)]">{formatDateTime(batch.public_luc)}</b></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <ScrollPanel minWidth={1040}>
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[72px]">ID</TableHead>
                      <TableHead className="w-[120px]">Kỳ dữ liệu</TableHead>
                      <TableHead>File nguồn</TableHead>
                      <TableHead className="w-[110px] text-right">Số căn</TableHead>
                      <TableHead className="w-[140px]">Trạng thái</TableHead>
                      <TableHead className="w-[110px]">Hiện hành</TableHead>
                      <TableHead className="w-[170px]">Công khai lúc</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publicBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>#{batch.id}</TableCell>
                        <TableCell>{batch.ky_du_lieu}</TableCell>
                        <TableCell className="max-w-[380px] truncate" title={batch.ten_file_nguon || undefined}>
                          {batch.ten_file_nguon}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(batch.tong_so_can)}</TableCell>
                        <TableCell>{publicBatchStatusLabel(batch.trang_thai)}</TableCell>
                        <TableCell>{batch.la_batch_public_hien_hanh ? "Có" : "Không"}</TableCell>
                        <TableCell>{formatDateTime(batch.public_luc)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollPanel>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <FileSpreadsheet className="text-[var(--accent)]" size={22} aria-hidden="true" />
            <CardTitle>Lịch sử kiểm tra/import file</CardTitle>
            <CardDescription>Các lần đọc file gần nhất, gồm kiểm tra file và công khai dữ liệu.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid min-w-0 gap-3 md:hidden">
              {imports.map((item) => (
                <div key={item.id} className="min-w-0 rounded-xl border border-[var(--line)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-base">#{item.id} · {importSourceLabel(item.loai_nguon)}</strong>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]" title={item.ten_file}>
                        {item.ten_file}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                      {importStatusLabel(item.trang_thai)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-[var(--muted)]">
                    <span>Số dòng: <b className="text-[var(--text)]">{formatNumber(item.so_dong)}</b></span>
                    <span>Thời điểm: <b className="text-[var(--text)]">{formatDateTime(item.thoi_diem_nhap)}</b></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <ScrollPanel minWidth={1080}>
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[72px]">ID</TableHead>
                      <TableHead className="w-[180px]">Loại nguồn</TableHead>
                      <TableHead>Tên file</TableHead>
                      <TableHead className="w-[110px] text-right">Số dòng</TableHead>
                      <TableHead className="w-[140px]">Trạng thái</TableHead>
                      <TableHead className="w-[180px]">Thời điểm</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>#{item.id}</TableCell>
                        <TableCell>{importSourceLabel(item.loai_nguon)}</TableCell>
                        <TableCell className="max-w-[460px] truncate" title={item.ten_file}>
                          {item.ten_file}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(item.so_dong)}</TableCell>
                        <TableCell>{importStatusLabel(item.trang_thai)}</TableCell>
                        <TableCell>{formatDateTime(item.thoi_diem_nhap)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollPanel>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </details>
    </AdminFrame>
  );
}

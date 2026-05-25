import { CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";

import { importFeeTrackingWorkbookAction } from "@/app/admin/import/actions";
import { AdminFrame, ScrollPanel } from "@/components/admin/admin-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminRole } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import { importSourceLabel, importStatusLabel, publicBatchStatusLabel } from "@/src/modules/shared/labels";

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
  }>;
};

type SearchParams = Awaited<AdminImportPageProps["searchParams"]>;

function formatDateTime(value: Date | null | undefined) {
  return value ? value.toLocaleString("vi-VN") : "-";
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
  if (params?.error === "import_failed") {
    return "Không nhập được file. Kiểm tra đúng mẫu file theo dõi thu phí và sheet Lịch sử đóng phí.";
  }
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

export default async function AdminImportPage({ searchParams }: AdminImportPageProps) {
  await requireAdminRole("SUPER_ADMIN");
  const params = await searchParams;
  const message = statusMessage(params);
  const isError = Boolean(params?.error);

  const [imports, publicBatches] = await Promise.all([
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
  ]);

  return (
    <AdminFrame
      activeKey="import"
      badge="Quản trị cao nhất"
      title="Nhập dữ liệu phí"
      description="Kiểm tra file thu phí hoặc công khai dữ liệu mới cho cư dân tra cứu."
    >
      {message ? (
        <div
          className={
            isError
              ? "mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800"
              : "mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
          }
        >
          {message}
        </div>
      ) : null}

      <ImportResultSummary params={params} />

      <Card className="mb-5 bg-white/90">
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <Upload size={20} aria-hidden="true" />
          </div>
          <CardTitle>Upload Excel theo dõi thu phí</CardTitle>
          <CardDescription>
            Dùng cho file như <strong>Theo dõi thu phí T5.xlsx</strong>. Hệ thống đọc sheet{" "}
            <strong>Lịch sử đóng phí</strong>, lấy mã căn và cột <strong>Tháng đã đóng đến hiện tại</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={importFeeTrackingWorkbookAction} className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_auto] xl:items-end">
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
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Button className="w-full sm:w-auto" variant="secondary" name="intent" type="submit" value="import_only">
                Chỉ kiểm tra file
              </Button>
              <Button className="w-full sm:w-auto" name="intent" type="submit" value="import_and_publish">
                <CheckCircle2 size={17} aria-hidden="true" />
                Nhập và công khai cho cư dân
              </Button>
            </div>
          </form>

          <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-white/70 p-4 text-sm leading-6 text-[var(--muted)]">
            <strong>Khuyến nghị:</strong> dùng <strong>Chỉ kiểm tra file</strong> khi muốn xem file có đủ 934 dòng,
            có lỗi mã căn/tháng hay không. Dùng <strong>Nhập và công khai cho cư dân</strong> khi file đã đúng,
            vì cư dân sẽ thấy dữ liệu mới ngay sau khi công khai.
          </div>
        </CardContent>
      </Card>

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
    </AdminFrame>
  );
}

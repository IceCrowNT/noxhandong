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
    imported?: string;
    published?: string;
    importBatchId?: string;
    publicBatchId?: string;
    rows?: string;
    error?: string;
  }>;
};

function formatDateTime(value: Date | null | undefined) {
  return value ? value.toLocaleString("vi-VN") : "-";
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "-";
}

function statusMessage(params?: Awaited<AdminImportPageProps["searchParams"]>) {
  if (params?.published === "1") {
    return `Đã nhập file, tạo batch #${params.publicBatchId || "-"} và chốt công khai ${params.rows || "0"} căn.`;
  }
  if (params?.imported === "1") {
    return `Đã nhập file vào staging batch #${params.importBatchId || "-"} với ${params.rows || "0"} dòng.`;
  }
  if (params?.error === "missing_file") return "Chưa chọn file Excel để nhập.";
  if (params?.error === "file_too_large") return "File quá lớn. Giới hạn hiện tại là 15 MB.";
  if (params?.error === "invalid_file_type") return "Chỉ hỗ trợ file Excel .xlsx hoặc .xls.";
  if (params?.error === "import_failed") {
    return "Không nhập được file. Kiểm tra đúng mẫu file theo dõi thu phí và sheet Lịch sử đóng phí.";
  }
  return null;
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
        thoi_diem_nhap: true
      }
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
        public_luc: true
      }
    })
  ]);

  return (
    <AdminFrame
      activeKey="import"
      badge="Quản trị cao nhất"
      title="Nhập/chốt dữ liệu phí"
      description="Nhập file thu phí, theo dõi lịch sử dữ liệu và lô dữ liệu đang công khai cho cư dân tra cứu."
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
          <form action={importFeeTrackingWorkbookAction} className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end">
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
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" name="intent" type="submit" value="import_only">
                Chỉ nhập staging
              </Button>
              <Button name="intent" type="submit" value="import_and_publish">
                <CheckCircle2 size={17} aria-hidden="true" />
                Nhập và chốt công khai
              </Button>
            </div>
          </form>

          <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-white/70 p-4 text-sm leading-6 text-[var(--muted)]">
            <strong>Khuyến nghị:</strong> khi nhận file mới, hãy bấm <strong>Chỉ nhập staging</strong> trước để kiểm tra
            lịch sử import và báo cáo preview. Chỉ dùng <strong>Nhập và chốt công khai</strong> khi file đã đúng, vì cư
            dân sẽ thấy dữ liệu mới ngay sau khi chốt.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="bg-white/90">
          <CardHeader>
            <FileSpreadsheet className="text-[var(--accent)]" size={22} aria-hidden="true" />
            <CardTitle>Dữ liệu công khai gần đây</CardTitle>
            <CardDescription>Lô phí đã tạo và trạng thái công khai hiện hành.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollPanel minWidth={920}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Kỳ dữ liệu</TableHead>
                    <TableHead>File nguồn</TableHead>
                    <TableHead>Số căn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hiện hành</TableHead>
                    <TableHead>Công khai lúc</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>#{batch.id}</TableCell>
                      <TableCell>{batch.ky_du_lieu}</TableCell>
                      <TableCell>{batch.ten_file_nguon}</TableCell>
                      <TableCell>{formatNumber(batch.tong_so_can)}</TableCell>
                      <TableCell>{publicBatchStatusLabel(batch.trang_thai)}</TableCell>
                      <TableCell>{batch.la_batch_public_hien_hanh ? "Có" : "Không"}</TableCell>
                      <TableCell>{formatDateTime(batch.public_luc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollPanel>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <FileSpreadsheet className="text-[var(--accent)]" size={22} aria-hidden="true" />
            <CardTitle>File đã nhập</CardTitle>
            <CardDescription>Lịch sử các lô dữ liệu gần nhất.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollPanel minWidth={860}>
              <Table>
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
                  {imports.map((item) => (
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
            </ScrollPanel>
          </CardContent>
        </Card>
      </div>
    </AdminFrame>
  );
}

import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, XCircle } from "lucide-react";

import {
  cancelPreparedPublicBatchAction,
  publishPreparedPublicBatchAction,
} from "@/app/admin/import/actions";
import { AdminFrame, ScrollPanel } from "@/components/admin/admin-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminRole } from "@/src/modules/auth/current-user";
import { publicFeeDisplayText } from "@/src/modules/billing/fee-status";
import { prisma } from "@/src/modules/database";
import { publicBatchStatusLabel } from "@/src/modules/shared/labels";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";

type PublicPreviewPageProps = {
  searchParams?: Promise<{
    batchId?: string;
    q?: string;
    view?: string;
  }>;
};

type PreviewRow = {
  id: number;
  ma_can: string;
  previousDisplay: string;
  currentDisplay: string;
  addedMonths: number;
  approvedPaymentAmount: number;
  remainderAmount: number;
  historyCount: number;
  changed: boolean;
};

function formatDateTime(value: Date | null | undefined) {
  return formatVietnamDateTime(value);
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "-";
}

function formatMoney(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ" : "-";
}

function recordValue(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function payloadNumber(payload: unknown, key: string) {
  return numericValue(recordValue(payload)?.[key]);
}

function payloadArrayLength(payload: unknown, key: string) {
  return arrayValue(recordValue(payload)?.[key]).length;
}

function buildPreviewRows(
  currentRows: Array<{
    id: number;
    can_ho_id: number;
    ma_can: string;
    thang_da_dong_den_hien_tai: string | null;
    payload_public_json: unknown;
  }>,
  previousRows: Array<{
    can_ho_id: number;
    thang_da_dong_den_hien_tai: string | null;
    payload_public_json: unknown;
  }>,
) {
  const previousByApartmentId = new Map(previousRows.map((row) => [row.can_ho_id, row]));

  return currentRows.map((row): PreviewRow => {
    const previous = previousByApartmentId.get(row.can_ho_id) || null;
    const previousDisplay = previous
      ? publicFeeDisplayText(previous.payload_public_json, previous.thang_da_dong_den_hien_tai)
      : "Chưa có dữ liệu nền";
    const currentDisplay = publicFeeDisplayText(row.payload_public_json, row.thang_da_dong_den_hien_tai);
    const addedMonths = payloadNumber(row.payload_public_json, "addedMonths");
    const approvedPaymentAmount = payloadNumber(row.payload_public_json, "approvedPaymentAmount");
    const remainderAmount = payloadNumber(row.payload_public_json, "remainderAmount");
    const historyCount = payloadArrayLength(row.payload_public_json, "includedHistoryIds");

    return {
      id: row.id,
      ma_can: row.ma_can,
      previousDisplay,
      currentDisplay,
      addedMonths,
      approvedPaymentAmount,
      remainderAmount,
      historyCount,
      changed: previousDisplay !== currentDisplay || addedMonths > 0 || approvedPaymentAmount > 0,
    };
  });
}

export default async function PublicPreviewPage({ searchParams }: PublicPreviewPageProps) {
  await requireAdminRole("SUPER_ADMIN");
  const params = await searchParams;
  const batchId = Number(params?.batchId || 0);
  const q = (params?.q || "").trim().toUpperCase();
  const view = params?.view || "changed";

  if (!Number.isInteger(batchId) || batchId <= 0) {
    return (
      <AdminFrame activeKey="import" badge="Quản trị cao nhất" title="Preview public" description="Batch public không hợp lệ.">
        <Card className="bg-white/90">
          <CardContent className="p-6">
            <Button asChild variant="secondary">
              <Link href="/admin/import">Về trang nhập dữ liệu</Link>
            </Button>
          </CardContent>
        </Card>
      </AdminFrame>
    );
  }

  const batch = await prisma.batchTrangThaiPhiPublic.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      ky_du_lieu: true,
      ten_file_nguon: true,
      trang_thai: true,
      la_batch_public_hien_hanh: true,
      tong_so_can: true,
      metadata_json: true,
      public_luc: true,
      ngay_tao: true,
      trang_thai_phi: {
        orderBy: { ma_can: "asc" },
        select: {
          id: true,
          can_ho_id: true,
          ma_can: true,
          thang_da_dong_den_hien_tai: true,
          payload_public_json: true,
        },
      },
    },
  });

  const metadata = recordValue(batch?.metadata_json);
  const previousPublicBatchId = numericValue(metadata?.previousPublicBatchId);
  const previousRows = previousPublicBatchId
    ? await prisma.trangThaiPhiCanHoPublic.findMany({
        where: { batch_id: previousPublicBatchId },
        select: {
          can_ho_id: true,
          thang_da_dong_den_hien_tai: true,
          payload_public_json: true,
        },
      })
    : [];

  const rows = batch ? buildPreviewRows(batch.trang_thai_phi, previousRows) : [];
  const changedRows = rows.filter((row) => row.changed);
  const remainderRows = rows.filter((row) => row.remainderAmount > 0);
  const totalApprovedAmount = rows.reduce((sum, row) => sum + row.approvedPaymentAmount, 0);
  const rowsForView = (view === "all" ? rows : view === "remainder" ? remainderRows : changedRows).filter((row) =>
    q ? row.ma_can.includes(q) || row.previousDisplay.toUpperCase().includes(q) || row.currentDisplay.toUpperCase().includes(q) : true,
  );

  return (
    <AdminFrame
      activeKey="import"
      badge="Quản trị cao nhất"
      title="Preview public"
      description="Kiểm tra từng căn thay đổi trước khi chốt dữ liệu cho cư dân."
      headerActions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/import">Về nhập dữ liệu</Link>
        </Button>
      }
    >
      {!batch ? (
        <Card className="bg-white/90">
          <CardContent className="p-6 text-sm text-[var(--muted)]">Không tìm thấy batch public cần xem.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          <Card className="bg-white/90">
            <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Batch #{batch.id}</Badge>
                  <Badge variant={batch.trang_thai === "NHAP" ? "secondary" : "success"}>{publicBatchStatusLabel(batch.trang_thai)}</Badge>
                  {batch.la_batch_public_hien_hanh ? <Badge variant="success">Hiện hành</Badge> : null}
                </div>
                <CardTitle className="mt-3">{batch.ky_du_lieu}</CardTitle>
                <CardDescription>
                  Nguồn: {batch.ten_file_nguon || "-"} · tạo lúc {formatDateTime(batch.ngay_tao)}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {batch.trang_thai === "NHAP" ? (
                  <>
                    <form action={cancelPreparedPublicBatchAction}>
                      <input type="hidden" name="publicBatchId" value={batch.id} />
                      <SubmitButton variant="secondary" pendingText="Đang hủy...">
                        <XCircle size={16} aria-hidden="true" />
                        Hủy preview
                      </SubmitButton>
                    </form>
                    <form action={publishPreparedPublicBatchAction}>
                      <input type="hidden" name="publicBatchId" value={batch.id} />
                      <SubmitButton pendingText="Đang chốt batch...">
                        <CheckCircle2 size={16} aria-hidden="true" />
                        Xác nhận chốt
                      </SubmitButton>
                    </form>
                  </>
                ) : (
                  <Button asChild variant="secondary">
                    <Link href="/admin/import">Quay lại</Link>
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Metric label="Tổng snapshot" value={formatNumber(rows.length)} />
            <Metric label="Căn thay đổi" value={formatNumber(changedRows.length)} />
            <Metric label="Có tiền lẻ" value={formatNumber(remainderRows.length)} />
            <Metric label="Tổng tiền duyệt" value={formatMoney(totalApprovedAmount)} />
            <Metric label="Dòng lịch sử" value={formatNumber(rows.reduce((sum, row) => sum + row.historyCount, 0))} />
          </section>

          {batch.trang_thai === "NHAP" && changedRows.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                <span>Batch này chưa có căn thay đổi so với batch nền. Chỉ nên chốt nếu đây là thao tác kiểm thử hoặc có chủ đích.</span>
              </div>
            </div>
          ) : null}

          <Card className="bg-white/90">
            <CardHeader className="gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Danh sách căn trong preview</CardTitle>
                <CardDescription>Ưu tiên xem các căn thay đổi và các căn có phần tiền lẻ.</CardDescription>
              </div>
              <form className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_auto_auto_auto]">
                <input type="hidden" name="batchId" value={batch.id} />
                <Input name="q" defaultValue={q} placeholder="Tìm mã căn hoặc nội dung..." />
                <SubmitButton name="view" value="changed" variant={view === "changed" ? "default" : "secondary"} pendingText="Đang lọc...">
                  Thay đổi
                </SubmitButton>
                <SubmitButton name="view" value="remainder" variant={view === "remainder" ? "default" : "secondary"} pendingText="Đang lọc...">
                  Tiền lẻ
                </SubmitButton>
                <SubmitButton name="view" value="all" variant={view === "all" ? "default" : "secondary"} pendingText="Đang lọc...">
                  Tất cả
                </SubmitButton>
              </form>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:hidden">
                {rowsForView.map((row) => (
                  <PreviewCard key={row.id} row={row} />
                ))}
              </div>

              <div className="hidden md:block">
                <ScrollPanel minWidth={1120}>
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[110px]">Mã căn</TableHead>
                        <TableHead>Trước chốt</TableHead>
                        <TableHead>Sau preview</TableHead>
                        <TableHead className="w-[100px] text-right">+ Tháng</TableHead>
                        <TableHead className="w-[150px] text-right">Tiền duyệt</TableHead>
                        <TableHead className="w-[140px] text-right">Tiền lẻ</TableHead>
                        <TableHead className="w-[110px] text-right">Lịch sử</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rowsForView.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-semibold">{row.ma_can}</TableCell>
                          <TableCell>{row.previousDisplay}</TableCell>
                          <TableCell>{row.currentDisplay}</TableCell>
                          <TableCell className="text-right">{formatNumber(row.addedMonths)}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.approvedPaymentAmount)}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.remainderAmount)}</TableCell>
                          <TableCell className="text-right">{formatNumber(row.historyCount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollPanel>
              </div>

              {!rowsForView.length ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] p-6 text-sm text-[var(--muted)]">
                  Không có dòng phù hợp với bộ lọc hiện tại.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminFrame>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-white/90">
      <CardContent className="p-4">
        <span className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</span>
        <strong className="mt-1 block text-2xl">{value}</strong>
      </CardContent>
    </Card>
  );
}

function PreviewCard({ row }: { row: PreviewRow }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <strong className="text-lg">{row.ma_can}</strong>
        <Badge variant={row.changed ? "success" : "secondary"}>{row.changed ? "Có thay đổi" : "Không đổi"}</Badge>
      </div>
      <div className="mt-3 grid gap-2 text-sm leading-6">
        <span>
          <b>Trước:</b> {row.previousDisplay}
        </span>
        <span>
          <b>Sau:</b> {row.currentDisplay}
        </span>
        <span>
          <b>Tiền duyệt:</b> {formatMoney(row.approvedPaymentAmount)}
        </span>
        <span>
          <b>Tiền lẻ:</b> {formatMoney(row.remainderAmount)}
        </span>
      </div>
      {row.remainderAmount > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-900">
          Có phần tiền lẻ không đủ một tháng, được giữ để audit.
        </div>
      ) : null}
    </div>
  );
}

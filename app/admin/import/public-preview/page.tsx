import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, XCircle } from "lucide-react";

import {
  cancelPreparedPublicBatchAction,
  publishPreparedPublicBatchAction,
} from "@/app/admin/import/actions";
import { AdminFrame } from "@/components/admin/admin-frame";
import { EvidencePreviewDialog } from "@/components/admin/evidence-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminRole } from "@/src/modules/auth/current-user";
import { publicFeeDisplayText } from "@/src/modules/billing/fee-status";
import { prisma } from "@/src/modules/database";
import { evidenceTypeLabel, publicBatchStatusLabel } from "@/src/modules/shared/labels";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";
import { findApartmentMentionRanges } from "@/src/modules/transactions/parser/apartment-parser";

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
  hasNewPayment: boolean;
  transactions: Array<{
    id: number;
    content: string;
    parsedApartment: string | null;
    selectedApartment: string | null;
    sender: string | null;
    reference: string | null;
    transactionAt: string;
    evidence: Array<{
      id: number;
      type: string;
      filePath: string | null;
      fileName: string | null;
      mimeType: string | null;
      note: string | null;
    }>;
  }>;
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

function payloadHistoryIds(payload: unknown) {
  return arrayValue(recordValue(payload)?.includedHistoryIds)
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

function HighlightApartmentMentions({ content, apartmentCodes }: { content: string; apartmentCodes: string[] }) {
  const ranges = findApartmentMentionRanges(content, apartmentCodes);
  if (!ranges.length) return <>{content}</>;

  const parts: Array<{ text: string; highlighted: boolean }> = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    if (range.start > cursor) {
      parts.push({ text: content.slice(cursor, range.start), highlighted: false });
    }
    parts.push({ text: content.slice(range.start, range.end), highlighted: true });
    cursor = range.end;
  }
  if (cursor < content.length) {
    parts.push({ text: content.slice(cursor), highlighted: false });
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.highlighted) {
          return (
            <strong key={`${part.text}-${index}`} className="rounded bg-emerald-100 px-0.5 text-sm font-bold text-emerald-950">
              {part.text}
            </strong>
          );
        }
        return <span key={`${part.text}-${index}`}>{part.text}</span>;
      })}
    </>
  );
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
  historiesById: Map<
    number,
    {
      giao_dich_ngan_hang: {
        id: number;
        noi_dung_goc: string;
        ma_can_parse: string | null;
        ma_can_duoc_chon: string | null;
        ten_nguoi_chuyen: string | null;
        tham_chieu_ngan_hang: string | null;
        ngay_giao_dich: Date | null;
        chung_tu_doi_soat: Array<{
          id: number;
          loai_chung_tu: string;
          duong_dan_file: string | null;
          ten_file_goc: string | null;
          mime_type: string | null;
          ghi_chu: string | null;
        }>;
      } | null;
    }
  >,
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
    const transactionMap = new Map<number, PreviewRow["transactions"][number]>();
    for (const historyId of payloadHistoryIds(row.payload_public_json)) {
      const transaction = historiesById.get(historyId)?.giao_dich_ngan_hang;
      if (!transaction || transactionMap.has(transaction.id)) continue;
      transactionMap.set(transaction.id, {
        id: transaction.id,
        content: transaction.noi_dung_goc,
        parsedApartment: transaction.ma_can_parse,
        selectedApartment: transaction.ma_can_duoc_chon,
        sender: transaction.ten_nguoi_chuyen,
        reference: transaction.tham_chieu_ngan_hang,
        transactionAt: formatDateTime(transaction.ngay_giao_dich),
        evidence: (transaction.chung_tu_doi_soat || []).map((item) => ({
          id: item.id,
          type: item.loai_chung_tu,
          filePath: item.duong_dan_file,
          fileName: item.ten_file_goc,
          mimeType: item.mime_type,
          note: item.ghi_chu,
        })),
      });
    }

    return {
      id: row.id,
      ma_can: row.ma_can,
      previousDisplay,
      currentDisplay,
      addedMonths,
      approvedPaymentAmount,
      remainderAmount,
      historyCount,
      changed: previousDisplay !== currentDisplay || addedMonths > 0,
      hasNewPayment: approvedPaymentAmount > 0,
      transactions: [...transactionMap.values()],
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
  const includedHistoryIds = batch
    ? batch.trang_thai_phi.flatMap((row) => payloadHistoryIds(row.payload_public_json))
    : [];
  const includedHistories = includedHistoryIds.length
    ? await prisma.lichSuDongPhiCanHo.findMany({
        where: { id: { in: includedHistoryIds } },
        select: {
          id: true,
          giao_dich_ngan_hang: {
            select: {
              id: true,
              noi_dung_goc: true,
              ma_can_parse: true,
              ma_can_duoc_chon: true,
              ten_nguoi_chuyen: true,
              tham_chieu_ngan_hang: true,
              ngay_giao_dich: true,
              chung_tu_doi_soat: {
                orderBy: { id: "desc" },
                select: {
                  id: true,
                  loai_chung_tu: true,
                  duong_dan_file: true,
                  ten_file_goc: true,
                  mime_type: true,
                  ghi_chu: true,
                },
              },
            },
          },
        },
      })
    : [];
  const historiesById = new Map(includedHistories.map((history) => [history.id, history]));

  const rows = batch ? buildPreviewRows(batch.trang_thai_phi, previousRows, historiesById) : [];
  const changedRows = rows.filter((row) => row.changed);
  const remainderRows = rows.filter((row) => row.remainderAmount > 0);
  const paymentRows = rows.filter((row) => row.hasNewPayment);
  const totalApprovedAmount = rows.reduce((sum, row) => sum + row.approvedPaymentAmount, 0);
  const rowsForView = (
    view === "all"
      ? rows
      : view === "remainder"
        ? remainderRows
        : view === "payment"
          ? paymentRows
          : changedRows
  ).filter((row) =>
    q
      ? row.ma_can.includes(q) ||
        row.previousDisplay.toUpperCase().includes(q) ||
        row.currentDisplay.toUpperCase().includes(q) ||
        row.transactions.some(
          (transaction) =>
            transaction.content.toUpperCase().includes(q) ||
            transaction.parsedApartment?.toUpperCase().includes(q) ||
            transaction.selectedApartment?.toUpperCase().includes(q),
        )
      : true,
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
            <Metric label="Số dư chuyển kỳ" value={formatNumber(remainderRows.length)} />
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
                <CardDescription>Đối chiếu nhanh mã căn parser với nội dung chuyển khoản gốc trước khi chốt.</CardDescription>
              </div>
              <form className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_auto_auto_auto_auto]">
                <input type="hidden" name="batchId" value={batch.id} />
                <Input name="q" defaultValue={q} placeholder="Tìm mã căn hoặc nội dung..." />
                <SubmitButton name="view" value="changed" variant={view === "changed" ? "default" : "secondary"} pendingText="Đang lọc...">
                  Mốc phí thay đổi
                </SubmitButton>
                <SubmitButton name="view" value="payment" variant={view === "payment" ? "default" : "secondary"} pendingText="Đang lọc...">
                  Có giao dịch
                </SubmitButton>
                <SubmitButton name="view" value="remainder" variant={view === "remainder" ? "default" : "secondary"} pendingText="Đang lọc...">
                  Số dư
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
                <div className="overflow-hidden rounded-lg border border-[var(--line)]">
                  <Table className="w-full table-fixed text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[12%]">Mã căn</TableHead>
                        <TableHead className="w-[27%]">Nội dung chuyển khoản</TableHead>
                        <TableHead className="w-[9%]">Bằng chứng</TableHead>
                        <TableHead className="w-[16%]">Trước chốt</TableHead>
                        <TableHead className="w-[16%]">Sau preview</TableHead>
                        <TableHead className="w-[8%] text-right">+ Tháng</TableHead>
                        <TableHead className="w-[12%] text-right">Tiền duyệt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rowsForView.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="align-top">
                            <strong>{row.ma_can}</strong>
                          </TableCell>
                          <TableCell className="align-top">
                            <TransactionContentCell row={row} />
                          </TableCell>
                          <TableCell className="align-top">
                            <EvidenceCell row={row} />
                          </TableCell>
                          <TableCell className="align-top">{row.previousDisplay}</TableCell>
                          <TableCell className="align-top">{row.currentDisplay}</TableCell>
                          <TableCell className="text-right">{formatNumber(row.addedMonths)}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.approvedPaymentAmount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
      <div className="mt-3">
        <TransactionContentCell row={row} />
      </div>
      <div className="mt-3">
        <EvidenceCell row={row} />
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
      </div>
    </div>
  );
}

function EvidenceCell({ row }: { row: PreviewRow }) {
  const evidence = row.transactions.flatMap((transaction) => transaction.evidence);
  if (!evidence.length) {
    return <span className="text-xs text-[var(--muted)]">Không có</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {evidence.map((item, index) =>
        item.filePath ? (
          <EvidencePreviewDialog
            key={item.id}
            filePath={item.filePath}
            fileName={item.fileName}
            mimeType={item.mimeType}
            evidenceType={evidenceTypeLabel(item.type)}
            note={item.note}
          />
        ) : (
          <Badge key={item.id} variant="secondary">
            Ghi chú {index + 1}
          </Badge>
        ),
      )}
    </div>
  );
}

function TransactionContentCell({ row }: { row: PreviewRow }) {
  if (!row.transactions.length) {
    return <span className="text-xs text-[var(--muted)]">Không có giao dịch nguồn trong preview này.</span>;
  }

  return (
    <div className="grid gap-2">
      {row.transactions.map((transaction) => (
        <div key={transaction.id} className="min-w-0 rounded-lg border border-[var(--line)] bg-[#fbfcfb] p-2.5">
          <p className="m-0 whitespace-normal break-all text-xs font-normal leading-5 text-[var(--muted)]">
            <HighlightApartmentMentions
              content={transaction.content}
              apartmentCodes={[row.ma_can, transaction.selectedApartment || "", transaction.parsedApartment || ""].filter(Boolean)}
            />
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] leading-4 text-[var(--muted)]">
            <span>{transaction.sender || "Không rõ người chuyển"}</span>
            <span>{transaction.transactionAt}</span>
            <span>Tham chiếu: {transaction.reference || "-"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

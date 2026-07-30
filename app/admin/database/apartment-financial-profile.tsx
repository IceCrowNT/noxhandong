import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  DollarSign,
  FileImage,
  Paperclip,
  ReceiptText,
  User,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApartmentFinancialProfile, FinancialEvent } from "@/src/modules/apartments/financial-profile";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";

function formatMoney(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function eventLabel(type: FinancialEvent["type"]) {
  if (type === "MONTHLY_CLOSING") return "Chốt công nợ";
  if (type === "BANK_TRANSFER") return "Tiền về ngân hàng";
  if (type === "MANUAL_ADJUSTMENT") return "Điều chỉnh";
  return "Giao dịch khác";
}

function eventIcon(type: FinancialEvent["type"]) {
  if (type === "MONTHLY_CLOSING") return ArrowUpRight;
  if (type === "BANK_TRANSFER") return ArrowDownRight;
  if (type === "MANUAL_ADJUSTMENT") return DollarSign;
  return ReceiptText;
}

function eventTone(type: FinancialEvent["type"]) {
  if (type === "MONTHLY_CLOSING") return "bg-rose-50 text-rose-700";
  if (type === "BANK_TRANSFER") return "bg-emerald-50 text-emerald-700";
  if (type === "MANUAL_ADJUSTMENT") return "bg-blue-50 text-blue-700";
  return "bg-slate-50 text-slate-700";
}

function isImageUrl(value: string) {
  return /\.(jpeg|jpg|gif|png|webp)$/i.test(value);
}

function EvidenceLinks({ event }: { event: FinancialEvent }) {
  if (!event.evidences.length) return <span className="text-xs text-[var(--muted)]">-</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {event.evidences.map((evidence, index) => {
        const Icon = evidence.url && isImageUrl(evidence.url) ? FileImage : Paperclip;
        return evidence.url ? (
          <a
            key={`${evidence.url}-${index}`}
            href={evidence.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-white px-2 py-1 text-xs font-semibold text-[var(--accent)] hover:border-[var(--accent)]"
          >
            <Icon size={13} aria-hidden="true" />
            {evidence.type || "File"}
          </a>
        ) : (
          <span
            key={`${evidence.type}-${index}`}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs font-semibold text-[var(--muted)]"
          >
            <Paperclip size={13} aria-hidden="true" />
            {evidence.note || evidence.type || "Ghi chú"}
          </span>
        );
      })}
    </div>
  );
}

export function ApartmentFinancialProfileView({ data }: { data: ApartmentFinancialProfile }) {
  const { apartment, events } = data;
  const paidThrough = apartment.currentFeeStatus?.thang_da_dong_den_hien_tai || "Chưa có dữ liệu";

  return (
    <Card className="border-[var(--line)] bg-white/90 shadow-sm">
      <CardHeader className="border-b border-[var(--line)] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--accent)]">
              <Building2 size={21} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl text-[var(--text)]">Căn hộ {apartment.ma_can}</CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <User size={15} aria-hidden="true" />
                {apartment.chu_ho}
                <span className="text-[var(--muted)]">•</span>
                {apartment.dien_tich} m²
              </CardDescription>
            </div>
          </div>

          <div className="rounded-md border border-[rgba(0,75,70,0.22)] bg-[var(--accent-soft)] px-4 py-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Đã đóng đến</span>
            <strong className="block text-lg leading-6 text-[var(--accent)]">{paidThrough}</strong>
          </div>
        </div>

        {apartment.currentFeeStatus?.ghi_chu_public ? (
          <p className="mt-3 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
            {apartment.currentFeeStatus.ghi_chu_public}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="pt-0">
        {events.length === 0 ? (
          <div className="p-4 text-sm text-[var(--muted)]">Chưa có dữ liệu giao dịch cho căn hộ này.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[160px]">Thời gian</TableHead>
                <TableHead className="w-[180px]">Loại / kỳ phí</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead className="w-[150px]">Chứng từ</TableHead>
                <TableHead className="w-[140px] text-right">Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const Icon = eventIcon(event.type);
                return (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap text-xs text-[var(--muted)]">
                      {formatVietnamDateTime(event.date.toISOString())}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-start gap-2">
                        <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${eventTone(event.type)}`}>
                          <Icon size={14} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <strong className="block text-sm leading-5 text-[var(--text)]">{eventLabel(event.type)}</strong>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {event.period ? (
                              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                                {event.period}
                              </span>
                            ) : null}
                            {event.feePeriod ? (
                              <span className="rounded-full border border-[rgba(0,75,70,0.22)] bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                                Kỳ phí {event.feePeriod}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[680px]">
                      <p className="line-clamp-2 text-sm leading-6 text-[var(--text)]">{event.description}</p>
                    </TableCell>
                    <TableCell>
                      <EvidenceLinks event={event} />
                    </TableCell>
                    <TableCell className={`whitespace-nowrap text-right text-base font-black ${event.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {event.amount > 0 ? "+" : ""}
                      {formatMoney(event.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

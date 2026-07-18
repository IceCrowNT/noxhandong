import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";
import { ApartmentFinancialProfile } from "@/src/modules/apartments/financial-profile";
import { FileImage, History, Building2, User, ArrowDownRight, ArrowUpRight, DollarSign } from "lucide-react";

export function ApartmentFinancialProfileView({ data }: { data: ApartmentFinancialProfile }) {
  const { apartment, events } = data;
  
  return (
    <Card className="bg-white/90 shadow-sm border-[var(--line)]">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent)] border border-[var(--line)]">
            <Building2 size={24} />
          </div>
          <div>
            <CardTitle className="text-2xl text-[var(--text)]">Căn hộ {apartment.ma_can}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-sm mt-1">
              <User size={16} /> {apartment.chu_ho}
              <span className="text-[var(--muted)] mx-1">•</span>
              {apartment.dien_tich} m²
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="mb-6 flex items-center gap-2 font-semibold text-[var(--muted)] text-sm uppercase tracking-wider">
          <History size={18} /> Lịch sử tài chính
        </h4>
        <div className="relative border-l-2 border-[var(--line)] pl-8 space-y-8 ml-4">
          {events.length === 0 ? (
            <div className="text-sm text-[var(--muted)] bg-[var(--surface)] p-4 rounded-md border border-[var(--line)]">
              Chưa có dữ liệu giao dịch cho căn hộ này.
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="relative group">
                {/* Timeline marker */}
                <div 
                  className={`absolute -left-[45px] flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110 
                    ${event.type === "MONTHLY_CLOSING" ? "bg-rose-500" : event.type === "BANK_TRANSFER" ? "bg-emerald-500" : "bg-blue-500"} text-white`}
                >
                  {event.type === "MONTHLY_CLOSING" ? (
                    <ArrowUpRight size={16} />
                  ) : event.type === "BANK_TRANSFER" ? (
                    <ArrowDownRight size={16} />
                  ) : (
                    <DollarSign size={16} />
                  )}
                </div>
                
                {/* Event Card */}
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-bold text-base text-[var(--text)] flex items-center gap-2">
                        {event.type === "MONTHLY_CLOSING"
                          ? "Chốt công nợ tháng"
                          : event.type === "BANK_TRANSFER"
                          ? "Tiền về ngân hàng"
                          : event.type === "MANUAL_ADJUSTMENT"
                          ? "Điều chỉnh thủ công"
                          : "Giao dịch khác"}
                        {event.period && (
                          <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[var(--muted)] border border-[var(--line)]">
                            {event.period}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[var(--muted)] mt-1">
                        {formatVietnamDateTime(event.date.toISOString())}
                      </div>
                    </div>
                    
                    <div className={`font-black text-lg whitespace-nowrap ${event.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {event.amount > 0 ? "+" : ""}
                      {event.amount.toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                  
                  <div className="text-sm text-[var(--text)] bg-white/50 p-3 rounded-lg border border-[var(--line)]/50 mb-3 whitespace-pre-line leading-relaxed">
                    {event.description}
                  </div>
                  
                  {event.evidences.length > 0 && (
                    <div className="mt-4 grid gap-3 border-t border-[var(--line)] pt-3">
                      {event.evidences.map((evi, i) => (
                        <div key={i}>
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                            {evi.type || "Bằng chứng đính kèm"}
                          </div>
                          {evi.note && (
                            <div className="mb-3 text-sm text-[var(--text)] italic bg-yellow-50/50 p-2 rounded-md border border-yellow-100">
                              {evi.note}
                            </div>
                          )}
                          {evi.url && evi.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                            <a
                              href={evi.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-sm overflow-hidden rounded-md border border-[var(--line)] hover:border-[var(--accent)]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={evi.url}
                                alt="Evidence"
                                className="max-h-[300px] w-full bg-[var(--surface)] object-contain"
                              />
                            </a>
                          ) : evi.url ? (
                            <a
                              href={evi.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[var(--accent)] border border-[var(--line)] shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                            >
                              <FileImage size={14} />
                              Mở file đính kèm {event.evidences.length > 1 ? `#${i + 1}` : ""}
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

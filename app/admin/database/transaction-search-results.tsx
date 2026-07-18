import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatVietnamDateTime } from "@/src/modules/shared/utils/date-time";
import { Search, FileImage } from "lucide-react";

export function TransactionSearchResults({ transactions, boSung }: { transactions: any[]; boSung: any[] }) {
  if (transactions.length === 0 && boSung.length === 0) return null;

  return (
    <Card className="bg-white/90 shadow-sm border-[var(--line)] mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent)] border border-[var(--line)]">
            <Search size={20} />
          </div>
          <div>
            <CardTitle className="text-xl text-[var(--text)]">Giao dịch liên quan</CardTitle>
            <CardDescription className="text-sm mt-1">
              Tìm thấy {transactions.length + boSung.length} giao dịch khớp với từ khóa
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((t) => (
            <div key={`tx-${t.id}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-semibold border border-blue-200">
                      Sao kê ngân hàng
                    </span>
                    {t.ma_can_duoc_chon && t.trang_thai_duyet === 'DA_DUYET' ? (
                      <span className="text-emerald-700 text-xs font-semibold border border-emerald-500 bg-emerald-50 rounded-md px-1.5 py-0.5" title="Mã căn đã được duyệt">
                        {t.ma_can_duoc_chon}
                      </span>
                    ) : t.ma_can_parse ? (
                      <span className="text-[var(--muted)] text-xs font-medium border border-[var(--line)] rounded-md px-1.5 py-0.5" title="Mã căn dự đoán từ nội dung">
                        Dự đoán: {t.ma_can_parse}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1.5">
                    {formatVietnamDateTime(t.ngay_giao_dich ? t.ngay_giao_dich.toISOString() : t.ngay_tao.toISOString())}
                  </div>
                </div>
                <div className={`font-black text-base whitespace-nowrap ${Number(t.so_tien) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {Number(t.so_tien) > 0 ? "+" : ""}
                  {Number(t.so_tien).toLocaleString("vi-VN")} đ
                </div>
              </div>
              <div className="text-sm text-[var(--text)] bg-white/50 p-2.5 rounded-lg border border-[var(--line)]/50 mb-2 leading-relaxed break-all">
                {t.noi_dung_goc}
              </div>
              {(t.ten_nguoi_chuyen || t.tai_khoan_nguoi_chuyen) && (
                <div className="text-xs text-[var(--muted)]">
                  Người chuyển: <span className="font-medium text-[var(--text)]">{t.ten_nguoi_chuyen || "Không rõ"}</span>
                  {t.tai_khoan_nguoi_chuyen && ` - STK: ${t.tai_khoan_nguoi_chuyen}`}
                </div>
              )}
              {t.chung_tu_doi_soat && t.chung_tu_doi_soat.length > 0 && (
                <div className="mt-4 grid gap-3 border-t border-[var(--line)] pt-3">
                  {t.chung_tu_doi_soat.map((evi: any, i: number) => (
                    <div key={i}>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        {evi.loai_chung_tu || "Bằng chứng đính kèm"}
                      </div>
                      {evi.ghi_chu && (
                        <div className="mb-3 text-sm text-[var(--text)] italic bg-yellow-50/50 p-2 rounded-md border border-yellow-100">
                          {evi.ghi_chu}
                        </div>
                      )}
                      {evi.duong_dan_file && evi.duong_dan_file.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <a
                          href={evi.duong_dan_file}
                          target="_blank"
                          rel="noreferrer"
                          className="block max-w-sm overflow-hidden rounded-md border border-[var(--line)] hover:border-[var(--accent)]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={evi.duong_dan_file}
                            alt="Evidence"
                            className="max-h-[300px] w-full bg-[var(--surface)] object-contain"
                          />
                        </a>
                      ) : evi.duong_dan_file ? (
                        <a
                          href={evi.duong_dan_file}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[var(--accent)] border border-[var(--line)] shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                          <FileImage size={14} />
                          Mở file đính kèm {t.chung_tu_doi_soat.length > 1 ? `#${i + 1}` : ""}
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {boSung.map((b) => (
            <div key={`bs-${b.id}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold border border-amber-200">
                      Giao dịch bổ sung
                    </span>
                    {b.can_ho?.ma_can && (
                      <span className="text-[var(--accent)] text-xs font-semibold border border-[var(--accent)] rounded-md px-1.5 py-0.5">
                        {b.can_ho.ma_can}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1.5">
                    {formatVietnamDateTime(b.ngay_giao_dich_goc ? b.ngay_giao_dich_goc.toISOString() : b.ngay_tao.toISOString())}
                  </div>
                </div>
                <div className={`font-black text-base whitespace-nowrap ${Number(b.so_tien) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {Number(b.so_tien) > 0 ? "+" : ""}
                  {Number(b.so_tien).toLocaleString("vi-VN")} đ
                </div>
              </div>
              <div className="text-sm text-[var(--text)] bg-white/50 p-2.5 rounded-lg border border-[var(--line)]/50 mb-2 leading-relaxed">
                {b.ghi_chu_noi_bo || b.noi_dung_xac_minh}
              </div>
              
              {b.duong_dan_file && (
                <div className="mt-4 grid gap-3 border-t border-[var(--line)] pt-3">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      {b.loai_bang_chung || "Bằng chứng đính kèm"}
                    </div>
                    {b.duong_dan_file.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <a
                        href={b.duong_dan_file}
                        target="_blank"
                        rel="noreferrer"
                        className="block max-w-sm overflow-hidden rounded-md border border-[var(--line)] hover:border-[var(--accent)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.duong_dan_file}
                          alt="Evidence"
                          className="max-h-[300px] w-full bg-[var(--surface)] object-contain"
                        />
                      </a>
                    ) : (
                      <a
                        href={b.duong_dan_file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[var(--accent)] border border-[var(--line)] shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                      >
                        <FileImage size={14} />
                        Mở file đính kèm
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

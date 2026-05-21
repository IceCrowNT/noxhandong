import Link from "next/link";
import { AlertTriangle, Building2, CheckCircle2, FileSpreadsheet, Search, Users } from "lucide-react";

import { AdminFrame } from "@/components/admin/admin-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  reviewFlagLabel
} from "@/src/modules/shared/labels";

type DashboardPageProps = {
  searchParams?: Promise<{
    ma_can?: string;
  }>;
};

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "-";
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "-";
}

function compactText(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

function yesNo(value: boolean | null | undefined) {
  return value ? "Có" : "Không";
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(4, Math.round((value / total) * 100));
}

function MiniLineChart({ points }: { points: number[] }) {
  const values = points.length ? points : [0, 0, 0, 0, 0];
  const max = Math.max(...values, 1);
  const coords = values.map((value, index) => {
    const x = 20 + index * (320 / Math.max(values.length - 1, 1));
    const y = 108 - (value / max) * 74;
    return [x, y] as const;
  });
  const polyline = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `M${coords[0][0]} ${coords[0][1]} L${polyline.replaceAll(" ", " L")} L340 122 L20 122 Z`;

  return (
    <div className="relative h-40 rounded-xl border border-[var(--line)] bg-white/80 p-4">
      <svg className="h-full w-full" viewBox="0 0 360 130" role="img" aria-label="Xu hướng nhập dữ liệu">
        <defs>
          <linearGradient id="dashboardLineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#004b46" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#004b46" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#dashboardLineFill)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="#004b46"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {coords.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#f7faf8" stroke="#004b46" strokeWidth="3" />
        ))}
      </svg>
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

export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  const account = await requireAdmin();
  const params = await searchParams;
  const data = await getApartmentDashboardData(params?.ma_can || "");
  const selected = data.search.selectedApartment;
  const latestImportPoints = [...data.latestImports].reverse().map((item) => item.so_dong || 0);
  const hasSearch = Boolean(data.search.query);

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
      <section className="mb-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
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
              <CardDescription>Dữ liệu phí hiện hành</CardDescription>
              <CardTitle className="mt-2 text-3xl">{data.summary.currentBatch?.ky_du_lieu || "-"}</CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <CheckCircle2 size={21} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-[var(--muted)]">
            {data.summary.currentBatch
              ? `${formatNumber(data.summary.currentBatch.tong_so_can)} căn · ${publicBatchStatusLabel(
                  data.summary.currentBatch.trang_thai
                )}`
              : "Chưa có dữ liệu phí đã công khai."}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardDescription>Liên hệ cần xử lý</CardDescription>
              <CardTitle className="mt-2 text-3xl">{formatNumber(data.summary.contactReviewCount)}</CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[var(--accent)]">
              <Users size={21} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted)]">Dữ liệu nháp chưa duyệt hoặc cần rà soát.</CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardDescription>Liên hệ chính thức</CardDescription>
              <CardTitle className="mt-2 text-3xl">{formatNumber(data.summary.approvedContactCount)}</CardTitle>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-800">
              <AlertTriangle size={21} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted)]">Liên hệ đã được duyệt vào danh bạ nội bộ.</CardContent>
        </Card>
      </section>

      <section className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
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
              <Button type="submit">
                <Search size={17} aria-hidden="true" />
                Tìm
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            {data.search.parseMessage ? (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
                {data.search.parseMessage}
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
              <CardTitle>Xu hướng nhập dữ liệu</CardTitle>
              <CardDescription>Dựa trên các lô import gần nhất.</CardDescription>
            </CardHeader>
            <CardContent>
              <MiniLineChart points={latestImportPoints} />
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
        <section className="mb-5 grid gap-4 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
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

      <Card className="bg-white/90">
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
    </AdminFrame>
  );
}

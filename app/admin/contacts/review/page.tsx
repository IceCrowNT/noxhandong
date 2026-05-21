import Link from "next/link";
import { Filter } from "lucide-react";

import { approveContactAction, rejectContactAction } from "@/app/admin/contacts/review/actions";
import { AdminFrame, ScrollPanel } from "@/components/admin/admin-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/src/modules/auth/current-user";
import {
  getContactReviewData,
  isContactReviewStatus,
  type ContactReviewNeedsFilter
} from "@/src/modules/contacts/review";
import { contactReviewStatusLabel, contactRoleLabel, reviewFlagLabel } from "@/src/modules/shared/labels";

type ContactReviewPageProps = {
  searchParams?: Promise<{
    ma_can?: string;
    status?: string;
    needs?: string;
    page?: string;
    approved?: string;
    rejected?: string;
    error?: string;
  }>;
};

const ROLE_OPTIONS = [
  "CHU_HO",
  "CHU_MOI",
  "CHU_CU",
  "KHACH_THUE",
  "NGUOI_THAN",
  "NGUOI_NHAN_THONG_BAO",
  "DONG_HO",
  "MOI_GIOI",
  "KHAC"
] as const;

function text(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

function getNeedsFilter(value: string | undefined): ContactReviewNeedsFilter {
  if (value === "NEEDS_REVIEW" || value === "CLEAN") return value;
  return "ALL";
}

function statusMessage(params: Awaited<ContactReviewPageProps["searchParams"]>) {
  if (params?.approved === "1") return "Đã duyệt liên hệ nháp vào danh bạ chính thức.";
  if (params?.rejected === "1") return "Đã từ chối liên hệ nháp.";
  if (params?.error === "1") return "Không xử lý được liên hệ nháp. Kiểm tra lại dữ liệu đầu vào.";
  return null;
}

function pageHref(filters: { maCan: string; status: string; needs: string }, page: number) {
  return `/admin/contacts/review?ma_can=${encodeURIComponent(filters.maCan)}&status=${filters.status}&needs=${filters.needs}&page=${page}`;
}

export default async function ContactReviewPage({ searchParams }: ContactReviewPageProps) {
  const account = await requireAdmin();
  const params = await searchParams;
  const status = params?.status && isContactReviewStatus(params.status) ? params.status : "CHUA_DUYET";
  const needs = getNeedsFilter(params?.needs);
  const page = Number(params?.page || "1");
  const data = await getContactReviewData({
    maCan: params?.ma_can,
    status,
    needs,
    page
  });
  const message = statusMessage(params);

  return (
    <AdminFrame
      activeKey="contacts"
      badge="Quản lý"
      title="Liên hệ chờ xử lý"
      description={
        <>
          Đăng nhập bằng {account.ten_hien_thi || account.ten_dang_nhap}. Dữ liệu gốc được giữ trong vùng nháp, chỉ
          liên hệ đã duyệt mới vào danh bạ chính thức.
        </>
      }
    >
      {message ? (
        <div
          className={
            params?.error === "1"
              ? "mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800"
              : "mb-4 rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
          }
        >
          {message}
        </div>
      ) : null}

      <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Tổng theo bộ lọc</CardDescription>
            <CardTitle>{data.pagination.total.toLocaleString("vi-VN")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted)]">
            Trang {data.pagination.page}/{data.pagination.pageCount}
          </CardContent>
        </Card>
        {data.summary.statusCounts.map((item) => (
          <Card key={item.status}>
            <CardHeader>
              <CardDescription>{contactReviewStatusLabel(item.status)}</CardDescription>
              <CardTitle>{item.count.toLocaleString("vi-VN")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted)]">Trạng thái duyệt liên hệ.</CardContent>
          </Card>
        ))}
        {data.summary.reviewCounts.map((item) => (
          <Card key={String(item.needsReview)}>
            <CardHeader>
              <CardDescription>{item.needsReview ? "Cần rà soát" : "Tương đối sạch"}</CardDescription>
              <CardTitle>{item.count.toLocaleString("vi-VN")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted)]">Phân loại chất lượng dữ liệu.</CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <CardTitle>Danh sách liên hệ nháp</CardTitle>
            <CardDescription>Bảng duyệt nằm trong khung cuộn riêng để thao tác trên dữ liệu dài dễ hơn.</CardDescription>
          </div>
          <form
            className="grid w-full gap-3 md:grid-cols-[minmax(220px,1fr)_180px_190px_auto] xl:w-[900px]"
            action="/admin/contacts/review"
          >
            <Label className="grid gap-2">
              Mã căn
              <Input defaultValue={data.filters.maCan} maxLength={80} name="ma_can" placeholder="Lọc theo mã căn" />
            </Label>
            <Label className="grid gap-2">
              Trạng thái
              <Select defaultValue={data.filters.status} name="status">
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="CHUA_DUYET">Chưa duyệt</SelectItem>
                  <SelectItem value="DA_DUYET">Đã duyệt</SelectItem>
                  <SelectItem value="TU_CHOI">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </Label>
            <Label className="grid gap-2">
              Chất lượng
              <Select defaultValue={data.filters.needs} name="needs">
                <SelectTrigger>
                  <SelectValue placeholder="Chất lượng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả chất lượng</SelectItem>
                  <SelectItem value="NEEDS_REVIEW">Cần rà soát</SelectItem>
                  <SelectItem value="CLEAN">Tương đối sạch</SelectItem>
                </SelectContent>
              </Select>
            </Label>
            <div className="flex items-end">
              <Button className="w-full" type="submit">
                <Filter size={16} aria-hidden="true" />
                Lọc
              </Button>
            </div>
          </form>
        </CardHeader>

        <CardContent>
          <ScrollPanel minWidth={1800}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Căn</TableHead>
                  <TableHead>Dữ liệu gốc</TableHead>
                  <TableHead>Đề xuất parse</TableHead>
                  <TableHead>Rà soát</TableHead>
                  <TableHead>Duyệt vào danh bạ</TableHead>
                  <TableHead>Từ chối</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.candidates.length ? (
                  data.candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <strong>{text(candidate.ma_can)}</strong>
                        <br />
                        <span className="text-[var(--muted)]">#{candidate.id}</span>
                        <br />
                        {contactReviewStatusLabel(candidate.trang_thai_duyet)}
                      </TableCell>
                      <TableCell className="leading-6">
                        <strong>{text(candidate.ten_chu_ho_goc)}</strong>
                        <br />
                        Người sử dụng: {text(candidate.ten_nguoi_su_dung_goc)}
                        <br />
                        SĐT gốc: {text(candidate.so_dien_thoai_goc)}
                        <br />
                        <span className="text-[var(--muted)]">{text(candidate.thong_tin_phu_goc)}</span>
                        <br />
                        <span className="text-[var(--muted)]">{text(candidate.ghi_chu_goc)}</span>
                      </TableCell>
                      <TableCell className="leading-6">
                        <strong>{text(candidate.ten_hien_thi_parse)}</strong>
                        <br />
                        {text(candidate.so_dien_thoai_parse)}
                        <br />
                        Vai trò: {contactRoleLabel(candidate.vai_tro_du_doan)}
                        <br />
                        Chính: {candidate.la_lien_he_chinh_du_doan ? "Có" : "Không"}
                      </TableCell>
                      <TableCell className="leading-6">
                        {candidate.co_can_ra_soat ? "Cần rà soát" : "Tương đối sạch"}
                        <br />
                        <span className="text-[var(--muted)]">{text(candidate.ly_do_ra_soat)}</span>
                        <br />
                        Cảnh báo:{" "}
                        {candidate.flags.length ? candidate.flags.map((flag) => reviewFlagLabel(flag)).join(", ") : "-"}
                        <br />
                        <span className="text-[var(--muted)]">{text(candidate.ghi_chu_nghiep_vu)}</span>
                      </TableCell>
                      <TableCell>
                        <form action={approveContactAction} className="grid min-w-[260px] gap-3">
                          <input name="candidateId" type="hidden" value={candidate.id} />
                          <Label className="grid gap-1 text-xs font-medium text-[var(--muted)]">
                            Tên hiển thị
                            <Input
                              name="displayName"
                              required
                              defaultValue={
                                candidate.ten_hien_thi_parse ||
                                candidate.ten_nguoi_su_dung_goc ||
                                candidate.ten_chu_ho_goc ||
                                ""
                              }
                            />
                          </Label>
                          <Label className="grid gap-1 text-xs font-medium text-[var(--muted)]">
                            Số điện thoại
                            <Input
                              name="phoneNumber"
                              defaultValue={candidate.so_dien_thoai_parse || candidate.so_dien_thoai_goc || ""}
                            />
                          </Label>
                          <Label className="grid gap-1 text-xs font-medium text-[var(--muted)]">
                            Vai trò
                            <Select name="role" defaultValue={candidate.vai_tro_du_doan || "KHAC"}>
                              <SelectTrigger>
                                <SelectValue placeholder="Vai trò" />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {contactRoleLabel(role)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox name="isPrimary" defaultChecked={candidate.la_lien_he_chinh_du_doan} />
                            Liên hệ chính
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                              name="receivesNotification"
                              defaultChecked={candidate.nhan_thong_bao_du_doan ?? true}
                            />
                            Nhận thông báo
                          </label>
                          <Label className="grid gap-1 text-xs font-medium text-[var(--muted)]">
                            Ghi chú duyệt
                            <Input name="note" defaultValue={candidate.ghi_chu_duyet || ""} />
                          </Label>
                          <Button size="sm" type="submit">
                            Duyệt
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell>
                        <form action={rejectContactAction} className="grid min-w-[220px] gap-3">
                          <input name="candidateId" type="hidden" value={candidate.id} />
                          <Label className="grid gap-1 text-xs font-medium text-[var(--muted)]">
                            Lý do từ chối
                            <Input name="rejectNote" defaultValue={candidate.ghi_chu_duyet || ""} />
                          </Label>
                          <Button variant="secondary" size="sm" type="submit">
                            Từ chối
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="py-8 text-center text-[var(--muted)]" colSpan={6}>
                      Không có liên hệ nháp theo bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollPanel>

          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--line)] pt-4 md:flex-row md:items-center md:justify-between">
            <span className="text-sm text-[var(--muted)]">
              {data.pagination.total.toLocaleString("vi-VN")} liên hệ nháp
            </span>
            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href={pageHref(data.filters, Math.max(1, data.pagination.page - 1))}>Trước</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href={pageHref(data.filters, Math.min(data.pagination.pageCount, data.pagination.page + 1))}>
                  Sau
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminFrame>
  );
}

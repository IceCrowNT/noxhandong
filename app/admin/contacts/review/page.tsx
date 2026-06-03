import Link from "next/link";
import { AlertTriangle, CheckCircle2, Filter, Phone, UserCheck, XCircle } from "lucide-react";

import { approveContactAction, rejectContactAction } from "@/app/admin/contacts/review/actions";
import { AdminFrame } from "@/components/admin/admin-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notice } from "@/components/ui/notice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/src/modules/auth/current-user";
import {
  getContactReviewData,
  isContactReviewStatus,
  type ContactReviewNeedsFilter,
} from "@/src/modules/contacts/review";
import { adminRoleLabel, contactReviewStatusLabel, contactRoleLabel, reviewFlagLabel } from "@/src/modules/shared/labels";

type ContactReviewPageProps = {
  searchParams?: Promise<{
    ma_can?: string;
    status?: string;
    needs?: string;
    page?: string;
    candidateId?: string;
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
  "KHAC",
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

function reviewHref(
  filters: { maCan: string; status: string; needs: string },
  page: number,
  candidateId?: number,
) {
  const params = new URLSearchParams();
  if (filters.maCan) params.set("ma_can", filters.maCan);
  params.set("status", filters.status);
  params.set("needs", filters.needs);
  params.set("page", String(page));
  if (candidateId) params.set("candidateId", String(candidateId));
  return `/admin/contacts/review?${params.toString()}`;
}

function selectedClass(isSelected: boolean) {
  return isSelected
    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
    : "border-[var(--line)] bg-white hover:border-[var(--accent)] hover:bg-[#f8faf9]";
}

function qualityLabel(needsReview: boolean) {
  return needsReview ? "Cần rà soát" : "Tương đối sạch";
}

function phoneHref(value: string | null | undefined) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? `tel:${digits}` : null;
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
    page,
  });
  const message = statusMessage(params);
  const canManageContacts = account.vai_tro === "SUPER_ADMIN";
  const selectedId = Number(params?.candidateId || "0");
  const selectedCandidate = data.candidates.find((candidate) => candidate.id === selectedId) || data.candidates[0] || null;
  const selectedPhoneHref = selectedCandidate
    ? phoneHref(selectedCandidate.so_dien_thoai_parse || selectedCandidate.so_dien_thoai_goc)
    : null;

  return (
    <AdminFrame
      activeKey="contacts"
      badge={adminRoleLabel(account.vai_tro)}
      title="Duyệt liên hệ cư dân"
      description={
        canManageContacts
          ? "Rà soát dữ liệu liên hệ từ file Excel trước khi đưa vào danh bạ chính thức."
          : "Tài khoản quản lý/kỹ thuật chỉ được xem dữ liệu liên hệ, không được duyệt hoặc sửa dữ liệu."
      }
    >
      {!canManageContacts ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
          Chế độ xem: tài khoản hiện tại chỉ xem liên hệ nháp và thông tin gốc, không có quyền duyệt/từ chối.
        </div>
      ) : null}

      {message ? (
        <Notice tone={params?.error === "1" ? "error" : "success"}>{message}</Notice>
      ) : null}

      <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <CardDescription>Tổng theo bộ lọc</CardDescription>
            <CardTitle>{data.pagination.total.toLocaleString("vi-VN")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-[var(--muted)]">
            Trang {data.pagination.page}/{data.pagination.pageCount}
          </CardContent>
        </Card>
        {data.summary.statusCounts.map((item) => (
          <Card key={item.status}>
            <CardHeader className="p-4">
              <CardDescription>{contactReviewStatusLabel(item.status)}</CardDescription>
              <CardTitle>{item.count.toLocaleString("vi-VN")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm text-[var(--muted)]">Trạng thái duyệt.</CardContent>
          </Card>
        ))}
        {data.summary.reviewCounts.map((item) => (
          <Card key={String(item.needsReview)}>
            <CardHeader className="p-4">
              <CardDescription>{qualityLabel(item.needsReview)}</CardDescription>
              <CardTitle>{item.count.toLocaleString("vi-VN")}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm text-[var(--muted)]">Chất lượng dữ liệu.</CardContent>
          </Card>
        ))}
      </section>

      <Card className="mb-4">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_190px_auto]" action="/admin/contacts/review">
            <Label className="grid gap-2">
              Mã căn
              <Input defaultValue={data.filters.maCan} maxLength={80} name="ma_can" placeholder="Ví dụ: L1.115" />
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
              <SubmitButton className="w-full" pendingText="Đang lọc...">
                <Filter size={16} aria-hidden="true" />
                Lọc
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {selectedCandidate ? (
        <section className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)_420px]">
          <Card className="xl:sticky xl:top-20 xl:self-start">
            <CardHeader>
              <CardTitle>Danh sách liên hệ</CardTitle>
              <CardDescription>{data.candidates.length} liên hệ trong trang hiện tại.</CardDescription>
            </CardHeader>
            <CardContent className="grid max-h-[660px] gap-2 overflow-y-auto pr-1">
              {data.candidates.map((candidate) => {
                const isSelected = candidate.id === selectedCandidate.id;
                return (
                  <Button
                    asChild
                    key={candidate.id}
                    variant="ghost"
                    className={`h-auto justify-start rounded-xl border p-3 text-left ${selectedClass(isSelected)}`}
                  >
                    <Link href={reviewHref(data.filters, data.pagination.page, candidate.id)}>
                      <span className="grid w-full gap-2">
                        <span className="flex items-start justify-between gap-2">
                          <span>
                            <span className="block text-base font-semibold text-[var(--text)]">{text(candidate.ma_can)}</span>
                            <span className="text-xs text-[var(--muted)]">#{candidate.id}</span>
                          </span>
                          <Badge variant={candidate.co_can_ra_soat ? "outline" : "success"}>
                            {qualityLabel(candidate.co_can_ra_soat)}
                          </Badge>
                        </span>
                        <span className="line-clamp-1 text-sm font-medium text-[var(--text)]">
                          {text(candidate.ten_hien_thi_parse || candidate.ten_nguoi_su_dung_goc || candidate.ten_chu_ho_goc)}
                        </span>
                        <span className="line-clamp-1 text-xs text-[var(--muted)]">
                          {text(candidate.so_dien_thoai_parse || candidate.so_dien_thoai_goc)} ·{" "}
                          {contactReviewStatusLabel(candidate.trang_thai_duyet)}
                        </span>
                      </span>
                    </Link>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardDescription>Hồ sơ liên hệ</CardDescription>
                    <CardTitle>
                      {text(selectedCandidate.ma_can)} · #{selectedCandidate.id}
                    </CardTitle>
                  </div>
                  <Badge variant="outline">{contactReviewStatusLabel(selectedCandidate.trang_thai_duyet)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <UserCheck size={16} aria-hidden="true" />
                      Dữ liệu gốc từ Excel
                    </div>
                    <dl className="grid gap-3 text-sm">
                      <div>
                        <dt className="text-[var(--muted)]">Chủ hộ gốc</dt>
                        <dd className="font-semibold">{text(selectedCandidate.ten_chu_ho_goc)}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Người sử dụng</dt>
                        <dd>{text(selectedCandidate.ten_nguoi_su_dung_goc)}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Số điện thoại gốc</dt>
                        <dd className="flex flex-wrap items-center gap-2 font-semibold">
                          {text(selectedCandidate.so_dien_thoai_goc)}
                          {phoneHref(selectedCandidate.so_dien_thoai_goc) ? (
                            <Button asChild size="sm" variant="secondary">
                              <a href={phoneHref(selectedCandidate.so_dien_thoai_goc) || undefined}>
                                <Phone size={14} aria-hidden="true" />
                                Gọi
                              </a>
                            </Button>
                          ) : null}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Thông tin phụ</dt>
                        <dd>{text(selectedCandidate.thong_tin_phu_goc)}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Ghi chú gốc</dt>
                        <dd>{text(selectedCandidate.ghi_chu_goc)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-[var(--line)] bg-white p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Đề xuất đưa vào danh bạ
                    </div>
                    <dl className="grid gap-3 text-sm">
                      <div>
                        <dt className="text-[var(--muted)]">Tên hiển thị</dt>
                        <dd className="font-semibold">{text(selectedCandidate.ten_hien_thi_parse)}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Số điện thoại parse</dt>
                        <dd className="flex items-center gap-2 font-semibold">
                          <Phone size={14} aria-hidden="true" />
                          {text(selectedCandidate.so_dien_thoai_parse)}
                          {phoneHref(selectedCandidate.so_dien_thoai_parse) ? (
                            <Button asChild size="sm" variant="secondary">
                              <a href={phoneHref(selectedCandidate.so_dien_thoai_parse) || undefined}>Gọi</a>
                            </Button>
                          ) : null}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Vai trò dự đoán</dt>
                        <dd>{contactRoleLabel(selectedCandidate.vai_tro_du_doan)}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Liên hệ chính</dt>
                        <dd>{selectedCandidate.la_lien_he_chinh_du_doan ? "Có" : "Không"}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Nhận thông báo</dt>
                        <dd>{selectedCandidate.nhan_thong_bao_du_doan ? "Có" : "Không"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                    <AlertTriangle size={16} aria-hidden="true" />
                    Chất lượng dữ liệu
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <span className="block text-[var(--muted)]">Kết luận</span>
                      <strong>{qualityLabel(selectedCandidate.co_can_ra_soat)}</strong>
                    </div>
                    <div>
                      <span className="block text-[var(--muted)]">Lý do rà soát</span>
                      <span>{text(selectedCandidate.ly_do_ra_soat)}</span>
                    </div>
                    <div>
                      <span className="block text-[var(--muted)]">Cảnh báo</span>
                      <span>
                        {selectedCandidate.flags.length
                          ? selectedCandidate.flags.map((flag) => reviewFlagLabel(flag)).join(", ")
                          : "-"}
                      </span>
                    </div>
                  </div>
                  {selectedCandidate.ghi_chu_nghiep_vu ? (
                    <p className="mt-3 rounded-lg bg-[#f8faf9] p-3 text-sm text-[var(--muted)]">
                      {selectedCandidate.ghi_chu_nghiep_vu}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="xl:sticky xl:top-20 xl:self-start">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Thao tác duyệt</CardTitle>
                  <CardDescription>
                    {canManageContacts
                      ? "Kiểm tra nhanh, chỉnh lại trường cần thiết rồi duyệt hoặc từ chối."
                      : "Chỉ Super Admin được thao tác với dữ liệu này."}
                  </CardDescription>
                </div>
                {selectedPhoneHref ? (
                  <Button asChild size="sm" variant="secondary" className="shrink-0">
                    <a href={selectedPhoneHref}>
                      <Phone size={15} aria-hidden="true" />
                      Gọi
                    </a>
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {canManageContacts ? (
                <>
                  <form action={approveContactAction} className="grid gap-3">
                    <input name="candidateId" type="hidden" value={selectedCandidate.id} />
                    <Label className="grid gap-2">
                      Tên hiển thị
                      <Input
                        name="displayName"
                        required
                        defaultValue={
                          selectedCandidate.ten_hien_thi_parse ||
                          selectedCandidate.ten_nguoi_su_dung_goc ||
                          selectedCandidate.ten_chu_ho_goc ||
                          ""
                        }
                      />
                    </Label>
                    <Label className="grid gap-2">
                      Số điện thoại
                      <Input
                        name="phoneNumber"
                        defaultValue={selectedCandidate.so_dien_thoai_parse || selectedCandidate.so_dien_thoai_goc || ""}
                      />
                    </Label>
                    <Label className="grid gap-2">
                      Vai trò
                      <Select name="role" defaultValue={selectedCandidate.vai_tro_du_doan || "KHAC"}>
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
                    <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-3">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox name="isPrimary" defaultChecked={selectedCandidate.la_lien_he_chinh_du_doan} />
                        Liên hệ chính
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          name="receivesNotification"
                          defaultChecked={selectedCandidate.nhan_thong_bao_du_doan ?? true}
                        />
                        Nhận thông báo
                      </label>
                    </div>
                    <Label className="grid gap-2">
                      Ghi chú duyệt
                      <Textarea name="note" defaultValue={selectedCandidate.ghi_chu_duyet || ""} rows={3} />
                    </Label>
                    <SubmitButton pendingText="Đang duyệt...">
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Duyệt vào danh bạ
                    </SubmitButton>
                  </form>

                  <form action={rejectContactAction} className="grid gap-3 rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-3">
                    <input name="candidateId" type="hidden" value={selectedCandidate.id} />
                    <Label className="grid gap-2">
                      Lý do từ chối
                      <Textarea name="rejectNote" defaultValue={selectedCandidate.ghi_chu_duyet || ""} rows={2} />
                    </Label>
                    <SubmitButton variant="secondary" pendingText="Đang từ chối...">
                      <XCircle size={16} aria-hidden="true" />
                      Từ chối liên hệ này
                    </SubmitButton>
                  </form>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[#fbfcfb] p-4 text-sm text-[var(--muted)]">
                  Tài khoản hiện tại chỉ có quyền xem. Khi cần chốt dữ liệu, hãy dùng tài khoản Quản trị cao nhất.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-[var(--muted)]">
            Không có liên hệ nháp theo bộ lọc hiện tại.
          </CardContent>
        </Card>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:flex-row md:items-center md:justify-between">
        <span className="text-sm text-[var(--muted)]">
          {data.pagination.total.toLocaleString("vi-VN")} liên hệ nháp
        </span>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href={reviewHref(data.filters, Math.max(1, data.pagination.page - 1))}>Trước</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={reviewHref(data.filters, Math.min(data.pagination.pageCount, data.pagination.page + 1))}>Sau</Link>
          </Button>
        </div>
      </div>
    </AdminFrame>
  );
}

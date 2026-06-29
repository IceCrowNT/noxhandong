import Link from "next/link";
import { ChevronLeft, ChevronRight, Phone, Plus, Trash2, UserRoundPen } from "lucide-react";

import { createContactAction, deleteContactAction, updateContactAction } from "@/app/admin/contacts/review/actions";
import { AdminFrame } from "@/components/admin/admin-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requirePermission } from "@/src/modules/auth/current-user";
import { hasPermission } from "@/src/modules/auth/permissions";
import {
  CONTACT_DIRECTORY_PAGE_SIZE,
  getContactDirectoryData,
  isContactDirectoryStatus,
} from "@/src/modules/contacts/directory";
import { adminRoleLabel, contactRoleLabel, contactStatusLabel } from "@/src/modules/shared/labels";

type ContactDirectoryPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    page?: string;
    contactId?: string;
    created?: string;
    updated?: string;
    deleted?: string;
    error_create?: string;
    error_update?: string;
    error_delete?: string;
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

const STATUS_OPTIONS = ["DANG_DUNG", "CAN_XAC_MINH", "CU"] as const;

function text(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

function getStatusFilter(value: string | undefined) {
  return value && isContactDirectoryStatus(value) ? value : "ALL";
}

function pageHref(
  filters: { query: string; status: string },
  page: number,
  contactId?: number,
) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
  params.set("page", String(page));
  if (contactId) params.set("contactId", String(contactId));
  return `/admin/contacts/review?${params.toString()}`;
}

function getStatusMessage(params: Awaited<ContactDirectoryPageProps["searchParams"]>) {
  if (params?.created === "1") {
    return { tone: "success" as const, text: "Đã thêm liên hệ vào danh bạ cư dân." };
  }
  if (params?.updated === "1") {
    return { tone: "success" as const, text: "Đã cập nhật thông tin liên hệ." };
  }
  if (params?.deleted === "1") {
    return { tone: "success" as const, text: "Đã xóa liên hệ khỏi danh bạ." };
  }
  if (params?.error_create === "1") {
    return { tone: "error" as const, text: "Không thêm được liên hệ. Kiểm tra lại mã căn hoặc dữ liệu nhập." };
  }
  if (params?.error_update === "1") {
    return { tone: "error" as const, text: "Không cập nhật được liên hệ." };
  }
  if (params?.error_delete === "1") {
    return { tone: "error" as const, text: "Không xóa được liên hệ." };
  }
  return null;
}

function callHref(phoneNumber: string | null | undefined) {
  const digits = String(phoneNumber || "").replace(/\D/g, "");
  return digits ? `tel:${digits}` : null;
}

export default async function ContactDirectoryPage({ searchParams }: ContactDirectoryPageProps) {
  const account = await requirePermission("VIEW_CONTACTS");
  const params = await searchParams;
  const status = getStatusFilter(params?.status);
  const page = Number(params?.page || "1");
  const data = await getContactDirectoryData({
    query: params?.q,
    status,
    page,
  });
  const canManageContacts = hasPermission(account.vai_tro, "REVIEW_CONTACTS");
  const selectedId = Number(params?.contactId || "0");
  const selectedContact = data.contacts.find((contact) => contact.id === selectedId) || data.contacts[0] || null;
  const message = getStatusMessage(params);

  return (
    <AdminFrame
      activeKey="contacts"
      badge={adminRoleLabel(account.vai_tro)}
      title="Danh bạ cư dân"
      description={
        canManageContacts
          ? "Tra cứu và quản lý trực tiếp danh bạ cư dân chuẩn trong hệ thống. Dữ liệu ở đây là dữ liệu vận hành chính."
          : "Tra cứu nhanh số điện thoại, vai trò liên hệ và trạng thái danh bạ cư dân."
      }
    >
      {!canManageContacts ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
          Chế độ xem: tài khoản hiện tại có thể tra cứu và gọi nhanh, không có quyền thêm, sửa hoặc xóa danh bạ.
        </div>
      ) : null}

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="p-4">
            <CardDescription>Tổng liên hệ</CardDescription>
            <CardTitle>{data.summary.total.toLocaleString("vi-VN")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-[var(--muted)]">Toàn bộ danh bạ chính thức.</CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardDescription>Căn đã có danh bạ</CardDescription>
            <CardTitle>{data.summary.apartmentCount.toLocaleString("vi-VN")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-[var(--muted)]">Số căn có ít nhất một liên hệ.</CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardDescription>Liên hệ chính</CardDescription>
            <CardTitle>{data.summary.primaryCount.toLocaleString("vi-VN")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-[var(--muted)]">Được đánh dấu đầu mối chính.</CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardDescription>Cần xác minh</CardDescription>
            <CardTitle>{data.summary.reviewCount.toLocaleString("vi-VN")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-[var(--muted)]">Đang dùng nhưng cần rà soát thêm.</CardContent>
        </Card>
      </section>

      <Card className="mb-4">
        <CardContent className="p-4">
          <form action="/admin/contacts/review" className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Từ khóa tra cứu</span>
              <Input
                defaultValue={data.filters.query}
                maxLength={80}
                name="q"
                placeholder="Mã căn, tên liên hệ, số điện thoại, ghi chú..."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Trạng thái</span>
              <select
                className="h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
                defaultValue={data.filters.status}
                name="status"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DANG_DUNG">Đang dùng</option>
                <option value="CAN_XAC_MINH">Cần xác minh</option>
                <option value="CU">Cũ</option>
              </select>
            </label>

            <div className="flex items-end">
              <SubmitButton className="w-full" pendingText="Đang lọc...">
                Lọc danh bạ
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="xl:sticky xl:top-20 xl:self-start">
          <CardHeader>
            <CardTitle>Danh sách liên hệ</CardTitle>
            <CardDescription>
              {data.contacts.length} liên hệ trong trang hiện tại · trang {data.pagination.page}/{data.pagination.pageCount}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid max-h-[720px] gap-2 overflow-y-auto pr-1">
            {data.contacts.map((contact) => {
              const isSelected = selectedContact?.id === contact.id;
              return (
                <Button
                  asChild
                  key={contact.id}
                  variant="ghost"
                  className={`h-auto justify-start rounded-xl border p-3 text-left ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
                      : "border-[var(--line)] bg-white hover:border-[var(--accent)] hover:bg-[#f8faf9]"
                  }`}
                >
                  <Link href={pageHref(data.filters, data.pagination.page, contact.id)}>
                    <span className="grid w-full gap-2">
                      <span className="flex items-start justify-between gap-2">
                        <span>
                          <span className="block text-base font-semibold text-[var(--text)]">{contact.can_ho.ma_can}</span>
                          <span className="text-xs text-[var(--muted)]">{text(contact.ten_hien_thi)}</span>
                        </span>
                        {contact.la_lien_he_chinh ? <Badge variant="success">Liên hệ chính</Badge> : null}
                      </span>
                      <span className="line-clamp-1 text-xs text-[var(--muted)]">
                        {text(contact.so_dien_thoai)} · {contactRoleLabel(contact.vai_tro_lien_he)}
                      </span>
                      <span className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">{contactStatusLabel(contact.trang_thai_lien_he)}</Badge>
                        {contact.nhan_thong_bao ? <Badge variant="outline">Nhận thông báo</Badge> : null}
                      </span>
                    </span>
                  </Link>
                </Button>
              );
            })}
          </CardContent>
          <CardContent className="flex items-center justify-between gap-2 border-t border-[var(--line)] pt-4">
            <Button
              asChild
              disabled={data.pagination.page <= 1}
              size="sm"
              variant="secondary"
            >
              <Link href={pageHref(data.filters, Math.max(1, data.pagination.page - 1), selectedContact?.id)}>
                <ChevronLeft size={16} aria-hidden="true" />
                Trang trước
              </Link>
            </Button>
            <span className="text-xs text-[var(--muted)]">
              {data.pagination.total.toLocaleString("vi-VN")} liên hệ · {CONTACT_DIRECTORY_PAGE_SIZE} / trang
            </span>
            <Button
              asChild
              disabled={data.pagination.page >= data.pagination.pageCount}
              size="sm"
              variant="secondary"
            >
              <Link href={pageHref(data.filters, Math.min(data.pagination.pageCount, data.pagination.page + 1), selectedContact?.id)}>
                Trang sau
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {selectedContact ? (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardDescription>{selectedContact.can_ho.toa_lo_goc || selectedContact.can_ho.ma_lo}</CardDescription>
                    <CardTitle>
                      {selectedContact.can_ho.ma_can} · {selectedContact.ten_hien_thi}
                    </CardTitle>
                  </div>
                  {callHref(selectedContact.so_dien_thoai) ? (
                    <Button asChild size="sm" variant="secondary">
                      <a href={callHref(selectedContact.so_dien_thoai)!}>
                        <Phone size={16} aria-hidden="true" />
                        Gọi nhanh
                      </a>
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                    <span className="text-xs font-semibold uppercase text-[var(--muted)]">Chủ hộ gốc</span>
                    <strong className="mt-1 block leading-6">{text(selectedContact.can_ho.chu_ho_ten_goc)}</strong>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                    <span className="text-xs font-semibold uppercase text-[var(--muted)]">Số điện thoại</span>
                    <strong className="mt-1 block leading-6">{text(selectedContact.so_dien_thoai)}</strong>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                    <span className="text-xs font-semibold uppercase text-[var(--muted)]">Vai trò</span>
                    <strong className="mt-1 block leading-6">{contactRoleLabel(selectedContact.vai_tro_lien_he)}</strong>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                    <span className="text-xs font-semibold uppercase text-[var(--muted)]">Trạng thái</span>
                    <strong className="mt-1 block leading-6">{contactStatusLabel(selectedContact.trang_thai_lien_he)}</strong>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--line)] bg-white p-3 text-sm leading-6">
                    <div><b>Mã căn:</b> {selectedContact.can_ho.ma_can}</div>
                    <div><b>Lô:</b> {text(selectedContact.can_ho.toa_lo_goc || selectedContact.can_ho.ma_lo)}</div>
                    <div><b>Tình trạng gốc:</b> {text(selectedContact.can_ho.tinh_trang_goc)}</div>
                    <div><b>Trạng thái sử dụng gốc:</b> {text(selectedContact.can_ho.trang_thai_su_dung_goc)}</div>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-white p-3 text-sm leading-6">
                    <div><b>Liên hệ chính:</b> {selectedContact.la_lien_he_chinh ? "Có" : "Không"}</div>
                    <div><b>Nhận thông báo:</b> {selectedContact.nhan_thong_bao ? "Có" : "Không"}</div>
                    <div><b>Nguồn:</b> {text(selectedContact.nguon_du_lieu)}</div>
                    <div><b>Cập nhật:</b> {new Date(selectedContact.ngay_cap_nhat).toLocaleString("vi-VN")}</div>
                  </div>
                </div>

                {canManageContacts ? (
                  <>
                    <form action={updateContactAction} className="grid gap-3 rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-4">
                      <div className="flex items-center gap-2">
                        <UserRoundPen size={18} aria-hidden="true" />
                        <strong>Chỉnh sửa liên hệ</strong>
                      </div>

                      <input name="contactId" type="hidden" value={selectedContact.id} />
                      <input name="returnQuery" type="hidden" value={data.filters.query} />
                      <input name="returnStatus" type="hidden" value={data.filters.status} />
                      <input name="returnPage" type="hidden" value={String(data.pagination.page)} />

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-sm font-medium">Tên hiển thị</span>
                          <Input defaultValue={selectedContact.ten_hien_thi} name="displayName" required />
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-medium">Số điện thoại</span>
                          <Input defaultValue={selectedContact.so_dien_thoai || ""} name="phoneNumber" />
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="grid gap-2">
                          <span className="text-sm font-medium">Vai trò</span>
                          <select
                            className="h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
                            defaultValue={selectedContact.vai_tro_lien_he || ""}
                            name="role"
                          >
                            <option value="">Chưa gán</option>
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {contactRoleLabel(role)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-medium">Trạng thái</span>
                          <select
                            className="h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
                            defaultValue={selectedContact.trang_thai_lien_he}
                            name="contactStatus"
                          >
                            {STATUS_OPTIONS.map((statusOption) => (
                              <option key={statusOption} value={statusOption}>
                                {contactStatusLabel(statusOption)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-medium">Link Zalo</span>
                          <Input defaultValue={selectedContact.zalo_link || ""} name="zaloLink" />
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">
                          <input defaultChecked={selectedContact.la_lien_he_chinh} name="isPrimary" type="checkbox" />
                          Liên hệ chính
                        </label>
                        <label className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">
                          <input defaultChecked={selectedContact.nhan_thong_bao} name="receivesNotification" type="checkbox" />
                          Nhận thông báo
                        </label>
                      </div>

                      <label className="grid gap-2">
                        <span className="text-sm font-medium">Ghi chú</span>
                        <Textarea defaultValue={selectedContact.ghi_chu || ""} name="note" rows={4} />
                      </label>

                      <div className="flex justify-end">
                        <SubmitButton pendingText="Đang lưu...">Lưu thay đổi</SubmitButton>
                      </div>
                    </form>

                    <form action={deleteContactAction} className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <input name="contactId" type="hidden" value={selectedContact.id} />
                      <input name="returnQuery" type="hidden" value={data.filters.query} />
                      <input name="returnStatus" type="hidden" value={data.filters.status} />
                      <input name="returnPage" type="hidden" value={String(data.pagination.page)} />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-red-900">
                          Xóa liên hệ này khỏi danh bạ chính thức. Thao tác này không hoàn tác được.
                        </div>
                        <SubmitButton pendingText="Đang xóa..." variant="destructive">
                          <Trash2 size={16} aria-hidden="true" />
                          Xóa liên hệ
                        </SubmitButton>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-4 text-sm leading-6 text-[var(--muted)]">
                    <b>Ghi chú:</b> {text(selectedContact.ghi_chu)}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {canManageContacts ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plus size={18} aria-hidden="true" />
                  <div>
                    <CardTitle>Thêm liên hệ mới</CardTitle>
                    <CardDescription>Tạo trực tiếp danh bạ cư dân chuẩn cho một căn hộ.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form action={createContactAction} className="grid gap-3">
                  <input name="returnQuery" type="hidden" value={data.filters.query} />
                  <input name="returnStatus" type="hidden" value={data.filters.status} />
                  <input name="returnPage" type="hidden" value={String(data.pagination.page)} />

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Mã căn</span>
                      <Input name="maCan" placeholder="Ví dụ L2.511A" required />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Tên hiển thị</span>
                      <Input name="displayName" placeholder="Tên cư dân / người liên hệ" required />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Số điện thoại</span>
                      <Input name="phoneNumber" placeholder="09..." />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Vai trò</span>
                      <select className="h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm" name="role">
                        <option value="">Chưa gán</option>
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {contactRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">Trạng thái</span>
                      <select className="h-10 rounded-md border border-[var(--line)] bg-white px-3 text-sm" defaultValue="DANG_DUNG" name="contactStatus">
                        {STATUS_OPTIONS.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {contactStatusLabel(statusOption)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Link Zalo</span>
                    <Input name="zaloLink" placeholder="https://zalo.me/..." />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">
                      <input name="isPrimary" type="checkbox" />
                      Đặt làm liên hệ chính
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm">
                      <input defaultChecked name="receivesNotification" type="checkbox" />
                      Có nhận thông báo
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Ghi chú</span>
                    <Textarea name="note" placeholder="Thông tin bổ sung nếu cần." rows={4} />
                  </label>

                  <div className="flex justify-end">
                    <SubmitButton pendingText="Đang thêm...">Thêm vào danh bạ</SubmitButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </AdminFrame>
  );
}

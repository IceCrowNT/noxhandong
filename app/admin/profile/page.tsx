import { KeyRound, Save, UserCircle } from "lucide-react";

import { changeMyPasswordAction, updateMyProfileAction } from "@/app/admin/actions";
import { AdminFrame } from "@/components/admin/admin-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/src/modules/auth/current-user";
import { accountStatusLabel, adminRoleLabel } from "@/src/modules/shared/labels";

type ProfilePageProps = {
  searchParams?: Promise<{
    updated?: string;
    passwordChanged?: string;
    error?: string;
  }>;
};

function getStatusMessage(params?: Awaited<ProfilePageProps["searchParams"]>) {
  if (params?.updated === "1") return "Đã cập nhật thông tin tài khoản.";
  if (params?.passwordChanged === "1") return "Đã đổi mật khẩu.";
  if (params?.error === "duplicate") return "Email đã được tài khoản khác sử dụng.";
  if (params?.error === "password") return "Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ.";
  return null;
}

export default async function AdminProfilePage({ searchParams }: ProfilePageProps) {
  const account = await requireAdmin();
  const params = await searchParams;
  const statusMessage = getStatusMessage(params);
  const isError = Boolean(params?.error);

  return (
    <AdminFrame
      activeKey="profile"
      badge={adminRoleLabel(account.vai_tro)}
      title="Tài khoản của tôi"
      description="Cập nhật tên hiển thị, email và mật khẩu đăng nhập của tài khoản hiện tại."
    >
      {statusMessage ? (
        <Notice tone={isError ? "error" : "success"}>{statusMessage}</Notice>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.8fr)]">
        <Card className="bg-white/90">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
              <UserCircle size={20} aria-hidden="true" />
            </div>
            <CardTitle>Thông tin tài khoản</CardTitle>
            <CardDescription>Thông tin này dùng để hiển thị trong vùng quản trị nội bộ.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateMyProfileAction} className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Tài khoản đăng nhập
                <Input value={account.ten_dang_nhap} readOnly />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Số điện thoại đăng nhập
                <Input value={account.so_dien_thoai || ""} readOnly />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Tên hiển thị
                <Input name="displayName" defaultValue={account.ten_hien_thi || ""} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Email
                <Input name="email" type="email" defaultValue={account.email || ""} />
              </label>
              <div className="md:col-span-2">
                <SubmitButton pendingText="Đang lưu...">
                  <Save size={16} aria-hidden="true" />
                  Lưu thông tin
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Trạng thái quyền</CardTitle>
            <CardDescription>Thông tin chỉ đọc của tài khoản hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ["Vai trò", adminRoleLabel(account.vai_tro)],
              ["Trạng thái", accountStatusLabel(account.trang_thai)],
              ["ID tài khoản", String(account.id)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[var(--line)] bg-white p-4">
                <span className="mb-1 block text-xs font-bold uppercase text-[var(--muted)]">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/90 xl:col-span-2">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
              <KeyRound size={20} aria-hidden="true" />
            </div>
            <CardTitle>Đổi mật khẩu</CardTitle>
            <CardDescription>Mật khẩu mới cần tối thiểu 10 ký tự.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={changeMyPasswordAction} className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold">
                Mật khẩu hiện tại
                <Input name="currentPassword" type="password" autoComplete="current-password" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Mật khẩu mới
                <Input name="newPassword" type="password" autoComplete="new-password" minLength={10} required />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Nhập lại mật khẩu mới
                <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required />
              </label>
              <div className="md:col-span-3">
                <SubmitButton variant="secondary" pendingText="Đang đổi mật khẩu...">
                  <KeyRound size={16} aria-hidden="true" />
                  Đổi mật khẩu
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </AdminFrame>
  );
}

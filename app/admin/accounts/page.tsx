import { Lock, LockOpen, UserPlus } from "lucide-react";

import { createManagerAction, lockAccountAction, unlockAccountAction, updateAccountRoleAction } from "@/app/admin/actions";
import { AdminFrame, ScrollPanel } from "@/components/admin/admin-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminRole } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import { accountStatusLabel, adminRoleLabel } from "@/src/modules/shared/labels";

type AccountsPageProps = {
  searchParams?: Promise<{
    created?: string;
    locked?: string;
    unlocked?: string;
    roleUpdated?: string;
    error?: string;
  }>;
};

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Quản trị cao nhất" },
  { value: "MANAGER", label: "Quản lý" },
  { value: "TECHNICIAN", label: "Kỹ thuật" },
] as const;

const ROLE_PERMISSIONS = [
  {
    role: "SUPER_ADMIN",
    label: "Quản trị cao nhất",
    permissions: ["Tra cứu nội bộ", "Nhập/chốt dữ liệu phí", "Quản lý tài khoản", "Duyệt liên hệ", "Tài khoản cá nhân"],
  },
  {
    role: "MANAGER",
    label: "Quản lý",
    permissions: ["Tra cứu nội bộ", "Xem liên hệ", "Gọi nhanh cư dân", "Tài khoản cá nhân"],
  },
  {
    role: "TECHNICIAN",
    label: "Kỹ thuật",
    permissions: ["Tra cứu nội bộ", "Xem liên hệ", "Gọi nhanh cư dân", "Tài khoản cá nhân"],
  },
] as const;

function getStatusMessage(params?: Awaited<AccountsPageProps["searchParams"]>) {
  if (params?.created === "1") return "Đã tạo tài khoản nội bộ.";
  if (params?.locked === "1") return "Đã khóa tài khoản.";
  if (params?.unlocked === "1") return "Đã mở khóa tài khoản.";
  if (params?.roleUpdated === "1") return "Đã cập nhật vai trò tài khoản.";
  if (params?.error === "duplicate") return "Tài khoản, số điện thoại hoặc email đã tồn tại.";
  if (params?.error === "invalid") {
    return "Dữ liệu không hợp lệ. Cần tài khoản, số điện thoại hợp lệ và mật khẩu ít nhất 10 ký tự.";
  }
  return null;
}

function RoleSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      className="h-9 rounded-md border border-[var(--line)] bg-white px-3 py-1 text-sm text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
      defaultValue={["SUPER_ADMIN", "MANAGER", "TECHNICIAN"].includes(defaultValue) ? defaultValue : "MANAGER"}
      name="role"
    >
      {ROLE_OPTIONS.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}

export default async function AdminAccountsPage({ searchParams }: AccountsPageProps) {
  const currentAccount = await requireAdminRole("SUPER_ADMIN");
  const params = await searchParams;
  const statusMessage = getStatusMessage(params);
  const isError = Boolean(params?.error);
  const accounts = await prisma.taiKhoanQuanTri.findMany({
    orderBy: [{ vai_tro: "asc" }, { ten_dang_nhap: "asc" }],
    select: {
      id: true,
      ten_dang_nhap: true,
      so_dien_thoai: true,
      email: true,
      ten_hien_thi: true,
      vai_tro: true,
      trang_thai: true,
      lan_dang_nhap_cuoi: true
    }
  });

  return (
    <AdminFrame
      activeKey="accounts"
      badge="Quản trị cao nhất"
      title="Quản lý tài khoản"
      description="Tạo, phân quyền, khóa hoặc mở khóa tài khoản quản trị nội bộ."
    >
      {statusMessage ? (
        <div
          className={
            isError
              ? "mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800"
              : "mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800"
          }
        >
          {statusMessage}
        </div>
      ) : null}

      <Card className="mb-5 bg-white/90">
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <UserPlus size={20} aria-hidden="true" />
          </div>
          <CardTitle>Tạo tài khoản nội bộ</CardTitle>
          <CardDescription>
            Super Admin có thể tạo thêm tài khoản quản trị cao nhất, quản lý hoặc kỹ thuật mà không cần thao tác trực tiếp trong DB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createManagerAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">
              Tài khoản
              <Input name="username" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Số điện thoại đăng nhập
              <Input name="phoneNumber" inputMode="tel" placeholder="0912345678" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Tên hiển thị
              <Input name="displayName" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Email
              <Input name="email" type="email" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Vai trò
              <select
                className="flex h-9 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-1 text-sm text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                defaultValue="MANAGER"
                name="role"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Mật khẩu ban đầu
              <Input name="password" type="password" minLength={10} required />
            </label>
            <div className="flex items-end">
              <Button className="w-full" type="submit" size="lg">
                Tạo tài khoản
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-5 bg-white/90">
        <CardHeader>
          <CardTitle>Bảng quyền theo vai trò</CardTitle>
          <CardDescription>Vai trò quyết định nhóm chức năng tài khoản được sử dụng trong vùng quản trị.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {ROLE_PERMISSIONS.map((item) => (
            <div key={item.role} className="rounded-xl border border-[var(--line)] bg-white p-4">
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{item.role}</span>
              <strong className="mt-1 block text-lg">{item.label}</strong>
              <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
                {item.permissions.map((permission) => (
                  <li key={permission} className="rounded-md bg-[var(--accent-soft)] px-3 py-2 text-[var(--accent)]">
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Danh sách tài khoản</CardTitle>
          <CardDescription>Tài khoản đang hoạt động mới có thể đăng nhập vào vùng nội bộ.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:hidden">
            {accounts.map((account) => (
              <div key={account.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="block truncate text-base">{account.ten_hien_thi || account.ten_dang_nhap}</strong>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">
                      {account.ten_dang_nhap} · {account.so_dien_thoai || "Chưa có SĐT"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                    {adminRoleLabel(account.vai_tro)}
                  </span>
                </div>
                <div className="mt-3 grid gap-1 text-sm text-[var(--muted)]">
                  <span>Trạng thái: <b className="text-[var(--text)]">{accountStatusLabel(account.trang_thai)}</b></span>
                  <span>Email: <b className="text-[var(--text)]">{account.email || "-"}</b></span>
                  <span>
                    Đăng nhập cuối:{" "}
                    <b className="text-[var(--text)]">{account.lan_dang_nhap_cuoi?.toLocaleString("vi-VN") || "-"}</b>
                  </span>
                </div>
                {account.id !== currentAccount.id ? (
                  <form action={updateAccountRoleAction} className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <input name="id" type="hidden" value={account.id} />
                    <RoleSelect defaultValue={account.vai_tro} />
                    <Button size="sm" type="submit">
                      Lưu
                    </Button>
                  </form>
                ) : null}
                {account.trang_thai === "DANG_HOAT_DONG" && account.id !== currentAccount.id ? (
                  <form action={lockAccountAction} className="mt-3">
                    <input name="id" type="hidden" value={account.id} />
                    <Button variant="secondary" size="sm" type="submit" className="w-full">
                      <Lock size={15} aria-hidden="true" />
                      Khóa tài khoản
                    </Button>
                  </form>
                ) : account.trang_thai === "BI_KHOA" && account.id !== currentAccount.id ? (
                  <form action={unlockAccountAction} className="mt-3">
                    <input name="id" type="hidden" value={account.id} />
                    <Button size="sm" type="submit" className="w-full">
                      <LockOpen size={15} aria-hidden="true" />
                      Mở khóa tài khoản
                    </Button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <ScrollPanel minWidth={980}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tài khoản</TableHead>
                    <TableHead>SĐT đăng nhập</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Quyền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Đăng nhập cuối</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-semibold">{account.ten_dang_nhap}</TableCell>
                      <TableCell>{account.so_dien_thoai || "-"}</TableCell>
                      <TableCell>{account.ten_hien_thi || "-"}</TableCell>
                      <TableCell>{account.email || "-"}</TableCell>
                      <TableCell>
                        {account.id !== currentAccount.id ? (
                          <form action={updateAccountRoleAction} className="flex items-center gap-2">
                            <input name="id" type="hidden" value={account.id} />
                            <RoleSelect defaultValue={account.vai_tro} />
                            <Button size="sm" type="submit">
                              Lưu
                            </Button>
                          </form>
                        ) : (
                          adminRoleLabel(account.vai_tro)
                        )}
                      </TableCell>
                      <TableCell>{accountStatusLabel(account.trang_thai)}</TableCell>
                      <TableCell>{account.lan_dang_nhap_cuoi?.toLocaleString("vi-VN") || "-"}</TableCell>
                      <TableCell>
                        {account.trang_thai === "DANG_HOAT_DONG" && account.id !== currentAccount.id ? (
                          <form action={lockAccountAction}>
                            <input name="id" type="hidden" value={account.id} />
                            <Button variant="secondary" size="sm" type="submit">
                              <Lock size={15} aria-hidden="true" />
                              Khóa
                            </Button>
                          </form>
                        ) : account.trang_thai === "BI_KHOA" && account.id !== currentAccount.id ? (
                          <form action={unlockAccountAction}>
                            <input name="id" type="hidden" value={account.id} />
                            <Button size="sm" type="submit">
                              <LockOpen size={15} aria-hidden="true" />
                              Mở khóa
                            </Button>
                          </form>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollPanel>
          </div>
        </CardContent>
      </Card>
    </AdminFrame>
  );
}

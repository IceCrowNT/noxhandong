import { Lock, UserPlus } from "lucide-react";

import { createManagerAction, lockAccountAction } from "@/app/admin/actions";
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
    error?: string;
  }>;
};

function getStatusMessage(params?: Awaited<AccountsPageProps["searchParams"]>) {
  if (params?.created === "1") return "Đã tạo tài khoản quản lý.";
  if (params?.locked === "1") return "Đã khóa tài khoản.";
  if (params?.error === "duplicate") return "Tài khoản, số điện thoại hoặc email đã tồn tại.";
  if (params?.error === "invalid") {
    return "Dữ liệu không hợp lệ. Cần tài khoản, số điện thoại hợp lệ và mật khẩu ít nhất 10 ký tự.";
  }
  return null;
}

export default async function AdminAccountsPage({ searchParams }: AccountsPageProps) {
  await requireAdminRole("SUPER_ADMIN");
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
      description="Tạo, theo dõi hoặc khóa tài khoản quản trị nội bộ."
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
          <CardTitle>Tạo tài khoản quản lý</CardTitle>
          <CardDescription>
            Tài khoản quản lý dùng để vào vùng nội bộ. Quyền cao nhất vẫn giữ cho tài khoản Super Admin.
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

      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Danh sách tài khoản</CardTitle>
          <CardDescription>Chỉ tài khoản quản lý đang hoạt động mới có thể đăng nhập vào vùng nội bộ.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <TableCell>{adminRoleLabel(account.vai_tro)}</TableCell>
                    <TableCell>{accountStatusLabel(account.trang_thai)}</TableCell>
                    <TableCell>{account.lan_dang_nhap_cuoi?.toLocaleString("vi-VN") || "-"}</TableCell>
                    <TableCell>
                      {account.trang_thai === "DANG_HOAT_DONG" && account.vai_tro !== "SUPER_ADMIN" ? (
                        <form action={lockAccountAction}>
                          <input name="id" type="hidden" value={account.id} />
                          <Button variant="secondary" size="sm" type="submit">
                            <Lock size={15} aria-hidden="true" />
                            Khóa
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
        </CardContent>
      </Card>
    </AdminFrame>
  );
}

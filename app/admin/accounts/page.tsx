import Link from "next/link";

import {
  createManagerAction,
  lockAccountAction,
  logoutAction,
} from "@/app/admin/actions";
import { requireAdminRole } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";

type AccountsPageProps = {
  searchParams?: Promise<{
    created?: string;
    locked?: string;
    error?: string;
  }>;
};

function getStatusMessage(params?: Awaited<AccountsPageProps["searchParams"]>) {
  if (params?.created === "1") {
    return "Đã tạo tài khoản manager.";
  }
  if (params?.locked === "1") {
    return "Đã khóa tài khoản.";
  }
  if (params?.error === "duplicate") {
    return "Tài khoản, số điện thoại hoặc email đã tồn tại.";
  }
  if (params?.error === "invalid") {
    return "Dữ liệu không hợp lệ. Cần tài khoản, số điện thoại hợp lệ và mật khẩu ít nhất 10 ký tự.";
  }
  return null;
}

export default async function AdminAccountsPage({ searchParams }: AccountsPageProps) {
  await requireAdminRole("SUPER_ADMIN");
  const params = await searchParams;
  const statusMessage = getStatusMessage(params);
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
      lan_dang_nhap_cuoi: true,
    },
  });

  return (
    <main className="page-shell admin-shell">
      <section className="panel admin-header">
        <div>
          <p className="eyebrow">SUPER_ADMIN</p>
          <h1>Quản lý tài khoản</h1>
          <p className="hero-copy">Chỉ Super Admin được tạo hoặc khóa tài khoản quản trị.</p>
        </div>
        <div className="admin-actions">
          <Link className="secondary-button" href="/admin">
            Về admin
          </Link>
          <form action={logoutAction}>
            <button className="secondary-button" type="submit">
              Đăng xuất
            </button>
          </form>
        </div>
      </section>

      {statusMessage ? <div className="status-banner">{statusMessage}</div> : null}

      <section className="panel">
        <h2>Tạo manager</h2>
        <form action={createManagerAction} className="admin-form admin-form-grid">
          <label className="upload-field">
            Tài khoản
            <input name="username" required />
          </label>
          <label className="upload-field">
            Số điện thoại đăng nhập
            <input name="phoneNumber" inputMode="tel" placeholder="0912345678" required />
          </label>
          <label className="upload-field">
            Tên hiển thị
            <input name="displayName" />
          </label>
          <label className="upload-field">
            Email
            <input name="email" type="email" />
          </label>
          <label className="upload-field">
            Mật khẩu ban đầu
            <input name="password" type="password" minLength={10} required />
          </label>
          <button className="primary-button" type="submit">
            Tạo manager
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Danh sách tài khoản</h2>
        <div className="table-wrap">
          <table className="review-table admin-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>SĐT đăng nhập</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Quyền</th>
                <th>Trạng thái</th>
                <th>Đăng nhập cuối</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.ten_dang_nhap}</td>
                  <td>{account.so_dien_thoai || "-"}</td>
                  <td>{account.ten_hien_thi || "-"}</td>
                  <td>{account.email || "-"}</td>
                  <td>{account.vai_tro}</td>
                  <td>{account.trang_thai}</td>
                  <td>{account.lan_dang_nhap_cuoi?.toLocaleString("vi-VN") || "-"}</td>
                  <td>
                    {account.trang_thai === "DANG_HOAT_DONG" &&
                    account.vai_tro !== "SUPER_ADMIN" ? (
                      <form action={lockAccountAction}>
                        <input name="id" type="hidden" value={account.id} />
                        <button className="secondary-button compact-button" type="submit">
                          Khóa
                        </button>
                      </form>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

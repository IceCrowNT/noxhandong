import Link from "next/link";

import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/src/modules/auth/current-user";

type AdminHomeProps = {
  searchParams?: Promise<{
    denied?: string;
  }>;
};

export default async function AdminHomePage({ searchParams }: AdminHomeProps) {
  const account = await requireAdmin();
  const params = await searchParams;

  return (
    <main className="page-shell admin-shell">
      <section className="panel admin-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Vùng quản trị</h1>
          <p className="hero-copy">
            Đăng nhập bằng {account.ten_hien_thi || account.ten_dang_nhap}, quyền{" "}
            <strong>{account.vai_tro}</strong>.
          </p>
        </div>
        <form action={logoutAction}>
          <button className="secondary-button" type="submit">
            Đăng xuất
          </button>
        </form>
      </section>

      {params?.denied === "1" ? (
        <div className="error-banner">Tài khoản hiện tại không có quyền vào chức năng này.</div>
      ) : null}

      <section className="admin-grid">
        <Link className="admin-card" href="/admin/accounts">
          <span>SUPER_ADMIN</span>
          <strong>Quản lý tài khoản</strong>
          <p>Tạo và khóa tài khoản manager.</p>
        </Link>
        <Link className="admin-card" href="/admin/import">
          <span>SUPER_ADMIN</span>
          <strong>Import/chốt dữ liệu public</strong>
          <p>Khu vực dành cho batch thu phí sau này.</p>
        </Link>
        <Link className="admin-card" href="/admin/dashboard">
          <span>MANAGER</span>
          <strong>Dashboard quản lý</strong>
          <p>Tìm căn, xem phí public, contact candidate và lịch sử import.</p>
        </Link>
        <Link className="admin-card" href="/admin/contacts/review">
          <span>MANAGER</span>
          <strong>Review contact</strong>
          <p>Duyệt, sửa hoặc từ chối contact candidate trước khi vào master.</p>
        </Link>
      </section>
    </main>
  );
}

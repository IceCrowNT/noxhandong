import Link from "next/link";

import { logoutAction } from "@/app/admin/actions";
import { requireAdminRole } from "@/src/modules/auth/current-user";

export default async function AdminImportPage() {
  await requireAdminRole("SUPER_ADMIN");

  return (
    <main className="page-shell admin-shell">
      <section className="panel admin-header">
        <div>
          <p className="eyebrow">SUPER_ADMIN</p>
          <h1>Import dữ liệu public</h1>
          <p className="hero-copy">
            Route này đã được bảo vệ quyền Super Admin. Chức năng import file theo dõi thu phí sẽ
            được triển khai ở Task H.
          </p>
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
    </main>
  );
}

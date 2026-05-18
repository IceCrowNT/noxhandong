import Link from "next/link";

import { PUBLIC_LOOKUP_MAX_LENGTH } from "@/src/modules/billing/fee-status";

export default function HomePage() {
  return (
    <main className="resident-home-shell">
      <header className="resident-public-header">
        <Link className="resident-brand" href="/">
          <span className="resident-brand-mark" aria-hidden="true">
            AD
          </span>
          <span>BQT An Đồng</span>
        </Link>
        <Link className="admin-login-link" href="/admin/login">
          Quản trị
        </Link>
      </header>

      <section className="resident-home-panel">
        <div className="resident-home-copy">
          <h1>Tra cứu phí quản lý</h1>
          <p>Nhập mã căn để xem đã đóng phí đến tháng nào.</p>
        </div>

        <form className="resident-lookup-form" action="/tra-cuu-phi">
          <label>
            Mã căn
            <input
              aria-label="Nhập mã căn hộ"
              autoComplete="off"
              inputMode="text"
              maxLength={PUBLIC_LOOKUP_MAX_LENGTH}
              name="ma_can"
              placeholder="Ví dụ: L1.115 hoặc căn 115 lô L1"
            />
          </label>
          <button className="primary-button" type="submit">
            Tra cứu
          </button>
        </form>

        <div className="resident-example-grid" aria-label="Ví dụ nhập mã căn">
          <span>L1.115</span>
          <span>l1 115</span>
          <span>căn 115 lô L1</span>
          <span>LK2.10</span>
        </div>

        <div className="resident-home-notes">
          <span>Không cần đăng nhập</span>
          <span>Không hiển thị thông tin cá nhân</span>
        </div>
      </section>
    </main>
  );
}

import { loginAction } from "@/app/admin/actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing") {
    return "Vui lòng nhập đủ số điện thoại/tài khoản và mật khẩu.";
  }
  if (error === "invalid") {
    return "Số điện thoại/tài khoản hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.";
  }
  return null;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);

  return (
    <main className="admin-auth-shell">
      <section className="admin-auth-panel">
        <p className="eyebrow">Quản trị nội bộ</p>
        <h1>Đăng nhập</h1>
        <p className="hero-copy">
          Khu vực này chỉ dành cho tài khoản quản trị đã được cấp quyền.
        </p>

        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

        <form action={loginAction} className="admin-form">
          <label className="upload-field">
            Số điện thoại hoặc tài khoản
            <input
              name="username"
              autoComplete="username"
              inputMode="tel"
              placeholder="0912345678 hoặc admin"
              required
            />
          </label>
          <label className="upload-field">
            Mật khẩu
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary-button" type="submit">
            Đăng nhập
          </button>
        </form>
      </section>
    </main>
  );
}

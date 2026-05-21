import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { loginAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
      <Card className="w-full max-w-[460px]">
        <CardHeader>
          <Button asChild variant="ghost" className="mb-2 w-fit px-0">
            <Link href="/">
              <ArrowLeft size={18} aria-hidden="true" />
              Về trang chủ
            </Link>
          </Button>
          <p className="eyebrow">Quản trị nội bộ</p>
          <CardTitle className="text-3xl">Đăng nhập</CardTitle>
          <CardDescription>Dành cho tài khoản quản trị đã được cấp quyền.</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{errorMessage}</div> : null}

          <form action={loginAction} className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Số điện thoại hoặc tài khoản
              <Input
                name="username"
                autoComplete="username"
                inputMode="tel"
                placeholder="0912345678 hoặc admin"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Mật khẩu
              <Input name="password" type="password" autoComplete="current-password" required />
            </label>
            <Button type="submit" size="lg">
              Đăng nhập
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

import Link from "next/link";
import { Database, Home, LayoutDashboard, LogOut, ShieldCheck, Upload, Users } from "lucide-react";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navigation = [
  { key: "home", href: "/admin", label: "Vùng quản trị", icon: Home },
  { key: "dashboard", href: "/admin/dashboard", label: "Tra cứu nội bộ", icon: LayoutDashboard },
  { key: "import", href: "/admin/import", label: "Nhập dữ liệu", icon: Upload },
  { key: "contacts", href: "/admin/contacts/review", label: "Duyệt liên hệ", icon: Users },
  { key: "accounts", href: "/admin/accounts", label: "Tài khoản", icon: ShieldCheck },
  { key: "database", href: "/admin#database", label: "Cơ sở dữ liệu", icon: Database }
] as const;

type AdminFrameProps = {
  activeKey: (typeof navigation)[number]["key"];
  badge?: string;
  children: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  title: string;
};

export function AdminFrame({ activeKey, badge, children, description, headerActions, title }: AdminFrameProps) {
  return (
    <main className="admin-shell min-h-screen bg-[#f8faf9] text-[var(--text)]">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--line)] bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex h-14 items-center border-b border-[var(--line)] px-4">
            <Link href="/admin" className="flex min-w-0 items-center gap-3 text-[var(--accent)]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                <Home size={17} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-sm leading-5">BQT An Đồng</strong>
                <span className="block truncate text-xs text-[var(--muted)]">Vùng quản trị</span>
              </div>
            </Link>
          </div>

          <nav className="grid gap-1 p-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeKey === item.key;
              return (
                <Link
                  className={
                    active
                      ? "flex h-9 items-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-white"
                      : "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                  }
                  href={item.href}
                  key={item.key}
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[var(--line)] bg-[#f8faf9]/95 px-4 backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold">{title}</span>
              {badge ? (
                <Badge variant="outline" className="hidden shrink-0 md:inline-flex">
                  {badge}
                </Badge>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {headerActions}
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </Button>
              </form>
            </div>
          </header>

          <div className="p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-1 md:mb-5">
              <div className="flex flex-wrap items-center gap-2">
                {badge ? <Badge variant="secondary">{badge}</Badge> : null}
                <Badge variant="success">Dữ liệu thật</Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
              {description ? <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

export function ScrollPanel({ children, minWidth = 900 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border border-[var(--line)] bg-white">
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}

import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/admin/actions";
import { AdminDesktopSidebar, AdminMobileMenu, type AdminNavigationKey } from "@/components/admin/admin-navigation";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/src/modules/auth/current-user";

type AdminFrameProps = {
  activeKey: AdminNavigationKey;
  badge?: string;
  children: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  title: string;
};

export async function AdminFrame({ activeKey, badge, children, description, headerActions, title }: AdminFrameProps) {
  const account = await requireAdmin();
  return (
    <main className="admin-shell min-h-screen bg-[#f8faf9] text-[var(--text)]">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <AdminDesktopSidebar activeKey={activeKey} role={account.vai_tro} />

        <section className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[var(--line)] bg-[#f8faf9]/95 px-4 backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <AdminMobileMenu activeKey={activeKey} role={account.vai_tro} />
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
                <SubmitButton variant="ghost" size="sm" pendingText="Đang thoát...">
                  <LogOut size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </SubmitButton>
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
    <div className="max-h-[380px] w-full max-w-full overflow-auto rounded-md border border-[var(--line)] bg-white">
      <div className="w-max min-w-full" style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}

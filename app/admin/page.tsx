import Link from "next/link";
import { Database, FileSpreadsheet, Search, Users } from "lucide-react";

import { AdminFrame } from "@/components/admin/admin-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/src/modules/auth/current-user";
import { adminRoleLabel } from "@/src/modules/shared/labels";

type AdminHomeProps = {
  searchParams?: Promise<{
    denied?: string;
  }>;
};

const adminCards = [
  {
    href: "/admin/dashboard",
    icon: Search,
    role: "Quản lý",
    title: "Tra cứu nội bộ",
    description: "Tìm căn, xem trạng thái phí, liên hệ cư dân và lịch sử nhập dữ liệu."
  },
  {
    href: "/admin/contacts/review",
    icon: Users,
    role: "Quản lý",
    title: "Duyệt liên hệ",
    description: "Rà soát liên hệ nháp trước khi đưa vào danh bạ chính thức."
  },
  {
    href: "/admin/import",
    icon: FileSpreadsheet,
    role: "Quản trị cao nhất",
    title: "Nhập/chốt dữ liệu phí",
    description: "Nhập file thu phí và chốt dữ liệu cho cư dân tra cứu."
  },
  {
    href: "/admin/accounts",
    icon: Database,
    role: "Quản trị cao nhất",
    title: "Tài khoản quản trị",
    description: "Tạo, theo dõi và khóa tài khoản quản lý nội bộ."
  }
];

export default async function AdminHomePage({ searchParams }: AdminHomeProps) {
  const account = await requireAdmin();
  const params = await searchParams;

  return (
    <AdminFrame
      activeKey="home"
      badge={adminRoleLabel(account.vai_tro)}
      title="Vùng quản trị"
      description={
        <>
          Đăng nhập bằng {account.ten_hien_thi || account.ten_dang_nhap}, quyền{" "}
          <strong>{adminRoleLabel(account.vai_tro)}</strong>.
        </>
      }
    >
      {params?.denied === "1" ? (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
          Tài khoản hiện tại không có quyền vào chức năng này.
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
        {adminCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group block">
              <Card className="h-full bg-white/90 transition-colors group-hover:border-[var(--accent)]">
                <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 p-4 md:block md:p-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] md:mx-6 md:mt-6">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 md:hidden">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                      {item.role}
                    </p>
                    <strong className="mt-1 block truncate text-base">{item.title}</strong>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">{item.description}</p>
                  </div>
                  <div className="hidden md:block">
                    <CardHeader className="gap-3 pt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                        {item.role}
                      </p>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>
    </AdminFrame>
  );
}

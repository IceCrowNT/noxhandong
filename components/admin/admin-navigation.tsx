"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, FileSearch, LayoutDashboard, Menu, ShieldCheck, Upload, UserCircle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { hasPermission, type Permission } from "@/src/modules/auth/permissions";
import type { AdminRole } from "@/src/modules/auth/session";

export const adminNavigation = [
  {
    key: "dashboard",
    href: "/admin/dashboard",
    label: "Tra cứu nội bộ",
    icon: LayoutDashboard,
    permission: "VIEW_DASHBOARD",
    group: "Vận hành",
  },
  {
    key: "announcements",
    href: "/admin/announcements",
    label: "Thông báo",
    icon: Bell,
    permission: "MANAGE_ANNOUNCEMENTS",
    group: "Vận hành",
  },
  {
    key: "contacts",
    href: "/admin/contacts/review",
    label: "Danh bạ cư dân",
    icon: Users,
    permission: "VIEW_CONTACTS",
    group: "Cơ sở dữ liệu",
  },
  {
    key: "import",
    href: "/admin/import",
    label: "Nhập dữ liệu",
    icon: Upload,
    permission: "IMPORT_DATA",
    group: "Cơ sở dữ liệu",
  },
  {
    key: "transactions",
    href: "/admin/transactions/review",
    label: "Duyệt sao kê",
    icon: FileSearch,
    permission: "REVIEW_TRANSACTIONS",
    group: "Cơ sở dữ liệu",
  },
  {
    key: "accounts",
    href: "/admin/accounts",
    label: "Tài khoản quản trị",
    icon: ShieldCheck,
    permission: "MANAGE_ACCOUNTS",
    group: "Cơ sở dữ liệu",
  },
  {
    key: "profile",
    href: "/admin/profile",
    label: "Tài khoản của tôi",
    icon: UserCircle,
    permission: "VIEW_PROFILE",
    group: "Cá nhân",
  },
] as const;

export type AdminNavigationKey = (typeof adminNavigation)[number]["key"];

function AdminBrand() {
  return (
    <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3 text-[var(--accent)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-sm">
        <Image
          alt="Hoang Huy Group"
          className="h-7 w-7 object-contain"
          height={28}
          src="/images/logo-hoanghuy.webp"
          width={28}
        />
      </div>
      <div className="min-w-0">
        <strong className="block truncate text-sm leading-5">BQT An Đông</strong>
        <span className="block truncate text-xs text-[var(--muted)]">Vùng quản trị</span>
      </div>
    </Link>
  );
}

function NavigationLinks({
  activeKey,
  role,
  closeOnClick = false,
}: {
  activeKey: AdminNavigationKey;
  role: AdminRole;
  closeOnClick?: boolean;
}) {
  const visibleItems = adminNavigation.filter((item) => hasPermission(role, item.permission as Permission));

  return (
    <nav className="grid gap-1 p-2">
      {visibleItems.map((item, index) => {
        const Icon = item.icon;
        const active = activeKey === item.key;
        const previousGroup = index > 0 ? visibleItems[index - 1]?.group : null;
        const link = (
          <Link
            className={
              active
                ? "flex h-10 items-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-white"
                : "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            }
            href={item.href}
          >
            <Icon aria-hidden="true" size={16} />
            {item.label}
          </Link>
        );

        return (
          <div key={item.key}>
            {item.group !== previousGroup ? (
              <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                {item.group}
              </div>
            ) : null}
            {closeOnClick ? <SheetClose asChild>{link}</SheetClose> : link}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminDesktopSidebar({ activeKey, role }: { activeKey: AdminNavigationKey; role: AdminRole }) {
  return (
    <aside className="hidden border-r border-[var(--line)] bg-white lg:sticky lg:top-0 lg:block lg:h-screen">
      <div className="flex h-14 items-center border-b border-[var(--line)] px-4">
        <AdminBrand />
      </div>
      <NavigationLinks activeKey={activeKey} role={role} />
    </aside>
  );
}

export function AdminMobileMenu({ activeKey, role }: { activeKey: AdminNavigationKey; role: AdminRole }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label="Mở menu quản trị"
          className="lg:hidden"
          data-testid="admin-mobile-menu-trigger"
          size="icon-sm"
          variant="ghost"
        >
          <Menu aria-hidden="true" size={18} />
          <span className="sr-only">Mở menu quản trị</span>
        </Button>
      </SheetTrigger>
      <SheetContent data-testid="admin-mobile-sheet" side="left">
        <SheetHeader className="border-b border-[var(--line)]">
          <SheetTitle>Menu quản trị</SheetTitle>
          <SheetDescription>Chọn nhanh khu vực cần thao tác.</SheetDescription>
        </SheetHeader>
        <div className="border-b border-[var(--line)] p-4">
          <AdminBrand />
        </div>
        <NavigationLinks activeKey={activeKey} role={role} closeOnClick />
      </SheetContent>
    </Sheet>
  );
}

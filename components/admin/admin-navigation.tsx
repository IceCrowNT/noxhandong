"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, FileSearch, LayoutDashboard, Menu, ShieldCheck, Upload, UserCircle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hasPermission, type Permission } from "@/src/modules/auth/permissions";
import type { AdminRole } from "@/src/modules/auth/session";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const adminNavigation = [
  { key: "dashboard", href: "/admin/dashboard", label: "Tra cứu nội bộ", icon: LayoutDashboard, permission: "VIEW_DASHBOARD" },
  { key: "contacts", href: "/admin/contacts/review", label: "Liên hệ cư dân", icon: Users, permission: "VIEW_CONTACTS" },
  { key: "import", href: "/admin/import", label: "Nhập dữ liệu", icon: Upload, permission: "IMPORT_DATA" },
  { key: "transactions", href: "/admin/transactions/review", label: "Duyệt sao kê", icon: FileSearch, permission: "REVIEW_TRANSACTIONS" },
  { key: "announcements", href: "/admin/announcements", label: "Thông báo", icon: Bell, permission: "MANAGE_ANNOUNCEMENTS" },
  { key: "accounts", href: "/admin/accounts", label: "Tài khoản quản trị", icon: ShieldCheck, permission: "MANAGE_ACCOUNTS" },
  { key: "profile", href: "/admin/profile", label: "Tài khoản của tôi", icon: UserCircle, permission: "VIEW_PROFILE" },
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
        <strong className="block truncate text-sm leading-5">BQT An Đồng</strong>
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
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = activeKey === item.key;
        const link = (
          <Link
            className={
              active
                ? "flex h-10 items-center gap-2 rounded-md bg-[var(--accent)] px-3 text-sm font-medium text-white"
                : "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            }
            href={item.href}
          >
            <Icon size={16} aria-hidden="true" />
            {item.label}
          </Link>
        );

        return closeOnClick ? (
          <SheetClose asChild key={item.key}>
            {link}
          </SheetClose>
        ) : (
          <div key={item.key}>{link}</div>
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
          <Menu size={18} aria-hidden="true" />
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

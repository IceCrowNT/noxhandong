import type { AdminRole } from "@/src/modules/auth/session";

export type Permission =
  | "VIEW_DASHBOARD"
  | "VIEW_CONTACTS"
  | "REVIEW_CONTACTS"
  | "IMPORT_DATA"
  | "REVIEW_TRANSACTIONS"
  | "PUBLISH_DATA"
  | "MANAGE_ANNOUNCEMENTS"
  | "MANAGE_ACCOUNTS"
  | "VIEW_PROFILE";

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set<Permission>([
    "VIEW_DASHBOARD",
    "VIEW_CONTACTS",
    "REVIEW_CONTACTS",
    "IMPORT_DATA",
    "REVIEW_TRANSACTIONS",
    "PUBLISH_DATA",
    "MANAGE_ANNOUNCEMENTS",
    "MANAGE_ACCOUNTS",
    "VIEW_PROFILE",
  ]),
  MANAGER: new Set<Permission>(["VIEW_DASHBOARD", "VIEW_PROFILE", "MANAGE_ANNOUNCEMENTS"]),
  TECHNICIAN: new Set<Permission>(["VIEW_DASHBOARD", "VIEW_PROFILE"]),
};

export function hasPermission(role: AdminRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function permissionForAdminPath(pathname: string): Permission | null {
  if (pathname.startsWith("/admin/accounts")) return "MANAGE_ACCOUNTS";
  if (pathname.startsWith("/admin/import")) return "IMPORT_DATA";
  if (pathname.startsWith("/admin/transactions")) return "REVIEW_TRANSACTIONS";
  if (pathname.startsWith("/admin/announcements")) return "MANAGE_ANNOUNCEMENTS";
  if (pathname.startsWith("/admin/contacts")) return "VIEW_CONTACTS";
  if (pathname.startsWith("/admin/profile")) return "VIEW_PROFILE";
  if (pathname.startsWith("/admin")) return "VIEW_DASHBOARD";
  return null;
}

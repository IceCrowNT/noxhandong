import { describe, expect, it } from "vitest";

import {
  hasPermission,
  permissionForAdminPath,
} from "@/src/modules/auth/permissions";

describe("admin permissions", () => {
  it("gives super admin operational permissions", () => {
    expect(hasPermission("SUPER_ADMIN", "IMPORT_DATA")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "REVIEW_TRANSACTIONS")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "MANAGE_OPERATION_TASKS")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "MANAGE_ACCOUNTS")).toBe(true);
  });

  it("allows managers to manage operation tasks without import/review access", () => {
    expect(hasPermission("MANAGER", "VIEW_DASHBOARD")).toBe(true);
    expect(hasPermission("MANAGER", "VIEW_OPERATION_TASKS")).toBe(true);
    expect(hasPermission("MANAGER", "MANAGE_OPERATION_TASKS")).toBe(true);
    expect(hasPermission("MANAGER", "VIEW_CONTACTS")).toBe(true);
    expect(hasPermission("MANAGER", "VIEW_PROFILE")).toBe(true);
    expect(hasPermission("MANAGER", "IMPORT_DATA")).toBe(false);
    expect(hasPermission("MANAGER", "REVIEW_TRANSACTIONS")).toBe(false);
  });

  it("lets technicians view and report operation tasks only", () => {
    expect(hasPermission("TECHNICIAN", "VIEW_DASHBOARD")).toBe(true);
    expect(hasPermission("TECHNICIAN", "VIEW_OPERATION_TASKS")).toBe(true);
    expect(hasPermission("TECHNICIAN", "MANAGE_OPERATION_TASKS")).toBe(false);
    expect(hasPermission("TECHNICIAN", "VIEW_CONTACTS")).toBe(true);
    expect(hasPermission("TECHNICIAN", "VIEW_PROFILE")).toBe(true);
    expect(hasPermission("TECHNICIAN", "IMPORT_DATA")).toBe(false);
    expect(hasPermission("TECHNICIAN", "REVIEW_TRANSACTIONS")).toBe(false);
  });

  it("maps protected routes to the same permission source", () => {
    expect(permissionForAdminPath("/admin/import")).toBe("IMPORT_DATA");
    expect(permissionForAdminPath("/admin/operation-tasks")).toBe("VIEW_OPERATION_TASKS");
    expect(permissionForAdminPath("/admin/transactions/review")).toBe("REVIEW_TRANSACTIONS");
    expect(permissionForAdminPath("/admin/announcements")).toBe("MANAGE_ANNOUNCEMENTS");
  });
});

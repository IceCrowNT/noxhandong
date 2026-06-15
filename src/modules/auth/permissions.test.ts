import { describe, expect, it } from "vitest";

import {
  hasPermission,
  permissionForAdminPath,
} from "@/src/modules/auth/permissions";

describe("admin permissions", () => {
  it("gives super admin operational permissions", () => {
    expect(hasPermission("SUPER_ADMIN", "IMPORT_DATA")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "REVIEW_TRANSACTIONS")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "MANAGE_ACCOUNTS")).toBe(true);
  });

  it("limits manager and technician to daily lookup work", () => {
    for (const role of ["MANAGER", "TECHNICIAN"] as const) {
      expect(hasPermission(role, "VIEW_DASHBOARD")).toBe(true);
      expect(hasPermission(role, "VIEW_CONTACTS")).toBe(true);
      expect(hasPermission(role, "VIEW_PROFILE")).toBe(true);
      expect(hasPermission(role, "IMPORT_DATA")).toBe(false);
      expect(hasPermission(role, "REVIEW_TRANSACTIONS")).toBe(false);
    }
  });

  it("maps protected routes to the same permission source", () => {
    expect(permissionForAdminPath("/admin/import")).toBe("IMPORT_DATA");
    expect(permissionForAdminPath("/admin/transactions/review")).toBe("REVIEW_TRANSACTIONS");
    expect(permissionForAdminPath("/admin/announcements")).toBe("MANAGE_ANNOUNCEMENTS");
  });
});

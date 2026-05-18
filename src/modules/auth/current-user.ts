import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/src/modules/database";
import {
  ADMIN_SESSION_COOKIE,
  type AdminRole,
  verifyAdminSessionToken,
} from "@/src/modules/auth/session";

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const session = await verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) {
    return null;
  }

  const account = await prisma.taiKhoanQuanTri.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      ten_dang_nhap: true,
      ten_hien_thi: true,
      vai_tro: true,
      trang_thai: true,
    },
  });

  if (!account || account.trang_thai !== "DANG_HOAT_DONG") {
    return null;
  }

  return account;
}

export async function requireAdmin() {
  const account = await getCurrentAdmin();
  if (!account) {
    redirect("/admin/login");
  }
  return account;
}

export async function requireAdminRole(role: AdminRole) {
  const account = await requireAdmin();
  if (account.vai_tro !== role) {
    redirect("/admin?denied=1");
  }
  return account;
}

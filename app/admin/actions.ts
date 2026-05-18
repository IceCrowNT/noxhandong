"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/src/modules/database";
import { requireAdminRole } from "@/src/modules/auth/current-user";
import { normalizeAdminLoginIdentifier, normalizeVietnamPhone } from "@/src/modules/auth/identity";
import { hashPassword, verifyPassword } from "@/src/modules/auth/password";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
} from "@/src/modules/auth/session";

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(formData: FormData) {
  const loginIdentifier = getString(formData, "username");
  const password = getString(formData, "password");

  if (!loginIdentifier || !password) {
    redirect("/admin/login?error=missing");
  }

  const identity = normalizeAdminLoginIdentifier(loginIdentifier);
  const account =
    identity.type === "phone"
      ? await prisma.taiKhoanQuanTri.findUnique({
          where: { so_dien_thoai: identity.value },
        })
      : await prisma.taiKhoanQuanTri.findUnique({
          where: { ten_dang_nhap: identity.value },
        });

  if (
    !account ||
    account.trang_thai !== "DANG_HOAT_DONG" ||
    !verifyPassword(password, account.mat_khau_hash)
  ) {
    redirect("/admin/login?error=invalid");
  }

  const token = await createAdminSessionToken({
    userId: account.id,
    username: account.ten_dang_nhap,
    role: account.vai_tro,
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  await prisma.taiKhoanQuanTri.update({
    where: { id: account.id },
    data: { lan_dang_nhap_cuoi: new Date() },
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}

export async function createManagerAction(formData: FormData) {
  await requireAdminRole("SUPER_ADMIN");

  const username = getString(formData, "username");
  const phoneNumber = normalizeVietnamPhone(getString(formData, "phoneNumber"));
  const displayName = getString(formData, "displayName");
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!username || !phoneNumber || password.length < 10) {
    redirect("/admin/accounts?error=invalid");
  }

  try {
    await prisma.taiKhoanQuanTri.create({
      data: {
        ten_dang_nhap: username,
        so_dien_thoai: phoneNumber,
        ten_hien_thi: displayName || null,
        email: email || null,
        mat_khau_hash: hashPassword(password),
        vai_tro: "MANAGER",
        trang_thai: "DANG_HOAT_DONG",
      },
    });
  } catch {
    redirect("/admin/accounts?error=duplicate");
  }

  redirect("/admin/accounts?created=1");
}

export async function lockAccountAction(formData: FormData) {
  await requireAdminRole("SUPER_ADMIN");

  const id = Number(getString(formData, "id"));
  if (!Number.isInteger(id)) {
    redirect("/admin/accounts?error=invalid");
  }

  await prisma.taiKhoanQuanTri.update({
    where: { id },
    data: { trang_thai: "BI_KHOA" },
  });

  redirect("/admin/accounts?locked=1");
}

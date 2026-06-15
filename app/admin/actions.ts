"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/src/modules/database";
import { requireAdmin, requirePermission } from "@/src/modules/auth/current-user";
import { normalizeAdminLoginIdentifier, normalizeVietnamPhone } from "@/src/modules/auth/identity";
import { hashPassword, verifyPassword } from "@/src/modules/auth/password";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionMaxAgeSeconds,
} from "@/src/modules/auth/session";

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getCreatableAdminRole(value: string) {
  if (value === "SUPER_ADMIN") return "SUPER_ADMIN";
  return value === "TECHNICIAN" ? "TECHNICIAN" : "MANAGER";
}

function getAssignableAdminRole(value: string) {
  if (value === "SUPER_ADMIN") return "SUPER_ADMIN";
  return value === "TECHNICIAN" ? "TECHNICIAN" : "MANAGER";
}

export async function loginAction(formData: FormData) {
  const headerStore = await headers();
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
    await prisma.nhatKyDangNhapQuanTri.create({
      data: {
        tai_khoan_id: account?.id || null,
        dinh_danh_dang_nhap: loginIdentifier,
        thanh_cong: false,
        ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip"),
        user_agent: headerStore.get("user-agent"),
        ghi_chu: "Đăng nhập thất bại.",
      },
    });
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
    maxAge: getAdminSessionMaxAgeSeconds(),
  });

  await prisma.$transaction([
    prisma.taiKhoanQuanTri.update({
      where: { id: account.id },
      data: { lan_dang_nhap_cuoi: new Date() },
    }),
    prisma.nhatKyDangNhapQuanTri.create({
      data: {
        tai_khoan_id: account.id,
        dinh_danh_dang_nhap: loginIdentifier,
        thanh_cong: true,
        ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip"),
        user_agent: headerStore.get("user-agent"),
        ghi_chu: "Đăng nhập thành công.",
      },
    }),
  ]);

  redirect("/admin/dashboard");
}

export async function resetAccountPasswordAction(formData: FormData) {
  const currentAccount = await requirePermission("MANAGE_ACCOUNTS");

  const id = Number(getString(formData, "id"));
  const newPassword = getString(formData, "newPassword");
  if (!Number.isInteger(id) || id === currentAccount.id || newPassword.length < 10) {
    redirect("/admin/accounts?error=invalid");
  }

  const account = await prisma.taiKhoanQuanTri.findUnique({ where: { id }, select: { id: true } });
  if (!account) {
    redirect("/admin/accounts?error=invalid");
  }

  await prisma.taiKhoanQuanTri.update({
    where: { id },
    data: { mat_khau_hash: hashPassword(newPassword) },
  });

  redirect("/admin/accounts?passwordReset=1");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}

export async function createManagerAction(formData: FormData) {
  await requirePermission("MANAGE_ACCOUNTS");

  const username = getString(formData, "username");
  const phoneNumber = normalizeVietnamPhone(getString(formData, "phoneNumber"));
  const displayName = getString(formData, "displayName");
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const role = getCreatableAdminRole(getString(formData, "role"));

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
        vai_tro: role,
        trang_thai: "DANG_HOAT_DONG",
      },
    });
  } catch {
    redirect("/admin/accounts?error=duplicate");
  }

  redirect("/admin/accounts?created=1");
}

export async function lockAccountAction(formData: FormData) {
  const currentAccount = await requirePermission("MANAGE_ACCOUNTS");

  const id = Number(getString(formData, "id"));
  if (!Number.isInteger(id) || id === currentAccount.id) {
    redirect("/admin/accounts?error=invalid");
  }

  const account = await prisma.taiKhoanQuanTri.findUnique({ where: { id }, select: { id: true } });
  if (!account) {
    redirect("/admin/accounts?error=invalid");
  }

  await prisma.taiKhoanQuanTri.update({ where: { id }, data: { trang_thai: "BI_KHOA" } });

  redirect("/admin/accounts?locked=1");
}

export async function unlockAccountAction(formData: FormData) {
  await requirePermission("MANAGE_ACCOUNTS");

  const id = Number(getString(formData, "id"));
  if (!Number.isInteger(id)) {
    redirect("/admin/accounts?error=invalid");
  }

  const account = await prisma.taiKhoanQuanTri.findUnique({ where: { id }, select: { id: true } });
  if (!account) {
    redirect("/admin/accounts?error=invalid");
  }

  await prisma.taiKhoanQuanTri.update({ where: { id }, data: { trang_thai: "DANG_HOAT_DONG" } });

  redirect("/admin/accounts?unlocked=1");
}

export async function updateAccountRoleAction(formData: FormData) {
  const currentAccount = await requirePermission("MANAGE_ACCOUNTS");

  const id = Number(getString(formData, "id"));
  const role = getAssignableAdminRole(getString(formData, "role"));
  if (!Number.isInteger(id) || id === currentAccount.id) {
    redirect("/admin/accounts?error=invalid");
  }

  const account = await prisma.taiKhoanQuanTri.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!account) {
    redirect("/admin/accounts?error=invalid");
  }

  await prisma.taiKhoanQuanTri.update({
    where: { id },
    data: { vai_tro: role },
  });

  redirect("/admin/accounts?roleUpdated=1");
}

export async function updateMyProfileAction(formData: FormData) {
  const account = await requireAdmin();
  const displayName = getString(formData, "displayName");
  const email = getString(formData, "email");

  try {
    await prisma.taiKhoanQuanTri.update({
      where: { id: account.id },
      data: {
        ten_hien_thi: displayName || null,
        email: email || null,
      },
    });
  } catch {
    redirect("/admin/profile?error=duplicate");
  }

  redirect("/admin/profile?updated=1");
}

export async function changeMyPasswordAction(formData: FormData) {
  const account = await requireAdmin();
  const currentPassword = getString(formData, "currentPassword");
  const newPassword = getString(formData, "newPassword");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!currentPassword || newPassword.length < 10 || newPassword !== confirmPassword) {
    redirect("/admin/profile?error=password");
  }

  const fullAccount = await prisma.taiKhoanQuanTri.findUnique({
    where: { id: account.id },
    select: { mat_khau_hash: true },
  });

  if (!fullAccount || !verifyPassword(currentPassword, fullAccount.mat_khau_hash)) {
    redirect("/admin/profile?error=password");
  }

  await prisma.taiKhoanQuanTri.update({
    where: { id: account.id },
    data: { mat_khau_hash: hashPassword(newPassword) },
  });

  redirect("/admin/profile?passwordChanged=1");
}

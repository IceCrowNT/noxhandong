"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const ANNOUNCEMENT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "announcements");

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeFileName(value: string) {
  return path.basename(value || "announcement.pdf").replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-").replace(/\s+/g, " ").trim();
}

export async function createAnnouncementAction(formData: FormData) {
  const account = await requirePermission("MANAGE_ANNOUNCEMENTS");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const status = getString(formData, "status") === "CONG_KHAI" ? "CONG_KHAI" : "NHAP";
  const file = formData.get("pdfFile");

  if (!title || !(file instanceof File) || file.size <= 0) {
    redirect("/admin/announcements?error=invalid");
  }

  if (file.type && file.type !== "application/pdf") {
    redirect("/admin/announcements?error=not_pdf");
  }

  if (file.size > MAX_PDF_BYTES) {
    redirect("/admin/announcements?error=file_too_large");
  }

  await mkdir(ANNOUNCEMENT_UPLOAD_DIR, { recursive: true });
  const originalName = safeFileName(file.name);
  const storedName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${originalName}`;
  const storedPath = path.join(ANNOUNCEMENT_UPLOAD_DIR, storedName);
  await writeFile(storedPath, Buffer.from(await file.arrayBuffer()));

  await prisma.thongBaoCongKhai.create({
    data: {
      tieu_de: title,
      mo_ta_ngan: description || null,
      ten_file_goc: originalName,
      duong_dan_file: `/uploads/announcements/${storedName}`,
      mime_type: "application/pdf",
      kich_thuoc_byte: file.size,
      trang_thai: status,
      ngay_cong_khai: status === "CONG_KHAI" ? new Date() : null,
      nguoi_tao_id: account.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/announcements");
  redirect("/admin/announcements?created=1");
}

export async function updateAnnouncementStatusAction(formData: FormData) {
  await requirePermission("MANAGE_ANNOUNCEMENTS");
  const id = Number(getString(formData, "id"));
  const status = getString(formData, "status");

  if (!Number.isInteger(id) || !["NHAP", "CONG_KHAI", "AN"].includes(status)) {
    redirect("/admin/announcements?error=invalid");
  }

  await prisma.thongBaoCongKhai.update({
    where: { id },
    data: {
      trang_thai: status,
      ngay_cong_khai: status === "CONG_KHAI" ? new Date() : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/announcements");
  redirect("/admin/announcements?updated=1");
}

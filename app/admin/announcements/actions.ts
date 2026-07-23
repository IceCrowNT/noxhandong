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

function safeUrlFileName(value: string) {
  const originalBaseName = path.basename(value || "announcement.pdf");
  const originalExtension = path.extname(originalBaseName).toLowerCase();
  const extension = originalExtension || ".pdf";
  const nameWithoutExtension = path.basename(originalBaseName, path.extname(originalBaseName));
  const slug = nameWithoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "announcement"}${extension}`;
}

export async function createAnnouncementAction(formData: FormData) {
  const account = await requirePermission("MANAGE_ANNOUNCEMENTS");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const status = getString(formData, "status") === "CONG_KHAI" ? "CONG_KHAI" : "NHAP";
  const file = formData.get("pdfFile");

  if (!title) {
    redirect("/admin/announcements?error=invalid");
  }

  let storedPathUrl = null;
  let originalName = null;
  let fileSize = null;

  if (file instanceof File && file.size > 0) {
    if (file.type && file.type !== "application/pdf") {
      redirect("/admin/announcements?error=not_pdf");
    }

    if (file.size > MAX_PDF_BYTES) {
      redirect("/admin/announcements?error=file_too_large");
    }

    await mkdir(ANNOUNCEMENT_UPLOAD_DIR, { recursive: true });
    originalName = path.basename(file.name || "announcement.pdf").trim() || "announcement.pdf";
    const storedName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeUrlFileName(originalName)}`;
    const storedPath = path.join(ANNOUNCEMENT_UPLOAD_DIR, storedName);
    await writeFile(storedPath, Buffer.from(await file.arrayBuffer()));
    storedPathUrl = `/uploads/announcements/${storedName}`;
    fileSize = file.size;
  }

  await prisma.thongBaoCongKhai.create({
    data: {
      tieu_de: title,
      mo_ta_ngan: description || null,
      ten_file_goc: originalName,
      duong_dan_file: storedPathUrl,
      mime_type: storedPathUrl ? "application/pdf" : null,
      kich_thuoc_byte: fileSize,
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

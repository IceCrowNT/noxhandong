"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { requirePermission } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";

const VALID_DEPARTMENTS = new Set(["KY_THUAT", "VE_SINH"]);
const VALID_CLOSE_STATUSES = new Set(["HOAN_THANH", "BO_QUA", "THAY_DOI"]);

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getPositiveInt(formData: FormData, name: string) {
  const raw = getString(formData, name);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function getRequiredId(formData: FormData) {
  const id = Number(getString(formData, "id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseVietnamDateTimeLocal(value: string) {
  if (!value) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function nextDisplayOrder() {
  const lastTask = await prisma.congViecVanHanh.findFirst({
    orderBy: { stt_hien_thi: "desc" },
    select: { stt_hien_thi: true },
  });
  return (lastTask?.stt_hien_thi || 0) + 1;
}

async function writeTaskLog({
  taskId,
  action,
  accountId,
  content,
  payload,
}: {
  taskId: number;
  action: "TAO" | "SUA" | "BAO_XONG" | "DONG_VIEC" | "XOA_MEM";
  accountId: number;
  content: string;
  payload?: Prisma.InputJsonValue;
}) {
  await prisma.nhatKyCongViecVanHanh.create({
    data: {
      cong_viec_id: taskId,
      hanh_dong: action,
      noi_dung: content,
      nguoi_thuc_hien_id: accountId,
      payload_json: payload || undefined,
    },
  });
}

export async function createOperationTaskAction(formData: FormData) {
  const account = await requirePermission("MANAGE_OPERATION_TASKS");
  const taskName = getString(formData, "taskName");
  const description = getString(formData, "description");
  const department = getString(formData, "department");
  const deadline = parseVietnamDateTimeLocal(getString(formData, "deadline"));
  const displayOrder = getPositiveInt(formData, "displayOrder") || (await nextDisplayOrder());

  if (!taskName || !VALID_DEPARTMENTS.has(department) || !deadline) {
    redirect("/admin/operation-tasks?error=invalid");
  }

  const task = await prisma.congViecVanHanh.create({
    data: {
      stt_hien_thi: displayOrder,
      ten_cong_viec: taskName,
      mo_ta: description || null,
      bo_phan: department as "KY_THUAT" | "VE_SINH",
      deadline,
      nguoi_tao_id: account.id,
      nguoi_cap_nhat_id: account.id,
    },
  });

  await writeTaskLog({
    taskId: task.id,
    action: "TAO",
    accountId: account.id,
    content: `Tạo công việc: ${taskName}`,
    payload: {
      stt_hien_thi: displayOrder,
      bo_phan: department,
      deadline: deadline.toISOString(),
    },
  });

  revalidatePath("/admin/operation-tasks");
  redirect("/admin/operation-tasks?created=1");
}

export async function updateOperationTaskAction(formData: FormData) {
  const account = await requirePermission("MANAGE_OPERATION_TASKS");
  const id = getRequiredId(formData);
  const taskName = getString(formData, "taskName");
  const description = getString(formData, "description");
  const department = getString(formData, "department");
  const deadline = parseVietnamDateTimeLocal(getString(formData, "deadline"));
  const displayOrder = getPositiveInt(formData, "displayOrder");

  if (!id || !taskName || !VALID_DEPARTMENTS.has(department) || !deadline) {
    redirect("/admin/operation-tasks?error=invalid");
  }

  const before = await prisma.congViecVanHanh.findFirst({
    where: { id, da_xoa: false, trang_thai_dong: "DANG_MO" },
    select: {
      id: true,
      stt_hien_thi: true,
      ten_cong_viec: true,
      mo_ta: true,
      bo_phan: true,
      deadline: true,
      trang_thai_dong: true,
    },
  });

  if (!before) {
    redirect("/admin/operation-tasks?error=not_found");
  }

  const updated = await prisma.congViecVanHanh.update({
    where: { id },
    data: {
      stt_hien_thi: displayOrder,
      ten_cong_viec: taskName,
      mo_ta: description || null,
      bo_phan: department as "KY_THUAT" | "VE_SINH",
      deadline,
      nguoi_cap_nhat_id: account.id,
    },
  });

  await writeTaskLog({
    taskId: id,
    action: "SUA",
    accountId: account.id,
    content: `Sửa công việc: ${taskName}`,
    payload: {
      before,
      after: {
        stt_hien_thi: updated.stt_hien_thi,
        ten_cong_viec: updated.ten_cong_viec,
        mo_ta: updated.mo_ta,
        bo_phan: updated.bo_phan,
        deadline: updated.deadline.toISOString(),
      },
    },
  });

  revalidatePath("/admin/operation-tasks");
  redirect("/admin/operation-tasks?updated=1");
}

export async function markOperationTaskDoneAction(formData: FormData) {
  const account = await requirePermission("VIEW_OPERATION_TASKS");
  const id = getRequiredId(formData);
  if (!id) redirect("/admin/operation-tasks?error=invalid");

  const task = await prisma.congViecVanHanh.findFirst({
    where: { id, da_xoa: false, trang_thai_dong: "DANG_MO" },
    select: { id: true, ten_cong_viec: true, da_bao_xong: true },
  });

  if (!task) {
    redirect("/admin/operation-tasks?error=not_found");
  }

  if (!task.da_bao_xong) {
    await prisma.congViecVanHanh.update({
      where: { id },
      data: {
        da_bao_xong: true,
        bao_xong_luc: new Date(),
        nguoi_bao_xong_id: account.id,
        nguoi_cap_nhat_id: account.id,
      },
    });

    await writeTaskLog({
      taskId: id,
      action: "BAO_XONG",
      accountId: account.id,
      content: `Báo xong công việc: ${task.ten_cong_viec}`,
    });
  }

  revalidatePath("/admin/operation-tasks");
  redirect("/admin/operation-tasks?reported=1");
}

export async function closeOperationTaskAction(formData: FormData) {
  const account = await requirePermission("MANAGE_OPERATION_TASKS");
  const id = getRequiredId(formData);
  const closeStatus = getString(formData, "closeStatus");
  const closeNote = getString(formData, "closeNote");

  if (!id || !VALID_CLOSE_STATUSES.has(closeStatus)) {
    redirect("/admin/operation-tasks?error=invalid");
  }

  const task = await prisma.congViecVanHanh.findFirst({
    where: { id, da_xoa: false },
    select: { id: true, ten_cong_viec: true },
  });

  if (!task) {
    redirect("/admin/operation-tasks?error=not_found");
  }

  await prisma.congViecVanHanh.update({
    where: { id },
    data: {
      trang_thai_dong: closeStatus as "HOAN_THANH" | "BO_QUA" | "THAY_DOI",
      dong_luc: new Date(),
      nguoi_dong_id: account.id,
      ghi_chu_dong: closeNote || null,
      nguoi_cap_nhat_id: account.id,
    },
  });

  await writeTaskLog({
    taskId: id,
    action: "DONG_VIEC",
    accountId: account.id,
    content: `Đóng công việc: ${task.ten_cong_viec}`,
    payload: { trang_thai_dong: closeStatus, ghi_chu_dong: closeNote || null },
  });

  revalidatePath("/admin/operation-tasks");
  redirect("/admin/operation-tasks?closed=1");
}

export async function deleteOperationTaskAction(formData: FormData) {
  const account = await requirePermission("MANAGE_OPERATION_TASKS");
  const id = getRequiredId(formData);
  if (!id) redirect("/admin/operation-tasks?error=invalid");

  const task = await prisma.congViecVanHanh.findFirst({
    where: { id, da_xoa: false },
    select: { id: true, ten_cong_viec: true },
  });

  if (!task) {
    redirect("/admin/operation-tasks?error=not_found");
  }

  await prisma.congViecVanHanh.update({
    where: { id },
    data: {
      da_xoa: true,
      nguoi_cap_nhat_id: account.id,
    },
  });

  await writeTaskLog({
    taskId: id,
    action: "XOA_MEM",
    accountId: account.id,
    content: `Xóa công việc: ${task.ten_cong_viec}`,
  });

  revalidatePath("/admin/operation-tasks");
  redirect("/admin/operation-tasks?deleted=1");
}

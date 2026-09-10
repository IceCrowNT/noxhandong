"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { requirePermission } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";

const VALID_DEPARTMENTS = new Set(["KY_THUAT", "VE_SINH", "HANH_CHINH", "TONG_HOP"]);
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

function parseVietnamDateLocalEnd(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999+07:00`);
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
  const deadline = parseVietnamDateLocalEnd(getString(formData, "deadline"));
  const displayOrder = await nextDisplayOrder();

  if (!taskName || !VALID_DEPARTMENTS.has(department) || !deadline) {
    return { error: "Vui lòng nhập đầy đủ tên công việc, bộ phận và deadline." };
  }

  const task = await prisma.congViecVanHanh.create({
    data: {
      stt_hien_thi: displayOrder,
      ten_cong_viec: taskName,
      mo_ta: description || null,
      bo_phan: department as "KY_THUAT" | "VE_SINH" | "HANH_CHINH" | "TONG_HOP",
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
  return { success: true, message: "Đã tạo công việc mới thành công!" };
}

export async function updateOperationTaskAction(formData: FormData) {
  const account = await requirePermission("MANAGE_OPERATION_TASKS");
  const id = getRequiredId(formData);
  const taskName = getString(formData, "taskName");
  const description = getString(formData, "description");
  const department = getString(formData, "department");
  const deadline = parseVietnamDateLocalEnd(getString(formData, "deadline"));

  if (!id || !taskName || !VALID_DEPARTMENTS.has(department) || !deadline) {
    return { error: "Dữ liệu cập nhật không hợp lệ." };
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
      da_bao_xong: true,
    },
  });

  if (!before) {
    return { error: "Không tìm thấy công việc, hoặc công việc đã bị xóa/đóng." };
  }
  if (before.da_bao_xong) {
    return { error: "Không thể sửa công việc đã được nhân viên báo xong." };
  }

  const updated = await prisma.congViecVanHanh.update({
    where: { id },
    data: {
      ten_cong_viec: taskName,
      mo_ta: description || null,
      bo_phan: department as "KY_THUAT" | "VE_SINH" | "HANH_CHINH" | "TONG_HOP",
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
  return { success: true, message: "Đã cập nhật công việc thành công!" };
}

export async function markOperationTaskDoneAction(formData: FormData) {
  const account = await requirePermission("VIEW_OPERATION_TASKS");
  const id = getRequiredId(formData);
  const isReportDone = getString(formData, "isReportDone") === "1";
  
  if (!id) return { error: "ID công việc không hợp lệ." };

  const before = await prisma.congViecVanHanh.findFirst({
    where: { id, da_xoa: false, trang_thai_dong: "DANG_MO" },
    select: { id: true, ten_cong_viec: true, da_bao_xong: true, nguoi_bao_xong_id: true },
  });

  if (!before) {
    return { error: "Không tìm thấy công việc, hoặc công việc đã bị xóa/đóng." };
  }

  if (before.da_bao_xong) {
    if (isReportDone) {
      return { success: true, message: "Công việc này đã được báo xong từ trước." };
    }
    const canUnmark = before.nguoi_bao_xong_id === account.id || account.vai_tro === "SUPER_ADMIN";
    if (!canUnmark) {
      return { error: "Bạn không có quyền bỏ tích báo xong (chỉ người đánh dấu hoặc Super Admin mới được bỏ)." };
    }

    await prisma.congViecVanHanh.update({
      where: { id },
      data: {
        da_bao_xong: false,
        bao_xong_luc: null,
        nguoi_bao_xong_id: null,
        nguoi_cap_nhat_id: account.id,
      },
    });

    await writeTaskLog({
      taskId: id,
      action: "BAO_XONG",
      accountId: account.id,
      content: `Hủy báo xong công việc: ${before.ten_cong_viec}`,
    });
  } else {
    if (!isReportDone) {
      return { success: true, message: "Công việc này chưa được báo xong." };
    }

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
      content: `Báo xong công việc: ${before.ten_cong_viec}`,
    });
  }

  revalidatePath("/admin/operation-tasks");
  return { success: true, message: isReportDone ? "Đã báo xong công việc!" : "Đã bỏ tích báo xong!" };
}

export async function closeOperationTaskAction(formData: FormData) {
  const account = await requirePermission("MANAGE_OPERATION_TASKS");
  const id = getRequiredId(formData);
  const closeStatus = getString(formData, "closeStatus");
  const closeNote = getString(formData, "closeNote");

  if (!id || !VALID_CLOSE_STATUSES.has(closeStatus)) {
    return { error: "Trạng thái đóng không hợp lệ." };
  }

  const before = await prisma.congViecVanHanh.findFirst({
    where: { id, da_xoa: false, trang_thai_dong: "DANG_MO" },
    select: { id: true, ten_cong_viec: true, da_bao_xong: true },
  });

  if (!before) {
    return { error: "Không tìm thấy công việc, hoặc công việc đã bị đóng/xóa." };
  }
  if (!before.da_bao_xong) {
    return { error: "Phải đợi bộ phận liên quan báo xong mới có thể đóng việc." };
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
    content: `Đóng công việc: ${before.ten_cong_viec}`,
    payload: { trang_thai_dong: closeStatus, ghi_chu_dong: closeNote || null },
  });

  revalidatePath("/admin/operation-tasks");
  return { success: true, message: "Đã đóng công việc thành công!" };
}

export async function deleteOperationTaskAction(formData: FormData) {
  const account = await requirePermission("MANAGE_OPERATION_TASKS");
  const id = getRequiredId(formData);
  if (!id) return { error: "ID công việc không hợp lệ." };

  const task = await prisma.congViecVanHanh.findFirst({
    where: { id, da_xoa: false },
    select: { id: true, ten_cong_viec: true, trang_thai_dong: true, da_bao_xong: true },
  });

  if (!task) {
    return { error: "Không tìm thấy công việc." };
  }
  if (task.trang_thai_dong !== "DANG_MO" || task.da_bao_xong) {
    return { error: "Không thể xóa công việc đã đóng hoặc đã báo xong." };
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
  return { success: true, message: "Đã xóa công việc thành công." };
}

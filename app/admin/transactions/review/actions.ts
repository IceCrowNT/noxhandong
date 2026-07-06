"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { requirePermission } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import { normalizeApartmentCode } from "@/src/modules/shared/utils/text";
import { feePeriodFromDate } from "@/src/modules/transactions/review/period";

const EVIDENCE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "evidence");
const MAX_EVIDENCE_BYTES = 8 * 1024 * 1024;

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getId(formData: FormData, name: string) {
  const id = Number(getString(formData, name));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getReturnTo(formData: FormData, fallback: string) {
  const value = getString(formData, "returnTo");
  return value.startsWith("/admin/transactions/review") && !value.startsWith("//") ? value : fallback;
}

function withResult(pathname: string, key: string) {
  const url = new URL(pathname, "http://localhost");
  url.searchParams.set(key, "1");
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function ensureReviewableStatus(status: string) {
  if (status === "DA_DUYET" || status === "BAO_LUU" || status === "TU_CHOI") {
    redirect("/admin/transactions/review?error=already_reviewed");
  }
}

function parseMoney(value: FormDataEntryValue | null) {
  const normalized = String(value || "").replace(/\D/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

function safeFileName(value: string) {
  return path.basename(value || "evidence").replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-").replace(/\s+/g, " ").trim();
}

async function storeEvidenceFile(file: FormDataEntryValue | null, transactionId: number) {
  if (!(file instanceof File) || file.size <= 0) {
    return {
      publicPath: null,
      originalName: null,
      mimeType: null,
      fileSize: null,
    };
  }

  if (file.size > MAX_EVIDENCE_BYTES) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=evidence_too_large`);
  }

  await mkdir(EVIDENCE_UPLOAD_DIR, { recursive: true });
  const originalName = safeFileName(file.name);
  const mimeType = file.type || null;
  const fileSize = file.size;
  const storedName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${transactionId}-${originalName}`;
  const storedPath = path.join(EVIDENCE_UPLOAD_DIR, storedName);
  await writeFile(storedPath, Buffer.from(await file.arrayBuffer()));

  return {
    publicPath: `/uploads/evidence/${storedName}`,
    originalName,
    mimeType,
    fileSize,
  };
}

async function upsertLatestReview(client: Prisma.TransactionClient | typeof prisma, transactionId: number, data: {
  status: "CHUA_DUYET" | "DA_RA_SOAT" | "DA_DUYET" | "BAO_LUU" | "TU_CHOI";
  apartmentCode?: string | null;
  note?: string | null;
  reviewer: string;
}) {
  await client.giaoDichNganHang.update({
    where: { id: transactionId },
    data: {
      trang_thai_duyet: data.status,
      ma_can_duoc_chon: data.apartmentCode || null,
      ghi_chu_duyet: data.note || null,
      nguoi_duyet: data.reviewer,
      ngay_duyet: new Date(),
    },
  });
}

export async function approveTransactionAction(formData: FormData) {
  const account = await requirePermission("REVIEW_TRANSACTIONS");
  const transactionId = getId(formData, "transactionId");
  const apartmentCode = getString(formData, "apartmentCode").toUpperCase();
  const note = getString(formData, "note");

  if (!transactionId || !apartmentCode) {
    redirect("/admin/transactions/review?error=invalid");
  }

  const [transaction, apartment] = await Promise.all([
    prisma.giaoDichNganHang.findUnique({
      where: { id: transactionId },
      select: { id: true, ngay_giao_dich: true, so_tien: true, trang_thai_duyet: true },
    }),
    prisma.canHo.findUnique({ where: { ma_can: apartmentCode }, select: { id: true, ma_can: true } }),
  ]);

  if (!transaction || !apartment) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=invalid_apartment`);
  }
  ensureReviewableStatus(transaction.trang_thai_duyet);

  const publishedHistoryCount = await prisma.lichSuDongPhiCanHo.count({
    where: {
      giao_dich_ngan_hang_id: transactionId,
      batch_phi_public_id: { not: null },
    },
  });
  if (publishedHistoryCount > 0) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=already_public`);
  }
  const historyPeriod = feePeriodFromDate(transaction.ngay_giao_dich || new Date()).historyLabel;

  await prisma.$transaction(async (tx) => {
    await tx.lichSuDongPhiCanHo.deleteMany({
      where: {
        giao_dich_ngan_hang_id: transactionId,
        batch_phi_public_id: null,
      },
    });
    await tx.phanBoGiaoDich.deleteMany({ where: { giao_dich_ngan_hang_id: transactionId } });
    const allocation = await tx.phanBoGiaoDich.create({
      data: {
        giao_dich_ngan_hang_id: transactionId,
        can_ho_id: apartment.id,
        so_tien_phan_bo: transaction.so_tien,
        cach_phan_bo: "CHINH_TAY",
        ghi_chu: note || "Admin duyệt giao dịch cho một căn.",
      },
    });

    await tx.lichSuDongPhiCanHo.create({
      data: {
        can_ho_id: apartment.id,
        ky_du_lieu: historyPeriod,
        so_tien: transaction.so_tien,
        loai_nguon: "GIAO_DICH_DA_DUYET",
        giao_dich_ngan_hang_id: transactionId,
        phan_bo_giao_dich_id: allocation.id,
        ghi_chu: note || "Sinh từ màn duyệt sao kê Phase 2.",
        nguoi_tao_id: account.id,
      },
    });
    await upsertLatestReview(tx, transactionId, {
      status: "DA_DUYET",
      apartmentCode: apartment.ma_can,
      note: note || "Đã duyệt và ghi lịch sử phí.",
      reviewer: account.ten_dang_nhap,
    });
  });

  revalidatePath("/admin/transactions/review");
  redirect(withResult(getReturnTo(formData, `/admin/transactions/review?transactionId=${transactionId}`), "approved"));
}

export async function approveTransactionWithEvidenceAction(formData: FormData) {
  const account = await requirePermission("REVIEW_TRANSACTIONS");
  const transactionId = getId(formData, "transactionId");
  const apartmentCode = getString(formData, "apartmentCode").toUpperCase();
  const note = getString(formData, "note");
  const evidenceType = getString(formData, "evidenceType") || "ZALO";
  const evidenceNote = getString(formData, "evidenceNote") || note;
  const file = formData.get("evidenceFile");

  if (!transactionId || !apartmentCode) {
    redirect("/admin/transactions/review?error=invalid");
  }

  const [transaction, apartment, publishedHistoryCount] = await Promise.all([
    prisma.giaoDichNganHang.findUnique({
      where: { id: transactionId },
      select: { id: true, ngay_giao_dich: true, so_tien: true, tham_chieu_ngan_hang: true, trang_thai_duyet: true },
    }),
    prisma.canHo.findUnique({ where: { ma_can: apartmentCode }, select: { id: true, ma_can: true } }),
    prisma.lichSuDongPhiCanHo.count({
      where: {
        giao_dich_ngan_hang_id: transactionId,
        batch_phi_public_id: { not: null },
      },
    }),
  ]);

  if (!transaction || !apartment) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=invalid_apartment`);
  }
  ensureReviewableStatus(transaction.trang_thai_duyet);
  if (publishedHistoryCount > 0) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=already_public`);
  }
  const historyPeriod = feePeriodFromDate(transaction.ngay_giao_dich || new Date()).historyLabel;

  const storedEvidence = await storeEvidenceFile(file, transactionId);
  const shouldSaveEvidence = Boolean(storedEvidence.publicPath || storedEvidence.originalName || evidenceNote);

  await prisma.$transaction(async (tx) => {
    await tx.lichSuDongPhiCanHo.deleteMany({
      where: {
        giao_dich_ngan_hang_id: transactionId,
        batch_phi_public_id: null,
      },
    });
    await tx.phanBoGiaoDich.deleteMany({ where: { giao_dich_ngan_hang_id: transactionId } });

    const allocation = await tx.phanBoGiaoDich.create({
      data: {
        giao_dich_ngan_hang_id: transactionId,
        can_ho_id: apartment.id,
        so_tien_phan_bo: transaction.so_tien,
        cach_phan_bo: "CHINH_TAY",
        ghi_chu: note || "Admin duyệt giao dịch có bằng chứng.",
      },
    });

    await tx.lichSuDongPhiCanHo.create({
      data: {
        can_ho_id: apartment.id,
        ky_du_lieu: historyPeriod,
        so_tien: transaction.so_tien,
        loai_nguon: "GIAO_DICH_DA_DUYET",
        giao_dich_ngan_hang_id: transactionId,
        phan_bo_giao_dich_id: allocation.id,
        ghi_chu: note || evidenceNote || "Sinh từ màn duyệt sao kê Phase 2 - có bằng chứng.",
        nguoi_tao_id: account.id,
      },
    });

    if (shouldSaveEvidence) {
      await tx.chungTuDoiSoat.create({
        data: {
          giao_dich_ngan_hang_id: transactionId,
          can_ho_id: apartment.id,
          loai_chung_tu: evidenceType,
          duong_dan_file: storedEvidence.publicPath,
          ten_file_goc: storedEvidence.originalName,
          mime_type: storedEvidence.mimeType,
          kich_thuoc_byte: storedEvidence.fileSize,
          ngay_giao_dich: transaction.ngay_giao_dich,
          so_tien: transaction.so_tien,
          ma_tham_chieu_ngan_hang: transaction.tham_chieu_ngan_hang,
          ghi_chu: evidenceNote || note || null,
          nguoi_tao_id: account.id,
        },
      });
    }
    await upsertLatestReview(tx, transactionId, {
      status: "DA_DUYET",
      apartmentCode: apartment.ma_can,
      note: note || evidenceNote || "Đã duyệt, ghi lịch sử phí và lưu bằng chứng.",
      reviewer: account.ten_dang_nhap,
    });
  });

  revalidatePath("/admin/transactions/review");
  redirect(withResult(getReturnTo(formData, `/admin/transactions/review?transactionId=${transactionId}`), "approvedWithEvidence"));
}

export async function approveMultiTransactionAction(formData: FormData) {
  const account = await requirePermission("REVIEW_TRANSACTIONS");
  const transactionId = getId(formData, "transactionId");
  const note = getString(formData, "note");
  const codes = formData
    .getAll("allocationCode")
    .map((value) => normalizeApartmentCode(String(value || "")) || String(value || "").trim().toUpperCase());
  const amounts = formData.getAll("allocationAmount").map(parseMoney);

  if (!transactionId) {
    redirect("/admin/transactions/review?error=invalid");
  }

  const drafts = codes
    .map((code, index) => ({ code, amount: amounts[index] }))
    .filter((item): item is { code: string; amount: number } => Boolean(item.code) && typeof item.amount === "number");

  if (drafts.length < 2) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=invalid_allocation`);
  }

  const uniqueCodes = new Set(drafts.map((item) => item.code));
  if (uniqueCodes.size !== drafts.length) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=duplicate_allocation`);
  }

  const [transaction, apartments, publishedHistoryCount] = await Promise.all([
    prisma.giaoDichNganHang.findUnique({
      where: { id: transactionId },
      select: { id: true, ngay_giao_dich: true, so_tien: true, trang_thai_duyet: true },
    }),
    prisma.canHo.findMany({
      where: { ma_can: { in: drafts.map((item) => item.code) } },
      select: { id: true, ma_can: true },
    }),
    prisma.lichSuDongPhiCanHo.count({
      where: {
        giao_dich_ngan_hang_id: transactionId,
        batch_phi_public_id: { not: null },
      },
    }),
  ]);

  if (!transaction) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=invalid`);
  }
  ensureReviewableStatus(transaction.trang_thai_duyet);
  if (publishedHistoryCount > 0) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=already_public`);
  }
  const historyPeriod = feePeriodFromDate(transaction.ngay_giao_dich || new Date()).historyLabel;

  const totalAmount = Math.round(Number(transaction.so_tien));
  const allocatedTotal = drafts.reduce((sum, item) => sum + item.amount, 0);
  if (allocatedTotal !== totalAmount) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=allocation_sum_mismatch`);
  }

  const apartmentByCode = new Map(apartments.map((apartment) => [apartment.ma_can, apartment]));
  if (drafts.some((item) => !apartmentByCode.has(item.code))) {
    redirect(`/admin/transactions/review?transactionId=${transactionId}&error=invalid_apartment`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.lichSuDongPhiCanHo.deleteMany({
      where: {
        giao_dich_ngan_hang_id: transactionId,
        batch_phi_public_id: null,
      },
    });
    await tx.phanBoGiaoDich.deleteMany({ where: { giao_dich_ngan_hang_id: transactionId } });

    for (const draft of drafts) {
      const apartment = apartmentByCode.get(draft.code);
      if (!apartment) continue;
      const allocation = await tx.phanBoGiaoDich.create({
        data: {
          giao_dich_ngan_hang_id: transactionId,
          can_ho_id: apartment.id,
          so_tien_phan_bo: draft.amount,
          cach_phan_bo: "NHIEU_CAN_DUNG_CHUAN",
          ghi_chu: note || "Admin phân bổ giao dịch cho nhiều căn.",
        },
      });

      await tx.lichSuDongPhiCanHo.create({
        data: {
          can_ho_id: apartment.id,
          ky_du_lieu: historyPeriod,
          so_tien: draft.amount,
          loai_nguon: "GIAO_DICH_DA_DUYET",
          giao_dich_ngan_hang_id: transactionId,
          phan_bo_giao_dich_id: allocation.id,
          ghi_chu: note || "Sinh từ màn duyệt sao kê Phase 2 - phân bổ nhiều căn.",
          nguoi_tao_id: account.id,
        },
      });
    }
    await upsertLatestReview(tx, transactionId, {
      status: "DA_DUYET",
      apartmentCode: drafts.map((item) => item.code).join(", "),
      note: note || "Đã duyệt và phân bổ nhiều căn.",
      reviewer: account.ten_dang_nhap,
    });
  });

  revalidatePath("/admin/transactions/review");
  redirect(withResult(getReturnTo(formData, `/admin/transactions/review?transactionId=${transactionId}`), "multiApproved"));
}

export async function markTransactionNeedsEvidenceAction(formData: FormData) {
  const account = await requirePermission("REVIEW_TRANSACTIONS");
  const transactionId = getId(formData, "transactionId");
  const note = getString(formData, "note") || "Cần bổ sung bằng chứng.";
  if (!transactionId) redirect("/admin/transactions/review?error=invalid");

  const transaction = await prisma.giaoDichNganHang.findUnique({
    where: { id: transactionId },
    select: { trang_thai_duyet: true },
  });
  if (!transaction) redirect("/admin/transactions/review?error=invalid");
  ensureReviewableStatus(transaction.trang_thai_duyet);

  await upsertLatestReview(prisma, transactionId, {
    status: "DA_RA_SOAT",
    note,
    reviewer: account.ten_dang_nhap,
  });

  revalidatePath("/admin/transactions/review");
  redirect(withResult(getReturnTo(formData, `/admin/transactions/review?transactionId=${transactionId}`), "needsEvidence"));
}

export async function reserveTransactionAction(formData: FormData) {
  const account = await requirePermission("REVIEW_TRANSACTIONS");
  const transactionId = getId(formData, "transactionId");
  const note =
    getString(formData, "note") ||
    "Bảo lưu để đối chiếu sau; không đưa vào lịch sử đóng phí và không tính vào hàng chờ chính.";
  if (!transactionId) redirect("/admin/transactions/review?error=invalid");

  const transaction = await prisma.giaoDichNganHang.findUnique({
    where: { id: transactionId },
    select: { trang_thai_duyet: true },
  });
  if (!transaction) redirect("/admin/transactions/review?error=invalid");
  ensureReviewableStatus(transaction.trang_thai_duyet);

  await prisma.$transaction(async (tx) => {
    await tx.lichSuDongPhiCanHo.deleteMany({
      where: { giao_dich_ngan_hang_id: transactionId, batch_phi_public_id: null },
    });
    await tx.phanBoGiaoDich.deleteMany({ where: { giao_dich_ngan_hang_id: transactionId } });
    await upsertLatestReview(tx, transactionId, {
      status: "BAO_LUU",
      note,
      reviewer: account.ten_dang_nhap,
    });
  });

  revalidatePath("/admin/transactions/review");
  redirect(withResult(getReturnTo(formData, `/admin/transactions/review?transactionId=${transactionId}`), "reserved"));
}

export async function rejectTransactionAction(formData: FormData) {
  const account = await requirePermission("REVIEW_TRANSACTIONS");
  const transactionId = getId(formData, "transactionId");
  const note = getString(formData, "note") || "Đánh dấu không liên quan/cần loại khỏi đối soát phí.";
  if (!transactionId) redirect("/admin/transactions/review?error=invalid");

  const transaction = await prisma.giaoDichNganHang.findUnique({
    where: { id: transactionId },
    select: { trang_thai_duyet: true },
  });
  if (!transaction) redirect("/admin/transactions/review?error=invalid");
  ensureReviewableStatus(transaction.trang_thai_duyet);

  await upsertLatestReview(prisma, transactionId, {
    status: "TU_CHOI",
    note,
    reviewer: account.ten_dang_nhap,
  });

  revalidatePath("/admin/transactions/review");
  redirect(withResult(getReturnTo(formData, `/admin/transactions/review?transactionId=${transactionId}`), "rejected"));
}

export async function addEvidenceAction(formData: FormData) {
  const account = await requirePermission("REVIEW_TRANSACTIONS");
  const transactionId = getId(formData, "transactionId");
  const apartmentCode = getString(formData, "apartmentCode").toUpperCase();
  const evidenceType = getString(formData, "evidenceType") || "GHI_CHU_THU_CONG";
  const note = getString(formData, "evidenceNote");
  const file = formData.get("evidenceFile");

  if (!transactionId) redirect("/admin/transactions/review?error=invalid");

  const [transaction, apartment] = await Promise.all([
    prisma.giaoDichNganHang.findUnique({
      where: { id: transactionId },
      select: { id: true, ngay_giao_dich: true, so_tien: true, tham_chieu_ngan_hang: true },
    }),
    apartmentCode ? prisma.canHo.findUnique({ where: { ma_can: apartmentCode }, select: { id: true } }) : null,
  ]);

  if (!transaction) redirect("/admin/transactions/review?error=invalid");

  const storedEvidence = await storeEvidenceFile(file, transactionId);

  await prisma.chungTuDoiSoat.create({
    data: {
      giao_dich_ngan_hang_id: transactionId,
      can_ho_id: apartment?.id || null,
      loai_chung_tu: evidenceType,
      duong_dan_file: storedEvidence.publicPath,
      ten_file_goc: storedEvidence.originalName,
      mime_type: storedEvidence.mimeType,
      kich_thuoc_byte: storedEvidence.fileSize,
      ngay_giao_dich: transaction.ngay_giao_dich,
      so_tien: transaction.so_tien,
      ma_tham_chieu_ngan_hang: transaction.tham_chieu_ngan_hang,
      ghi_chu: note || null,
      nguoi_tao_id: account.id,
    },
  });

  revalidatePath("/admin/transactions/review");
  redirect(`/admin/transactions/review?transactionId=${transactionId}&evidenceAdded=1`);
}

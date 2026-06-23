"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";
import { createMonthlyClosingLedgerFromPublicBatch } from "@/src/modules/imports/monthly-closing";
import { runProjectScript } from "@/src/modules/imports/script-runner";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".xlsx", ".xls"]);
const UPLOAD_DIR = path.join(process.cwd(), ".local", "admin-uploads", "fee-tracking");
const STATEMENT_UPLOAD_DIR = path.join(process.cwd(), ".local", "admin-uploads", "bank-statements");
const HISTORICAL_EVIDENCE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "historical-supplements");

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeFileName(value: string) {
  const baseName = path.basename(value || "fee-tracking.xlsx");
  return baseName.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-").replace(/\s+/g, " ").trim();
}

function numberField(result: Record<string, unknown>, field: string) {
  const value = result[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseDateTimeInput(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function storeHistoricalEvidenceFile(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size <= 0) {
    return {
      publicPath: null,
      originalName: null,
      mimeType: null,
      fileSize: null,
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    redirect("/admin/import?historicalError=file_too_large");
  }

  await mkdir(HISTORICAL_EVIDENCE_UPLOAD_DIR, { recursive: true });
  const originalName = safeFileName(file.name || "historical-evidence");
  const storedName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${originalName}`;
  const storedPath = path.join(HISTORICAL_EVIDENCE_UPLOAD_DIR, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storedPath, buffer);

  return {
    publicPath: `/uploads/historical-supplements/${storedName}`,
    originalName,
    mimeType: file.type || null,
    fileSize: file.size,
  };
}

function appendImportSummaryParams(params: URLSearchParams, importResult: Record<string, unknown>) {
  const fields = [
    "invalidApartmentRows",
    "missingPaidThroughRows",
    "unparsedPaidThroughRows",
    "partialPaymentRows",
    "outsideBaseYearRows",
  ];

  for (const field of fields) {
    const value = numberField(importResult, field);
    if (value !== null) {
      params.set(field, String(value));
    }
  }
}

export async function importFeeTrackingWorkbookAction(formData: FormData) {
  const account = await requirePermission("IMPORT_DATA");
  const intent = getString(formData, "intent");
  const file = formData.get("feeTrackingFile");

  if (!(file instanceof File) || file.size <= 0) {
    redirect("/admin/import?error=missing_file");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    redirect("/admin/import?error=file_too_large");
  }

  const originalName = safeFileName(file.name);
  const extension = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    redirect("/admin/import?error=invalid_file_type");
  }

  if (intent === "import_and_publish" && getString(formData, "confirmExcelPublic") !== "CHOT_EXCEL") {
    redirect("/admin/import?error=invalid_excel_confirm");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const storedPath = path.join(UPLOAD_DIR, `${timestamp}-${originalName}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storedPath, buffer);

  let redirectUrl = "/admin/import";
  try {
    const importResult = await runProjectScript("scripts/import-fee-tracking-v2.cjs", [storedPath]);
    const importBatchId = numberField(importResult, "batchId");
    const importedRows = numberField(importResult, "importedRows");

    if (!importBatchId) {
      throw new Error("Script import không trả về import batch hợp lệ.");
    }

    if (intent !== "import_and_publish") {
      const redirectParams = new URLSearchParams({
        checked: "1",
        importBatchId: String(importBatchId),
        rows: String(importedRows || 0),
      });
      appendImportSummaryParams(redirectParams, importResult);
      redirectUrl = `/admin/import?${redirectParams.toString()}`;
    } else {
      const prepareResult = await runProjectScript("scripts/prepare-fee-public-batch-v2.cjs", [
        `--import-batch-id=${importBatchId}`,
      ]);
      const publicBatchId = numberField(prepareResult, "draftPublicBatchId");

      if (!publicBatchId) {
        throw new Error("Script chuẩn bị batch không trả về batch phí hợp lệ.");
      }

      const publishResult = await runProjectScript("scripts/publish-fee-public-batch-v2.cjs", [
        `--batch-id=${publicBatchId}`,
        `--admin=${account.ten_dang_nhap}`,
      ]);
      const snapshotCount = numberField(publishResult, "snapshotCount");

      await createMonthlyClosingLedgerFromPublicBatch({
        publicBatchId,
        source: "EXCEL_CHOT",
        accountId: account.id,
        importBatchId,
        fileName: originalName,
        closingCutoffAt: parseDateTimeInput(getString(formData, "closingCutoffAt")),
        note: "Sổ chốt tháng tạo từ Excel theo dõi thu phí đã được xác nhận bằng mã CHOT_EXCEL.",
      });

      const redirectParams = new URLSearchParams({
        published: "1",
        importBatchId: String(importBatchId),
        publicBatchId: String(publicBatchId),
        rows: String(snapshotCount || importedRows || 0),
      });
      appendImportSummaryParams(redirectParams, importResult);
      redirectUrl = `/admin/import?${redirectParams.toString()}`;
    }
  } catch (error) {
    console.error(error);
    redirect("/admin/import?error=import_failed");
  }

  redirect(redirectUrl);
}

export async function importBankStatementAction(formData: FormData) {
  await requirePermission("IMPORT_DATA");
  const intent = getString(formData, "intent");
  const file = formData.get("bankStatementFile");

  if (!(file instanceof File) || file.size <= 0) {
    redirect("/admin/import?statementError=missing_file");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    redirect("/admin/import?statementError=file_too_large");
  }

  const originalName = safeFileName(file.name || "bank-statement.xls");
  const extension = path.extname(originalName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    redirect("/admin/import?statementError=invalid_file_type");
  }

  await mkdir(STATEMENT_UPLOAD_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const storedPath = path.join(STATEMENT_UPLOAD_DIR, `${timestamp}-${originalName}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storedPath, buffer);

  let redirectUrl = "/admin/import";
  try {
    const result =
      intent === "check_statement"
        ? await runProjectScript("scripts/report-bank-statement-parser-v2.cjs", [storedPath])
        : await runProjectScript("scripts/import-bank-statement-v2.cjs", [storedPath]);

    const params = new URLSearchParams({
      statementChecked: intent === "check_statement" ? "1" : "0",
      statementImported: intent === "check_statement" ? "0" : "1",
      statementRows: String(numberField(result, "rows") || numberField(result, "rawRows") || 0),
      statementIncomeRows: String(numberField(result, "incomeRows") || 0),
      statementSkippedExpenseRows: String(numberField(result, "skippedExpenseRows") || 0),
      statementSkippedClosingRows: String(numberField(result, "skippedBeforeOrAtClosingRows") || 0),
      statementBatchId: String(numberField(result, "batchId") || ""),
      statementParsedValidRows: String(numberField(result, "parsedValidRows") || 0),
      statementUnparsedRows: String(numberField(result, "unparsedRows") || 0),
      statementMultiCandidateRows: String(numberField(result, "multiCandidateRows") || 0),
      statementReviewRowsCreated: String(numberField(result, "reviewRowsCreated") || 0),
    });

    redirectUrl = `/admin/import?${params.toString()}`;
  } catch (error) {
    console.error(error);
    redirect("/admin/import?statementError=import_failed");
  }

  redirect(redirectUrl);
}

export async function prepareApprovedPaymentHistoryPublicBatchAction(formData: FormData) {
  await requirePermission("PUBLISH_DATA");
  const period = getString(formData, "period") || "T6-2026";

  if (!/^T\s*\d{1,2}\s*[-/]\s*\d{4}$/i.test(period)) {
    redirect("/admin/transactions/review?historyPublishError=invalid_period");
  }

  let redirectUrl = "/admin/transactions/review";
  try {
    const prepareResult = await runProjectScript("scripts/prepare-public-batch-from-history-v2.cjs", [
      `--period=${period}`,
    ]);
    const publicBatchId = numberField(prepareResult, "draftPublicBatchId");
    const snapshotRows = numberField(prepareResult, "snapshotRows");
    const approvedHistoryRows = numberField(prepareResult, "approvedHistoryRows");
    const changedApartmentCount = numberField(prepareResult, "changedApartmentCount");

    if (!publicBatchId) {
      throw new Error("Script chuẩn bị batch từ lịch sử phí không trả về batch hợp lệ.");
    }

    const params = new URLSearchParams({
      historyPreviewed: "1",
      publicBatchId: String(publicBatchId),
      rows: String(snapshotRows || 0),
      approvedHistoryRows: String(approvedHistoryRows || 0),
      changedApartmentCount: String(changedApartmentCount || 0),
    });
    redirectUrl = `/admin/transactions/review?${params.toString()}`;
  } catch (error) {
    console.error(error);
    redirect("/admin/transactions/review?historyPublishError=preview_failed");
  }

  redirect(redirectUrl);
}

export async function publishPreparedPublicBatchAction(formData: FormData) {
  const account = await requirePermission("PUBLISH_DATA");
  const batchId = getString(formData, "publicBatchId");

  if (!/^\d+$/.test(batchId)) {
    redirect("/admin/transactions/review?historyPublishError=invalid_batch");
  }

  let redirectUrl = "/admin/transactions/review";
  try {
    const publishResult = await runProjectScript("scripts/publish-fee-public-batch-v2.cjs", [
      `--batch-id=${batchId}`,
      `--admin=${account.ten_dang_nhap}`,
    ]);
    const snapshotCount = numberField(publishResult, "snapshotCount");
    const historyRowsLinked = numberField(publishResult, "historyRowsLinked");
    await createMonthlyClosingLedgerFromPublicBatch({
      publicBatchId: Number(batchId),
      source: "SAO_KE_DA_DUYET",
      accountId: account.id,
      note: "Sổ chốt tháng tạo từ giao dịch sao kê đã duyệt và được Super Admin chốt public.",
    });

    const params = new URLSearchParams({
      historyPublished: "1",
      publicBatchId: batchId,
      rows: String(snapshotCount || 0),
      historyRowsLinked: String(historyRowsLinked || 0),
    });
    redirectUrl = `/admin/transactions/review?${params.toString()}`;
  } catch (error) {
    console.error(error);
    redirect("/admin/transactions/review?historyPublishError=publish_failed");
  }

  redirect(redirectUrl);
}

export async function cancelPreparedPublicBatchAction(formData: FormData) {
  await requirePermission("PUBLISH_DATA");
  const batchId = getString(formData, "publicBatchId");

  if (!/^\d+$/.test(batchId)) {
    redirect("/admin/transactions/review?historyPublishError=invalid_batch");
  }

  try {
    await prisma.batchTrangThaiPhiPublic.deleteMany({
      where: {
        id: Number(batchId),
        trang_thai: "NHAP",
        la_batch_public_hien_hanh: false,
      },
    });
  } catch (error) {
    console.error(error);
    redirect("/admin/transactions/review?historyPublishError=cancel_failed");
  }

  redirect("/admin/transactions/review?historyPreviewCancelled=1");
}

export async function createHistoricalSupplementAction(formData: FormData) {
  const account = await requirePermission("IMPORT_DATA");
  const apartmentCode = getString(formData, "apartmentCode").toUpperCase();
  const amountRaw = getString(formData, "amount").replace(/\D/g, "");
  const sourcePeriod = getString(formData, "sourcePeriod") || "T5-2026";
  const appliedMonth = getString(formData, "appliedMonth");
  const occurredAt = parseDateTimeInput(getString(formData, "occurredAt"));
  const evidenceType = getString(formData, "evidenceType") || "GHI_CHU_THU_CONG";
  const evidenceNote = getString(formData, "evidenceNote");
  const internalNote = getString(formData, "internalNote");
  const evidenceFile = formData.get("evidenceFile");

  const amount = Number(amountRaw);
  if (!apartmentCode || !Number.isFinite(amount) || amount <= 0) {
    redirect("/admin/import?historicalError=invalid");
  }

  if (!evidenceNote && (!(evidenceFile instanceof File) || evidenceFile.size <= 0)) {
    redirect("/admin/import?historicalError=missing_evidence");
  }

  const apartment = await prisma.canHo.findUnique({
    where: { ma_can: apartmentCode },
    select: { id: true, ma_can: true },
  });
  if (!apartment) {
    redirect("/admin/import?historicalError=invalid_apartment");
  }

  const storedEvidence = await storeHistoricalEvidenceFile(evidenceFile);
  let redirectUrl = "/admin/import";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const history = await tx.lichSuDongPhiCanHo.create({
        data: {
          can_ho_id: apartment.id,
          ky_du_lieu: sourcePeriod,
          thang_ap_dung: appliedMonth || null,
          so_tien: amount,
          loai_nguon: "BO_SUNG_QUA_KHU",
          ghi_chu:
            internalNote ||
            evidenceNote ||
            "Bổ sung giao dịch quá khứ được xác minh thủ công.",
          nguoi_tao_id: account.id,
        },
      });

      const supplement = await tx.boSungGiaoDichQuaKhu.create({
        data: {
          can_ho_id: apartment.id,
          lich_su_dong_phi_id: history.id,
          so_tien: amount,
          ky_du_lieu: sourcePeriod,
          thang_ap_dung: appliedMonth || null,
          ngay_giao_dich_goc: occurredAt,
          loai_bang_chung: evidenceType,
          duong_dan_file: storedEvidence.publicPath,
          ten_file_goc: storedEvidence.originalName,
          mime_type: storedEvidence.mimeType,
          kich_thuoc_file: storedEvidence.fileSize,
          noi_dung_xac_minh: evidenceNote || null,
          ghi_chu_noi_bo: internalNote || null,
          nguoi_tao_id: account.id,
        },
      });

      return { historyId: history.id, supplementId: supplement.id };
    });

    revalidatePath("/admin/import");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/transactions/review");
    redirectUrl = `/admin/import?historicalCreated=1&historicalApartment=${encodeURIComponent(apartment.ma_can)}&historicalHistoryId=${result.historyId}&historicalSupplementId=${result.supplementId}`;
  } catch (error) {
    console.error(error);
    redirect("/admin/import?historicalError=create_failed");
  }

  redirect(redirectUrl);
}

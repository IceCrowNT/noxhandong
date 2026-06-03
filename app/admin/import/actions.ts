"use server";

import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";

import { requireAdminRole } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".xlsx", ".xls"]);
const UPLOAD_DIR = path.join(process.cwd(), ".local", "admin-uploads", "fee-tracking");
const STATEMENT_UPLOAD_DIR = path.join(process.cwd(), ".local", "admin-uploads", "bank-statements");

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeFileName(value: string) {
  const baseName = path.basename(value || "fee-tracking.xlsx");
  return baseName.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-").replace(/\s+/g, " ").trim();
}

function readJsonFromScriptOutput(output: string) {
  const end = output.lastIndexOf("}");
  if (end < 0) {
    throw new Error(`Không đọc được kết quả script: ${output.slice(0, 500)}`);
  }

  const candidateStarts = Array.from(output.matchAll(/\{/g))
    .map((match) => match.index)
    .filter((index): index is number => typeof index === "number");

  for (const start of candidateStarts.reverse()) {
    try {
      return JSON.parse(output.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      // dotenv can print tips containing braces before the actual JSON payload.
    }
  }

  throw new Error(`Không đọc được kết quả script: ${output.slice(0, 500)}`);
}

function runScript(scriptPath: string, args: string[]) {
  const output = execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return readJsonFromScriptOutput(output);
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

async function createMonthlyClosingLedgerFromPublicBatch(input: {
  publicBatchId: number;
  source: "EXCEL_CHOT" | "SAO_KE_DA_DUYET";
  accountId: number;
  importBatchId?: number;
  fileName?: string;
  closingCutoffAt?: Date | null;
  note?: string;
}) {
  const batch = await prisma.batchTrangThaiPhiPublic.findUnique({
    where: { id: input.publicBatchId },
    include: {
      trang_thai_phi: {
        select: {
          can_ho_id: true,
          ma_can: true,
          thang_da_dong_den_hien_tai: true,
          ghi_chu_public: true,
          payload_public_json: true,
        },
      },
    },
  });

  if (!batch || batch.so_chot_thang_id || !batch.trang_thai_phi.length) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const closing = await tx.soChotThang.create({
      data: {
        ky_du_lieu: batch.ky_du_lieu,
        lo_excel_chot_id: input.source === "EXCEL_CHOT" ? input.importBatchId : null,
        lo_sao_ke_id: input.source === "SAO_KE_DA_DUYET" ? input.importBatchId : null,
        ten_file_excel_chot: input.source === "EXCEL_CHOT" ? input.fileName : null,
        tong_so_can: batch.trang_thai_phi.length,
        so_can_khop: batch.trang_thai_phi.length,
        so_can_can_ra_soat: 0,
        trang_thai: "DA_CHOT",
        ghi_chu: input.note || null,
        nguoi_chot_id: input.accountId,
        ngay_chot: new Date(),
        metadata_json: {
          publicBatchId: batch.id,
          source: input.source,
          createdFrom: "admin_import_page",
          chotDenThoiDiem: input.closingCutoffAt?.toISOString() || null,
        },
      },
    });

    await tx.soChotCanHo.createMany({
      data: batch.trang_thai_phi.map((item) => ({
        so_chot_thang_id: closing.id,
        can_ho_id: item.can_ho_id,
        ma_can: item.ma_can,
        thang_da_dong_den_hien_tai: item.thang_da_dong_den_hien_tai,
        nguon: input.source,
        ghi_chu: item.ghi_chu_public,
        payload_json: item.payload_public_json ?? undefined,
      })),
    });

    await tx.batchTrangThaiPhiPublic.update({
      where: { id: batch.id },
      data: { so_chot_thang_id: closing.id },
    });
  });
}

export async function importFeeTrackingWorkbookAction(formData: FormData) {
  const account = await requireAdminRole("SUPER_ADMIN");
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
    const importResult = runScript("scripts/import-fee-tracking-v2.cjs", [storedPath]);
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
      const prepareResult = runScript("scripts/prepare-fee-public-batch-v2.cjs", [
        `--import-batch-id=${importBatchId}`,
      ]);
      const publicBatchId = numberField(prepareResult, "draftPublicBatchId");

      if (!publicBatchId) {
        throw new Error("Script chuẩn bị batch không trả về batch phí hợp lệ.");
      }

      const publishResult = runScript("scripts/publish-fee-public-batch-v2.cjs", [
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
  await requireAdminRole("SUPER_ADMIN");
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
        ? runScript("scripts/report-bank-statement-parser-v2.cjs", [storedPath])
        : runScript("scripts/import-bank-statement-v2.cjs", [storedPath]);

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
  await requireAdminRole("SUPER_ADMIN");
  const period = getString(formData, "period") || "T6-2026";

  if (!/^T\s*\d{1,2}\s*[-/]\s*\d{4}$/i.test(period)) {
    redirect("/admin/import?historyPublishError=invalid_period");
  }

  let redirectUrl = "/admin/import";
  try {
    const prepareResult = runScript("scripts/prepare-public-batch-from-history-v2.cjs", [
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
    redirectUrl = `/admin/import?${params.toString()}`;
  } catch (error) {
    console.error(error);
    redirect("/admin/import?historyPublishError=preview_failed");
  }

  redirect(redirectUrl);
}

export async function publishPreparedPublicBatchAction(formData: FormData) {
  const account = await requireAdminRole("SUPER_ADMIN");
  const batchId = getString(formData, "publicBatchId");

  if (!/^\d+$/.test(batchId)) {
    redirect("/admin/import?historyPublishError=invalid_batch");
  }

  let redirectUrl = "/admin/import";
  try {
    const publishResult = runScript("scripts/publish-fee-public-batch-v2.cjs", [
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
    redirectUrl = `/admin/import?${params.toString()}`;
  } catch (error) {
    console.error(error);
    redirect("/admin/import?historyPublishError=publish_failed");
  }

  redirect(redirectUrl);
}

export async function cancelPreparedPublicBatchAction(formData: FormData) {
  await requireAdminRole("SUPER_ADMIN");
  const batchId = getString(formData, "publicBatchId");

  if (!/^\d+$/.test(batchId)) {
    redirect("/admin/import?historyPublishError=invalid_batch");
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
    redirect("/admin/import?historyPublishError=cancel_failed");
  }

  redirect("/admin/import?historyPreviewCancelled=1");
}

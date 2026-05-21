"use server";

import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";

import { requireAdminRole } from "@/src/modules/auth/current-user";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".xlsx", ".xls"]);
const UPLOAD_DIR = path.join(process.cwd(), ".local", "admin-uploads", "fee-tracking");

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeFileName(value: string) {
  const baseName = path.basename(value || "fee-tracking.xlsx");
  return baseName.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-").replace(/\s+/g, " ").trim();
}

function readJsonFromScriptOutput(output: string) {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error(`Không đọc được kết quả script: ${output.slice(0, 500)}`);
  }
  return JSON.parse(output.slice(start, end + 1)) as Record<string, unknown>;
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
      redirectUrl = `/admin/import?imported=1&importBatchId=${importBatchId}&rows=${importedRows || 0}`;
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

      redirectUrl = `/admin/import?published=1&importBatchId=${importBatchId}&publicBatchId=${publicBatchId}&rows=${snapshotCount || importedRows || 0}`;
    }
  } catch (error) {
    console.error(error);
    redirect("/admin/import?error=import_failed");
  }

  redirect(redirectUrl);
}

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/src/modules/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const PERIOD_PATTERN = /^T(?:[1-9]|1[0-2])-\d{4}$/;

function parseResult(stdout: string) {
  const start = stdout.lastIndexOf("\n{");
  const jsonText = start >= 0 ? stdout.slice(start + 1) : stdout.slice(stdout.indexOf("{"));
  return JSON.parse(jsonText) as { outputPath: string; status: string; period: string };
}

export async function GET(request: Request) {
  const account = await getCurrentAdmin();
  if (!account) {
    return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
  }

  const period = new URL(request.url).searchParams.get("period")?.toUpperCase() || "";
  if (!PERIOD_PATTERN.test(period)) {
    return NextResponse.json({ error: "Kỳ dữ liệu không hợp lệ." }, { status: 400 });
  }

  try {
    const projectRoot = process.cwd();
    const tsxCli = path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs");
    const exporter = path.join(projectRoot, "scripts", "export-monthly-fee-ledger.ts");
    const { stdout } = await execFileAsync(
      process.execPath,
      [tsxCli, exporter, `--period=${period}`],
      {
        cwd: projectRoot,
        env: process.env,
        maxBuffer: 1024 * 1024 * 4,
        timeout: 120_000,
      }
    );
    const result = parseResult(stdout);
    const workbook = await fs.readFile(result.outputPath);

    return new NextResponse(workbook, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="So-theo-doi-thu-phi-${period}-FINAL.xlsx"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể xuất file Excel FINAL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

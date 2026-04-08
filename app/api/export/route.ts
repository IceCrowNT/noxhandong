import { NextResponse } from "next/server";
import { exportReviewWorkbook } from "@/lib/excel/exporter";
import { ExportPayload, ReviewRow } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExportPayload;
    const rows = Array.isArray(body.rows) ? (body.rows as ReviewRow[]) : [];
    const workbookBuffer = exportReviewWorkbook(rows);
    const timestamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(workbookBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="fee-review-${timestamp}.xlsx"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể export file Excel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

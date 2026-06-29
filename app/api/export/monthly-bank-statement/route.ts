import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/src/modules/auth/current-user";
import { buildMonthlyBankStatementWorkbook } from "@/src/modules/exports/monthly-bank-statement";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const period = request.nextUrl.searchParams.get("period");
  if (!period) {
    return NextResponse.json({ error: "Thiếu kỳ dữ liệu." }, { status: 400 });
  }

  try {
    const { workbook, fileName } = await buildMonthlyBankStatementWorkbook(period);
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không xuất được file sao kê tháng.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

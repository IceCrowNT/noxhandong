import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/src/modules/auth/current-user";
import { getFeeNoticeDataset } from "@/src/modules/apartments/fee-notice-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await getCurrentAdmin();
  if (!account) return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const period = params.get("period")?.toUpperCase() || "";
  const paidThrough = params.get("paidThrough") || "";

  try {
    const dataset = await getFeeNoticeDataset(period, paidThrough);
    const workbook = XLSX.utils.book_new();

    const summary = dataset.lotGroups.map((group, index) => ({
      STT: index + 1,
      "Lô cụ thể": group.lot,
      "Số căn cần phát": group.rows.length,
      "Nội dung": `Thông báo phí ${dataset.notice.startLabel} - ${dataset.notice.endLabel}`,
      "Danh sách tất cả căn": group.rows.map((row) => row.maCan).join(", "),
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summary);
    summarySheet["!cols"] = [7, 14, 18, 34, 56].map((wch) => ({ wch }));
    summarySheet["!pageSetup"] = { orientation: "portrait", fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Tong hop");

    const usedNames = new Set<string>(["Tong hop"]);
    for (const group of dataset.lotGroups) {
      const tableStartRow = 5;
      const data = [
        [`CHECKLIST PHÁT THÔNG BÁO THU PHÍ - LÔ ${group.lot}`],
        [`Các căn đã đóng chính xác đến T${dataset.paidThroughMonth}/${dataset.paidThroughYear}`],
        [`Kỳ thông báo: ${dataset.notice.startLabel} đến hết ${dataset.notice.endLabel}`],
        ["Nội dung thực hiện: phát thông báo bằng cách dán cửa hoặc đưa tay"],
        [],
        ["STT", "Mã căn", "Dán cửa", "Đưa tay", "Ghi chú"],
        ...group.rows.map((row, index) => [index + 1, row.maCan, "☐", "☐", ""]),
        [],
        ["Tổng số căn", group.rows.length, "", "", ""],
        [],
        ["", "", "NGƯỜI THỰC HIỆN", "", ""],
        [],
        [],
        [],
      ];

      const sheet = XLSX.utils.aoa_to_sheet(data);
      sheet["!cols"] = [7, 16, 14, 14, 36].map((wch) => ({ wch }));
      sheet["!rows"] = data.map((_, index) => ({ hpt: index < 4 ? 22 : index === tableStartRow ? 24 : 20 }));
      sheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },
        { s: { r: group.rows.length + 9, c: 2 }, e: { r: group.rows.length + 9, c: 4 } },
      ];
      sheet["!pageSetup"] = { orientation: "portrait", fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
      sheet["!margins"] = { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
      sheet["!autofilter"] = { ref: `A${tableStartRow + 1}:E${tableStartRow + group.rows.length + 1}` };

      let sheetName = group.lot.replace(/[\\/?*[\]:]/g, "-").slice(0, 31) || "Chua xac dinh";
      let suffix = 2;
      while (usedNames.has(sheetName)) {
        sheetName = `${group.lot.slice(0, 27)}-${suffix}`.slice(0, 31);
        suffix += 1;
      }
      usedNames.add(sheetName);
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    }

    const output = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(output, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Danh-sach-thong-bao-${dataset.paidThrough}-${dataset.notice.startLabel.replace("/", "-")}-${dataset.notice.endLabel.replace("/", "-")}.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể xuất danh sách thông báo." },
      { status: 400 },
    );
  }
}

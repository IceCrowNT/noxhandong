import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIOD_PATTERN = /^T(?:[1-9]|1[0-2])-\d{4}$/;
const PAID_THROUGH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

function recordValue(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function exactPaidThroughKey(payload: unknown, fallback: string | null) {
  const payloadRecord = recordValue(payload);
  const paidThrough = recordValue(payloadRecord?.paidThrough);
  const numericMonth =
    numericValue(paidThrough?.numericMonth) ??
    numericValue(payloadRecord?.numericMonth) ??
    (() => {
      const match = String(fallback || "").match(/-?\d+(?:[.,]\d+)?/);
      return match ? Number(match[0].replace(",", ".")) : null;
    })();

  if (numericMonth === null || !Number.isInteger(numericMonth)) return null;
  const month = numericValue(paidThrough?.resolvedMonth) ?? (((numericMonth - 1) % 12) + 12) % 12 + 1;
  const year = numericValue(paidThrough?.resolvedYear) ?? 2026 + Math.floor((numericMonth - 1) / 12);
  return `${year}-${String(month).padStart(2, "0")}`;
}

function noticePeriod(year: number, month: number) {
  const startIndex = year * 12 + month;
  const endIndex = startIndex + 5;
  return {
    start: `T${(startIndex % 12) + 1}/${Math.floor(startIndex / 12)}`,
    end: `T${(endIndex % 12) + 1}/${Math.floor(endIndex / 12)}`,
  };
}

export async function GET(request: Request) {
  const account = await getCurrentAdmin();
  if (!account) return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const period = params.get("period")?.toUpperCase() || "";
  const paidThrough = params.get("paidThrough") || "";
  const match = paidThrough.match(PAID_THROUGH_PATTERN);
  if (!PERIOD_PATTERN.test(period) || !match) {
    return NextResponse.json({ error: "Kỳ dữ liệu hoặc mốc tháng đã đóng không hợp lệ." }, { status: 400 });
  }

  const batch = await prisma.batchTrangThaiPhiPublic.findFirst({
    where: { ky_du_lieu: period, trang_thai: "DA_PUBLIC" },
    orderBy: [{ la_batch_public_hien_hanh: "desc" }, { id: "desc" }],
    select: { id: true },
  });
  if (!batch) return NextResponse.json({ error: "Không tìm thấy kỳ dữ liệu đã công khai." }, { status: 404 });

  const rows = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { batch_id: batch.id },
    orderBy: { ma_can: "asc" },
    select: {
      ma_can: true,
      thang_da_dong_den_hien_tai: true,
      payload_public_json: true,
      can_ho: { select: { ma_lo: true, ma_so: true, toa_lo_goc: true } },
    },
  });
  const targetRows = rows.filter(
    (row) => exactPaidThroughKey(row.payload_public_json, row.thang_da_dong_den_hien_tai) === paidThrough,
  );
  const year = Number(match[1]);
  const month = Number(match[2]);
  const notice = noticePeriod(year, month);

  const workbook = XLSX.utils.book_new();
  const lotGroups = targetRows.reduce<Record<string, typeof targetRows>>((groups, row) => {
    const lot = row.can_ho.toa_lo_goc || row.can_ho.ma_lo || "Chưa xác định";
    groups[lot] ||= [];
    groups[lot].push(row);
    return groups;
  }, {});
  const sortedLots = Object.entries(lotGroups).sort(([left], [right]) =>
    left.localeCompare(right, "vi-VN", { numeric: true }),
  );
  const summary = sortedLots.map(([lot, lotRows], index) => ({
    STT: index + 1,
    "Lô cụ thể": lot,
    "Số căn cần phát": lotRows.length,
    "Nội dung": `Thông báo phí ${notice.start} - ${notice.end}`,
  }));
  const summarySheet = XLSX.utils.json_to_sheet(summary);
  summarySheet["!cols"] = [7, 14, 18, 34].map((wch) => ({ wch }));
  summarySheet["!pageSetup"] = { orientation: "portrait", fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Tong hop");

  const usedNames = new Set<string>(["Tong hop"]);
  for (const [lot, lotRows] of sortedLots) {
    const tableStartRow = 5;
    const data = [
      [`CHECKLIST PHÁT THÔNG BÁO THU PHÍ - LÔ ${lot}`],
      [`Các căn đã đóng chính xác đến T${month}/${year}`],
      [`Kỳ thông báo: ${notice.start} đến hết ${notice.end}`],
      [`Nội dung thực hiện: phát thông báo bằng cách dán cửa hoặc đưa tay`],
      [],
      ["STT", "Mã căn", "Dán cửa", "Đưa tay", "Ghi chú"],
      ...lotRows.map((row, index) => [
        index + 1,
        row.ma_can,
        "☐",
        "☐",
        "",
      ]),
      [],
      ["Tổng số căn", lotRows.length, "", "", ""],
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
      { s: { r: lotRows.length + 9, c: 2 }, e: { r: lotRows.length + 9, c: 4 } },
    ];
    sheet["!pageSetup"] = { orientation: "portrait", fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
    sheet["!margins"] = { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
    sheet["!autofilter"] = { ref: `A${tableStartRow + 1}:E${tableStartRow + lotRows.length + 1}` };

    let sheetName = lot.replace(/[\\/?*[\]:]/g, "-").slice(0, 31) || "Chua xac dinh";
    let suffix = 2;
    while (usedNames.has(sheetName)) {
      sheetName = `${lot.slice(0, 27)}-${suffix}`.slice(0, 31);
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
      "Content-Disposition": `attachment; filename="Danh-sach-thong-bao-${paidThrough}-${notice.start.replace("/", "-")}-${notice.end.replace("/", "-")}.xlsx"`,
    },
  });
}

import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/src/modules/auth/current-user";
import { getApartmentDashboardData } from "@/src/modules/apartments/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePeriodLabel(value: string) {
  const match = value.match(/^T(\d{1,2})-(\d{4})$/i);
  if (!match) return null;
  return {
    month: Number(match[1]),
    year: Number(match[2]),
  };
}

function parseDistributionLabel(value: string) {
  const match = value.match(/(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  return {
    month: Number(match[1]),
    year: Number(match[2]),
  };
}

function absoluteMonthIndex(year: number, month: number) {
  return year * 12 + month - 1;
}

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kyPhi = searchParams.get("ky_phi") || undefined;
    
    const data = await getApartmentDashboardData("", kyPhi);
    const distribution = data.summary.distributionOverview.distribution;
    const currentPeriodLabel = data.summary.distributionOverview.sourcePeriod.label; // e.g., T6-2026

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Phân bố tháng");

    const totalApartments = data.summary.totalApartments;

    let reportMonthStr = currentPeriodLabel;
    if (currentPeriodLabel.startsWith("T")) {
      const parts = currentPeriodLabel.substring(1).split("-");
      if (parts.length === 2) {
        let m = parseInt(parts[0], 10);
        let y = parseInt(parts[1], 10);
        reportMonthStr = `${m}/${y}`;
      }
    }

    const powerCutApts = new Set(
      data.summary.distributionOverview.attentionRows
        .filter((r: any) => r.kind === "POWER_CUT")
        .map((r: any) => r.ma_can)
    );

    const parsedDistribution = distribution
      .map((item) => {
        const period = parseDistributionLabel(item.label);
        return period
          ? {
              item,
              month: period.month,
              year: period.year,
              index: absoluteMonthIndex(period.year, period.month),
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.index - a.index);
    const reportPeriod = parsePeriodLabel(currentPeriodLabel) || parsedDistribution[0] || null;

    const fullDistribution = [];
    if (reportPeriod) {
      let currY = reportPeriod.year;
      let currM = reportPeriod.month;
      let distIndex = 0;

      while (currY > 2024 || (currY === 2024 && currM >= 3)) {
        const currIndex = absoluteMonthIndex(currY, currM);
        while (parsedDistribution[distIndex]?.index > currIndex) {
          distIndex++;
        }

        const foundItem = parsedDistribution[distIndex];
        const isExactMonth = foundItem?.index === currIndex;
        const effectiveItem = isExactMonth ? foundItem.item : foundItem?.item || parsedDistribution[distIndex - 1]?.item;
        if (!effectiveItem) {
          break;
        }

        if (isExactMonth) {
          distIndex++;
        }

        fullDistribution.push({
          monthStr: `T${currM}/${String(currY).substring(2)}`,
          completedCount: effectiveItem.completedCount || 0,
          missingCount: effectiveItem.missingCount || 0,
          missingApartments: effectiveItem.missingApartments || [],
        });

        currM--;
        if (currM === 0) {
          currM = 12;
          currY--;
        }
      }
    } else {
      for (const item of distribution) {
        let monthStr = item.label;
        const mMatch = item.label.match(/(\d{1,2})\.(\d{4})/);
        if (mMatch) {
          monthStr = `T${mMatch[1]}/${mMatch[2].substring(2)}`;
        }
        fullDistribution.push({
          monthStr,
          completedCount: item.completedCount,
          missingCount: item.missingCount,
          missingApartments: item.missingApartments,
        });
      }
    }

    const aptToOldestMissedMonth = new Map<string, string>();
    for (const item of fullDistribution) {
      for (const apt of item.missingApartments) {
        if (powerCutApts.has(apt.maCan)) {
          aptToOldestMissedMonth.set(apt.maCan, item.monthStr);
        }
      }
    }

    const rowNotes = new Map<string, string[]>();
    for (const [maCan, monthStr] of aptToOldestMissedMonth.entries()) {
      if (!rowNotes.has(monthStr)) {
        rowNotes.set(monthStr, []);
      }
      rowNotes.get(monthStr)!.push(`${maCan} cắt điện`);
    }

    const fontBold = { name: "Arial", size: 11, bold: true };
    const fontNormal = { name: "Arial", size: 11 };
    
    // Row 1
    sheet.mergeCells("A1:E1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = `TỔNG HỢP BÁO CÁO THU PHÍ THÁNG ${reportMonthStr}`;
    titleCell.font = { name: "Arial", size: 12, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    const f1 = sheet.getCell("F1");
    f1.value = totalApartments;
    f1.font = { name: "Arial", size: 12, bold: true };
    f1.alignment = { horizontal: "center", vertical: "middle" };

    sheet.getCell("A1").border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    sheet.getCell("F1").border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

    // Headers Row 2 & 3
    sheet.mergeCells("A2:A3");
    sheet.getCell("A2").value = "Số tháng";
    
    sheet.mergeCells("B2:C2");
    sheet.getCell("B2").value = "Số liệu đã thu";

    sheet.mergeCells("D2:E2");
    sheet.getCell("D2").value = "Số Liệu còn nợ";

    sheet.mergeCells("F2:F3");
    sheet.getCell("F2").value = "Ghi chú";

    sheet.getCell("B3").value = "Số căn";
    sheet.getCell("C3").value = "Tỉ lệ";
    sheet.getCell("D3").value = "Số căn";
    sheet.getCell("E3").value = "Tỉ lệ";

    const headerCells = ["A2", "B2", "D2", "F2", "B3", "C3", "D3", "E3"];
    headerCells.forEach(ref => {
      const c = sheet.getCell(ref);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EFDA" } }; 
      c.font = fontBold;
      c.alignment = { horizontal: "center", vertical: "middle" };
      c.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });
    
    let r = 4;
    for (const item of fullDistribution) {
      const monthStr = item.monthStr;
      const totalGroup = Math.max(item.completedCount + item.missingCount, 1);
      const paidPercent = item.completedCount / totalGroup;
      const unpaidPercent = item.missingCount / totalGroup;
      
      const missingApts = rowNotes.get(monthStr) || [];
      const noteStr = missingApts.sort((a, b) => a.localeCompare(b, "vi-VN", { numeric: true })).join(", ");

      const row = sheet.getRow(r);
      row.getCell(1).value = monthStr;
      row.getCell(2).value = item.completedCount;
      row.getCell(3).value = paidPercent;
      row.getCell(4).value = item.missingCount;
      row.getCell(5).value = unpaidPercent;
      row.getCell(6).value = noteStr;

      const isRed = r === 4;
      const numFont = isRed ? { ...fontNormal, color: { argb: "FFFF0000" } } : fontNormal;
      const mainFont = isRed ? { ...fontBold, color: { argb: "FFFF0000" } } : fontBold;
      
      for (let i = 1; i <= 6; i++) {
        const c = row.getCell(i);
        c.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        if (i === 1) {
          c.font = mainFont;
          c.alignment = { horizontal: "center", vertical: "middle" };
        } else if (i >= 2 && i <= 5) {
          c.alignment = { horizontal: "center", vertical: "middle" };
          c.font = numFont;
        } else {
          c.font = fontNormal; // Ghi chú
          c.alignment = { horizontal: "left", vertical: "middle" };
        }
      }
      
      row.getCell(3).numFmt = "0.00%";
      row.getCell(5).numFmt = "0.00%";

      r++;
    }

    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 15;
    sheet.getColumn(6).width = 40;

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Bao_cao_thu_phi_${currentPeriodLabel}.xlsx"`,
      },
    });

  } catch (error) {
    console.error("Lỗi xuất báo cáo phân bố:", error);
    return new NextResponse(
      `Internal Server Error: ${error instanceof Error ? error.stack : String(error)}`,
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}

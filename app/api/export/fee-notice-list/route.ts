import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

import { getFeeNoticeDataset } from "@/src/modules/apartments/fee-notice-export";
import { getCurrentAdmin } from "@/src/modules/auth/current-user";
import { prisma } from "@/src/modules/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Dataset = Awaited<ReturnType<typeof getFeeNoticeDataset>>;
type DatasetRow = Dataset["rows"][number];

function safeText(value: string | null | undefined) {
  return (value || "").trim();
}

function uniqueLines(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeContactLabel(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s*-\s*/g, " - ")
    .trim();
}

function compactContactLines(contactLines: string[]) {
  const cleaned = uniqueLines(contactLines.map(normalizeContactLabel)).filter(Boolean);
  if (cleaned.length <= 10) return cleaned;
  return [...cleaned.slice(0, 10), `(+${cleaned.length - 10} liên hệ khác)`];
}

function estimateWrappedLineCount(text: string, widthChars: number) {
  const lines = String(text || "").split("\n");
  return Math.max(
    1,
    lines.reduce((sum, line) => {
      const length = line.trim().length || 1;
      return sum + Math.max(1, Math.ceil(length / widthChars));
    }, 0),
  );
}

function sheetName(name: string) {
  return name.replace(/[\\/?*[\]:]/g, "-").slice(0, 31) || "Sheet1";
}

async function buildContactMap(rows: DatasetRow[]) {
  const maCanList = rows.map((row) => row.maCan);

  const [apartments, candidates] = await Promise.all([
    prisma.canHo.findMany({
      where: { ma_can: { in: maCanList } },
      select: {
        ma_can: true,
        chu_ho_ten_goc: true,
        lien_he: {
          where: { trang_thai_lien_he: "DANG_DUNG" },
          orderBy: [{ la_lien_he_chinh: "desc" }, { thu_tu_uu_tien: "asc" }, { id: "asc" }],
          select: {
            ten_hien_thi: true,
            so_dien_thoai: true,
          },
        },
      },
    }),
    prisma.ungVienLienHeCanHo.findMany({
      where: { ma_can: { in: maCanList }, trang_thai_duyet: { not: "TU_CHOI" } },
      orderBy: [{ co_can_ra_soat: "asc" }, { thu_tu_nguon: "asc" }, { id: "asc" }],
      select: {
        ma_can: true,
        ten_hien_thi_parse: true,
        ten_nguoi_su_dung_goc: true,
        ten_chu_ho_goc: true,
        so_dien_thoai_parse: true,
        so_dien_thoai_goc: true,
      },
    }),
  ]);

  const map = new Map<string, { contactLines: string[]; phoneLines: string[] }>();

  for (const apartment of apartments) {
    let contactLines = uniqueLines(
      apartment.lien_he.map((contact) => {
        const name = safeText(contact.ten_hien_thi);
        const phone = safeText(contact.so_dien_thoai);
        return normalizeContactLabel(phone ? `${name} / ${phone}` : name);
      }),
    );
    const phoneLines = uniqueLines(apartment.lien_he.map((contact) => safeText(contact.so_dien_thoai)));
    
    // Bổ sung tên gốc nếu không có liên hệ nào
    if (contactLines.length === 0 && safeText(apartment.chu_ho_ten_goc)) {
      contactLines.push(normalizeContactLabel(safeText(apartment.chu_ho_ten_goc)));
    }

    map.set(apartment.ma_can, { contactLines, phoneLines });
  }

  for (const candidate of candidates) {
    const key = safeText(candidate.ma_can);
    if (!key) continue;

    const existing = map.get(key) || { contactLines: [], phoneLines: [] };
    const name =
      safeText(candidate.ten_hien_thi_parse) ||
      safeText(candidate.ten_nguoi_su_dung_goc) ||
      safeText(candidate.ten_chu_ho_goc);
    const phone = safeText(candidate.so_dien_thoai_parse) || safeText(candidate.so_dien_thoai_goc);

    if (phone || name) {
      existing.contactLines = uniqueLines([
        ...existing.contactLines,
        normalizeContactLabel(phone ? `${name || "Liên hệ"} / ${phone}` : name),
      ]);
      if (phone) {
        existing.phoneLines = uniqueLines([...existing.phoneLines, phone]);
      }
    }

    map.set(key, existing);
  }

  return map;
}

function createWorksheet(workbook: ExcelJS.Workbook, title: string) {
  return workbook.addWorksheet(sheetName(title), {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
      horizontalCentered: true,
      verticalCentered: false,
    },
    views: [{ showGridLines: true }],
  });
}

function buildRegularChecklistSheet({
  workbook,
  sheetTitle,
  headingText,
  periodText,
  instructionText,
  rows,
}: {
  workbook: ExcelJS.Workbook;
  sheetTitle: string;
  headingText: string;
  periodText: string;
  instructionText: string;
  rows: DatasetRow[];
}) {
  const sheet = createWorksheet(workbook, sheetTitle);

  sheet.columns = [
    { key: "stt", width: 7 },
    { key: "maCan", width: 18 },
    { key: "danCua", width: 14 },
    { key: "duaTay", width: 14 },
    { key: "ghiChu", width: 34 },
  ];

  sheet.mergeCells("A1:E2");
  const titleCell = sheet.getCell("A1");
  titleCell.value = headingText;
  titleCell.font = { name: "Times New Roman", size: 15, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  sheet.getRow(1).height = 26;
  sheet.getRow(2).height = 26;

  sheet.mergeCells("A3:E3");
  const infoRow3 = sheet.getCell("A3");
  infoRow3.value = periodText;
  infoRow3.font = { name: "Times New Roman", size: 12, bold: true };
  infoRow3.alignment = { horizontal: "left", vertical: "middle" };

  sheet.mergeCells("A4:E4");
  const infoRow4 = sheet.getCell("A4");
  infoRow4.value = instructionText;
  infoRow4.font = { name: "Times New Roman", size: 12, italic: true };
  infoRow4.alignment = { horizontal: "left", vertical: "middle" };

  const headerRowIndex = 6;
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.values = ["STT", "Mã căn", "Dán cửa", "Đưa tay", "Ghi chú"];
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Times New Roman", size: 11, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  rows.forEach((row, index) => {
    const excelRow = sheet.addRow([index + 1, row.maCan, "", "", ""]);
    excelRow.height = 24;
    excelRow.eachCell((cell, colNumber) => {
      cell.font = {
        name: "Times New Roman",
        size: 11,
        bold: colNumber === 2,
      };
      cell.alignment = {
        horizontal: colNumber === 5 ? "left" : "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const totalRowIndex = sheet.rowCount + 1;
  sheet.getCell(`A${totalRowIndex}`).value = "Tổng số căn";
  sheet.getCell(`B${totalRowIndex}`).value = rows.length;
  sheet.getCell(`A${totalRowIndex}`).font = { name: "Times New Roman", size: 12, bold: true };
  sheet.getCell(`B${totalRowIndex}`).font = { name: "Times New Roman", size: 12, bold: true };

  const signRowIndex = totalRowIndex + 3;
  sheet.mergeCells(`C${signRowIndex}:E${signRowIndex}`);
  const signCell = sheet.getCell(`C${signRowIndex}`);
  signCell.value = "NGƯỜI THỰC HIỆN";
  signCell.font = { name: "Times New Roman", size: 13, bold: true };
  signCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.pageSetup.printTitlesRow = `${headerRowIndex}:${headerRowIndex}`;
}

function buildRegularWorkbook(dataset: Dataset) {
  const workbook = new ExcelJS.Workbook();
  const currentPeriodMonth = Number(dataset.period.replace(/^T(\d{1,2})-\d{4}$/, "$1"));
  const baseHeading = `CHECKLIST ${dataset.notice.titleText} THU PHÍ\nTHÁNG ${currentPeriodMonth} - CÁC CĂN ĐÃ ĐÓNG HẾT THÁNG ${dataset.paidThroughMonth}/${dataset.paidThroughYear}`;
  const periodText = `Kỳ thông báo: ${dataset.notice.startLabel} đến hết ${dataset.notice.endLabel}`;
  const instructionText = "Nội dung thực hiện: phát thông báo bằng cách dán cửa hoặc đưa tay";

  buildRegularChecklistSheet({
    workbook,
    sheetTitle: "Tong hop",
    headingText: baseHeading,
    periodText,
    instructionText,
    rows: dataset.rows,
  });

  dataset.lotGroups.forEach((group) => {
    buildRegularChecklistSheet({
      workbook,
      sheetTitle: group.lot,
      headingText: `${baseHeading}\nLÔ ${group.lot}`,
      periodText,
      instructionText: `${instructionText} - riêng lô ${group.lot}`,
      rows: group.rows,
    });
  });

  return {
    workbook,
    filename: `Danh-sach-thong-bao-${dataset.paidThrough}-${dataset.notice.startLabel.replace("/", "-")}-${dataset.notice.endLabel.replace("/", "-")}.xlsx`,
  };
}

async function buildPowerCutWorkbook(dataset: Dataset) {
  const workbook = new ExcelJS.Workbook();
  const contactMap = await buildContactMap(dataset.rows);
  const currentPeriodMonth = Number(dataset.period.replace(/^T(\d{1,2})-\d{4}$/, "$1"));

  const sheet = createWorksheet(workbook, "Checklist cat dien");
  sheet.columns = [
    { key: "stt", width: 7 },
    { key: "maCan", width: 11 },
    { key: "contact", width: 34 },
    { key: "delivered", width: 12 },
    { key: "cut", width: 10 },
    { key: "note", width: 22 },
  ];

  sheet.mergeCells("A1:F2");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `DANH SÁCH CHECKLIST CĂN HỘ CẦN CẮT ĐIỆN VÀ THEO DÕI\nTHÁNG ${currentPeriodMonth} (CÁC CĂN CHƯA ĐÓNG THÁNG ${dataset.notice.overdueFromText})`;
  titleCell.font = { name: "Times New Roman", size: 15, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 24;

  const headerRowIndex = 4;
  const headerRow = sheet.getRow(headerRowIndex);
  headerRow.values = ["STT", "Căn hộ", "Số điện thoại liên hệ", "Đã dán / Đưa tay", "Đã cắt (Tick ✓)", "Ghi chú / Chứng kiến"];
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Times New Roman", size: 11, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  dataset.rows.forEach((row, index) => {
    const contact = contactMap.get(row.maCan) || { contactLines: [], phoneLines: [] };
    const compactLines = compactContactLines(contact.contactLines);
    const phoneText = compactLines.length
      ? compactLines.join("\n")
      : contact.phoneLines.length
        ? contact.phoneLines.join("\n")
        : "";

    const excelRow = sheet.addRow([index + 1, row.maCan, phoneText, "", "", ""]);
    const estimatedLineCount = estimateWrappedLineCount(phoneText, 28);
    excelRow.height = Math.max(24, estimatedLineCount * 14 + 6);

    excelRow.eachCell((cell, colNumber) => {
      cell.font = {
        name: "Times New Roman",
        size: colNumber === 3 ? 10 : 11,
        bold: colNumber === 2,
      };
      cell.alignment = {
        horizontal: colNumber === 6 ? "left" : "center",
        vertical: colNumber === 3 || colNumber === 6 ? "top" : "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const dateRowIndex = sheet.rowCount + 2;
  sheet.mergeCells(`A${dateRowIndex}:F${dateRowIndex}`);
  const dateCell = sheet.getCell(`A${dateRowIndex}`);
  dateCell.value = "Ngày ..... tháng ..... năm 20....";
  dateCell.font = { name: "Times New Roman", size: 12, italic: true };
  dateCell.alignment = { horizontal: "right", vertical: "middle" };

  const signRowIndex = dateRowIndex + 2;
  sheet.mergeCells(`D${signRowIndex}:F${signRowIndex}`);
  const signCell = sheet.getCell(`D${signRowIndex}`);
  signCell.value = "BỘ PHẬN KỸ THUẬT";
  signCell.font = { name: "Times New Roman", size: 13, bold: true };
  signCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.pageSetup.printTitlesRow = `${headerRowIndex}:${headerRowIndex}`;

  return {
    workbook,
    filename: `Checklist-cat-dien-${dataset.period}-${dataset.notice.overdueFromText.replace("/", "-")}.xlsx`,
  };
}

export async function GET(request: Request) {
  const account = await getCurrentAdmin();
  if (!account) {
    return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const period = params.get("period")?.toUpperCase() || "";
  const paidThrough = params.get("paidThrough") || "";

  try {
    const dataset = await getFeeNoticeDataset(period, paidThrough);
    const exportResult =
      dataset.notice.noticeType === "POWER_CUT"
        ? await buildPowerCutWorkbook(dataset)
        : buildRegularWorkbook(dataset);

    const output = await exportResult.workbook.xlsx.writeBuffer();

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể xuất danh sách thông báo." },
      { status: 400 },
    );
  }
}

import fs from "node:fs/promises";
import path from "node:path";

import JSZip from "jszip";
import { NextResponse } from "next/server";

import { getFeeNoticeDataset } from "@/src/modules/apartments/fee-notice-export";
import { getCurrentAdmin } from "@/src/modules/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEE_NOTICE_TEMPLATE_PATH = path.join(process.cwd(), "templates", "fee-notice-template.docx");
const POWER_CUT_TEMPLATE_PATH = path.join(process.cwd(), "templates", "power-cut-template.docx");

const TEMPLATE_APARTMENT_CODES = ["L2.220", "L2.310"];
const TEMPLATE_START_DATE = "01/05/2026";
const TEMPLATE_END_DATE = "30/10/2026";
const TEMPLATE_MONTHLY_FEE = "250.000";
const TEMPLATE_TOTAL_FEE = "1.500.000";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function moneyText(value: number) {
  return value.toLocaleString("vi-VN");
}

function stripSpellMarks(xml: string) {
  return xml.replace(/<w:proofErr\b[^>]*\/>/g, "");
}

function stripMailMergeSettings(xml: string) {
  return xml.replace(/<w:mailMerge>[\s\S]*?<\/w:mailMerge>/g, "");
}

function stripTrackChanges(xml: string) {
  return xml
    .replace(/<w:del\b[\s\S]*?<\/w:del>/g, "")
    .replace(/<w:ins\b[^>]*>/g, "")
    .replace(/<\/w:ins>/g, "");
}

function stripLegacyFallback(xml: string) {
  return xml.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, "");
}

function stripCustomXmlRelationships(xml: string) {
  return xml.replace(
    /<Relationship\b[^>]*Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/customXml"[^>]*\/>/g,
    "",
  );
}

function stripMailMergeRelationships(xml: string) {
  return xml.replace(
    /<Relationship\b[^>]*Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/mailMergeSource"[^>]*\/>/g,
    "",
  );
}

function normalizeParagraphText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function decodeParagraphText(paragraphXml: string) {
  return normalizeParagraphText(
    paragraphXml
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'"),
  );
}

function replaceApartmentCode(xml: string, apartmentCode: string) {
  let nextXml = xml;
  for (const code of TEMPLATE_APARTMENT_CODES) {
    nextXml = nextXml.replaceAll(code, apartmentCode);
  }
  return nextXml;
}

function replaceParagraphTextRuns(paragraphXml: string, nextText: string) {
  const runs = paragraphXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) ?? [];
  if (runs.length === 0) {
    return paragraphXml;
  }

  const textRunIndex = runs.findIndex((run) => /<w:t\b/.test(run));
  if (textRunIndex === -1) {
    return paragraphXml;
  }

  const preservedPrefix = runs.slice(0, textRunIndex).filter((run) => !/<w:instrText\b/.test(run)).join("");
  const templateRun = runs[textRunIndex];
  const rebuiltRun = templateRun.replace(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/, `<w:t>${escapeXml(nextText)}</w:t>`);
  return paragraphXml.replace(/<w:r\b[\s\S]*<\/w:r>/, `${preservedPrefix}${rebuiltRun}`);
}

function currentHaiPhongDateText() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `Hải Phòng, ngày ${day} tháng ${month} năm ${now.getFullYear()}`;
}

function buildPowerCutTransferContent(overdueFromText: string, overdueToText: string) {
  return `ND : Căn hộ + SĐT + nộp phí QLVH từ tháng ${overdueFromText} – tháng ${overdueToText}`;
}

function replaceFeeNoticeParagraphs(
  pageXml: string,
  row: Awaited<ReturnType<typeof getFeeNoticeDataset>>["rows"][number],
  dataset: Awaited<ReturnType<typeof getFeeNoticeDataset>>,
) {
  const nextXml = replaceApartmentCode(pageXml, row.maCan);

  return nextXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraphXml) => {
    const text = decodeParagraphText(paragraphXml);

    if (text === "THÔNG BÁO" || text.startsWith("THÔNG BÁO LẦN")) {
      return replaceParagraphTextRuns(paragraphXml, dataset.notice.titleText);
    }

    if (text.startsWith("Kính gửi")) {
      return replaceParagraphTextRuns(paragraphXml, `Kính gửi : CĂN HỘ ${row.maCan}`);
    }

    if (text.startsWith("V/v:")) {
      return replaceParagraphTextRuns(
        paragraphXml,
        `V/v: Thu phí dịch vụ quản lý vận hành kỳ phí từ ${dataset.notice.startDateText} đến ${dataset.notice.endDateText}`,
      );
    }

    if (text.startsWith("BQT trân trọng thông báo")) {
      return replaceParagraphTextRuns(
        paragraphXml,
        `BQT trân trọng thông báo tới Quý Cư dân lịch thu phí Quản lý vận hành kỳ phí 06 tháng (từ ${dataset.notice.startDateText} đến ${dataset.notice.endDateText}), như sau:`,
      );
    }

    if (text.startsWith("Thời gian:")) {
      return replaceParagraphTextRuns(paragraphXml, `Thời gian: trước ngày ${dataset.notice.dueDateText}`);
    }

    if (text.startsWith("Phí quản lý")) {
      return replaceParagraphTextRuns(paragraphXml, `Phí quản lý chung cư là : ${moneyText(row.monthlyFee)} VNĐ/1 tháng`);
    }

    if (text.startsWith("Kỳ phí 6 tháng phải nộp")) {
      return replaceParagraphTextRuns(
        paragraphXml,
        `Kỳ phí 6 tháng phải nộp : (${moneyText(row.monthlyFee)} × 6) = ${moneyText(row.totalFee)} VNĐ`,
      );
    }

    if (text.startsWith("“") || text.startsWith('" Tòa') || text.includes("nộp phí QLVH từ")) {
      return replaceParagraphTextRuns(paragraphXml, `“ ${dataset.notice.transferContentHint}”`);
    }

    if (text.startsWith("Số:") && text.includes("An Hải")) {
      return [
        '<w:p w14:paraId="DOCXDATE1" w14:textId="DOCXDATE1" w:rsidR="007E420E" w:rsidRPr="003D0095" w:rsidRDefault="007E420E" w:rsidP="00954FAD">',
        '<w:pPr><w:tabs><w:tab w:val="right" w:pos="9360"/></w:tabs><w:spacing w:line="276" w:lineRule="auto"/>',
        '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:i/><w:iCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:pPr>',
        '<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:i/><w:iCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>',
        '<w:t xml:space="preserve">Số: …../TBTP-BQTNOXHAD</w:t></w:r>',
        '<w:r><w:tab/></w:r>',
        '<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:i/><w:iCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>',
        `<w:t>${escapeXml(dataset.notice.documentDateText)}</w:t></w:r></w:p>`,
      ].join("");
    }

    return paragraphXml;
  });
}

function replacePowerCutParagraphs(
  pageXml: string,
  row: Awaited<ReturnType<typeof getFeeNoticeDataset>>["rows"][number],
  dataset: Awaited<ReturnType<typeof getFeeNoticeDataset>>,
) {
  let nextXml = replaceApartmentCode(pageXml, row.maCan);
  nextXml = nextXml.replaceAll(`Số tiền : ${TEMPLATE_TOTAL_FEE} đ`, `Số tiền : ${moneyText(row.totalFee)} đ`);

  return nextXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraphXml) => {
    const text = decodeParagraphText(paragraphXml);

    if (text.startsWith("Hải Phòng, ngày")) {
      return replaceParagraphTextRuns(paragraphXml, currentHaiPhongDateText());
    }

    if (text.startsWith("Kính gửi:")) {
      return replaceParagraphTextRuns(paragraphXml, `Kính gửi: CĂN HỘ ${row.maCan}`);
    }

    if (text.startsWith("Hiện tại hộ dân đang")) {
      return replaceParagraphTextRuns(
        paragraphXml,
        `Hiện tại hộ dân đang chậm đóng phí QLVH từ tháng ${dataset.notice.overdueFromText} theo quy định của khu NOXH.`,
      );
    }

    if (text.startsWith("ND")) {
      return replaceParagraphTextRuns(
        paragraphXml,
        buildPowerCutTransferContent(dataset.notice.overdueFromText, dataset.notice.overdueToText),
      );
    }

    if (text.startsWith("Thời gian dự kiến cắt điện:")) {
      const replacedApartmentText = text.replace(/(tại căn hộ số:\s*)(.+)$/i, `$1${row.maCan}`);
      return replaceParagraphTextRuns(paragraphXml, replacedApartmentText);
    }

    return paragraphXml;
  });
}

function buildDocumentXml(
  originalXml: string,
  rows: Awaited<ReturnType<typeof getFeeNoticeDataset>>["rows"],
  dataset: Awaited<ReturnType<typeof getFeeNoticeDataset>>,
) {
  const sanitizedOriginalXml = stripLegacyFallback(stripTrackChanges(stripSpellMarks(originalXml)));
  const bodyMatch = sanitizedOriginalXml.match(/<w:body>([\s\S]*?)(<w:sectPr[\s\S]*?<\/w:sectPr>)<\/w:body>/);
  if (!bodyMatch) {
    throw new Error("Không đọc được cấu trúc Word template.");
  }

  const templatePageXml = bodyMatch[1];
  const sectPrXml = bodyMatch[2];
  const pageBreakXml = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

  const pageBuilder =
    dataset.notice.noticeType === "POWER_CUT" ? replacePowerCutParagraphs : replaceFeeNoticeParagraphs;

  const pagesXml = rows.map((row) => pageBuilder(templatePageXml, row, dataset)).join(pageBreakXml);
  return sanitizedOriginalXml.replace(bodyMatch[0], `<w:body>${pagesXml}${sectPrXml}</w:body>`);
}

async function loadTemplateZip(noticeType: Awaited<ReturnType<typeof getFeeNoticeDataset>>["notice"]["noticeType"]) {
  const templatePath = noticeType === "POWER_CUT" ? POWER_CUT_TEMPLATE_PATH : FEE_NOTICE_TEMPLATE_PATH;
  const templateBuffer = await fs.readFile(templatePath);
  return JSZip.loadAsync(templateBuffer);
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
    const zip = await loadTemplateZip(dataset.notice.noticeType);
    const documentXml = await zip.file("word/document.xml")?.async("string");
    const settingsXml = await zip.file("word/settings.xml")?.async("string");
    const settingsRelsXml = await zip.file("word/_rels/settings.xml.rels")?.async("string");
    const documentRelsXml = await zip.file("word/_rels/document.xml.rels")?.async("string");

    if (!documentXml) {
      throw new Error("Template Word không có word/document.xml.");
    }

    zip.file("word/document.xml", buildDocumentXml(documentXml, dataset.rows, dataset));

    if (settingsXml) {
      zip.file("word/settings.xml", stripMailMergeSettings(settingsXml));
    }
    if (settingsRelsXml) {
      zip.file("word/_rels/settings.xml.rels", stripMailMergeRelationships(settingsRelsXml));
    }
    if (documentRelsXml) {
      zip.file("word/_rels/document.xml.rels", stripCustomXmlRelationships(documentRelsXml));
    }

    zip.remove("customXml/item1.xml");
    zip.remove("customXml/itemProps1.xml");
    zip.remove("customXml/_rels/item1.xml.rels");

    const output = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    const prefix = dataset.notice.noticeType === "POWER_CUT" ? "Thong-bao-cat-dien" : "Thong-bao-thu-phi";

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${prefix}-${dataset.paidThrough}-${dataset.notice.startLabel.replace("/", "-")}-${dataset.notice.endLabel.replace("/", "-")}.docx"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể xuất thông báo Word." },
      { status: 400 },
    );
  }
}

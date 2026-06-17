import fs from "node:fs/promises";
import path from "node:path";

import JSZip from "jszip";
import { NextResponse } from "next/server";

import { getFeeNoticeDataset } from "@/src/modules/apartments/fee-notice-export";
import { getCurrentAdmin } from "@/src/modules/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATE_PATH = path.join(process.cwd(), "templates", "fee-notice-template.docx");
const TEMPLATE_APARTMENT_CODE = "L2.220";
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

function replaceApartmentCode(xml: string, apartmentCode: string) {
  return xml.replace(
    new RegExp(`<w:t>${TEMPLATE_APARTMENT_CODE.replace(".", "\\.")}</w:t>`),
    `<w:t>${escapeXml(apartmentCode)}</w:t>`,
  );
}

function replaceDocumentDateParagraph(xml: string, documentDateText: string) {
  return xml.replace(
    /<w:p\b[^>]*>[\s\S]*?<w:t>An Hải<\/w:t>[\s\S]*?<w:t>ngày<\/w:t>[\s\S]*?<w:t>2026<\/w:t>[\s\S]*?<\/w:p>/,
    [
      '<w:p w14:paraId="DOCXDATE1" w14:textId="DOCXDATE1" w:rsidR="007E420E" w:rsidRPr="003D0095" w:rsidRDefault="007E420E" w:rsidP="00954FAD">',
      '<w:pPr><w:tabs><w:tab w:val="right" w:pos="9360"/></w:tabs><w:spacing w:line="276" w:lineRule="auto"/><w:jc w:val="right"/>',
      '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:i/><w:iCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:pPr>',
      '<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:i/><w:iCs/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>',
      `<w:t>${escapeXml(documentDateText)}</w:t></w:r></w:p>`,
    ].join(""),
  );
}

function replaceDueDateParagraph(xml: string, dueDateText: string) {
  return xml.replace(
    /(<w:p\b[^>]*>[\s\S]*?<w:t xml:space="preserve">Thời gian: trước ngày <\/w:t>)[\s\S]*?(<\/w:p>)/,
    [
      "$1",
      '<w:r w:rsidR="00E539A3" w:rsidRPr="00FB5C47"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>',
      '<w:b/><w:spacing w:val="-2"/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="pt-BR" w:eastAsia="vi-VN"/></w:rPr>',
      `<w:t>${escapeXml(dueDateText)}</w:t></w:r>`,
      "$2",
    ].join(""),
  );
}

function replaceMoneyParagraphs(xml: string, monthlyFee: number, totalFee: number) {
  const monthlyText = moneyText(monthlyFee);
  const totalText = moneyText(totalFee);

  return xml
    .replaceAll(`: ${TEMPLATE_MONTHLY_FEE} VNĐ/1 tháng`, `: ${monthlyText} VNĐ/1 tháng`)
    .replaceAll(`(${TEMPLATE_MONTHLY_FEE} x 6) = ${TEMPLATE_TOTAL_FEE} VNĐ`, `(${monthlyText} x 6) = ${totalText} VNĐ`);
}

function replaceNoticeDates(xml: string, startDateText: string, endDateText: string) {
  return xml
    .replaceAll(`từ ${TEMPLATE_START_DATE} `, `từ ${startDateText} `)
    .replaceAll(`từ ${TEMPLATE_START_DATE})`, `từ ${startDateText})`)
    .replaceAll(`đến ${TEMPLATE_END_DATE}`, `đến ${endDateText}`)
    .replaceAll(`ến ${TEMPLATE_END_DATE}`, `ến ${endDateText}`);
}

function buildPageXml(
  templatePageXml: string,
  row: Awaited<ReturnType<typeof getFeeNoticeDataset>>["rows"][number],
  dataset: Awaited<ReturnType<typeof getFeeNoticeDataset>>,
) {
  let pageXml = stripSpellMarks(templatePageXml);
  pageXml = replaceApartmentCode(pageXml, row.maCan);
  pageXml = replaceNoticeDates(pageXml, dataset.notice.startDateText, dataset.notice.endDateText);
  pageXml = replaceMoneyParagraphs(pageXml, row.monthlyFee, row.totalFee);
  pageXml = replaceDueDateParagraph(pageXml, dataset.notice.dueDateText);
  pageXml = replaceDocumentDateParagraph(pageXml, dataset.notice.documentDateText);
  return pageXml;
}

function buildDocumentXml(
  originalXml: string,
  rows: Awaited<ReturnType<typeof getFeeNoticeDataset>>["rows"],
  dataset: Awaited<ReturnType<typeof getFeeNoticeDataset>>,
) {
  const bodyMatch = originalXml.match(/<w:body>([\s\S]*?)(<w:sectPr[\s\S]*?<\/w:sectPr>)<\/w:body>/);
  if (!bodyMatch) {
    throw new Error("Không đọc được cấu trúc Word template.");
  }

  const templatePageXml = bodyMatch[1];
  const sectPrXml = bodyMatch[2];
  const pageBreakXml = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

  const pagesXml = rows
    .map((row) => buildPageXml(templatePageXml, row, dataset))
    .join(pageBreakXml);

  return stripSpellMarks(
    originalXml.replace(bodyMatch[0], `<w:body>${pagesXml}${sectPrXml}</w:body>`),
  );
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
    const templateBuffer = await fs.readFile(TEMPLATE_PATH);
    const zip = await JSZip.loadAsync(templateBuffer);
    const documentXml = await zip.file("word/document.xml")?.async("string");

    if (!documentXml) {
      throw new Error("Template Word không có word/document.xml.");
    }

    const nextXml = buildDocumentXml(documentXml, dataset.rows, dataset);
    zip.file("word/document.xml", nextXml);

    const output = await zip.generateAsync({ type: "nodebuffer" });
    return new NextResponse(output, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Thong-bao-thu-phi-${dataset.paidThrough}-${dataset.notice.startLabel.replace("/", "-")}-${dataset.notice.endLabel.replace("/", "-")}.docx"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể xuất thông báo Word." },
      { status: 400 },
    );
  }
}

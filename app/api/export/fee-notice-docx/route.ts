import fs from "node:fs/promises";
import path from "node:path";

import JSZip from "jszip";
import { NextResponse } from "next/server";

import { getFeeNoticeDataset } from "@/src/modules/apartments/fee-notice-export";
import { getCurrentAdmin } from "@/src/modules/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEE_NOTICE_TEMPLATE_PATH = path.join(process.cwd(), "templates", "fee-notice-template-v2.docx");
const POWER_CUT_TEMPLATE_PATH = path.join(process.cwd(), "templates", "power-cut-template-v2.docx");

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

function replacePlaceholders(paragraphXml: string, replacements: Record<string, string>) {
  let text = decodeParagraphText(paragraphXml);
  let hasReplacement = false;

  for (const [key, value] of Object.entries(replacements)) {
    if (text.includes(key)) {
      text = text.replaceAll(key, value);
      hasReplacement = true;
    }
  }

  if (hasReplacement) {
    return replaceParagraphTextRuns(paragraphXml, text);
  }

  return paragraphXml;
}

function replaceFeeNoticeParagraphs(
  pageXml: string,
  row: Awaited<ReturnType<typeof getFeeNoticeDataset>>["rows"][number],
  dataset: Awaited<ReturnType<typeof getFeeNoticeDataset>>,
) {
  const replacements: Record<string, string> = {
    "{{TIEU_DE_THONG_BAO}}": dataset.notice.titleText,
    "{{MA_CAN}}": row.maCan,
    "{{KY_PHI_BAT_DAU}}": dataset.notice.startDateText,
    "{{KY_PHI_KET_THUC}}": dataset.notice.endDateText,
    "{{PHI_HANG_THANG}}": moneyText(row.monthlyFee),
    "{{TONG_PHI}}": moneyText(row.totalFee),
    "{{HAN_NOP_PHI}}": dataset.notice.dueDateText,
    "{{NOI_DUNG_CHUYEN_KHOAN}}": dataset.notice.transferContentHint,
    "{{NGAY_THANG_NAM}}": dataset.notice.documentDateText,
  };

  return pageXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraphXml) => {
    return replacePlaceholders(paragraphXml, replacements);
  });
}

function replacePowerCutParagraphs(
  pageXml: string,
  row: Awaited<ReturnType<typeof getFeeNoticeDataset>>["rows"][number],
  dataset: Awaited<ReturnType<typeof getFeeNoticeDataset>>,
) {
  const replacements: Record<string, string> = {
    "{{NGAY_THANG_NAM}}": currentHaiPhongDateText(),
    "{{MA_CAN}}": row.maCan,
    "{{THANG_NO_BAT_DAU}}": dataset.notice.overdueFromText,
    "{{THANG_NO_KET_THUC}}": dataset.notice.overdueToText,
    "{{TONG_PHI}}": moneyText(row.totalFee),
    "{{NGAY_CAT_DIEN}}": dataset.notice.dueDateText,
  };

  return pageXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraphXml) => {
    return replacePlaceholders(paragraphXml, replacements);
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

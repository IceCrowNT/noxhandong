import fs from "node:fs/promises";
import JSZip from "jszip";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeParagraphText(paragraphXml: string) {
  return paragraphXml
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function replaceParagraphTextRuns(paragraphXml: string, nextText: string) {
  const runs = paragraphXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) ?? [];
  if (runs.length === 0) return paragraphXml;
  const textRunIndex = runs.findIndex((run) => /<w:t\b/.test(run));
  if (textRunIndex === -1) return paragraphXml;
  const preservedPrefix = runs.slice(0, textRunIndex).filter((run) => !/<w:instrText\b/.test(run)).join("");
  const templateRun = runs[textRunIndex];
  const rebuiltRun = templateRun.replace(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/, `<w:t>${escapeXml(nextText)}</w:t>`);
  return paragraphXml.replace(/<w:r\b[\s\S]*<\/w:r>/, `${preservedPrefix}${rebuiltRun}`);
}

function processFeeNotice(xml: string) {
  return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraphXml) => {
    const text = decodeParagraphText(paragraphXml);
    if (text.startsWith("THÔNG BÁO") || text.startsWith("THÔNG BÁO LẦN")) return replaceParagraphTextRuns(paragraphXml, "{{TIEU_DE_THONG_BAO}}");
    if (text.startsWith("Kính gửi")) return replaceParagraphTextRuns(paragraphXml, "Kính gửi : CĂN HỘ {{MA_CAN}}");
    if (text.startsWith("V/v:")) return replaceParagraphTextRuns(paragraphXml, "V/v: Thu phí dịch vụ quản lý vận hành kỳ phí từ {{KY_PHI_BAT_DAU}} đến {{KY_PHI_KET_THUC}}");
    
    // Original doc had two paragraphs for this notification
    if (text.startsWith("BQT trân trọng thông báo")) {
      return replaceParagraphTextRuns(paragraphXml, "BQT trân trọng thông báo tới Quý Cư dân lịch thu phí Quản lý vận hành kỳ phí 06 tháng (từ {{KY_PHI_BAT_DAU}} đến {{KY_PHI_KET_THUC}}), như sau:");
    }
    if (text.startsWith("(từ ") && text.includes("như sau")) {
      return replaceParagraphTextRuns(paragraphXml, ""); // Clear this duplicate paragraph entirely
    }
    
    if (text.startsWith("Phí quản lý chung cư là")) return replaceParagraphTextRuns(paragraphXml, "Phí quản lý chung cư là : {{PHI_HANG_THANG}} VNĐ/1 tháng");
    if (text.startsWith("Kỳ phí 6 tháng phải nộp")) return replaceParagraphTextRuns(paragraphXml, "Kỳ phí 6 tháng phải nộp : ({{PHI_HANG_THANG}} × 6) = {{TONG_PHI}} VNĐ");
    if (text.startsWith("Thời gian: trước ngày")) return replaceParagraphTextRuns(paragraphXml, "Thời gian: trước ngày {{HAN_NOP_PHI}}");
    if (text.startsWith("“ Tòa") || text.startsWith('" Tòa') || text.includes("nộp phí QLVH từ")) return replaceParagraphTextRuns(paragraphXml, "“ {{NOI_DUNG_CHUYEN_KHOAN}}”");
    
    if (text.startsWith("Số:") && text.includes("An Hải")) {
      return replaceParagraphTextRuns(paragraphXml, "Số: …../TBTP-BQTNOXHAD \t\t {{NGAY_THANG_NAM}}"); 
    }
    return paragraphXml;
  });
}

function processPowerCut(xml: string) {
    return xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraphXml) => {
      const text = decodeParagraphText(paragraphXml);
      
      if (text.startsWith("Hải Phòng, ngày")) return replaceParagraphTextRuns(paragraphXml, "{{NGAY_THANG_NAM}}");
      if (text.startsWith("Kính gửi:")) return replaceParagraphTextRuns(paragraphXml, "Kính gửi: CĂN HỘ {{MA_CAN}}");
      if (text.startsWith("Hiện tại hộ dân đang chậm")) return replaceParagraphTextRuns(paragraphXml, "Hiện tại hộ dân đang chậm đóng phí QLVH từ tháng {{THANG_NO_BAT_DAU}} theo quy định của khu NOXH.");
      if (text.includes("Số tiền :") && text.includes("đ")) return replaceParagraphTextRuns(paragraphXml, "- Số tiền : {{TONG_PHI}} đ");
      if (text.startsWith("ND : Căn hộ")) return replaceParagraphTextRuns(paragraphXml, "ND : Căn hộ + SĐT + nộp phí QLVH từ tháng {{THANG_NO_BAT_DAU}} – tháng {{THANG_NO_KET_THUC}}");
      if (text.startsWith("Thời gian dự kiến cắt điện:")) return replaceParagraphTextRuns(paragraphXml, "Thời gian dự kiến cắt điện: Từ 08h00 ngày {{NGAY_CAT_DIEN}}, tại căn hộ số: {{MA_CAN}}");
      
      return paragraphXml;
    });
}

async function run() {
  const feeBuf = await fs.readFile("templates/fee-notice-template.docx");
  const feeZip = await JSZip.loadAsync(feeBuf);
  let feeXml = await feeZip.file("word/document.xml")!.async("string");
  feeZip.file("word/document.xml", processFeeNotice(feeXml));
  await fs.writeFile("templates/fee-notice-template-v2.docx", await feeZip.generateAsync({type: "nodebuffer"}));
  
  const powerBuf = await fs.readFile("templates/power-cut-template.docx");
  const powerZip = await JSZip.loadAsync(powerBuf);
  let powerXml = await powerZip.file("word/document.xml")!.async("string");
  powerZip.file("word/document.xml", processPowerCut(powerXml));
  await fs.writeFile("templates/power-cut-template-v2.docx", await powerZip.generateAsync({type: "nodebuffer"}));
  
  console.log("Done generating v2 templates");
}

run().catch(console.error);

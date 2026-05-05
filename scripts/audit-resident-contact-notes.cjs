#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const inputPath = process.argv[2] || "docs/Theo dõi thu phí T4.xlsx";
const resolvedPath = path.resolve(process.cwd(), inputPath);
const outputPath = path.resolve(process.cwd(), "docs/bao-cao-audit-lien-he-can-ho.md");

function normalizePhoneChunks(text) {
  const matches = String(text).match(/0\d(?:[\d\.\s\-]){7,14}\d/g) || [];
  return matches.map((m) => m.replace(/\D/g, ""));
}

function splitLines(text) {
  return String(text).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function detectFlags(text) {
  const flags = [];
  const defs = [
    ["DA_BAN", /đã bán|da ban/i],
    ["CHU_MOI", /chủ mới|chu moi/i],
    ["KHACH_THUE", /khách thuê|khach thue/i],
    ["CAN_XIN_SDT", /cần xin sđt|cần xin sdt|can xin sdt/i],
    ["SDT_SAI", /sđt sai|sdt sai/i],
    ["XAC_MINH", /xác minh|xac minh/i],
    ["GHI_CHU_THANH_TOAN", /thanh toán theo tháng|thanh toan theo thang|khách đóng 1 tháng 1 lần|khach dong 1 thang 1 lan/i],
  ];
  for (const [key, re] of defs) {
    if (re.test(text)) flags.push(key);
  }
  return flags;
}

function classify(owner, note) {
  const lines = splitLines(note);
  const phones = normalizePhoneChunks(note);
  const flags = detectFlags(note);
  const hasSlash = note.includes("/");
  const needsReview = flags.length > 0 || lines.length > 1 || phones.length > 1 || hasSlash;
  return { lines, phones, flags, hasSlash, needsReview };
}

function mdEscape(text) {
  return String(text).replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, " ");
}

function main() {
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Không tìm thấy file: ${resolvedPath}`);
  }

  const wb = XLSX.readFile(resolvedPath);
  const ws = wb.Sheets["Danh sách khách hàng"];
  if (!ws) throw new Error('Không tìm thấy sheet "Danh sách khách hàng"');

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const data = rows.slice(1).filter((r) => r.some((v) => String(v).trim() !== ""));

  const audits = [];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    const maCan = String(r[1] || "").trim();
    const chuHo = String(r[3] || "").trim();
    const thongTin = String(r[4] || "").trim();
    if (!maCan || !thongTin) continue;
    const analysis = classify(chuHo, thongTin);
    if (analysis.needsReview) {
      audits.push({
        rowIndex: i + 2,
        maCan,
        chuHo,
        thongTin,
        lineCount: analysis.lines.length,
        phoneCount: analysis.phones.length,
        phones: analysis.phones,
        flags: analysis.flags,
      });
    }
  }

  const summary = {
    totalReviewed: audits.length,
    multiLine: audits.filter((a) => a.lineCount > 1).length,
    multiPhone: audits.filter((a) => a.phoneCount > 1).length,
    withFlags: audits.filter((a) => a.flags.length > 0).length,
  };

  const top = audits.slice(0, 80);
  const lines = [];
  lines.push("# Báo cáo audit liên hệ căn hộ");
  lines.push("");
  lines.push(`- File nguồn: \`${path.basename(resolvedPath)}\``);
  lines.push(`- Tổng ô cần rà soát: \`${summary.totalReviewed}\``);
  lines.push(`- Có nhiều dòng: \`${summary.multiLine}\``);
  lines.push(`- Có nhiều số điện thoại: \`${summary.multiPhone}\``);
  lines.push(`- Có cờ trạng thái: \`${summary.withFlags}\``);
  lines.push("");
  lines.push("## Mẫu dữ liệu cần rà soát");
  lines.push("");
  lines.push("| Dòng Excel | Mã căn | Chủ hộ | Số dòng | Số SĐT | Flags | Thông tin cư dân |");
  lines.push("| --- | --- | --- | ---: | ---: | --- | --- |");
  for (const item of top) {
    lines.push(`| ${item.rowIndex} | ${mdEscape(item.maCan)} | ${mdEscape(item.chuHo)} | ${item.lineCount} | ${item.phoneCount} | ${mdEscape(item.flags.join(", "))} | ${mdEscape(item.thongTin)} |`);
  }
  lines.push("");
  lines.push("## Nhận xét");
  lines.push("");
  lines.push("- Các ô có nhiều dòng, nhiều số điện thoại hoặc cờ trạng thái không nên đổ thẳng vào bảng master.");
  lines.push("- Các ô này phải đi qua bảng `ung_vien_lien_he_can_ho` để review.");

  fs.writeFileSync(outputPath, lines.join("\n"));
  console.log(JSON.stringify({ outputPath, summary }, null, 2));
}

main();

// @ts-nocheck

import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { normalizeFreeText, safeString } from "../src/modules/shared/utils/text";

const REPORT_DIR = "docs/reports";
const OUTPUT_BASENAME = "phan-tich-giao-dich-can-nhap-tay-t1-t5-2026";

function classify(row) {
  const description = normalizeFreeText(row["Nội dung gốc"] || "");
  const amount = Number(row["Số tiền thu"] || 0);
  const status = safeString(row["Trạng thái đối soát"]);

  if (description.includes("ZALO")) return "ZALO_CAN_BANG_CHUNG";
  if (description.includes("TRA LAI TAI KHOAN") || description.includes("DDA")) return "NOI_BO_TRA_LAI";
  if (status === "CAN_RA_SOAT_NHIEU_CAN") return "NHIEU_CAN_LECH_TIEN";
  if (
    /\bL\s*[1-9][A-C]?\s*(?:SO|SONHA|CAN|CANHO|P|PHONG)?\s*[1-9]\d{2}/.test(description) ||
    /\b[1-9]\d{2}\s*(?:LO|L)\s*[1-9]/.test(description) ||
    /\bLO\s*[1-9]\s*[A-C]?\s*[1-9]\d{2}/.test(description)
  ) {
    return "CO_MAU_CAN_CAN_XEM_LAI";
  }
  if (description.includes("BQT KHU NHA O XA HOI") && !/(PHI|QLVH|CAN|LO|L[1-9])/.test(description)) {
    return "TEN_NGUOI_CHUYEN_CHUNG_CHUNG";
  }
  if (amount > 0 && amount < 100000) return "TIEN_NHO_NOI_BO_KHAC";
  return "KHONG_RO_CAN";
}

function countBy(rows, key) {
  return rows.reduce((result, row) => {
    const value = typeof key === "function" ? key(row) : row[key];
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function main() {
  const reportDir = path.resolve(process.cwd(), REPORT_DIR);
  const files = fs
    .readdirSync(reportDir)
    .filter((file) => /^T[1-5]-2026-.*doi-soat-theo-doi\.xlsx$/.test(file))
    .sort();

  const rows = [];
  for (const file of files) {
    const workbook = XLSX.readFile(path.join(reportDir, file));
    const sheet = workbook.Sheets["Bang chung nhap tay"];
    if (!sheet) continue;
    const period = file.slice(0, 7);
    for (const row of XLSX.utils.sheet_to_json(sheet)) {
      const category = classify(row);
      rows.push({
        "Kỳ": period,
        "Nhóm xử lý": category,
        ...row,
      });
    }
  }

  const byCategory = countBy(rows, "Nhóm xử lý");
  const byPeriod = {};
  for (const row of rows) {
    byPeriod[row["Kỳ"]] ||= {};
    byPeriod[row["Kỳ"]][row["Nhóm xử lý"]] = (byPeriod[row["Kỳ"]][row["Nhóm xử lý"]] || 0) + 1;
  }

  const categoryRows = Object.entries(byCategory)
    .sort((left, right) => right[1] - left[1])
    .map(([category, count]) => ({ "Nhóm xử lý": category, "Số dòng": count }));
  const periodRows = Object.entries(byPeriod).flatMap(([period, counts]) =>
    Object.entries(counts).map(([category, count]) => ({ "Kỳ": period, "Nhóm xử lý": category, "Số dòng": count }))
  );

  const summary = {
    totalRows: rows.length,
    byCategory,
    byPeriod,
    outputs: {
      xlsx: path.join(REPORT_DIR, `${OUTPUT_BASENAME}.xlsx`),
      json: path.join(REPORT_DIR, `${OUTPUT_BASENAME}.json`),
      csv: path.join(REPORT_DIR, `${OUTPUT_BASENAME}.csv`),
    },
  };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(categoryRows), "Tong hop nhom");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(periodRows), "Theo thang");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Chi tiet");

  XLSX.writeFile(workbook, path.join(reportDir, `${OUTPUT_BASENAME}.xlsx`));
  fs.writeFileSync(path.join(reportDir, `${OUTPUT_BASENAME}.json`), JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(path.join(reportDir, `${OUTPUT_BASENAME}.csv`), XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows)), "utf8");

  console.log(JSON.stringify(summary, null, 2));
}

main();

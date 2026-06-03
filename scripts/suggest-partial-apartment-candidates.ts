// @ts-nocheck

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import XLSX from "xlsx";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { normalizeFreeText, safeString } from "../src/modules/shared/utils/text";

const INPUT = "docs/reports/phan-tich-giao-dich-can-nhap-tay-t1-t5-2026.xlsx";
const OUTPUT_BASE = "goi-y-ma-can-thieu-lo-t1-t5-2026";
const OUTPUT_DIR = "docs/reports";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function normalizeName(value: string): string {
  return normalizeFreeText(value).replace(/\b(CT|DEN|MBVCB|CHUYEN|TIEN|NOP|PHI|CAN|HO)\b/g, "").replace(/\s+/g, " ").trim();
}

function digits(value: unknown): string {
  return safeString(value).replace(/\D/g, "");
}

function extractMissingBlockRoom(description: string): string | null {
  const normalized = normalizeFreeText(description);
  const patterns = [
    /\bCAN\s+HO\s+L\s+([1-9]\d{2}[A-Z]?)\b/,
    /\bCAN\s+L\s+([1-9]\d{2}[A-Z]?)\b/,
    /\bHO\s+L\s+([1-9]\d{2}[A-Z]?)\b/,
    /\bL\s+([1-9]\d{2}[A-Z]?)\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function tokenSet(value: string): Set<string> {
  return new Set(
    normalizeName(value)
      .split(" ")
      .filter((token) => token.length >= 2)
  );
}

function scoreContact(row, contact): { score: number; reason: string } {
  const reasons: string[] = [];
  let score = 0;
  const senderName = safeString(row["Người chuyển"]);
  const senderAccount = digits(row["Tài khoản chuyển"]);
  const contactPhone = digits(contact.so_dien_thoai_parse || contact.so_dien_thoai_goc || "");
  const contactName = safeString(contact.ten_hien_thi_parse || contact.ten_nguoi_su_dung_goc || contact.ten_chu_ho_goc || "");

  if (senderAccount && contactPhone && senderAccount.endsWith(contactPhone)) {
    score += 100;
    reasons.push("Khớp SĐT/tài khoản đối ứng");
  }

  const senderNormalized = normalizeName(senderName);
  const contactNormalized = normalizeName(contactName);
  if (senderNormalized && contactNormalized && senderNormalized === contactNormalized) {
    score += 80;
    reasons.push("Khớp tên đầy đủ");
  } else {
    const senderTokens = tokenSet(senderName);
    const contactTokens = tokenSet(contactName);
    const overlap = [...senderTokens].filter((token) => contactTokens.has(token));
    if (overlap.length >= 2) {
      score += 35;
      reasons.push(`Trùng token tên: ${overlap.join(" ")}`);
    } else if (overlap.length === 1) {
      score += 10;
      reasons.push(`Trùng một token tên: ${overlap[0]}`);
    }
  }

  return { score, reason: reasons.join("; ") || "Không khớp tên/SĐT" };
}

function decisionFromScore(bestScore: number, candidateCount: number): string {
  if (bestScore >= 100) return "GOI_Y_MANH_CHO_ADMIN_DUYET";
  if (bestScore >= 70) return "GOI_Y_TUONG_DOI_CAN_KIEM_TRA";
  if (candidateCount === 1 && bestScore > 0) return "CHI_CO_MOT_UNG_VIEN_CAN_KIEM_TRA";
  return "CHI_LIET_KE_UNG_VIEN_KHONG_TU_CHON";
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL in .env");

  const inputPath = path.resolve(process.cwd(), INPUT);
  const workbook = XLSX.readFile(inputPath);
  const sheet = workbook.Sheets["Chi tiet"];
  if (!sheet) throw new Error(`Cannot find sheet "Chi tiet" in ${INPUT}`);

  const rows = XLSX.utils.sheet_to_json(sheet);
  const detailRows = [];
  const summaryRows = [];

  for (const row of rows) {
    const room = extractMissingBlockRoom(row["Nội dung gốc"]);
    if (!room) continue;

    const apartments = await prisma.canHo.findMany({
      where: { ma_so: room },
      select: {
        id: true,
        ma_can: true,
        ma_lo: true,
        ma_so: true,
        chu_ho_ten_goc: true,
        ghi_chu: true,
      },
      orderBy: { ma_can: "asc" },
    });

    const contacts = await prisma.ungVienLienHeCanHo.findMany({
      where: { ma_can: { in: apartments.map((item) => item.ma_can) } },
      select: {
        ma_can: true,
        ten_chu_ho_goc: true,
        thong_tin_cu_dan_goc: true,
        ten_nguoi_su_dung_goc: true,
        so_dien_thoai_goc: true,
        ten_hien_thi_parse: true,
        so_dien_thoai_parse: true,
        trang_thai_duyet: true,
      },
      orderBy: [{ ma_can: "asc" }, { id: "asc" }],
    });

    const scored = [];
    for (const apartment of apartments) {
      const apartmentContacts = contacts.filter((contact) => contact.ma_can === apartment.ma_can);
      const contactScores = apartmentContacts.length
        ? apartmentContacts.map((contact) => ({ contact, ...scoreContact(row, contact) }))
        : [{ contact: null, score: 0, reason: "Không có contact staging" }];
      const best = contactScores.sort((left, right) => right.score - left.score)[0];
      scored.push({ apartment, best });
      detailRows.push({
        "Kỳ": row["Kỳ"],
        "Dòng sao kê": row["Dòng sao kê"],
        "Ngày": row["Ngày"],
        "Số tiền": row["Số tiền thu"],
        "Nội dung": row["Nội dung gốc"],
        "Người chuyển": row["Người chuyển"],
        "Tài khoản chuyển": row["Tài khoản chuyển"],
        "Mã giao dịch": row["Mã giao dịch"],
        "Số căn thiếu lô": room,
        "Ứng viên": apartment.ma_can,
        "Chủ hộ gốc": apartment.chu_ho_ten_goc,
        "Contact khớp nhất": best.contact
          ? `${best.contact.ten_hien_thi_parse || best.contact.ten_nguoi_su_dung_goc || ""} ${best.contact.so_dien_thoai_parse || best.contact.so_dien_thoai_goc || ""}`.trim()
          : "",
        "Điểm": best.score,
        "Lý do điểm": best.reason,
        "Ghi chú căn": apartment.ghi_chu || "",
      });
    }

    const bestOverall = scored.sort((left, right) => right.best.score - left.best.score)[0];
    summaryRows.push({
      "Kỳ": row["Kỳ"],
      "Dòng sao kê": row["Dòng sao kê"],
      "Ngày": row["Ngày"],
      "Số tiền": row["Số tiền thu"],
      "Người chuyển": row["Người chuyển"],
      "Tài khoản chuyển": row["Tài khoản chuyển"],
      "Mã giao dịch": row["Mã giao dịch"],
      "Nội dung": row["Nội dung gốc"],
      "Số căn thiếu lô": room,
      "Số ứng viên": apartments.length,
      "Ứng viên mạnh nhất": bestOverall?.apartment.ma_can || "",
      "Điểm mạnh nhất": bestOverall?.best.score || 0,
      "Kết luận": decisionFromScore(bestOverall?.best.score || 0, apartments.length),
      "Lý do": bestOverall?.best.reason || "",
    });
  }

  const outputDir = path.resolve(process.cwd(), OUTPUT_DIR);
  const outputWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(outputWorkbook, XLSX.utils.json_to_sheet(summaryRows), "Tong hop");
  XLSX.utils.book_append_sheet(outputWorkbook, XLSX.utils.json_to_sheet(detailRows), "Ung vien chi tiet");
  XLSX.writeFile(outputWorkbook, path.join(outputDir, `${OUTPUT_BASE}.xlsx`));
  fs.writeFileSync(path.join(outputDir, `${OUTPUT_BASE}.json`), JSON.stringify({ totalRows: summaryRows.length, summaryRows }, null, 2), "utf8");

  console.log(JSON.stringify({ totalRows: summaryRows.length, output: path.join(OUTPUT_DIR, `${OUTPUT_BASE}.xlsx`) }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

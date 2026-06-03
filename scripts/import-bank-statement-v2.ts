// @ts-nocheck

import path from "node:path";
import fs from "node:fs";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { APARTMENT_CODE_PARSER_VERSION, parseApartmentCode } from "../src/modules/transactions/parser/apartment-parser";
import {
  fileHash,
  readStatementRows,
  resolveExistingInputArg,
  transactionFingerprint,
} from "./bank-statement-common";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in .env");
}

const DEFAULT_INPUT = "docs/lich-su-giao-dich(15-04-2026 09_33_29).xls";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function parseArgs(args) {
  const options = {
    from: null,
    ignoreClosingCutoff: false,
  };

  for (const arg of args) {
    if (arg === "--ignore-closing-cutoff") {
      options.ignoreClosingCutoff = true;
      continue;
    }
    if (arg.startsWith("--from=")) {
      const raw = arg.slice("--from=".length).trim();
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid --from datetime: ${raw}`);
      }
      options.from = date;
    }
  }

  return options;
}

function getClosingCutoffFromMetadata(value) {
  if (!value || typeof value !== "object") return null;
  const raw = value.chotDenThoiDiem;
  if (typeof raw !== "string" || !raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function resolveImportCutoff(args) {
  const options = parseArgs(args);
  if (options.ignoreClosingCutoff) {
    return { cutoff: null, source: "ignored_by_flag", closingId: null, closingPeriod: null };
  }
  if (options.from) {
    return { cutoff: options.from, source: "cli_from", closingId: null, closingPeriod: null };
  }

  const latestClosings = await prisma.soChotThang.findMany({
    where: { trang_thai: "DA_CHOT" },
    orderBy: { id: "desc" },
    take: 20,
    select: { id: true, ky_du_lieu: true, metadata_json: true },
  });
  const latestClosing = latestClosings.find((closing) => getClosingCutoffFromMetadata(closing.metadata_json));
  const cutoff = getClosingCutoffFromMetadata(latestClosing?.metadata_json);

  return {
    cutoff,
    source: cutoff ? "latest_monthly_closing_with_cutoff" : "none",
    closingId: latestClosing?.id || null,
    closingPeriod: latestClosing?.ky_du_lieu || null,
  };
}

function detectInternalReason(transaction, parseResult, hasValidCode) {
  const content = `${transaction.description} ${parseResult.normalizedDescription}`.toUpperCase();
  const hard = ["TRA LAI TAI KHOAN", "DDA", "BHXH", "BHYT", "BHTN", "LUONG", "THU LAO"];
  const soft = ["BQT", "NOXH", "BAN QUAN TRI"];
  const generic = ["CHUYEN KHOAN NHANH", "QUA ZALO", "CHUYEN KHOAN", "CK NHANH", "NHANH QUA", "NAP TIEN", "HOAN TIEN"];
  const payment = ["PHI", "QLVH", "QLCC", "PQLCC", "CAN HO", "CHUNG CU", "NOP PHI", "DONG PHI", "TU THANG", "DEN THANG"];
  const hasResidentSignal = (parseResult.candidates.length > 0 || hasValidCode) && payment.some((keyword) => content.includes(keyword));

  if (transaction.amount <= 0) return "Bị lọc vì số tiền nhỏ hơn hoặc bằng 0.";
  const hardKeyword = hard.find((keyword) => content.includes(keyword));
  if (hardKeyword) return `Bị lọc vì chứa từ khóa nội bộ cứng: ${hardKeyword}.`;
  if (!hasResidentSignal && transaction.amount < 100000) {
    return "Bị lọc vì số tiền nhỏ hơn ngưỡng tối thiểu 100.000 và không có tín hiệu cư dân đóng phí.";
  }
  const softKeyword = soft.find((keyword) => content.includes(keyword));
  if (!hasResidentSignal && softKeyword) {
    return `Bị lọc vì chứa từ khóa nội bộ mềm: ${softKeyword}, trong khi không có tín hiệu cư dân đóng phí.`;
  }
  const hasApartmentContext = parseResult.candidates.length > 0 || /\bL[1-9][A-C]?\b/.test(content) || payment.some((keyword) => content.includes(keyword));
  const genericKeyword = generic.find((keyword) => content.includes(keyword));
  if (!hasResidentSignal && !hasApartmentContext && genericKeyword) {
    return `Bị lọc vì là giao dịch chuyển khoản chung chung (${genericKeyword}) và không có ngữ cảnh căn hộ.`;
  }
  return null;
}

function mapStatus(transaction, parseResult, validCodes) {
  const suggestions = [...new Set(parseResult.candidates.map((item) => item.code))];
  const parsed = parseResult.parsedApartmentCode;
  const hasValidCode = parsed ? validCodes.has(parsed) : false;

  if (suggestions.length > 1) {
    return { status: "NHIEU_CAN", confidence: "0.45", matchedCode: null, reason: parseResult.matchReason };
  }
  if (parsed) {
    if (hasValidCode) {
      const upper = transaction.description.toUpperCase();
      const direct = upper.includes(parsed) || upper.includes(parsed.replace(".", " "));
      return {
        status: direct ? "KHOP_TRUC_TIEP" : "KHOP_SAU_CHUAN_HOA",
        confidence: direct ? "0.99" : "0.90",
        matchedCode: parsed,
        reason: parseResult.matchReason,
      };
    }
    return {
      status: "MA_CAN_KHONG_HOP_LE",
      confidence: "0.40",
      matchedCode: parsed,
      reason: `Parsed apartment code ${parsed} does not exist in can_ho`,
    };
  }

  const internalReason = detectInternalReason(transaction, parseResult, hasValidCode);
  if (internalReason) {
    return { status: "KHONG_LIEN_QUAN_CAN_HO", confidence: "0.05", matchedCode: null, reason: internalReason };
  }

  return {
    status: "CHUA_NHAN_DIEN_DUOC_CAN",
    confidence: "0.10",
    matchedCode: null,
    reason: parseResult.matchReason,
  };
}

function findPartialApartmentCandidates(description, validApartments) {
  const normalized = description
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const roomMatches = new Set();
  const patterns = [
    /\bL\s+(\d{3}[A-C]?)\b/g,
    /\bCAN\s+(\d{3}[A-C]?)\b/g,
    /\bPHONG\s+(\d{3}[A-C]?)\b/g,
  ];

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      if (match[1]) roomMatches.add(match[1]);
    }
  }

  if (!roomMatches.size) return [];

  return validApartments
    .filter((apartment) => {
      const suffix = String(apartment.ma_can).split(".").pop();
      return suffix && roomMatches.has(suffix);
    })
    .slice(0, 20)
    .map((apartment, index) => ({
      code: apartment.ma_can,
      score: 10,
      reason: `Gợi ý yếu: nội dung chỉ có số căn ${String(apartment.ma_can).split(".").pop()}, thiếu lô. Cần admin duyệt.`,
      rank: index + 1,
    }));
}

async function main() {
  const { inputPath, rest } = resolveExistingInputArg(DEFAULT_INPUT);
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const { sheetName, headerRowNumber, records } = readStatementRows(resolvedPath);
  const importCutoff = await resolveImportCutoff(rest);
  const validApartments = await prisma.canHo.findMany({ select: { id: true, ma_can: true } });
  const validCodes = new Set(validApartments.map((item) => item.ma_can));
  const apartmentIdByCode = new Map(validApartments.map((item) => [item.ma_can, item.id]));

  const batch = await prisma.loNhapDuLieu.create({
    data: {
      loai_nguon: "SAO_KE_NGAN_HANG",
      ten_file: path.basename(resolvedPath),
      ma_bam_file: fileHash(resolvedPath),
      so_dong: records.length,
      trang_thai: "CHO_XU_LY",
      metadata_json: {
        sourcePath: inputPath,
        sheetName,
        headerRow: headerRowNumber,
        parserVersion: APARTMENT_CODE_PARSER_VERSION,
        importCutoff: {
          source: importCutoff.source,
          cutoffAt: importCutoff.cutoff?.toISOString() || null,
          closingId: importCutoff.closingId,
          closingPeriod: importCutoff.closingPeriod,
        },
      },
    },
  });

  const summary = {
    batchId: batch.id,
    sourceFile: inputPath,
    rows: records.length,
    incomeRows: 0,
    skippedExpenseRows: 0,
    skippedBeforeOrAtClosingRows: 0,
    missingTransactionDateRows: 0,
    transactionsUpserted: 0,
    rawRowsInserted: 0,
    parseStatus: {},
    reviewRowsCreated: 0,
    allocationsCreated: 0,
    parserVersion: APARTMENT_CODE_PARSER_VERSION,
    importCutoff: {
      source: importCutoff.source,
      cutoffAt: importCutoff.cutoff?.toISOString() || null,
      closingId: importCutoff.closingId,
      closingPeriod: importCutoff.closingPeriod,
    },
  };

  for (const record of records) {
    const rawRow = await prisma.dongSaoKeTho.create({
      data: {
        lo_nhap_du_lieu_id: batch.id,
        so_dong_nguon: record.sourceRowIndex,
        header_values_json: record.headers,
        values_json: record.values,
        mapped_row_json: record.mappedRow,
        payload_json: { sheetName, sourceFile: inputPath },
      },
    });
    summary.rawRowsInserted += 1;

    const transaction = record.transaction;
    const fingerprint = transactionFingerprint(transaction);
    const parseResult = parseApartmentCode(transaction.description);
    const normalizedDescription = parseResult.normalizedDescription;

    await prisma.giaoDichSaoKeThoChuan.upsert({
      where: transaction.transactionId
        ? { tham_chieu_ngan_hang: transaction.transactionId }
        : { van_tay_giao_dich: fingerprint },
      update: {
        lo_nhap_du_lieu_id: batch.id,
        ma_bam_file: fileHash(resolvedPath),
        so_dong_nguon: record.sourceRowIndex,
        ngay_giao_dich: transaction.transactionDate,
        so_tien: String(transaction.amount),
        la_giao_dich_thu: transaction.amount > 0,
        noi_dung_goc: transaction.description,
        noi_dung_chuan_hoa: normalizedDescription,
        ten_nguoi_chuyen: transaction.senderName,
        tai_khoan_nguoi_chuyen: transaction.senderAccount,
        ma_giao_dich_text: transaction.transactionId,
        header_values_json: record.headers,
        values_json: record.values,
        mapped_row_json: record.mappedRow,
        payload_goc_json: {
          rawStatementRowId: rawRow.id,
          rawRow: transaction.rawRow,
          sourceRowIndex: record.sourceRowIndex,
          sourceFile: inputPath,
          sheetName,
        },
      },
      create: {
        lo_nhap_du_lieu_id: batch.id,
        ma_bam_file: fileHash(resolvedPath),
        so_dong_nguon: record.sourceRowIndex,
        van_tay_giao_dich: fingerprint,
        tham_chieu_ngan_hang: transaction.transactionId || null,
        ngay_giao_dich: transaction.transactionDate,
        so_tien: String(transaction.amount),
        la_giao_dich_thu: transaction.amount > 0,
        noi_dung_goc: transaction.description,
        noi_dung_chuan_hoa: normalizedDescription,
        ten_nguoi_chuyen: transaction.senderName,
        tai_khoan_nguoi_chuyen: transaction.senderAccount,
        ma_giao_dich_text: transaction.transactionId,
        header_values_json: record.headers,
        values_json: record.values,
        mapped_row_json: record.mappedRow,
        payload_goc_json: {
          rawStatementRowId: rawRow.id,
          rawRow: transaction.rawRow,
          sourceRowIndex: record.sourceRowIndex,
          sourceFile: inputPath,
          sheetName,
        },
      },
    });

    if (transaction.amount <= 0) {
      summary.skippedExpenseRows += 1;
      continue;
    }

    summary.incomeRows += 1;
    if (!transaction.transactionDate) {
      summary.missingTransactionDateRows += 1;
    }
    if (importCutoff.cutoff && transaction.transactionDate && transaction.transactionDate <= importCutoff.cutoff) {
      summary.skippedBeforeOrAtClosingRows += 1;
      continue;
    }

    const mapped = mapStatus(transaction, parseResult, validCodes);
    const suggestionCandidates =
      parseResult.candidates.length > 0
        ? parseResult.candidates.map((candidate, index) => ({
            code: candidate.code,
            score: candidate.score,
            reason: candidate.reason,
            rank: index + 1,
          }))
        : findPartialApartmentCandidates(transaction.description, validApartments);
    summary.parseStatus[mapped.status] = (summary.parseStatus[mapped.status] || 0) + 1;

    const existingTransaction = transaction.transactionId
      ? await prisma.giaoDichNganHang.findUnique({
          where: { tham_chieu_ngan_hang: transaction.transactionId },
          select: { id: true },
        })
      : await prisma.giaoDichNganHang.findUnique({
          where: { van_tay_giao_dich: fingerprint },
          select: { id: true },
        });

    const transactionCreateData = {
      lo_nhap_du_lieu_id: batch.id,
      van_tay_giao_dich: fingerprint,
      ngay_giao_dich: transaction.transactionDate,
      so_tien: String(transaction.amount),
      noi_dung_goc: transaction.description,
      noi_dung_chuan_hoa: parseResult.normalizedDescription,
      ten_nguoi_chuyen: transaction.senderName,
      tai_khoan_nguoi_chuyen: transaction.senderAccount,
      ma_giao_dich_text: transaction.transactionId,
      payload_goc_json: {
        rawStatementRowId: rawRow.id,
        rawRow: transaction.rawRow,
        sourceRowIndex: record.sourceRowIndex,
      },
      phien_ban_parser: APARTMENT_CODE_PARSER_VERSION,
      ma_can_parse: mapped.matchedCode,
      trang_thai_khop: mapped.status,
      ly_do_khop: mapped.reason,
      do_tin_cay: mapped.confidence,
      la_giao_dich_noi_bo: mapped.status === "KHONG_LIEN_QUAN_CAN_HO",
      ung_vien_khop_json: suggestionCandidates,
      trang_thai_duyet: "CHUA_DUYET",
      ma_can_duoc_chon: mapped.matchedCode,
      ghi_chu_duyet: mapped.reason,
    };
    const transactionUpdateData = {
      van_tay_giao_dich: fingerprint,
      ngay_giao_dich: transaction.transactionDate,
      so_tien: String(transaction.amount),
      noi_dung_goc: transaction.description,
      noi_dung_chuan_hoa: parseResult.normalizedDescription,
      ten_nguoi_chuyen: transaction.senderName,
      tai_khoan_nguoi_chuyen: transaction.senderAccount,
      ma_giao_dich_text: transaction.transactionId,
      phien_ban_parser: APARTMENT_CODE_PARSER_VERSION,
      ma_can_parse: mapped.matchedCode,
      trang_thai_khop: mapped.status,
      ly_do_khop: mapped.reason,
      do_tin_cay: mapped.confidence,
      la_giao_dich_noi_bo: mapped.status === "KHONG_LIEN_QUAN_CAN_HO",
      ung_vien_khop_json: suggestionCandidates,
    };

    const dbTransaction = existingTransaction
      ? await prisma.giaoDichNganHang.update({
          where: { id: existingTransaction.id },
          data: transactionUpdateData,
        })
      : await prisma.giaoDichNganHang.create({
          data: {
            ...transactionCreateData,
            tham_chieu_ngan_hang: transaction.transactionId || null,
          },
        });
    summary.transactionsUpserted += 1;

    const currentReview = await prisma.duyetGiaoDich.findFirst({
      where: { giao_dich_ngan_hang_id: dbTransaction.id },
      orderBy: { id: "desc" },
      select: { id: true, trang_thai_duyet: true },
    });
    const currentMergedReview = dbTransaction.trang_thai_duyet || "CHUA_DUYET";
    const alreadyReviewed =
      currentMergedReview === "DA_DUYET" ||
      currentMergedReview === "DA_RA_SOAT" ||
      currentMergedReview === "TU_CHOI" ||
      (currentReview &&
        (currentReview.trang_thai_duyet === "DA_DUYET" ||
          currentReview.trang_thai_duyet === "DA_RA_SOAT" ||
          currentReview.trang_thai_duyet === "TU_CHOI"));

    const parse = await prisma.ketQuaParseGiaoDich.upsert({
      where: { giao_dich_ngan_hang_id: dbTransaction.id },
      update: {
        phien_ban_parser: APARTMENT_CODE_PARSER_VERSION,
        ma_can_parse: mapped.matchedCode,
        trang_thai_khop: mapped.status,
        ly_do_khop: mapped.reason,
        do_tin_cay: mapped.confidence,
        la_giao_dich_noi_bo: mapped.status === "KHONG_LIEN_QUAN_CAN_HO",
      },
      create: {
        giao_dich_ngan_hang_id: dbTransaction.id,
        phien_ban_parser: APARTMENT_CODE_PARSER_VERSION,
        ma_can_parse: mapped.matchedCode,
        trang_thai_khop: mapped.status,
        ly_do_khop: mapped.reason,
        do_tin_cay: mapped.confidence,
        la_giao_dich_noi_bo: mapped.status === "KHONG_LIEN_QUAN_CAN_HO",
      },
    });

    if (!alreadyReviewed) {
      await prisma.ungVienKhopGiaoDich.deleteMany({
        where: { ket_qua_parse_giao_dich_id: parse.id },
      });
    }
    if (!alreadyReviewed && suggestionCandidates.length) {
      await prisma.ungVienKhopGiaoDich.createMany({
        data: suggestionCandidates.map((candidate, index) => ({
          ket_qua_parse_giao_dich_id: parse.id,
          ma_can: candidate.code,
          diem: String(candidate.score),
          ly_do: candidate.reason,
          thu_hang: candidate.rank || index + 1,
        })),
      });
    }

    if (!currentReview) {
      await prisma.duyetGiaoDich.create({
        data: {
          giao_dich_ngan_hang_id: dbTransaction.id,
          trang_thai_duyet: "CHUA_DUYET",
          ma_can_duoc_chon: mapped.matchedCode,
          ghi_chu_duyet: mapped.reason,
        },
      });
      summary.reviewRowsCreated += 1;
    } else if (!alreadyReviewed) {
      await prisma.duyetGiaoDich.update({
        where: { id: currentReview.id },
        data: {
          ma_can_duoc_chon: mapped.matchedCode,
          ghi_chu_duyet: mapped.reason,
        },
      });
      await prisma.giaoDichNganHang.update({
        where: { id: dbTransaction.id },
        data: {
          ma_can_duoc_chon: mapped.matchedCode,
          ghi_chu_duyet: mapped.reason,
        },
      });
    }

    if (!alreadyReviewed) {
      await prisma.phanBoGiaoDich.deleteMany({
        where: { giao_dich_ngan_hang_id: dbTransaction.id },
      });
    }
    const matchedApartmentId = mapped.matchedCode ? apartmentIdByCode.get(mapped.matchedCode) : null;
    if (
      !alreadyReviewed &&
      matchedApartmentId &&
      transaction.amount > 0 &&
      (mapped.status === "KHOP_TRUC_TIEP" || mapped.status === "KHOP_SAU_CHUAN_HOA")
    ) {
      await prisma.phanBoGiaoDich.create({
        data: {
          giao_dich_ngan_hang_id: dbTransaction.id,
          can_ho_id: matchedApartmentId,
          so_tien_phan_bo: String(transaction.amount),
          cach_phan_bo: "MOT_CAN",
          ghi_chu: "Auto allocation từ import sao kê V2, chờ review.",
        },
      });
      summary.allocationsCreated += 1;
    }
  }

  await prisma.loNhapDuLieu.update({
    where: { id: batch.id },
    data: {
      trang_thai: "HOAN_TAT",
      tong_quan_loi: JSON.stringify(summary.parseStatus),
      metadata_json: {
        sourcePath: inputPath,
        sheetName,
        headerRow: headerRowNumber,
        parserVersion: APARTMENT_CODE_PARSER_VERSION,
        importCutoff: summary.importCutoff,
        summary,
      },
    },
  });

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

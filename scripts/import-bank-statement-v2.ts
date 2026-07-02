// @ts-nocheck

import path from "node:path";
import fs from "node:fs";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  APARTMENT_CODE_PARSER_VERSION,
  classifyApartmentTransaction,
  parseApartmentCode,
  suggestPartialApartmentCandidates,
} from "../src/modules/transactions/parser/apartment-parser";
import {
  fileHash,
  readStatementRows,
  resolveExistingInputArg,
  statementReferenceTokens,
  transactionFingerprint,
  transactionStableFingerprint,
} from "../src/modules/transactions/import/bank-statement-common";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in .env");
}

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

const existingBankTransactionSelect = {
  id: true,
  trang_thai_duyet: true,
  ma_can_duoc_chon: true,
  ma_can_parse: true,
  phien_ban_parser: true,
  payload_goc_json: true,
};

async function findExistingBankTransaction(tx, transaction, fingerprint) {
  const transactionId = transaction.transactionId?.trim();
  if (transactionId) {
    const byReference = await tx.giaoDichNganHang.findUnique({
      where: { tham_chieu_ngan_hang: transactionId },
      select: existingBankTransactionSelect,
    });
    if (byReference) return byReference;
  }

  const byFingerprint = await tx.giaoDichNganHang.findUnique({
    where: { van_tay_giao_dich: fingerprint },
    select: existingBankTransactionSelect,
  });
  if (byFingerprint) return byFingerprint;

  if (transaction.transactionDate && transaction.description) {
    const exactDuplicate = await tx.giaoDichNganHang.findFirst({
      where: {
        ngay_giao_dich: transaction.transactionDate,
        so_tien: String(transaction.amount),
        noi_dung_goc: transaction.description,
        tai_khoan_nguoi_chuyen: transaction.senderAccount || null,
      },
      orderBy: { id: "asc" },
      select: existingBankTransactionSelect,
    });
    if (exactDuplicate) return exactDuplicate;
  }

  const referenceTokens = statementReferenceTokens(transaction).filter((token) => token !== transactionId);
  if (transaction.transactionDate && referenceTokens.length) {
    const tokenMatchedDuplicate = await tx.giaoDichNganHang.findFirst({
      where: {
        ngay_giao_dich: transaction.transactionDate,
        so_tien: String(transaction.amount),
        tai_khoan_nguoi_chuyen: transaction.senderAccount || null,
        tham_chieu_ngan_hang: { in: referenceTokens },
      },
      orderBy: { id: "asc" },
      select: existingBankTransactionSelect,
    });
    if (tokenMatchedDuplicate) return tokenMatchedDuplicate;
  }

  return null;
}

async function main() {
  const { inputPath, rest } = resolveExistingInputArg("");
  if (!inputPath) {
    throw new Error("Missing bank statement input path");
  }
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const { sheetName, headerRowNumber, records } = readStatementRows(resolvedPath);
  const importCutoff = await resolveImportCutoff(rest);
  const validApartments = await prisma.canHo.findMany({ select: { id: true, ma_can: true } });
  const validCodes = new Set(validApartments.map((item) => item.ma_can));
  const apartmentIdByCode = new Map(validApartments.map((item) => [item.ma_can, item.id]));

  const sourceFileHash = fileHash(resolvedPath);
  const summary = await prisma.$transaction(async (tx) => {
    const batch = await tx.loNhapDuLieu.create({
      data: {
        loai_nguon: "SAO_KE_NGAN_HANG",
        ten_file: path.basename(resolvedPath),
        ma_bam_file: sourceFileHash,
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

    const result = {
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
      parserConflictRows: 0,
      parserVersion: APARTMENT_CODE_PARSER_VERSION,
      importCutoff: {
        source: importCutoff.source,
        cutoffAt: importCutoff.cutoff?.toISOString() || null,
        closingId: importCutoff.closingId,
        closingPeriod: importCutoff.closingPeriod,
      },
    };

    for (const record of records) {
    const rawRow = await tx.dongSaoKeTho.create({
      data: {
        lo_nhap_du_lieu_id: batch.id,
        so_dong_nguon: record.sourceRowIndex,
        header_values_json: record.headers,
        values_json: record.values,
        mapped_row_json: record.mappedRow,
        payload_json: { sheetName, sourceFile: inputPath },
      },
    });
    result.rawRowsInserted += 1;

    const transaction = record.transaction;
    const fingerprint = transactionFingerprint(transaction);
    const stableFingerprint = transactionStableFingerprint(transaction);
    const parseResult = parseApartmentCode(transaction.description);
    const normalizedDescription = parseResult.normalizedDescription;

    await tx.giaoDichSaoKeThoChuan.upsert({
      where: transaction.transactionId
        ? { tham_chieu_ngan_hang: transaction.transactionId }
        : { van_tay_giao_dich: fingerprint },
      update: {
        lo_nhap_du_lieu_id: batch.id,
        ma_bam_file: sourceFileHash,
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
        ma_bam_file: sourceFileHash,
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
      result.skippedExpenseRows += 1;
      continue;
    }

    result.incomeRows += 1;
    if (!transaction.transactionDate) {
      result.missingTransactionDateRows += 1;
    }
    if (importCutoff.cutoff && transaction.transactionDate && transaction.transactionDate <= importCutoff.cutoff) {
      result.skippedBeforeOrAtClosingRows += 1;
      continue;
    }

    const mapped = classifyApartmentTransaction(transaction, validCodes, parseResult);
    const suggestionCandidates =
      parseResult.candidates.length > 0
        ? parseResult.candidates.map((candidate, index) => ({
            code: candidate.code,
            score: candidate.score,
            reason: candidate.reason,
            rank: index + 1,
          }))
        : suggestPartialApartmentCandidates(transaction.description, validApartments);
    result.parseStatus[mapped.status] = (result.parseStatus[mapped.status] || 0) + 1;

    const existingTransaction = await findExistingBankTransaction(tx, transaction, fingerprint);

    const existingReviewed =
      existingTransaction &&
      ["DA_DUYET", "DA_RA_SOAT", "BAO_LUU", "TU_CHOI"].includes(existingTransaction.trang_thai_duyet);
    const previousChosenCode = existingTransaction?.ma_can_duoc_chon || existingTransaction?.ma_can_parse || null;
    const parserConflict =
      Boolean(existingReviewed) &&
      Boolean(previousChosenCode) &&
      Boolean(mapped.matchedCode) &&
      previousChosenCode !== mapped.matchedCode;
    if (parserConflict) result.parserConflictRows += 1;
    const previousPayload =
      existingTransaction?.payload_goc_json && typeof existingTransaction.payload_goc_json === "object"
        ? existingTransaction.payload_goc_json
        : {};

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
        stableFingerprint,
        referenceTokens: statementReferenceTokens(transaction),
      },
      phien_ban_parser: APARTMENT_CODE_PARSER_VERSION,
      ma_can_parse: mapped.matchedCode,
      trang_thai_khop: mapped.status,
      ly_do_khop: mapped.reason,
      do_tin_cay: String(mapped.confidence),
      la_giao_dich_noi_bo: mapped.status === "KHONG_LIEN_QUAN_CAN_HO",
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
      do_tin_cay: String(mapped.confidence),
      la_giao_dich_noi_bo: mapped.status === "KHONG_LIEN_QUAN_CAN_HO",
      payload_goc_json: {
        ...previousPayload,
        rawStatementRowId: rawRow.id,
        rawRow: transaction.rawRow,
        sourceRowIndex: record.sourceRowIndex,
        stableFingerprint,
        referenceTokens: statementReferenceTokens(transaction),
        parserConflict: parserConflict
          ? {
              previousParserVersion: existingTransaction?.phien_ban_parser || null,
              currentParserVersion: APARTMENT_CODE_PARSER_VERSION,
              previousApartmentCode: previousChosenCode,
              suggestedApartmentCode: mapped.matchedCode,
              detectedAt: new Date().toISOString(),
            }
          : null,
      },
    };

    const dbTransaction = existingTransaction
      ? await tx.giaoDichNganHang.update({
          where: { id: existingTransaction.id },
          data: transactionUpdateData,
        })
      : await tx.giaoDichNganHang.create({
          data: {
            ...transactionCreateData,
            tham_chieu_ngan_hang: transaction.transactionId || null,
          },
        });
    result.transactionsUpserted += 1;

    const currentMergedReview = dbTransaction.trang_thai_duyet || "CHUA_DUYET";
    const alreadyReviewed =
      currentMergedReview === "DA_DUYET" ||
      currentMergedReview === "DA_RA_SOAT" ||
      currentMergedReview === "BAO_LUU" ||
      currentMergedReview === "TU_CHOI";

    if (!alreadyReviewed) {
      await tx.ungVienKhopGiaoDich.deleteMany({
        where: { giao_dich_ngan_hang_id: dbTransaction.id },
      });
    }
    if (!alreadyReviewed && suggestionCandidates.length) {
      await tx.ungVienKhopGiaoDich.createMany({
        data: suggestionCandidates.map((candidate, index) => ({
          giao_dich_ngan_hang_id: dbTransaction.id,
          ma_can: candidate.code,
          diem: String(candidate.score),
          ly_do: candidate.reason,
          thu_hang: candidate.rank || index + 1,
        })),
      });
    }

    if (!existingTransaction) {
      result.reviewRowsCreated += 1;
    } else if (!alreadyReviewed) {
      await tx.giaoDichNganHang.update({
        where: { id: dbTransaction.id },
        data: {
          ma_can_duoc_chon: mapped.matchedCode,
          ghi_chu_duyet: mapped.reason,
        },
      });
    }

    if (!alreadyReviewed) {
      await tx.phanBoGiaoDich.deleteMany({
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
      await tx.phanBoGiaoDich.create({
        data: {
          giao_dich_ngan_hang_id: dbTransaction.id,
          can_ho_id: matchedApartmentId,
          so_tien_phan_bo: String(transaction.amount),
          cach_phan_bo: "MOT_CAN",
          ghi_chu: "Auto allocation từ import sao kê V2, chờ review.",
        },
      });
      result.allocationsCreated += 1;
    }
    }

    await tx.loNhapDuLieu.update({
    where: { id: batch.id },
    data: {
      trang_thai: "HOAN_TAT",
      tong_quan_loi: JSON.stringify(result.parseStatus),
      metadata_json: {
        sourcePath: inputPath,
        sheetName,
        headerRow: headerRowNumber,
        parserVersion: APARTMENT_CODE_PARSER_VERSION,
        importCutoff: result.importCutoff,
        summary: result,
      },
    },
    });
    return result;
  }, { timeout: 120_000 });

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

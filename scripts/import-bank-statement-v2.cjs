#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();
const XLSX = require("xlsx");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in .env");
}

const DEFAULT_INPUT = "docs/lich-su-giao-dich(15-04-2026 09_33_29).xls";
const PARSER_VERSION = "apartment-code-parser-v0.2-script";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function safeString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function removeVietnameseDiacritics(value) {
  return safeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d");
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeFreeText(value) {
  const noAccent = removeVietnameseDiacritics(value).toUpperCase();
  return normalizeWhitespace(noAccent.replace(/[._\-\\/]+/g, " ").replace(/[^A-Z0-9 ]+/g, " "));
}

function normalizeHeader(value) {
  return normalizeWhitespace(removeVietnameseDiacritics(value).toLowerCase());
}

function fileHash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function normalizeJsonValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeJsonValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeJsonValue(item)]));
  }
  return value;
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  const raw = safeString(value).replace(/[^\d-]/g, "");
  return raw ? Number(raw) : 0;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0));
  }

  const raw = safeString(value);
  const match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (!match) return null;
  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
  );
}

function rowToMappedObject(headers, values) {
  return headers.reduce((mapped, header, index) => {
    const key = safeString(header) || `__EMPTY_${index}`;
    mapped[key] = values[index] ?? "";
    return mapped;
  }, {});
}

function findHeaderRow(rows) {
  let best = { index: -1, score: 0 };
  for (let index = 0; index < Math.min(rows.length, 80); index += 1) {
    const normalized = rows[index].map(normalizeHeader);
    const score =
      normalized.some((cell) => cell.includes("ngay hach toan") || cell.includes("accounting date")) +
      normalized.some((cell) => cell.includes("mo ta giao dich") || cell.includes("transaction description")) * 3 +
      normalized.some((cell) => cell.includes("co") || cell.includes("credit")) +
      normalized.some((cell) => cell.includes("no") || cell.includes("debit"));

    if (score > best.score) best = { index, score };
  }

  if (best.index < 0 || best.score < 3) {
    throw new Error("Cannot detect bank statement header row.");
  }

  return best.index;
}

function findColumn(headers, aliases) {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((header) => aliases.some((alias) => header.includes(alias)));
}

function findDebitColumn(headers) {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((header) => header.includes("debit") || /^no\b/.test(header));
}

function findCreditColumn(headers) {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex((header) => header.includes("credit") || /^co\b/.test(header));
}

function splitNumericWordBoundaryToken(token) {
  return token
    .replace(/([0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([0-9])/g, "$1 $2")
    .split(" ")
    .filter(Boolean);
}

function normalizeApartmentCode(value) {
  const normalized = normalizeFreeText(value).replace(/\s+/g, "");
  const standardMatch = normalized.match(/^(L[1-9][A-Z]?)([1-9]\d{2}[A-Z]?)$/);
  if (standardMatch) return `${standardMatch[1]}.${standardMatch[2]}`;
  const lkMatch = normalized.match(/^(LK[1-9])([1-9]\d?)$/);
  if (lkMatch) return `${lkMatch[1]}.${lkMatch[2]}`;

  const dotted = safeString(value).toUpperCase().replace(/\s+/g, "");
  const dottedStandard = dotted.match(/^(L[1-9][A-Z]?)\.([1-9]\d{2}[A-Z]?)$/);
  if (dottedStandard) return `${dottedStandard[1]}.${dottedStandard[2]}`;
  const dottedLk = dotted.match(/^(LK[1-9])\.([1-9]\d?)$/);
  if (dottedLk) return `${dottedLk[1]}.${dottedLk[2]}`;
  const lkv = dotted.match(/^(LKV)\.([1-9]\d{0,2}[A-Z]?)$/);
  if (lkv) return `${lkv[1]}.${lkv[2]}`;

  return undefined;
}

function formatApartmentCode(block, room, prefix = "L") {
  return `${prefix}${block}.${room}`;
}

function buildCandidate(block, room, reason, score, prefix = "L") {
  const normalized = normalizeApartmentCode(formatApartmentCode(block, room, prefix));
  return normalized ? { code: normalized, reason, score } : undefined;
}

function buildLkCandidate(block, room, reason, score) {
  const normalizedBlock = block.startsWith("IK") ? `LK${block.slice(2)}` : block;
  const normalized = normalizeApartmentCode(`${normalizedBlock}.${room}`);
  return normalized ? { code: normalized, reason, score } : undefined;
}

function buildCompactBlockRoomCandidate(token, reason, score) {
  if (!token.startsWith("L")) return undefined;
  const shorthandMatch = token.match(/^L([1-9])(\d{2}[A-Z])$/);
  if (shorthandMatch) {
    return buildCandidate(shorthandMatch[1], `${shorthandMatch[1]}${shorthandMatch[2]}`, reason, score - 0.01);
  }
  const body = token.slice(1);
  for (const block of [body.slice(0, 1), body.slice(0, 2)]) {
    const candidate = buildCandidate(block, body.slice(block.length), reason, score);
    if (candidate) return candidate;
  }
  return undefined;
}

function buildCompactRoomBlockCandidate(token, reason, score) {
  const lIndex = token.indexOf("L");
  if (lIndex <= 0) return undefined;
  return buildCandidate(token.slice(lIndex + 1), token.slice(0, lIndex), reason, score);
}

function parseApartmentCode(rawDescription) {
  const normalizedDescription = normalizeFreeText(rawDescription);
  const candidates = [];
  const push = (candidate) => {
    if (candidate && !candidates.some((item) => item.code === candidate.code)) candidates.push(candidate);
  };

  const block = "([1-9][A-C]?)";
  const room = "([1-9]\\d{2}[A-Z]?)";
  const lkBlockAlias = "((?:LK|IK)[1-9])";
  const lkRoom = "([1-9]\\d?)";
  const filler = "(?:CAN|CANHO|HO|TOA|TOANHA|NHA|CHUNGCU|CC|PHI|DONG|NOP|TIEN|THANG|T|QLVH|PQLCC|PHONG|P)";

  for (const match of normalizedDescription.matchAll(new RegExp(`\\bL${block}\\s+${room}(?=${filler}|\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_SPACED", 0.98));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\bL${block}\\b(?:\\s+${filler}){0,4}\\s+${room}(?=\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_FLEXIBLE", 0.96));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\bL${block}\\s*(?:P|PHONG)\\s*${room}(?=\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_PHONG_ALIAS", 0.96));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\b${room}\\s+L${block}(?=${filler}|\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[2], match[1], "ROOM_BLOCK_FLEXIBLE", 0.94));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\b${lkBlockAlias}\\s+${lkRoom}(?=\\b|[^A-Z])`, "g"))) {
    push(buildLkCandidate(match[1], match[2], "LK_BLOCK_ROOM_SPACED", 0.98));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\b${lkBlockAlias}${lkRoom}(?=\\b|[^A-Z])`, "g"))) {
    push(buildLkCandidate(match[1], match[2], "LK_BLOCK_ROOM_COMPACT", 0.96));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\b${lkRoom}\\s+${lkBlockAlias}(?=\\b|[^A-Z])`, "g"))) {
    push(buildLkCandidate(match[2], match[1], "LK_ROOM_BLOCK_SPACED", 0.95));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\b([1-9]\\d{2})\\s+LO\\s*([1-9])(?=\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[2], match[1], "ROOM_LO_ALIAS", 0.93));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\b([1-9]\\d{2})LO([1-9])(?=\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[2], match[1], "ROOM_LO_COMPACT_ALIAS", 0.94));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\b(?:CAN|CANHO|HO|PHONG|SO|NHA)?\\s*${room}\\s+(?:LO|TOA|BLOCK|BLK)\\s+${block}(?=\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[2], match[1], "ROOM_TOWER_BLOCK_ALIAS", 0.95));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\b(?:LO|TOA|BLOCK|BLK)\\s+${block}\\s+(?:CAN|CANHO|HO|PHONG|SO|NHA)?\\s*${room}(?=\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[1], match[2], "TOWER_BLOCK_ROOM_ALIAS", 0.95));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\bL${block}${room}(\\d{6,})(?=\\s+(?:NOP|PHI|QLVH|QLCC|PQLCC|DONG|CAN|CC|THANG)\\b)`, "g"))) {
    push(buildCandidate(match[1], match[2], "BLOCK_ROOM_TRAILING_DIGITS", 0.89));
  }

  for (const token of normalizedDescription.split(" ").filter(Boolean)) {
    push(buildCompactBlockRoomCandidate(token, "BLOCK_ROOM_COMPACT_TOKEN", 0.93));
    push(buildCompactRoomBlockCandidate(token, "ROOM_BLOCK_COMPACT_TOKEN", 0.92));
    for (const part of splitNumericWordBoundaryToken(token)) {
      push(buildCompactBlockRoomCandidate(part, "BLOCK_ROOM_SPLIT_TOKEN", 0.91));
      push(buildCompactRoomBlockCandidate(part, "ROOM_BLOCK_SPLIT_TOKEN", 0.9));
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  return {
    rawDescription,
    normalizedDescription,
    parsedApartmentCode: candidates[0]?.code,
    candidates,
    matchReason:
      candidates.length === 0
        ? "No apartment pattern detected"
        : candidates.length === 1
          ? candidates[0].reason
          : `Multiple candidates: ${candidates.map((item) => item.code).join(", ")}`,
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

function transactionFingerprint(transaction) {
  return crypto
    .createHash("sha256")
    .update(
      [
        transaction.transactionDate?.toISOString() || "",
        transaction.amount,
        transaction.description,
        transaction.senderAccount || "",
        transaction.transactionId || "",
      ].join("|")
    )
    .digest("hex");
}

function readStatementRows(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
  const headerIndex = findHeaderRow(rows);
  const headers = rows[headerIndex].map(safeString);
  const normalizedHeaders = headers.map(normalizeHeader);

  const dateIndex = findColumn(headers, ["ngay hach toan", "accounting date", "ngay phat sinh giao dich", "transaction date"]);
  const descriptionIndex = findColumn(headers, ["mo ta giao dich", "transaction description"]);
  const debitIndex = findDebitColumn(headers);
  const creditIndex = findCreditColumn(headers);
  const transactionIdIndex = findColumn(headers, ["so giao dich", "transaction number"]);
  const senderAccountIndex = findColumn(headers, ["so tai khoan doi ung", "corresponsive account"]);
  const senderNameIndex = findColumn(headers, ["ten tai khoan doi ung", "corresponsive name"]);

  if (descriptionIndex < 0 || (debitIndex < 0 && creditIndex < 0)) {
    throw new Error(`Cannot detect statement columns. Headers: ${headers.join(" | ")}`);
  }

  const records = [];
  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const description = safeString(row[descriptionIndex]);
    const debit = debitIndex >= 0 ? parseNumber(row[debitIndex]) : 0;
    const credit = creditIndex >= 0 ? parseNumber(row[creditIndex]) : 0;
    const amount = credit > 0 ? credit : debit > 0 ? -debit : 0;
    if (!description && !amount) return;

    const mappedRow = rowToMappedObject(headers, row);
    records.push({
      sourceRowIndex: headerIndex + 2 + offset,
      headers,
      values: normalizeJsonValue(row),
      mappedRow: normalizeJsonValue(mappedRow),
      transaction: {
        transactionDate: dateIndex >= 0 ? parseDate(row[dateIndex]) : null,
        amount,
        description,
        senderName: senderNameIndex >= 0 ? safeString(row[senderNameIndex]) : null,
        senderAccount: senderAccountIndex >= 0 ? safeString(row[senderAccountIndex]) : null,
        transactionId: transactionIdIndex >= 0 ? safeString(row[transactionIdIndex]) : null,
        rawRow: normalizeJsonValue(mappedRow),
      },
    });
  });

  return { sheetName, headerIndex: headerIndex + 1, normalizedHeaders, records };
}

async function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const { sheetName, headerIndex, records } = readStatementRows(resolvedPath);
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
        headerRow: headerIndex,
        parserVersion: PARSER_VERSION,
      },
    },
  });

  const summary = {
    batchId: batch.id,
    sourceFile: inputPath,
    rows: records.length,
    transactionsUpserted: 0,
    rawRowsInserted: 0,
    parseStatus: {},
    reviewRowsCreated: 0,
    allocationsCreated: 0,
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
    const mapped = mapStatus(transaction, parseResult, validCodes);
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

    const transactionData = {
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
      };

    const dbTransaction = existingTransaction
      ? await prisma.giaoDichNganHang.update({
          where: { id: existingTransaction.id },
          data: transactionData,
        })
      : await prisma.giaoDichNganHang.create({
          data: {
        ...transactionData,
        van_tay_giao_dich: fingerprint,
        tham_chieu_ngan_hang: transaction.transactionId || null,
          },
        });
    summary.transactionsUpserted += 1;

    const parse = await prisma.ketQuaParseGiaoDich.upsert({
      where: { giao_dich_ngan_hang_id: dbTransaction.id },
      update: {
        phien_ban_parser: PARSER_VERSION,
        ma_can_parse: mapped.matchedCode,
        trang_thai_khop: mapped.status,
        ly_do_khop: mapped.reason,
        do_tin_cay: mapped.confidence,
        la_giao_dich_noi_bo: mapped.status === "KHONG_LIEN_QUAN_CAN_HO",
      },
      create: {
        giao_dich_ngan_hang_id: dbTransaction.id,
        phien_ban_parser: PARSER_VERSION,
        ma_can_parse: mapped.matchedCode,
        trang_thai_khop: mapped.status,
        ly_do_khop: mapped.reason,
        do_tin_cay: mapped.confidence,
        la_giao_dich_noi_bo: mapped.status === "KHONG_LIEN_QUAN_CAN_HO",
      },
    });

    await prisma.ungVienKhopGiaoDich.deleteMany({
      where: { ket_qua_parse_giao_dich_id: parse.id },
    });
    if (parseResult.candidates.length) {
      await prisma.ungVienKhopGiaoDich.createMany({
        data: parseResult.candidates.map((candidate, index) => ({
          ket_qua_parse_giao_dich_id: parse.id,
          ma_can: candidate.code,
          diem: String(candidate.score),
          ly_do: candidate.reason,
          thu_hang: index + 1,
        })),
      });
    }

    await prisma.duyetGiaoDich.deleteMany({
      where: { giao_dich_ngan_hang_id: dbTransaction.id },
    });
    await prisma.duyetGiaoDich.create({
      data: {
        giao_dich_ngan_hang_id: dbTransaction.id,
        trang_thai_duyet: "CHUA_DUYET",
        ma_can_duoc_chon: mapped.matchedCode,
        ghi_chu_duyet: mapped.reason,
      },
    });
    summary.reviewRowsCreated += 1;

    await prisma.phanBoGiaoDich.deleteMany({
      where: { giao_dich_ngan_hang_id: dbTransaction.id },
    });
    const matchedApartmentId = mapped.matchedCode ? apartmentIdByCode.get(mapped.matchedCode) : null;
    if (
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
        headerRow: headerIndex,
        parserVersion: PARSER_VERSION,
        summary,
      },
    },
  });

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

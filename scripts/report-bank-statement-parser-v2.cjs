#!/usr/bin/env node

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
const DEFAULT_OUTPUT_DIR = "docs/reports";
const parserVersion = "apartment-code-parser-v0.3-report";

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

function normalizeHeader(value) {
  return normalizeWhitespace(removeVietnameseDiacritics(value).toLowerCase());
}

function normalizeFreeText(value) {
  const noAccent = removeVietnameseDiacritics(value).toUpperCase();
  return normalizeWhitespace(noAccent.replace(/[._\-\\/]+/g, " ").replace(/[^A-Z0-9 ]+/g, " "));
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
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
}

function formatDate(value) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function findHeaderRow(rows) {
  let best = { index: -1, score: 0 };
  for (let index = 0; index < Math.min(rows.length, 80); index += 1) {
    const normalized = rows[index].map(normalizeHeader);
    const score =
      Number(normalized.some((cell) => cell.includes("ngay hach toan") || cell.includes("accounting date"))) +
      Number(normalized.some((cell) => cell.includes("mo ta giao dich") || cell.includes("transaction description"))) * 3 +
      Number(normalized.some((cell) => cell.includes("co") || cell.includes("credit"))) +
      Number(normalized.some((cell) => cell.includes("no") || cell.includes("debit")));

    if (score > best.score) best = { index, score };
  }

  if (best.index < 0 || best.score < 3) {
    throw new Error("Không nhận diện được dòng tiêu đề của file sao kê.");
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

function splitNumericWordBoundaryToken(token) {
  return token
    .replace(/([0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([0-9])/g, "$1 $2")
    .split(" ")
    .filter(Boolean);
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
  for (const match of normalizedDescription.matchAll(new RegExp(`\\b${room}(?:LO|TOA|BLOCK|BLK)${block}(?=\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[2], match[1], "ROOM_TOWER_BLOCK_COMPACT_ALIAS", 0.94));
  }
  for (const match of normalizedDescription.matchAll(new RegExp(`\\bL${block}\\b(?:\\s+(?:SO|NHA|SO NHA)){1,2}\\s+${room}(?=\\b|[^A-Z])`, "g"))) {
    push(buildCandidate(match[1], match[2], "BLOCK_SO_NHA_ROOM", 0.95));
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

  const filtered = candidates.filter((candidate) => {
    const [candidateBlock, candidateRoom] = candidate.code.split(".");
    if (candidateBlock.startsWith("LK")) return true;
    if (candidate.reason.startsWith("ROOM_BLOCK")) {
      const strongerSameRoomCandidate = candidates.find((other) => {
        if (other.code === candidate.code || !other.reason.startsWith("BLOCK_ROOM")) return false;
        const [, otherRoom] = other.code.split(".");
        return otherRoom === candidateRoom && other.score >= candidate.score;
      });
      if (strongerSameRoomCandidate) return false;
    }

    const exactWithSuffix = candidates.find((other) => {
      if (other.code === candidate.code) return false;
      const [otherBlock, otherRoom] = other.code.split(".");
      return (
        (candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}A`) ||
        (candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}B`) ||
        (candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}C`) ||
        (candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}D`) ||
        (candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}E`) ||
        (candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom === `${candidateRoom}F`) ||
        (candidateRoom.length === 3 && candidateBlock === otherBlock && otherRoom.length === 4 && otherRoom.startsWith(candidateRoom))
      );
    });

    return !exactWithSuffix;
  });

  filtered.sort((left, right) => right.score - left.score);
  return {
    rawDescription,
    normalizedDescription,
    parsedApartmentCode: filtered[0]?.code,
    candidates: filtered,
    matchReason:
      filtered.length === 0
        ? "Không nhận diện được mã căn"
        : filtered.length === 1
          ? filtered[0].reason
          : `Nhiều căn ứng viên: ${filtered.map((item) => item.code).join(", ")}`,
  };
}

function readStatementWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
  const headerIndex = findHeaderRow(rows);
  const headers = rows[headerIndex].map(safeString);
  const dateIndex = findColumn(headers, ["ngay hach toan", "accounting date", "ngay phat sinh giao dich", "transaction date"]);
  const descriptionIndex = findColumn(headers, ["mo ta giao dich", "transaction description"]);
  const debitIndex = findDebitColumn(headers);
  const creditIndex = findCreditColumn(headers);
  const transactionIdIndex = findColumn(headers, ["so giao dich", "transaction number"]);
  const senderAccountIndex = findColumn(headers, ["so tai khoan doi ung", "corresponsive account"]);
  const senderNameIndex = findColumn(headers, ["ten tai khoan doi ung", "corresponsive name"]);

  if (descriptionIndex < 0 || (debitIndex < 0 && creditIndex < 0)) {
    throw new Error(`Không nhận diện được cột nội dung hoặc số tiền. Headers: ${headers.join(" | ")}`);
  }

  const records = [];
  rows.slice(headerIndex + 1).forEach((row, offset) => {
    const description = safeString(row[descriptionIndex]);
    const debit = debitIndex >= 0 ? parseNumber(row[debitIndex]) : 0;
    const credit = creditIndex >= 0 ? parseNumber(row[creditIndex]) : 0;
    const amount = credit > 0 ? credit : debit > 0 ? -debit : 0;
    if (!description && !amount) return;

    records.push({
      sourceRowIndex: headerIndex + 2 + offset,
      row,
      transactionDate: dateIndex >= 0 ? parseDate(row[dateIndex]) : null,
      amount,
      description,
      senderName: senderNameIndex >= 0 ? safeString(row[senderNameIndex]) : "",
      senderAccount: senderAccountIndex >= 0 ? safeString(row[senderAccountIndex]) : "",
      transactionId: transactionIdIndex >= 0 ? safeString(row[transactionIdIndex]) : "",
    });
  });

  return { workbook, sheetName, rows, headerIndex, headers, descriptionIndex, records };
}

function publicPayload(payload) {
  return payload && typeof payload === "object" ? payload : {};
}

function paidThroughInfo(status) {
  if (!status) return {};
  const payload = publicPayload(status.payload_public_json);
  return publicPayload(payload.paidThrough);
}

function feePerMonth(apartmentType) {
  if (apartmentType === "LIEN_KE") return 200000;
  if (apartmentType === "CHUNG_CU") return 250000;
  return null;
}

function buildCheckNote({ status, apartment, feeStatus, amount }) {
  if (status === "KHONG_NHAN_DIEN") return "Không nhận diện được căn từ nội dung.";
  if (status === "NHIEU_CAN") return "Có nhiều căn ứng viên, cần kiểm tra bằng mắt.";
  if (status === "MA_CAN_KHONG_TON_TAI") return "Parser ra mã căn nhưng không có trong bảng căn hộ.";
  if (!feeStatus) return "Có căn parser nhưng chưa có dòng trong lịch sử thu phí T5.";
  if (amount <= 0) return "Giao dịch không phải tiền vào, chỉ dùng để kiểm tra nội dung.";

  const monthlyFee = feePerMonth(apartment?.loai_can);
  const paidInfo = paidThroughInfo(feeStatus);
  const numericMonth = typeof paidInfo.numericMonth === "number" ? paidInfo.numericMonth : null;
  const equivalentMonths = monthlyFee ? amount / monthlyFee : null;

  if (equivalentMonths && Number.isInteger(equivalentMonths) && equivalentMonths === 6 && numericMonth !== null && numericMonth < 10) {
    return "Cần kiểm tra: sao kê có khoản tương đương 6 tháng nhưng T5 chưa thể hiện đã đóng đến tháng 10.";
  }
  if (publicPayload(feeStatus.payload_public_json).isPartialPayment) {
    return "Lịch sử thu phí T5 đang đánh dấu căn này đóng lẻ tiền.";
  }
  return "Có căn parser và có dữ liệu trong lịch sử thu phí T5.";
}

async function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) throw new Error(`File not found: ${resolvedPath}`);

  const outputDir = path.resolve(process.cwd(), process.argv[3] || DEFAULT_OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  const statement = readStatementWorkbook(resolvedPath);
  const [apartments, currentBatch] = await Promise.all([
    prisma.canHo.findMany({
      select: { id: true, ma_can: true, loai_can: true, chu_ho_ten_goc: true },
    }),
    prisma.batchTrangThaiPhiPublic.findFirst({
      where: { la_batch_public_hien_hanh: true },
      orderBy: { public_luc: "desc" },
      select: { id: true, ky_du_lieu: true, ten_file_nguon: true },
    }),
  ]);

  if (!currentBatch) throw new Error("Chưa có batch thu phí công khai hiện hành để đối chiếu.");

  const feeStatuses = await prisma.trangThaiPhiCanHoPublic.findMany({
    where: { batch_id: currentBatch.id },
    select: {
      ma_can: true,
      thang_da_dong_den_hien_tai: true,
      payload_public_json: true,
    },
  });

  const apartmentByCode = new Map(apartments.map((item) => [item.ma_can, item]));
  const feeStatusByCode = new Map(feeStatuses.map((item) => [item.ma_can, item]));

  const detailRows = [];
  const amountByApartment = new Map();

  for (const record of statement.records) {
    const parse = parseApartmentCode(record.description);
    const uniqueCandidates = [...new Set(parse.candidates.map((item) => item.code))];
    const matchedCode = uniqueCandidates.length === 1 ? uniqueCandidates[0] : parse.parsedApartmentCode || "";
    const apartment = matchedCode ? apartmentByCode.get(matchedCode) : null;
    const feeStatus = matchedCode ? feeStatusByCode.get(matchedCode) : null;
    const isValid = Boolean(apartment);
    const status =
      uniqueCandidates.length > 1
        ? "NHIEU_CAN"
        : matchedCode && isValid
          ? "NHAN_DIEN_DUOC_CAN"
          : matchedCode
            ? "MA_CAN_KHONG_TON_TAI"
            : "KHONG_NHAN_DIEN";
    const publicText =
      publicPayload(feeStatus?.payload_public_json).publicDisplayText ||
      feeStatus?.thang_da_dong_den_hien_tai ||
      "";
    const checkNote = buildCheckNote({ status, apartment, feeStatus, amount: record.amount });
    const monthlyFee = feePerMonth(apartment?.loai_can);
    const equivalentMonths = monthlyFee && record.amount > 0 ? record.amount / monthlyFee : null;

    if (matchedCode && isValid && record.amount > 0) {
      amountByApartment.set(matchedCode, (amountByApartment.get(matchedCode) || 0) + record.amount);
    }

    detailRows.push({
      "Dòng Excel": record.sourceRowIndex,
      "Ngày": formatDate(record.transactionDate),
      "Số tiền": record.amount,
      "Nội dung": record.description,
      "Căn parser": matchedCode,
      "Trạng thái parser": status,
      "Ứng viên": uniqueCandidates.join(", "),
      "Lý do parser": parse.matchReason,
      "Loại căn": apartment?.loai_can || "",
      "Chủ hộ gốc": apartment?.chu_ho_ten_goc || "",
      "Tương đương số tháng": equivalentMonths === null ? "" : Number(equivalentMonths.toFixed(2)),
      "Trạng thái thu phí T5": publicText,
      "Đối chiếu gợi ý": checkNote,
      "Người chuyển": record.senderName,
      "TK đối ứng": record.senderAccount,
      "Mã giao dịch": record.transactionId,
    });
  }

  const summary = {
    sourceFile: inputPath,
    parserVersion,
    currentFeeBatchId: currentBatch.id,
    currentFeePeriod: currentBatch.ky_du_lieu,
    totalRows: detailRows.length,
    incomeRows: detailRows.filter((row) => row["Số tiền"] > 0).length,
    parsedValidRows: detailRows.filter((row) => row["Trạng thái parser"] === "NHAN_DIEN_DUOC_CAN").length,
    multiCandidateRows: detailRows.filter((row) => row["Trạng thái parser"] === "NHIEU_CAN").length,
    invalidApartmentRows: detailRows.filter((row) => row["Trạng thái parser"] === "MA_CAN_KHONG_TON_TAI").length,
    unparsedRows: detailRows.filter((row) => row["Trạng thái parser"] === "KHONG_NHAN_DIEN").length,
    uniqueParsedApartments: amountByApartment.size,
    totalParsedIncomeAmount: [...amountByApartment.values()].reduce((sum, amount) => sum + amount, 0),
    needsVisualReviewRows: detailRows.filter((row) => row["Đối chiếu gợi ý"].startsWith("Cần kiểm tra") || row["Trạng thái parser"] !== "NHAN_DIEN_DUOC_CAN").length,
  };

  const annotatedRows = statement.rows.map((row, index) => {
    const copy = [...row];
    if (index === statement.headerIndex) {
      copy.splice(statement.descriptionIndex + 1, 0, "Căn parser");
      return copy;
    }
    const record = statement.records.find((item) => item.sourceRowIndex === index + 1);
    if (!record) {
      copy.splice(statement.descriptionIndex + 1, 0, "");
      return copy;
    }
    const detail = detailRows.find((item) => item["Dòng Excel"] === record.sourceRowIndex);
    const parserText = detail
      ? [
          detail["Căn parser"] || detail["Trạng thái parser"],
          detail["Trạng thái thu phí T5"] ? `T5: ${detail["Trạng thái thu phí T5"]}` : "",
          detail["Đối chiếu gợi ý"],
        ]
          .filter(Boolean)
          .join(" | ")
      : "";
    copy.splice(statement.descriptionIndex + 1, 0, parserText);
    return copy;
  });

  const baseName = path.basename(resolvedPath, path.extname(resolvedPath)).replace(/[^\p{L}\p{N}_-]+/gu, "-");
  const outputXlsx = path.join(outputDir, `${baseName}-parser-doi-chieu.xlsx`);
  const outputJson = path.join(outputDir, `${baseName}-parser-summary.json`);
  const outputCsv = path.join(outputDir, `${baseName}-can-kiem-tra.csv`);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(annotatedRows), "Sao ke co parser");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { "Chỉ số": "File sao kê", "Giá trị": inputPath },
      { "Chỉ số": "Batch thu phí đối chiếu", "Giá trị": `${currentBatch.ky_du_lieu} (#${currentBatch.id})` },
      { "Chỉ số": "Tổng dòng giao dịch", "Giá trị": summary.totalRows },
      { "Chỉ số": "Dòng tiền vào", "Giá trị": summary.incomeRows },
      { "Chỉ số": "Dòng nhận diện được căn", "Giá trị": summary.parsedValidRows },
      { "Chỉ số": "Dòng nhiều căn ứng viên", "Giá trị": summary.multiCandidateRows },
      { "Chỉ số": "Dòng mã căn không tồn tại", "Giá trị": summary.invalidApartmentRows },
      { "Chỉ số": "Dòng không nhận diện căn", "Giá trị": summary.unparsedRows },
      { "Chỉ số": "Số căn nhận diện duy nhất", "Giá trị": summary.uniqueParsedApartments },
      { "Chỉ số": "Tổng tiền vào đã nhận diện căn", "Giá trị": formatMoney(summary.totalParsedIncomeAmount) },
      { "Chỉ số": "Dòng cần kiểm tra bằng mắt", "Giá trị": summary.needsVisualReviewRows },
    ]),
    "Tong hop"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows), "Chi tiet parser");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      detailRows.filter((row) => row["Đối chiếu gợi ý"].startsWith("Cần kiểm tra") || row["Trạng thái parser"] !== "NHAN_DIEN_DUOC_CAN")
    ),
    "Can kiem tra"
  );
  XLSX.writeFile(workbook, outputXlsx);

  fs.writeFileSync(outputJson, JSON.stringify(summary, null, 2), "utf8");
  const reviewRows = detailRows.filter((row) => row["Đối chiếu gợi ý"].startsWith("Cần kiểm tra") || row["Trạng thái parser"] !== "NHAN_DIEN_DUOC_CAN");
  fs.writeFileSync(outputCsv, XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(reviewRows)), "utf8");

  console.log(JSON.stringify({ ...summary, outputXlsx, outputJson, outputCsv }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


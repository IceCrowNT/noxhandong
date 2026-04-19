#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
const XLSX = require("xlsx");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong .env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MANAGEMENT_SHEET_NAMES = {
  customers: "Danh sách khách hàng",
  paymentHistory: "Lịch sử đóng phí",
  misc: [
    "Sheet1",
    "Khách ck nhầm vào tk An Điền",
    "Khách nộp bổ sung nợ vàoAn Điền",
  ],
};

function detectRowType(sheetName) {
  if (sheetName === MANAGEMENT_SHEET_NAMES.customers) {
    return "CUSTOMER";
  }

  if (sheetName === MANAGEMENT_SHEET_NAMES.paymentHistory) {
    return "FEE_HISTORY";
  }

  return "OTHER";
}

function readWorkbookRows(filePath) {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const rows = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }

    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
      raw: true,
    });

    matrix.forEach((row, index) => {
      const hasAnyValue = Array.isArray(row)
        ? row.some((cell) => cell !== "" && cell !== null && cell !== undefined)
        : false;

      if (!hasAnyValue) {
        return;
      }

      rows.push({
        sheetName,
        rowIndex: index + 1,
        rowType: detectRowType(sheetName),
        payload: {
          values: row,
        },
      });
    });
  }

  return {
    workbookSheetNames: workbook.SheetNames,
    rows,
  };
}

async function main() {
  const inputPath = process.argv[2] || "docs/Theo dõi thu phí T4.xlsx";
  const resolvedPath = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Không tìm thấy file: ${resolvedPath}`);
  }

  const fileBuffer = fs.readFileSync(resolvedPath);
  const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const { workbookSheetNames, rows } = readWorkbookRows(resolvedPath);

  const batch = await prisma.importBatch.create({
    data: {
      sourceType: "MANAGEMENT_WORKBOOK",
      fileName: path.basename(resolvedPath),
      fileHash,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      rowCount: rows.length,
      status: "PENDING",
      metadata: {
        workbookSheetNames,
        importKind: "raw_management_rows",
      },
    },
  });

  if (rows.length > 0) {
    await prisma.rawManagementRow.createMany({
      data: rows.map((row) => ({
        batchId: batch.id,
        sheetName: row.sheetName,
        rowIndex: row.rowIndex,
        rowType: row.rowType,
        payload: row.payload,
      })),
    });
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: "COMPLETED",
    },
  });

  const grouped = rows.reduce((accumulator, row) => {
    accumulator[row.sheetName] = (accumulator[row.sheetName] || 0) + 1;
    return accumulator;
  }, {});

  console.log(JSON.stringify({
    batchId: batch.id,
    fileName: path.basename(resolvedPath),
    rowCount: rows.length,
    sheets: workbookSheetNames,
    countsBySheet: grouped,
  }, null, 2));
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

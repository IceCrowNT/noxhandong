import path from "node:path";
import XLSX from "xlsx";
import { parseApartmentCode } from "../src/modules/transactions/parser/apartment-parser";
import {
  findColumn,
  findHeaderRow,
} from "../src/modules/transactions/import/bank-statement-common";

function parserDisplay(description: unknown) {
  const result = parseApartmentCode(String(description ?? ""));
  const codes = [...new Set(result.candidates.map((candidate) => candidate.code))];
  return codes.length > 0 ? codes.join(", ") : "Không nhận diện";
}

function shiftedMerge(merge: XLSX.Range, insertedColumnIndex: number): XLSX.Range {
  const shifted = {
    s: { ...merge.s },
    e: { ...merge.e }
  };

  if (shifted.s.c >= insertedColumnIndex) {
    shifted.s.c += 1;
  }
  if (shifted.e.c >= insertedColumnIndex) {
    shifted.e.c += 1;
  }

  return shifted;
}

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("Cần truyền đường dẫn file sao kê đầu vào.");
}

const parsedPath = path.parse(inputPath);
const outputPath = process.argv[3]
  ?? path.join(parsedPath.dir, `${parsedPath.name}-co-ket-qua-parser.xlsx`);

const workbook = XLSX.readFile(inputPath, { cellDates: true });
const sheetName = workbook.SheetNames[0];
const sourceSheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json<unknown[]>(sourceSheet, {
  header: 1,
  blankrows: true,
  defval: ""
});

const headerIndex = findHeaderRow(rows);
if (headerIndex < 0) {
  throw new Error("Không tìm thấy dòng tiêu đề sao kê.");
}

const headers = rows[headerIndex].map((value) => String(value ?? "").trim());
const descriptionIndex = findColumn(headers, ["mo ta giao dich", "transaction description"]);
if (descriptionIndex < 0) {
  throw new Error("Không tìm thấy cột nội dung chuyển khoản.");
}

const parserColumnIndex = descriptionIndex + 1;
let recognizedCount = 0;
let unrecognizedCount = 0;

const outputRows = rows.map((sourceRow, rowIndex) => {
  const row = [...sourceRow];
  let value: unknown = "";

  if (rowIndex === headerIndex) {
    value = "Kết quả parser căn hộ";
  } else if (rowIndex > headerIndex && String(row[descriptionIndex] ?? "").trim()) {
    value = parserDisplay(row[descriptionIndex]);
    if (value === "Không nhận diện") {
      unrecognizedCount += 1;
    } else {
      recognizedCount += 1;
    }
  }

  row.splice(parserColumnIndex, 0, value);
  return row;
});

const outputSheet = XLSX.utils.aoa_to_sheet(outputRows, { cellDates: true });
outputSheet["!merges"] = (sourceSheet["!merges"] ?? [])
  .map((merge) => shiftedMerge(merge, parserColumnIndex));
outputSheet["!rows"] = sourceSheet["!rows"];

const sourceColumns = sourceSheet["!cols"] ?? [];
outputSheet["!cols"] = [
  ...sourceColumns.slice(0, parserColumnIndex),
  { wch: 26 },
  ...sourceColumns.slice(parserColumnIndex)
];

workbook.Sheets[sheetName] = outputSheet;
XLSX.writeFile(workbook, outputPath);

console.log(JSON.stringify({
  inputPath,
  outputPath,
  sheetName,
  headerRow: headerIndex + 1,
  descriptionColumn: descriptionIndex + 1,
  parserColumn: parserColumnIndex + 1,
  recognizedCount,
  unrecognizedCount
}, null, 2));

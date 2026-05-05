#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const inputPath = process.argv[2] || "docs/Danh_Sach_Can_Ho_Master.xlsx";
const resolvedPath = path.resolve(process.cwd(), inputPath);
const outDir = path.resolve(process.cwd(), "docs/preview-master-lien-he-can-ho");
const sheetName = "MASTER DATA";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function normalizePhone(value) {
  const digits = safeString(value).replace(/\D/g, "");
  if (digits.length === 10) {
    return digits;
  }
  return "";
}

function isCleanName(value) {
  const text = safeString(value);
  if (!text) {
    return false;
  }

  return !/\d/.test(text);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, rows) {
  fs.writeFileSync(filePath, rows.map((row) => row.map(csvEscape).join(",")).join("\n"));
}

function classifyRow(source) {
  const reasons = [];

  if (source.trangThaiSuDung && source.trangThaiSuDung !== "Chủ Hộ") {
    reasons.push("TRANG_THAI_BIEN_DONG");
  }

  if (source.tenChuHoGoc && source.nguoiSuDung1 && source.tenChuHoGoc !== source.nguoiSuDung1) {
    reasons.push("CHU_HO_KHAC_NGUOI_SD1");
  }

  for (let index = 1; index <= 5; index += 1) {
    const name = source[`nguoiSuDung${index}`];
    const phone = source[`sdt${index}`];

    if (name && !isCleanName(name)) {
      reasons.push(`TEN_${index}_CHUA_SO_HOAC_GHI_CHU`);
    }

    if (phone && !name) {
      reasons.push(`SDT_${index}_KHONG_CO_TEN`);
    }
  }

  return reasons.length === 0 ? { deXuatXuLy: "NHAP_THANG", reasons: [] } : { deXuatXuLy: "CAN_RA_SOAT", reasons };
}

function buildParsedContacts(source, deXuatXuLy) {
  const contacts = [];

  const ownerIsUser1 = source.tenChuHoGoc && source.tenChuHoGoc === source.nguoiSuDung1;
  if (source.tenChuHoGoc) {
    contacts.push({
      tenHienThiParse: source.tenChuHoGoc,
      soDienThoaiParse: ownerIsUser1 ? normalizePhone(source.sdt1) : "",
      laLienHeChinhDuDoan: true
    });
  }

  for (let index = 1; index <= 5; index += 1) {
    const name = source[`nguoiSuDung${index}`];
    const phone = normalizePhone(source[`sdt${index}`]);

    if (!name && !phone) {
      continue;
    }

    if (ownerIsUser1 && index === 1 && name === source.tenChuHoGoc) {
      continue;
    }

    contacts.push({
      tenHienThiParse: name,
      soDienThoaiParse: phone,
      laLienHeChinhDuDoan: false
    });
  }

  if (contacts.length === 0) {
    contacts.push({
      tenHienThiParse: source.tenChuHoGoc,
      soDienThoaiParse: "",
      laLienHeChinhDuDoan: true
    });
  }

  return contacts.map((contact, index) => ({
    thuTu: index + 1,
    ...contact,
    deXuatXuLy
  }));
}

function main() {
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Không tìm thấy file: ${resolvedPath}`);
  }

  ensureDir(outDir);

  const workbook = XLSX.readFile(resolvedPath);
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Không tìm thấy sheet "${sheetName}" trong file ${resolvedPath}`);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });

  const header = [
    "dong_excel",
    "ma_can",
    "trang_thai_su_dung",
    "ten_chu_ho_goc",
    "nguoi_su_dung_1_goc",
    "sdt_1_goc",
    "nguoi_su_dung_2_goc",
    "sdt_2_goc",
    "nguoi_su_dung_3_goc",
    "sdt_3_goc",
    "nguoi_su_dung_4_goc",
    "sdt_4_goc",
    "nguoi_su_dung_5_goc",
    "sdt_5_goc",
    "thong_tin_phu_goc",
    "ghi_chu_goc",
    "thu_tu",
    "ten_hien_thi_parse",
    "so_dien_thoai_parse",
    "la_lien_he_chinh_du_doan",
    "de_xuat_xu_ly",
    "ly_do_ra_soat"
  ];

  const allRows = [header];
  const nhapThangRows = [header];
  const canRaSoatRows = [header];

  let nhapThangApartments = 0;
  let canRaSoatApartments = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const source = {
      dongExcel: index + 2,
      maCan: safeString(row["Mã Căn Hộ"]),
      trangThaiSuDung: safeString(row["Trạng Thái Sử Dụng (Auto)"]),
      tenChuHoGoc: safeString(row["Chủ Hộ (Tên)"]),
      nguoiSuDung1: safeString(row["Người sử dụng 1"]),
      sdt1: safeString(row["SĐT 1"]),
      nguoiSuDung2: safeString(row["Người sử dụng 2"]),
      sdt2: safeString(row["SĐT 2"]),
      nguoiSuDung3: safeString(row["Người sử dụng 3"]),
      sdt3: safeString(row["SĐT 3"]),
      nguoiSuDung4: safeString(row["Người sử dụng 4"]),
      sdt4: safeString(row["SĐT 4"]),
      nguoiSuDung5: safeString(row["Người sử dụng 5"]),
      sdt5: safeString(row["SĐT 5"]),
      thongTinPhuGoc: safeString(row["Thông tin phụ (Khách thuê/Chuyển nhượng)"]),
      ghiChuGoc: safeString(row["Ghi chú"])
    };

    const { deXuatXuLy, reasons } = classifyRow(source);
    const parsedContacts = buildParsedContacts(source, deXuatXuLy);

    if (deXuatXuLy === "NHAP_THANG") {
      nhapThangApartments += 1;
    } else {
      canRaSoatApartments += 1;
    }

    for (const contact of parsedContacts) {
      const outputRow = [
        source.dongExcel,
        source.maCan,
        source.trangThaiSuDung,
        source.tenChuHoGoc,
        source.nguoiSuDung1,
        source.sdt1,
        source.nguoiSuDung2,
        source.sdt2,
        source.nguoiSuDung3,
        source.sdt3,
        source.nguoiSuDung4,
        source.sdt4,
        source.nguoiSuDung5,
        source.sdt5,
        source.thongTinPhuGoc,
        source.ghiChuGoc,
        contact.thuTu,
        contact.tenHienThiParse,
        contact.soDienThoaiParse,
        contact.laLienHeChinhDuDoan ? "true" : "false",
        contact.deXuatXuLy,
        reasons.join(" | ")
      ];

      allRows.push(outputRow);

      if (deXuatXuLy === "NHAP_THANG") {
        nhapThangRows.push(outputRow);
      } else {
        canRaSoatRows.push(outputRow);
      }
    }
  }

  writeCsv(path.join(outDir, "preview-tong-hop.csv"), allRows);
  writeCsv(path.join(outDir, "nhap-thang.csv"), nhapThangRows);
  writeCsv(path.join(outDir, "can-ra-soat.csv"), canRaSoatRows);

  const readme = [
    "# Preview parse liên hệ từ file master mới",
    "",
    `- File nguồn: \`${path.basename(resolvedPath)}\``,
    `- Sheet: \`${sheetName}\``,
    `- Tổng căn: \`${rows.length}\``,
    `- NHAP_THANG: \`${nhapThangApartments}\` căn`,
    `- CAN_RA_SOAT: \`${canRaSoatApartments}\` căn`,
    `- Tổng dòng contact preview: \`${allRows.length - 1}\``,
    "",
    "## File kết quả",
    "",
    "- `preview-tong-hop.csv`",
    "- `nhap-thang.csv`",
    "- `can-ra-soat.csv`",
    "",
    "## Cách dùng",
    "",
    "1. Mở `nhap-thang.csv` để xem các dòng parser có thể nhập tương đối thẳng.",
    "2. Mở `can-ra-soat.csv` để xem các dòng contact cần review trước khi đổ vào master.",
    "3. Đối chiếu các cột `_goc` với các cột parse để kiểm tra parser có làm lệch dữ liệu hay không."
  ];

  fs.writeFileSync(path.join(outDir, "README.md"), readme.join("\n"));

  console.log(
    JSON.stringify(
      {
        outputDir: outDir,
        sourceFile: path.basename(resolvedPath),
        sourceRows: rows.length,
        nhapThangApartments,
        canRaSoatApartments,
        previewRows: allRows.length - 1
      },
      null,
      2
    )
  );
}

main();

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const inputPath = process.argv[2] || "docs/Theo dõi thu phí T4.xlsx";
const resolvedPath = path.resolve(process.cwd(), inputPath);
const outDir = path.resolve(process.cwd(), "docs/preview-lien-he-can-ho");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function splitDigitCluster(cluster) {
  const digits = String(cluster).replace(/\D/g, "");
  const result = [];
  let i = 0;
  while (i < digits.length) {
    if (digits[i] !== "0") {
      i += 1;
      continue;
    }
    if (i + 10 <= digits.length) {
      result.push(digits.slice(i, i + 10));
      i += 10;
      continue;
    }
    if (i + 11 <= digits.length) {
      result.push(digits.slice(i, i + 11));
      i += 11;
      continue;
    }
    break;
  }
  return result.filter((x) => x.length === 10 || x.length === 11);
}

function normalizePhoneList(text) {
  const raw = String(text);
  const clusters = raw.match(/(?:0[\d\.\s,\-]{8,})/g) || [];
  const all = [];
  for (const cluster of clusters) {
    for (const phone of splitDigitCluster(cluster)) {
      all.push(phone);
    }
  }
  return [...new Set(all)];
}

function splitLines(text) {
  return String(text)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function detectFlags(text) {
  const defs = [
    ["DA_BAN", /đã bán|da ban/i],
    ["CHU_MOI", /chủ mới|chu moi/i],
    ["KHACH_THUE", /khách thuê|khach thue|người thuê|nguoi thue/i],
    ["CAN_XIN_SDT", /cần xin sđt|cần xin sdt|can xin sdt|xin sdt/i],
    ["SDT_SAI", /sđt sai|sdt sai/i],
    ["XAC_MINH", /xác minh|xac minh/i],
    ["GHI_CHU_THANH_TOAN", /thanh toán theo tháng|thanh toan theo thang|khách đóng 1 tháng 1 lần|khach dong 1 thang 1 lan|cùng đóng phí|cung dong phi|cty đóng hộ|cty dong ho|đóng hộ|dong ho/i],
  ];
  const flags = [];
  for (const [key, re] of defs) {
    if (re.test(text)) flags.push(key);
  }
  return flags;
}

function cleanNameText(text) {
  return String(text)
    .replace(/0\d(?:[\d\.\s\-,]){7,16}\d/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/đã bán|da ban|chủ mới|chu moi|khách thuê|khach thue|người thuê|nguoi thue|cần xin sđt|cần xin sdt|can xin sdt|xin sdt|sđt sai|sdt sai|xác minh|xac minh/gi, " ")
    .replace(/thanh toán theo tháng|thanh toan theo thang|khách đóng 1 tháng 1 lần|khach dong 1 thang 1 lan|cùng đóng phí|cung dong phi|cty đóng hộ|cty dong ho|đóng hộ|dong ho/gi, " ")
    .replace(/->/g, " ")
    .replace(/[()':;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitPotentialNames(text) {
  return cleanNameText(text)
    .split(/\s*\/\s*|,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseRow(maCan, chuHo, note) {
  const rawLines = splitLines(note);
  const flags = detectFlags(note);
  const contacts = [];
  const businessNotes = [];
  let sequence = 1;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const line = rawLines[idx];
    const lineFlags = detectFlags(line);
    const phones = normalizePhoneList(line);
    const names = splitPotentialNames(line);
    const hasBusinessOnly =
      lineFlags.includes("GHI_CHU_THANH_TOAN") &&
      phones.length === 0 &&
      names.length <= 1;

    if (hasBusinessOnly) {
      businessNotes.push(line);
      continue;
    }

    if (idx === 0) {
      const ownerNames = chuHo
        .split(/\s*\/\s*/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (ownerNames.length >= 2 && ownerNames.length === phones.length) {
        ownerNames.forEach((name, i) => {
          contacts.push({
            sequence: sequence++,
            ten_hien_thi_parse: name,
            so_dien_thoai_parse: phones[i] || "",
            la_lien_he_chinh_du_doan: i === 0,
            source_line: line,
          });
        });
      } else {
        contacts.push({
          sequence: sequence++,
          ten_hien_thi_parse: chuHo,
          so_dien_thoai_parse: phones[0] || "",
          la_lien_he_chinh_du_doan: true,
          source_line: line,
        });

        const remainingNames = names.filter((n) => n && !ownerNames.includes(n) && n !== chuHo);
        if (remainingNames.length > 0) {
          if (phones.length >= 2 && remainingNames.length === phones.length - 1) {
            remainingNames.forEach((name, i) => {
              contacts.push({
                sequence: sequence++,
                ten_hien_thi_parse: name,
                so_dien_thoai_parse: phones[i + 1] || "",
                la_lien_he_chinh_du_doan: false,
                source_line: line,
              });
            });
          } else if (remainingNames.length === 1 && phones.length >= 2) {
            contacts.push({
              sequence: sequence++,
              ten_hien_thi_parse: remainingNames[0],
              so_dien_thoai_parse: phones[1] || "",
              la_lien_he_chinh_du_doan: false,
              source_line: line,
            });
          } else if (remainingNames.length >= 1 && phones.length <= 1) {
            contacts.push({
              sequence: sequence++,
              ten_hien_thi_parse: remainingNames.join("/ "),
              so_dien_thoai_parse: phones[0] || "",
              la_lien_he_chinh_du_doan: false,
              source_line: line,
            });
          }
        }
      }
      continue;
    }

    if (phones.length === 1 && names.length >= 1) {
      contacts.push({
        sequence: sequence++,
        ten_hien_thi_parse: names.join("/ "),
        so_dien_thoai_parse: phones[0],
        la_lien_he_chinh_du_doan: false,
        source_line: line,
      });
      continue;
    }

    if (phones.length === 0 && lineFlags.length > 0) {
      businessNotes.push(line);
      continue;
    }

    if (phones.length > 1 || names.length > 0) {
      contacts.push({
        sequence: sequence++,
        ten_hien_thi_parse: names.join("/ "),
        so_dien_thoai_parse: phones.join(" / "),
        la_lien_he_chinh_du_doan: false,
        source_line: line,
      });
      continue;
    }

    if (line.trim()) {
      businessNotes.push(line);
    }
  }

  let deXuatXuLy = "AUTO_MAP";
  const usableContacts = contacts.filter((c) => c.ten_hien_thi_parse || c.so_dien_thoai_parse);

  const onlyStatusNoUsable =
    usableContacts.length <= 1 &&
    usableContacts.every((c) => !c.so_dien_thoai_parse) &&
    flags.some((f) => ["DA_BAN", "CHU_MOI", "KHACH_THUE", "CAN_XIN_SDT", "SDT_SAI", "XAC_MINH"].includes(f));

  if (onlyStatusNoUsable) {
    deXuatXuLy = "CHI_LUU_CO_TRANG_THAI";
  } else if (
    flags.some((f) => ["DA_BAN", "CHU_MOI", "KHACH_THUE", "CAN_XIN_SDT", "SDT_SAI", "XAC_MINH", "GHI_CHU_THANH_TOAN"].includes(f)) ||
    rawLines.length > 1 ||
    usableContacts.some((c) => String(c.so_dien_thoai_parse).includes(" / "))
  ) {
    deXuatXuLy = "CAN_RA_SOAT";
  } else if (
    usableContacts.length >= 2 &&
    usableContacts.some((c) => c.ten_hien_thi_parse.includes("/ ")) &&
    usableContacts.filter((c) => c.so_dien_thoai_parse).length === usableContacts.length
  ) {
    deXuatXuLy = "AUTO_MAP_GROUP";
  } else if (
    usableContacts.length >= 1 &&
    usableContacts.every((c) => c.so_dien_thoai_parse || c.la_lien_he_chinh_du_doan)
  ) {
    deXuatXuLy = "AUTO_MAP";
  } else {
    deXuatXuLy = "CAN_RA_SOAT";
  }

  return {
    ma_can: maCan,
    ten_chu_ho_goc: chuHo,
    thong_tin_cu_dan_goc: note,
    contacts: usableContacts,
    flags,
    ghi_chu_nghiep_vu: businessNotes.join(" | "),
    de_xuat_xu_ly: deXuatXuLy,
  };
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(filePath, rows) {
  const lines = rows.map((row) => row.map(csvEscape).join(","));
  fs.writeFileSync(filePath, lines.join("\n"));
}

function writeMdSummary(filePath, summary, files) {
  const lines = [];
  lines.push("# Preview parse liên hệ căn hộ");
  lines.push("");
  lines.push(`- File nguồn: \`${summary.fileName}\``);
  lines.push(`- Tổng số căn có dữ liệu liên hệ: \`${summary.totalRows}\``);
  lines.push(`- AUTO_MAP: \`${summary.autoMap}\``);
  lines.push(`- AUTO_MAP_GROUP: \`${summary.autoMapGroup}\``);
  lines.push(`- CAN_RA_SOAT: \`${summary.canRaSoat}\``);
  lines.push(`- CHI_LUU_CO_TRANG_THAI: \`${summary.chiLuuCoTrangThai}\``);
  lines.push("");
  lines.push("## File kết quả");
  lines.push("");
  for (const f of files) lines.push(`- \`${f}\``);
  lines.push("");
  lines.push("## Cách dùng");
  lines.push("");
  lines.push("1. Mở `preview-tong-hop.csv` để xem toàn bộ kết quả parse.");
  lines.push("2. Mở `can-ra-soat.csv` để xem riêng dữ liệu bẩn cần quyết định rule.");
  lines.push("3. Nếu cần duyệt nhanh các case sạch, xem `auto-map.csv` và `auto-map-group.csv`.");
  lines.push("");
  fs.writeFileSync(filePath, lines.join("\n"));
}

function main() {
  ensureDir(outDir);
  const wb = XLSX.readFile(resolvedPath);
  const ws = wb.Sheets["Danh sách khách hàng"];
  if (!ws) throw new Error('Không tìm thấy sheet "Danh sách khách hàng"');
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }).slice(1).filter((r) => r.some((v) => String(v).trim() !== ""));

  const all = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const maCan = String(r[1] || "").trim();
    const chuHo = String(r[3] || "").trim();
    const thongTin = String(r[4] || "").trim();
    if (!maCan || !thongTin) continue;
    const parsed = parseRow(maCan, chuHo, thongTin);
    if (!parsed.contacts.length && parsed.de_xuat_xu_ly !== "CHI_LUU_CO_TRANG_THAI") {
      parsed.de_xuat_xu_ly = "CAN_RA_SOAT";
    }
    all.push({ rowIndex: i + 2, ...parsed });
  }

  const headers = [
    "dong_excel",
    "ma_can",
    "ten_chu_ho_goc",
    "thong_tin_cu_dan_goc",
    "thu_tu",
    "ten_hien_thi_parse",
    "so_dien_thoai_parse",
    "la_lien_he_chinh_du_doan",
    "flags",
    "ghi_chu_nghiep_vu",
    "de_xuat_xu_ly",
  ];

  const flatten = (items) => {
    const rows = [headers];
    for (const item of items) {
      if (!item.contacts.length) {
        rows.push([
          item.rowIndex,
          item.ma_can,
          item.ten_chu_ho_goc,
          item.thong_tin_cu_dan_goc,
          "",
          "",
          "",
          "",
          item.flags.join(" | "),
          item.ghi_chu_nghiep_vu,
          item.de_xuat_xu_ly,
        ]);
        continue;
      }
      for (const c of item.contacts) {
        rows.push([
          item.rowIndex,
          item.ma_can,
          item.ten_chu_ho_goc,
          item.thong_tin_cu_dan_goc,
          c.sequence,
          c.ten_hien_thi_parse,
          c.so_dien_thoai_parse,
          c.la_lien_he_chinh_du_doan ? "true" : "false",
          item.flags.join(" | "),
          item.ghi_chu_nghiep_vu,
          item.de_xuat_xu_ly,
        ]);
      }
    }
    return rows;
  };

  const byType = {
    "auto-map.csv": all.filter((x) => x.de_xuat_xu_ly === "AUTO_MAP"),
    "auto-map-group.csv": all.filter((x) => x.de_xuat_xu_ly === "AUTO_MAP_GROUP"),
    "can-ra-soat.csv": all.filter((x) => x.de_xuat_xu_ly === "CAN_RA_SOAT"),
    "chi-luu-co-trang-thai.csv": all.filter((x) => x.de_xuat_xu_ly === "CHI_LUU_CO_TRANG_THAI"),
    "preview-tong-hop.csv": all,
  };

  for (const [file, items] of Object.entries(byType)) {
    writeCsv(path.join(outDir, file), flatten(items));
  }

  const summary = {
    fileName: path.basename(resolvedPath),
    totalRows: all.length,
    autoMap: byType["auto-map.csv"].length,
    autoMapGroup: byType["auto-map-group.csv"].length,
    canRaSoat: byType["can-ra-soat.csv"].length,
    chiLuuCoTrangThai: byType["chi-luu-co-trang-thai.csv"].length,
  };

  writeMdSummary(
    path.join(outDir, "README.md"),
    summary,
    Object.keys(byType)
  );

  console.log(JSON.stringify(summary, null, 2));
}

main();

#!/usr/bin/env node

require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong .env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_SOURCE_FILE = "Danh_Sach_Can_Ho_Master.xlsx";

function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function normalizePhone(value) {
  const digits = safeString(value).replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) {
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

function contactFromSlot(source, slot) {
  return {
    thuTuNguon: slot,
    tenNguoiSuDungGoc: source[`nguoiSuDung${slot}`],
    soDienThoaiGoc: source[`sdt${slot}`],
    tenHienThiParse: source[`nguoiSuDung${slot}`],
    soDienThoaiParse: normalizePhone(source[`sdt${slot}`]),
    laLienHeChinhDuDoan: false,
    vaiTroDuDoan: null,
  };
}

function buildParsedContacts(source, deXuatXuLy) {
  const contacts = [];
  const ownerIsUser1 = source.tenChuHoGoc && source.tenChuHoGoc === source.nguoiSuDung1;

  if (source.tenChuHoGoc) {
    contacts.push({
      thuTuNguon: 0,
      tenNguoiSuDungGoc: source.tenChuHoGoc,
      soDienThoaiGoc: ownerIsUser1 ? source.sdt1 : "",
      tenHienThiParse: source.tenChuHoGoc,
      soDienThoaiParse: ownerIsUser1 ? normalizePhone(source.sdt1) : "",
      laLienHeChinhDuDoan: true,
      vaiTroDuDoan: "CHU_HO",
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

    contacts.push(contactFromSlot(source, index));
  }

  if (contacts.length === 0) {
    contacts.push({
      thuTuNguon: 0,
      tenNguoiSuDungGoc: source.tenChuHoGoc,
      soDienThoaiGoc: "",
      tenHienThiParse: source.tenChuHoGoc,
      soDienThoaiParse: "",
      laLienHeChinhDuDoan: true,
      vaiTroDuDoan: "CHU_HO",
    });
  }

  return contacts.map((contact, index) => ({
    thuTu: index + 1,
    deXuatXuLy,
    ...contact,
  }));
}

function sourceFromRawRow(rawRow) {
  const row = rawRow.mapped_row_json ?? {};
  return {
    dongExcel: rawRow.so_dong_nguon,
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
    tinhTrangGoc: safeString(row["TÌNH TRẠNG"]),
    ghiChuGoc: safeString(row["Ghi chú"]),
  };
}

async function main() {
  const sourceFile = process.argv[2] || DEFAULT_SOURCE_FILE;
  const batch = await prisma.loNhapDuLieu.findFirst({
    where: {
      loai_nguon: "WORKBOOK_QUAN_LY",
      ten_file: sourceFile,
    },
    orderBy: { id: "desc" },
  });

  if (!batch) {
    throw new Error(`Không tìm thấy batch master cho file ${sourceFile}. Hãy chạy npm run sync:apartment:master trước.`);
  }

  const rawRows = await prisma.dongDuLieuQuanLyTho.findMany({
    where: { lo_nhap_du_lieu_id: batch.id },
    orderBy: { so_dong_nguon: "asc" },
  });

  await prisma.ungVienLienHeCanHo.deleteMany({
    where: { lo_nhap_du_lieu_id: batch.id },
  });

  let candidateRows = 0;
  const nhapThangApartments = new Set();
  const canRaSoatApartments = new Set();

  for (const rawRow of rawRows) {
    const source = sourceFromRawRow(rawRow);
    const { deXuatXuLy, reasons } = classifyRow(source);
    const parsedContacts = buildParsedContacts(source, deXuatXuLy);
    const coCanRaSoat = deXuatXuLy === "CAN_RA_SOAT";

    if (coCanRaSoat) {
      canRaSoatApartments.add(source.maCan);
    } else {
      nhapThangApartments.add(source.maCan);
    }

    for (const contact of parsedContacts) {
      await prisma.ungVienLienHeCanHo.create({
        data: {
          lo_nhap_du_lieu_id: batch.id,
          dong_du_lieu_tho_id: rawRow.id,
          ma_can: source.maCan || null,
          ten_chu_ho_goc: source.tenChuHoGoc || null,
          thong_tin_cu_dan_goc: source.thongTinPhuGoc || null,
          thu_tu_nguon: contact.thuTuNguon,
          ten_nguoi_su_dung_goc: contact.tenNguoiSuDungGoc || null,
          so_dien_thoai_goc: contact.soDienThoaiGoc || null,
          thong_tin_phu_goc: source.thongTinPhuGoc || null,
          trang_thai_su_dung_goc: source.trangThaiSuDung || null,
          tinh_trang_goc: source.tinhTrangGoc || null,
          ghi_chu_goc: source.ghiChuGoc || null,
          ten_hien_thi_parse: contact.tenHienThiParse || null,
          so_dien_thoai_parse: contact.soDienThoaiParse || null,
          la_lien_he_chinh_du_doan: contact.laLienHeChinhDuDoan,
          vai_tro_du_doan: contact.vaiTroDuDoan,
          nhan_thong_bao_du_doan: contact.laLienHeChinhDuDoan || Boolean(contact.soDienThoaiParse),
          co_can_ra_soat: coCanRaSoat,
          ly_do_ra_soat: reasons.join(" | ") || null,
          flags_json: { reasons, deXuatXuLy },
          payload_parse_json: {
            dongExcel: source.dongExcel,
            thuTu: contact.thuTu,
            deXuatXuLy,
          },
        },
      });
      candidateRows += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        batchId: batch.id,
        sourceFile,
        rawRows: rawRows.length,
        candidateRows,
        nhapThangApartments: nhapThangApartments.size,
        canRaSoatApartments: canRaSoatApartments.size,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

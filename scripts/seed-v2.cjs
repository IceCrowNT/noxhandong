#!/usr/bin/env node

const crypto = require("node:crypto");
require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong .env");
}

const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
const initialPhone = normalizeVietnamPhone(process.env.ADMIN_INITIAL_PHONE || "");

if (!initialPassword) {
  throw new Error("Thiếu ADMIN_INITIAL_PASSWORD. Chạy: ADMIN_INITIAL_PASSWORD=... npm run seed:v2");
}

if (process.env.ADMIN_INITIAL_PHONE && !initialPhone) {
  throw new Error("ADMIN_INITIAL_PHONE không hợp lệ. Dùng dạng 0912345678 hoặc +84912345678.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 310000;
  const digest = "sha256";
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, digest).toString("hex");
  return `pbkdf2$${digest}$${iterations}$${salt}$${hash}`;
}

function normalizeVietnamPhone(value) {
  const compact = value.trim().replace(/[\s.\-()]/g, "");
  if (!compact) {
    return "";
  }
  if (/^\+84\d{9,10}$/.test(compact)) {
    return `0${compact.slice(3)}`;
  }
  if (/^84\d{9,10}$/.test(compact)) {
    return `0${compact.slice(2)}`;
  }
  if (/^0\d{9,10}$/.test(compact)) {
    return compact;
  }
  return "";
}

async function ensureFeeRule({ loaiCan, maPhi, soTien, ghiChu }) {
  const existing = await prisma.quyTacPhi.findFirst({
    where: {
      loai_can: loaiCan,
      ma_phi: maPhi,
      dang_ap_dung: true,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.quyTacPhi.create({
    data: {
      loai_can: loaiCan,
      ma_phi: maPhi,
      so_tien: soTien,
      hieu_luc_tu_ngay: new Date("2026-01-01T00:00:00.000Z"),
      dang_ap_dung: true,
      ghi_chu: ghiChu,
    },
  });
}

async function main() {
  const chungCuRule = await ensureFeeRule({
    loaiCan: "CHUNG_CU",
    maPhi: "QLVH",
    soTien: "250000",
    ghiChu: "Seed V2: phí quản lý vận hành chung cư",
  });

  const lienKeRule = await ensureFeeRule({
    loaiCan: "LIEN_KE",
    maPhi: "QLVH",
    soTien: "200000",
    ghiChu: "Seed V2: phí quản lý vận hành liền kề",
  });

  const admin = await prisma.taiKhoanQuanTri.upsert({
    where: { ten_dang_nhap: "admin" },
    update: {
      mat_khau_hash: hashPassword(initialPassword),
      vai_tro: "SUPER_ADMIN",
      trang_thai: "DANG_HOAT_DONG",
      ten_hien_thi: "Super Admin",
      so_dien_thoai: initialPhone || undefined,
    },
    create: {
      ten_dang_nhap: "admin",
      so_dien_thoai: initialPhone || null,
      mat_khau_hash: hashPassword(initialPassword),
      vai_tro: "SUPER_ADMIN",
      trang_thai: "DANG_HOAT_DONG",
      ten_hien_thi: "Super Admin",
    },
  });

  console.log("Seed V2 hoàn thành");
  console.log({
    feeRules: [
      { id: chungCuRule.id, loai_can: chungCuRule.loai_can, ma_phi: chungCuRule.ma_phi },
      { id: lienKeRule.id, loai_can: lienKeRule.loai_can, ma_phi: lienKeRule.ma_phi },
    ],
    admin: {
      id: admin.id,
      ten_dang_nhap: admin.ten_dang_nhap,
      so_dien_thoai: admin.so_dien_thoai,
      vai_tro: admin.vai_tro,
      trang_thai: admin.trang_thai,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

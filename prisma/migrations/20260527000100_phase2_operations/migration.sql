-- Phase 2 operations: review evidence, fee history, login log, public announcements.

CREATE TABLE IF NOT EXISTS "chung_tu_doi_soat" (
  "id" SERIAL PRIMARY KEY,
  "giao_dich_ngan_hang_id" INTEGER,
  "can_ho_id" INTEGER,
  "loai_chung_tu" TEXT NOT NULL,
  "duong_dan_file" TEXT,
  "ten_file_goc" TEXT,
  "mime_type" TEXT,
  "kich_thuoc_byte" INTEGER,
  "ngay_giao_dich" TIMESTAMP(3),
  "so_tien" DECIMAL(14,2),
  "ma_tham_chieu_ngan_hang" TEXT,
  "ghi_chu" TEXT,
  "nguoi_tao_id" INTEGER,
  "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chung_tu_doi_soat_giao_dich_ngan_hang_id_fkey"
    FOREIGN KEY ("giao_dich_ngan_hang_id") REFERENCES "giao_dich_ngan_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chung_tu_doi_soat_can_ho_id_fkey"
    FOREIGN KEY ("can_ho_id") REFERENCES "can_ho"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "chung_tu_doi_soat_nguoi_tao_id_fkey"
    FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "chung_tu_doi_soat_giao_dich_ngan_hang_id_idx" ON "chung_tu_doi_soat"("giao_dich_ngan_hang_id");
CREATE INDEX IF NOT EXISTS "chung_tu_doi_soat_can_ho_id_idx" ON "chung_tu_doi_soat"("can_ho_id");
CREATE INDEX IF NOT EXISTS "chung_tu_doi_soat_nguoi_tao_id_idx" ON "chung_tu_doi_soat"("nguoi_tao_id");

CREATE TABLE IF NOT EXISTS "lich_su_dong_phi_can_ho" (
  "id" SERIAL PRIMARY KEY,
  "can_ho_id" INTEGER NOT NULL,
  "ky_du_lieu" TEXT NOT NULL,
  "thang_ap_dung" TEXT,
  "so_tien" DECIMAL(14,2) NOT NULL,
  "loai_nguon" TEXT NOT NULL,
  "giao_dich_ngan_hang_id" INTEGER,
  "phan_bo_giao_dich_id" INTEGER,
  "batch_phi_public_id" INTEGER,
  "ghi_chu" TEXT,
  "nguoi_tao_id" INTEGER,
  "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lich_su_dong_phi_can_ho_can_ho_id_fkey"
    FOREIGN KEY ("can_ho_id") REFERENCES "can_ho"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "lich_su_dong_phi_can_ho_giao_dich_ngan_hang_id_fkey"
    FOREIGN KEY ("giao_dich_ngan_hang_id") REFERENCES "giao_dich_ngan_hang"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "lich_su_dong_phi_can_ho_phan_bo_giao_dich_id_fkey"
    FOREIGN KEY ("phan_bo_giao_dich_id") REFERENCES "phan_bo_giao_dich"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "lich_su_dong_phi_can_ho_batch_phi_public_id_fkey"
    FOREIGN KEY ("batch_phi_public_id") REFERENCES "batch_trang_thai_phi_public"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "lich_su_dong_phi_can_ho_nguoi_tao_id_fkey"
    FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "lich_su_dong_phi_can_ho_can_ho_id_ky_du_lieu_idx" ON "lich_su_dong_phi_can_ho"("can_ho_id", "ky_du_lieu");
CREATE INDEX IF NOT EXISTS "lich_su_dong_phi_can_ho_giao_dich_ngan_hang_id_idx" ON "lich_su_dong_phi_can_ho"("giao_dich_ngan_hang_id");
CREATE INDEX IF NOT EXISTS "lich_su_dong_phi_can_ho_phan_bo_giao_dich_id_idx" ON "lich_su_dong_phi_can_ho"("phan_bo_giao_dich_id");
CREATE INDEX IF NOT EXISTS "lich_su_dong_phi_can_ho_batch_phi_public_id_idx" ON "lich_su_dong_phi_can_ho"("batch_phi_public_id");
CREATE INDEX IF NOT EXISTS "lich_su_dong_phi_can_ho_nguoi_tao_id_idx" ON "lich_su_dong_phi_can_ho"("nguoi_tao_id");

CREATE TABLE IF NOT EXISTS "nhat_ky_dang_nhap_quan_tri" (
  "id" SERIAL PRIMARY KEY,
  "tai_khoan_id" INTEGER,
  "dinh_danh_dang_nhap" TEXT,
  "thanh_cong" BOOLEAN NOT NULL,
  "ip" TEXT,
  "user_agent" TEXT,
  "ghi_chu" TEXT,
  "thoi_diem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nhat_ky_dang_nhap_quan_tri_tai_khoan_id_fkey"
    FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "nhat_ky_dang_nhap_quan_tri_tai_khoan_id_thoi_diem_idx" ON "nhat_ky_dang_nhap_quan_tri"("tai_khoan_id", "thoi_diem");

CREATE TABLE IF NOT EXISTS "thong_bao_cong_khai" (
  "id" SERIAL PRIMARY KEY,
  "tieu_de" TEXT NOT NULL,
  "mo_ta_ngan" TEXT,
  "ten_file_goc" TEXT,
  "duong_dan_file" TEXT,
  "mime_type" TEXT,
  "kich_thuoc_byte" INTEGER,
  "trang_thai" TEXT NOT NULL DEFAULT 'NHAP',
  "ngay_cong_khai" TIMESTAMP(3),
  "nguoi_tao_id" INTEGER,
  "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "thong_bao_cong_khai_nguoi_tao_id_fkey"
    FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "thong_bao_cong_khai_trang_thai_ngay_cong_khai_idx" ON "thong_bao_cong_khai"("trang_thai", "ngay_cong_khai");
CREATE INDEX IF NOT EXISTS "thong_bao_cong_khai_nguoi_tao_id_idx" ON "thong_bao_cong_khai"("nguoi_tao_id");

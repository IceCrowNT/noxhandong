-- CreateEnum
CREATE TYPE "BoPhanCongViecVanHanh" AS ENUM ('KY_THUAT', 'VE_SINH');

-- CreateEnum
CREATE TYPE "TrangThaiDongCongViecVanHanh" AS ENUM ('DANG_MO', 'HOAN_THANH', 'BO_QUA', 'THAY_DOI');

-- CreateEnum
CREATE TYPE "HanhDongNhatKyCongViecVanHanh" AS ENUM ('TAO', 'SUA', 'BAO_XONG', 'DONG_VIEC', 'MO_LAI', 'XOA_MEM');

-- CreateTable
CREATE TABLE "cong_viec_van_hanh" (
    "id" SERIAL NOT NULL,
    "stt_hien_thi" INTEGER,
    "thoi_diem_giao_viec" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ten_cong_viec" TEXT NOT NULL,
    "mo_ta" TEXT,
    "bo_phan" "BoPhanCongViecVanHanh" NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "da_bao_xong" BOOLEAN NOT NULL DEFAULT false,
    "bao_xong_luc" TIMESTAMP(3),
    "nguoi_bao_xong_id" INTEGER,
    "trang_thai_dong" "TrangThaiDongCongViecVanHanh" NOT NULL DEFAULT 'DANG_MO',
    "dong_luc" TIMESTAMP(3),
    "nguoi_dong_id" INTEGER,
    "ghi_chu_dong" TEXT,
    "da_xoa" BOOLEAN NOT NULL DEFAULT false,
    "nguoi_tao_id" INTEGER,
    "nguoi_cap_nhat_id" INTEGER,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cong_viec_van_hanh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky_cong_viec_van_hanh" (
    "id" SERIAL NOT NULL,
    "cong_viec_id" INTEGER NOT NULL,
    "hanh_dong" "HanhDongNhatKyCongViecVanHanh" NOT NULL,
    "noi_dung" TEXT,
    "nguoi_thuc_hien_id" INTEGER,
    "payload_json" JSONB,
    "thoi_diem" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_cong_viec_van_hanh_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cong_viec_van_hanh_bo_phan_idx" ON "cong_viec_van_hanh"("bo_phan");

-- CreateIndex
CREATE INDEX "cong_viec_van_hanh_trang_thai_dong_idx" ON "cong_viec_van_hanh"("trang_thai_dong");

-- CreateIndex
CREATE INDEX "cong_viec_van_hanh_deadline_idx" ON "cong_viec_van_hanh"("deadline");

-- CreateIndex
CREATE INDEX "cong_viec_van_hanh_da_xoa_idx" ON "cong_viec_van_hanh"("da_xoa");

-- CreateIndex
CREATE INDEX "cong_viec_van_hanh_nguoi_tao_id_idx" ON "cong_viec_van_hanh"("nguoi_tao_id");

-- CreateIndex
CREATE INDEX "cong_viec_van_hanh_nguoi_cap_nhat_id_idx" ON "cong_viec_van_hanh"("nguoi_cap_nhat_id");

-- CreateIndex
CREATE INDEX "cong_viec_van_hanh_nguoi_bao_xong_id_idx" ON "cong_viec_van_hanh"("nguoi_bao_xong_id");

-- CreateIndex
CREATE INDEX "cong_viec_van_hanh_nguoi_dong_id_idx" ON "cong_viec_van_hanh"("nguoi_dong_id");

-- CreateIndex
CREATE INDEX "nhat_ky_cong_viec_van_hanh_cong_viec_id_thoi_diem_idx" ON "nhat_ky_cong_viec_van_hanh"("cong_viec_id", "thoi_diem");

-- CreateIndex
CREATE INDEX "nhat_ky_cong_viec_van_hanh_nguoi_thuc_hien_id_idx" ON "nhat_ky_cong_viec_van_hanh"("nguoi_thuc_hien_id");

-- AddForeignKey
ALTER TABLE "cong_viec_van_hanh" ADD CONSTRAINT "cong_viec_van_hanh_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_viec_van_hanh" ADD CONSTRAINT "cong_viec_van_hanh_nguoi_cap_nhat_id_fkey" FOREIGN KEY ("nguoi_cap_nhat_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_viec_van_hanh" ADD CONSTRAINT "cong_viec_van_hanh_nguoi_bao_xong_id_fkey" FOREIGN KEY ("nguoi_bao_xong_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_viec_van_hanh" ADD CONSTRAINT "cong_viec_van_hanh_nguoi_dong_id_fkey" FOREIGN KEY ("nguoi_dong_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_cong_viec_van_hanh" ADD CONSTRAINT "nhat_ky_cong_viec_van_hanh_cong_viec_id_fkey" FOREIGN KEY ("cong_viec_id") REFERENCES "cong_viec_van_hanh"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_cong_viec_van_hanh" ADD CONSTRAINT "nhat_ky_cong_viec_van_hanh_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

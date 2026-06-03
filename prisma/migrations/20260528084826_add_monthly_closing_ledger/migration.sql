-- CreateEnum
CREATE TYPE "TrangThaiSoChotThang" AS ENUM ('NHAP', 'DOI_SOAT', 'DA_CHOT', 'HUY');

-- CreateEnum
CREATE TYPE "NguonSoChotCanHo" AS ENUM ('EXCEL_CHOT', 'SAO_KE_DA_DUYET', 'DIEU_CHINH_THU_CONG');

-- AlterTable
ALTER TABLE "batch_trang_thai_phi_public" ADD COLUMN     "so_chot_thang_id" INTEGER;

-- AlterTable
ALTER TABLE "thong_bao_cong_khai" ALTER COLUMN "ngay_cap_nhat" DROP DEFAULT;

-- CreateTable
CREATE TABLE "so_chot_thang" (
    "id" SERIAL NOT NULL,
    "ky_du_lieu" TEXT NOT NULL,
    "tu_ngay" TIMESTAMP(3),
    "den_ngay" TIMESTAMP(3),
    "lo_excel_chot_id" INTEGER,
    "lo_sao_ke_id" INTEGER,
    "ten_file_excel_chot" TEXT,
    "tong_tien_excel" DECIMAL(14,2),
    "tong_tien_sao_ke" DECIMAL(14,2),
    "chenhlech_tien" DECIMAL(14,2),
    "tong_so_can" INTEGER,
    "so_can_khop" INTEGER,
    "so_can_can_ra_soat" INTEGER,
    "trang_thai" "TrangThaiSoChotThang" NOT NULL DEFAULT 'NHAP',
    "ghi_chu" TEXT,
    "metadata_json" JSONB,
    "nguoi_chot_id" INTEGER,
    "ngay_chot" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "so_chot_thang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "so_chot_can_ho" (
    "id" SERIAL NOT NULL,
    "so_chot_thang_id" INTEGER NOT NULL,
    "can_ho_id" INTEGER NOT NULL,
    "ma_can" TEXT NOT NULL,
    "thang_da_dong_den_hien_tai" TEXT,
    "so_tien_thang" DECIMAL(14,2),
    "nguon" "NguonSoChotCanHo" NOT NULL DEFAULT 'EXCEL_CHOT',
    "co_can_ra_soat" BOOLEAN NOT NULL DEFAULT false,
    "ghi_chu" TEXT,
    "payload_json" JSONB,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "so_chot_can_ho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "so_chot_thang_ky_du_lieu_trang_thai_idx" ON "so_chot_thang"("ky_du_lieu", "trang_thai");

-- CreateIndex
CREATE INDEX "so_chot_thang_lo_excel_chot_id_idx" ON "so_chot_thang"("lo_excel_chot_id");

-- CreateIndex
CREATE INDEX "so_chot_thang_lo_sao_ke_id_idx" ON "so_chot_thang"("lo_sao_ke_id");

-- CreateIndex
CREATE INDEX "so_chot_thang_nguoi_chot_id_idx" ON "so_chot_thang"("nguoi_chot_id");

-- CreateIndex
CREATE INDEX "so_chot_can_ho_can_ho_id_idx" ON "so_chot_can_ho"("can_ho_id");

-- CreateIndex
CREATE INDEX "so_chot_can_ho_ma_can_idx" ON "so_chot_can_ho"("ma_can");

-- CreateIndex
CREATE UNIQUE INDEX "so_chot_can_ho_so_chot_thang_id_can_ho_id_key" ON "so_chot_can_ho"("so_chot_thang_id", "can_ho_id");

-- CreateIndex
CREATE INDEX "batch_trang_thai_phi_public_so_chot_thang_id_idx" ON "batch_trang_thai_phi_public"("so_chot_thang_id");

-- AddForeignKey
ALTER TABLE "so_chot_thang" ADD CONSTRAINT "so_chot_thang_lo_excel_chot_id_fkey" FOREIGN KEY ("lo_excel_chot_id") REFERENCES "lo_nhap_du_lieu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "so_chot_thang" ADD CONSTRAINT "so_chot_thang_lo_sao_ke_id_fkey" FOREIGN KEY ("lo_sao_ke_id") REFERENCES "lo_nhap_du_lieu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "so_chot_thang" ADD CONSTRAINT "so_chot_thang_nguoi_chot_id_fkey" FOREIGN KEY ("nguoi_chot_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "so_chot_can_ho" ADD CONSTRAINT "so_chot_can_ho_so_chot_thang_id_fkey" FOREIGN KEY ("so_chot_thang_id") REFERENCES "so_chot_thang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "so_chot_can_ho" ADD CONSTRAINT "so_chot_can_ho_can_ho_id_fkey" FOREIGN KEY ("can_ho_id") REFERENCES "can_ho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_trang_thai_phi_public" ADD CONSTRAINT "batch_trang_thai_phi_public_so_chot_thang_id_fkey" FOREIGN KEY ("so_chot_thang_id") REFERENCES "so_chot_thang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "giao_dich_ngan_hang" ADD COLUMN     "do_tin_cay" DECIMAL(5,2),
ADD COLUMN     "ghi_chu_duyet" TEXT,
ADD COLUMN     "la_giao_dich_noi_bo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ly_do_khop" TEXT,
ADD COLUMN     "ma_can_duoc_chon" TEXT,
ADD COLUMN     "ma_can_parse" TEXT,
ADD COLUMN     "ngay_duyet" TIMESTAMP(3),
ADD COLUMN     "nguoi_duyet" TEXT,
ADD COLUMN     "phien_ban_parser" TEXT,
ADD COLUMN     "trang_thai_duyet" "TrangThaiDuyetGiaoDich" NOT NULL DEFAULT 'CHUA_DUYET',
ADD COLUMN     "trang_thai_khop" "TrangThaiKhop",
ADD COLUMN     "ung_vien_khop_json" JSONB;

-- CreateTable
CREATE TABLE "giao_dich_sao_ke_tho_chuan" (
    "id" SERIAL NOT NULL,
    "lo_nhap_du_lieu_id" INTEGER NOT NULL,
    "ma_bam_file" TEXT,
    "so_dong_nguon" INTEGER,
    "van_tay_giao_dich" TEXT NOT NULL,
    "tham_chieu_ngan_hang" TEXT,
    "ngay_giao_dich" TIMESTAMP(3),
    "so_tien" DECIMAL(14,2) NOT NULL,
    "la_giao_dich_thu" BOOLEAN NOT NULL DEFAULT true,
    "noi_dung_goc" TEXT NOT NULL,
    "noi_dung_chuan_hoa" TEXT,
    "ten_nguoi_chuyen" TEXT,
    "tai_khoan_nguoi_chuyen" TEXT,
    "ma_giao_dich_text" TEXT,
    "header_values_json" JSONB,
    "values_json" JSONB,
    "mapped_row_json" JSONB,
    "payload_goc_json" JSONB,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "giao_dich_sao_ke_tho_chuan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "giao_dich_sao_ke_tho_chuan_van_tay_giao_dich_key" ON "giao_dich_sao_ke_tho_chuan"("van_tay_giao_dich");

-- CreateIndex
CREATE UNIQUE INDEX "giao_dich_sao_ke_tho_chuan_tham_chieu_ngan_hang_key" ON "giao_dich_sao_ke_tho_chuan"("tham_chieu_ngan_hang");

-- CreateIndex
CREATE INDEX "giao_dich_sao_ke_tho_chuan_lo_nhap_du_lieu_id_idx" ON "giao_dich_sao_ke_tho_chuan"("lo_nhap_du_lieu_id");

-- CreateIndex
CREATE INDEX "giao_dich_sao_ke_tho_chuan_ngay_giao_dich_idx" ON "giao_dich_sao_ke_tho_chuan"("ngay_giao_dich");

-- CreateIndex
CREATE INDEX "giao_dich_sao_ke_tho_chuan_la_giao_dich_thu_idx" ON "giao_dich_sao_ke_tho_chuan"("la_giao_dich_thu");

-- CreateIndex
CREATE INDEX "giao_dich_ngan_hang_trang_thai_duyet_idx" ON "giao_dich_ngan_hang"("trang_thai_duyet");

-- CreateIndex
CREATE INDEX "giao_dich_ngan_hang_trang_thai_khop_idx" ON "giao_dich_ngan_hang"("trang_thai_khop");

-- CreateIndex
CREATE INDEX "giao_dich_ngan_hang_ma_can_parse_idx" ON "giao_dich_ngan_hang"("ma_can_parse");

-- AddForeignKey
ALTER TABLE "giao_dich_sao_ke_tho_chuan" ADD CONSTRAINT "giao_dich_sao_ke_tho_chuan_lo_nhap_du_lieu_id_fkey" FOREIGN KEY ("lo_nhap_du_lieu_id") REFERENCES "lo_nhap_du_lieu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

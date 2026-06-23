-- CreateTable
CREATE TABLE "bo_sung_giao_dich_qua_khu" (
    "id" SERIAL NOT NULL,
    "can_ho_id" INTEGER NOT NULL,
    "lich_su_dong_phi_id" INTEGER NOT NULL,
    "so_tien" DECIMAL(14,2) NOT NULL,
    "ky_du_lieu" TEXT NOT NULL,
    "thang_ap_dung" TEXT,
    "ngay_giao_dich_goc" TIMESTAMP(3),
    "loai_bang_chung" TEXT NOT NULL,
    "duong_dan_file" TEXT,
    "ten_file_goc" TEXT,
    "mime_type" TEXT,
    "kich_thuoc_file" INTEGER,
    "noi_dung_xac_minh" TEXT,
    "ghi_chu_noi_bo" TEXT,
    "nguoi_tao_id" INTEGER,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bo_sung_giao_dich_qua_khu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bo_sung_giao_dich_qua_khu_lich_su_dong_phi_id_key" ON "bo_sung_giao_dich_qua_khu"("lich_su_dong_phi_id");

-- CreateIndex
CREATE INDEX "bo_sung_giao_dich_qua_khu_can_ho_id_ky_du_lieu_idx" ON "bo_sung_giao_dich_qua_khu"("can_ho_id", "ky_du_lieu");

-- CreateIndex
CREATE INDEX "bo_sung_giao_dich_qua_khu_ngay_giao_dich_goc_idx" ON "bo_sung_giao_dich_qua_khu"("ngay_giao_dich_goc");

-- CreateIndex
CREATE INDEX "bo_sung_giao_dich_qua_khu_nguoi_tao_id_idx" ON "bo_sung_giao_dich_qua_khu"("nguoi_tao_id");

-- AddForeignKey
ALTER TABLE "bo_sung_giao_dich_qua_khu" ADD CONSTRAINT "bo_sung_giao_dich_qua_khu_can_ho_id_fkey" FOREIGN KEY ("can_ho_id") REFERENCES "can_ho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bo_sung_giao_dich_qua_khu" ADD CONSTRAINT "bo_sung_giao_dich_qua_khu_lich_su_dong_phi_id_fkey" FOREIGN KEY ("lich_su_dong_phi_id") REFERENCES "lich_su_dong_phi_can_ho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bo_sung_giao_dich_qua_khu" ADD CONSTRAINT "bo_sung_giao_dich_qua_khu_nguoi_tao_id_fkey" FOREIGN KEY ("nguoi_tao_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

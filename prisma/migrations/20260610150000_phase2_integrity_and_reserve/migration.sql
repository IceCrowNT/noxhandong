ALTER TYPE "TrangThaiDuyetGiaoDich" ADD VALUE IF NOT EXISTS 'BAO_LUU';

ALTER TABLE "so_chot_can_ho"
ADD COLUMN IF NOT EXISTS "so_du_chua_du_thang" DECIMAL(14, 2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "phan_bo_giao_dich_giao_dich_ngan_hang_id_can_ho_id_key"
ON "phan_bo_giao_dich"("giao_dich_ngan_hang_id", "can_ho_id");

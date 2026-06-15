-- Parser and review current state now live only on giao_dich_ngan_hang.
-- Candidate rows remain relational because they are a ranked one-to-many list.
DROP TABLE IF EXISTS "ung_vien_khop_giao_dich";
DROP TABLE IF EXISTS "duyet_giao_dich";
DROP TABLE IF EXISTS "ket_qua_parse_giao_dich";
DROP TABLE IF EXISTS "ngoai_le_giao_dich";

ALTER TABLE "giao_dich_ngan_hang"
DROP COLUMN IF EXISTS "ung_vien_khop_json";

CREATE TABLE "ung_vien_khop_giao_dich" (
    "id" SERIAL NOT NULL,
    "giao_dich_ngan_hang_id" INTEGER NOT NULL,
    "ma_can" TEXT NOT NULL,
    "diem" DECIMAL(5,2) NOT NULL,
    "ly_do" TEXT NOT NULL,
    "thu_hang" INTEGER NOT NULL,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ung_vien_khop_giao_dich_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ung_vien_khop_giao_dich_giao_dich_ngan_hang_id_thu_hang_idx"
ON "ung_vien_khop_giao_dich"("giao_dich_ngan_hang_id", "thu_hang");

CREATE INDEX "ung_vien_khop_giao_dich_ma_can_idx"
ON "ung_vien_khop_giao_dich"("ma_can");

ALTER TABLE "ung_vien_khop_giao_dich"
ADD CONSTRAINT "ung_vien_khop_giao_dich_giao_dich_ngan_hang_id_fkey"
FOREIGN KEY ("giao_dich_ngan_hang_id") REFERENCES "giao_dich_ngan_hang"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

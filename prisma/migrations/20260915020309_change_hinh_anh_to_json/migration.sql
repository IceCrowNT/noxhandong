/*
  Warnings:

  - The `hinh_anh_bao_xong` column on the `cong_viec_van_hanh` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "cong_viec_van_hanh" DROP COLUMN "hinh_anh_bao_xong",
ADD COLUMN     "hinh_anh_bao_xong" JSONB;

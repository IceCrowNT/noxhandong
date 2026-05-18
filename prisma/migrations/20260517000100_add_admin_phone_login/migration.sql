-- Add optional normalized phone number for admin/manager login.
ALTER TABLE "tai_khoan_quan_tri" ADD COLUMN "so_dien_thoai" TEXT;

CREATE UNIQUE INDEX "tai_khoan_quan_tri_so_dien_thoai_key" ON "tai_khoan_quan_tri"("so_dien_thoai");

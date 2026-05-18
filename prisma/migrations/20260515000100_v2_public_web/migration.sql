-- CreateEnum
CREATE TYPE "LoaiCan" AS ENUM ('CHUNG_CU', 'LIEN_KE');

-- CreateEnum
CREATE TYPE "TrangThaiCan" AS ENUM ('DANG_O', 'TRONG', 'KHOA');

-- CreateEnum
CREATE TYPE "LoaiNguonNhap" AS ENUM ('WORKBOOK_QUAN_LY', 'WORKBOOK_THEO_DOI_THU_PHI', 'SAO_KE_NGAN_HANG', 'CHUNG_TU');

-- CreateEnum
CREATE TYPE "TrangThaiLoNhap" AS ENUM ('CHO_XU_LY', 'HOAN_TAT', 'THAT_BAI');

-- CreateEnum
CREATE TYPE "LoaiDongQuanLyTho" AS ENUM ('DANH_SACH_KHACH_HANG', 'LICH_SU_DONG_PHI', 'KHAC');

-- CreateEnum
CREATE TYPE "TrangThaiDuyetUngVien" AS ENUM ('CHUA_DUYET', 'DA_DUYET', 'TU_CHOI');

-- CreateEnum
CREATE TYPE "TrangThaiKhop" AS ENUM ('KHOP_TRUC_TIEP', 'KHOP_SAU_CHUAN_HOA', 'NHIEU_CAN', 'MA_CAN_KHONG_HOP_LE', 'CHUA_NHAN_DIEN_DUOC_CAN', 'KHONG_LIEN_QUAN_CAN_HO', 'CAN_RA_SOAT', 'SUA_TAY', 'DA_DUYET');

-- CreateEnum
CREATE TYPE "TrangThaiDuyetGiaoDich" AS ENUM ('CHUA_DUYET', 'DA_RA_SOAT', 'DA_DUYET', 'TU_CHOI');

-- CreateEnum
CREATE TYPE "CachPhanBo" AS ENUM ('MOT_CAN', 'NHIEU_CAN_DUNG_CHUAN', 'NHIEU_CAN_THEO_TY_TRONG', 'CHINH_TAY');

-- CreateEnum
CREATE TYPE "VaiTroQuanTri" AS ENUM ('SUPER_ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "TrangThaiTaiKhoan" AS ENUM ('DANG_HOAT_DONG', 'BI_KHOA');

-- CreateEnum
CREATE TYPE "VaiTroLienHe" AS ENUM ('CHU_HO', 'CHU_MOI', 'CHU_CU', 'KHACH_THUE', 'NGUOI_THAN', 'NGUOI_NHAN_THONG_BAO', 'DONG_HO', 'MOI_GIOI', 'KHAC');

-- CreateEnum
CREATE TYPE "TrangThaiLienHe" AS ENUM ('DANG_DUNG', 'CU', 'CAN_XAC_MINH');

-- CreateEnum
CREATE TYPE "TrangThaiBatchPhiPublic" AS ENUM ('NHAP', 'DA_KIEM_TRA', 'DA_PUBLIC', 'HUY');

-- DropForeignKey
ALTER TABLE "Occupancy" DROP CONSTRAINT "Occupancy_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Occupancy" DROP CONSTRAINT "Occupancy_residentId_fkey";

-- DropForeignKey
ALTER TABLE "RawManagementRow" DROP CONSTRAINT "RawManagementRow_batchId_fkey";

-- DropForeignKey
ALTER TABLE "RawBankStatementRow" DROP CONSTRAINT "RawBankStatementRow_batchId_fkey";

-- DropForeignKey
ALTER TABLE "BankTransaction" DROP CONSTRAINT "BankTransaction_batchId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionParseResult" DROP CONSTRAINT "TransactionParseResult_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionCandidate" DROP CONSTRAINT "TransactionCandidate_parseResultId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionReview" DROP CONSTRAINT "TransactionReview_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionAllocation" DROP CONSTRAINT "TransactionAllocation_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionAllocation" DROP CONSTRAINT "TransactionAllocation_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "ExceptionCase" DROP CONSTRAINT "ExceptionCase_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "ExceptionCase" DROP CONSTRAINT "ExceptionCase_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_billingPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceLine" DROP CONSTRAINT "InvoiceLine_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceLine" DROP CONSTRAINT "InvoiceLine_sourceRuleId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentApplication" DROP CONSTRAINT "PaymentApplication_allocationId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentApplication" DROP CONSTRAINT "PaymentApplication_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_apartmentId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_transactionId_fkey";

-- DropTable
DROP TABLE "Apartment";

-- DropTable
DROP TABLE "Resident";

-- DropTable
DROP TABLE "Occupancy";

-- DropTable
DROP TABLE "FeeRule";

-- DropTable
DROP TABLE "ImportBatch";

-- DropTable
DROP TABLE "RawManagementRow";

-- DropTable
DROP TABLE "RawBankStatementRow";

-- DropTable
DROP TABLE "BankTransaction";

-- DropTable
DROP TABLE "TransactionParseResult";

-- DropTable
DROP TABLE "TransactionCandidate";

-- DropTable
DROP TABLE "TransactionReview";

-- DropTable
DROP TABLE "TransactionAllocation";

-- DropTable
DROP TABLE "ExceptionCase";

-- DropTable
DROP TABLE "BillingPeriod";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "InvoiceLine";

-- DropTable
DROP TABLE "PaymentApplication";

-- DropTable
DROP TABLE "Document";

-- DropEnum
DROP TYPE "ApartmentType";

-- DropEnum
DROP TYPE "ApartmentStatus";

-- DropEnum
DROP TYPE "OccupancyRole";

-- DropEnum
DROP TYPE "ImportSourceType";

-- DropEnum
DROP TYPE "ImportBatchStatus";

-- DropEnum
DROP TYPE "RawManagementRowType";

-- DropEnum
DROP TYPE "MatchStatus";

-- DropEnum
DROP TYPE "ReviewDecisionStatus";

-- DropEnum
DROP TYPE "AllocationMethod";

-- DropEnum
DROP TYPE "ExceptionType";

-- DropEnum
DROP TYPE "ExceptionStatus";

-- DropEnum
DROP TYPE "BillingPeriodStatus";

-- DropEnum
DROP TYPE "InvoiceStatus";

-- CreateTable
CREATE TABLE "can_ho" (
    "id" SERIAL NOT NULL,
    "ma_can" TEXT NOT NULL,
    "loai_can" "LoaiCan" NOT NULL,
    "ma_lo" TEXT NOT NULL,
    "ma_so" TEXT NOT NULL,
    "dien_tich_m2" DECIMAL(10,2),
    "toa_lo_goc" TEXT,
    "loai_hinh_goc" TEXT,
    "chu_ho_ten_goc" TEXT,
    "trang_thai_su_dung_goc" TEXT,
    "tinh_trang_goc" TEXT,
    "trang_thai" "TrangThaiCan" NOT NULL DEFAULT 'DANG_O',
    "ghi_chu" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "can_ho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lien_he_can_ho" (
    "id" SERIAL NOT NULL,
    "can_ho_id" INTEGER NOT NULL,
    "ten_hien_thi" TEXT NOT NULL,
    "so_dien_thoai" TEXT,
    "la_lien_he_chinh" BOOLEAN NOT NULL DEFAULT false,
    "nhan_thong_bao" BOOLEAN NOT NULL DEFAULT true,
    "zalo_link" TEXT,
    "vai_tro_lien_he" "VaiTroLienHe",
    "trang_thai_lien_he" "TrangThaiLienHe" NOT NULL DEFAULT 'DANG_DUNG',
    "thu_tu_uu_tien" INTEGER,
    "nguon_du_lieu" TEXT,
    "nguon_dong_du_lieu_tho_id" INTEGER,
    "co_can_ra_soat" BOOLEAN NOT NULL DEFAULT false,
    "ghi_chu" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lien_he_can_ho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quy_tac_phi" (
    "id" SERIAL NOT NULL,
    "loai_can" "LoaiCan" NOT NULL,
    "ma_phi" TEXT NOT NULL,
    "so_tien" DECIMAL(14,2) NOT NULL,
    "hieu_luc_tu_ngay" TIMESTAMP(3) NOT NULL,
    "hieu_luc_den_ngay" TIMESTAMP(3),
    "dang_ap_dung" BOOLEAN NOT NULL DEFAULT true,
    "ghi_chu" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quy_tac_phi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lo_nhap_du_lieu" (
    "id" SERIAL NOT NULL,
    "loai_nguon" "LoaiNguonNhap" NOT NULL,
    "ten_file" TEXT NOT NULL,
    "ma_bam_file" TEXT,
    "so_dong" INTEGER,
    "trang_thai" "TrangThaiLoNhap" NOT NULL DEFAULT 'CHO_XU_LY',
    "tong_quan_loi" TEXT,
    "metadata_json" JSONB,
    "nguoi_nhap_id" INTEGER,
    "thoi_diem_nhap" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lo_nhap_du_lieu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dong_du_lieu_quan_ly_tho" (
    "id" SERIAL NOT NULL,
    "lo_nhap_du_lieu_id" INTEGER NOT NULL,
    "ten_sheet" TEXT NOT NULL,
    "so_dong_nguon" INTEGER NOT NULL,
    "loai_dong" "LoaiDongQuanLyTho" NOT NULL,
    "header_values_json" JSONB,
    "values_json" JSONB NOT NULL,
    "mapped_row_json" JSONB,
    "payload_json" JSONB,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dong_du_lieu_quan_ly_tho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ung_vien_lien_he_can_ho" (
    "id" SERIAL NOT NULL,
    "lo_nhap_du_lieu_id" INTEGER NOT NULL,
    "dong_du_lieu_tho_id" INTEGER NOT NULL,
    "ma_can" TEXT,
    "ten_chu_ho_goc" TEXT,
    "thong_tin_cu_dan_goc" TEXT,
    "thu_tu_nguon" INTEGER,
    "ten_nguoi_su_dung_goc" TEXT,
    "so_dien_thoai_goc" TEXT,
    "thong_tin_phu_goc" TEXT,
    "trang_thai_su_dung_goc" TEXT,
    "tinh_trang_goc" TEXT,
    "ghi_chu_goc" TEXT,
    "ten_hien_thi_parse" TEXT,
    "so_dien_thoai_parse" TEXT,
    "la_lien_he_chinh_du_doan" BOOLEAN NOT NULL DEFAULT false,
    "vai_tro_du_doan" "VaiTroLienHe",
    "nhan_thong_bao_du_doan" BOOLEAN,
    "co_can_ra_soat" BOOLEAN NOT NULL DEFAULT false,
    "ly_do_ra_soat" TEXT,
    "flags_json" JSONB,
    "ghi_chu_nghiep_vu" TEXT,
    "payload_parse_json" JSONB,
    "payload_duyet_json" JSONB,
    "trang_thai_duyet" "TrangThaiDuyetUngVien" NOT NULL DEFAULT 'CHUA_DUYET',
    "ghi_chu_duyet" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ung_vien_lien_he_can_ho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dong_sao_ke_tho" (
    "id" SERIAL NOT NULL,
    "lo_nhap_du_lieu_id" INTEGER NOT NULL,
    "so_dong_nguon" INTEGER NOT NULL,
    "header_values_json" JSONB,
    "values_json" JSONB NOT NULL,
    "mapped_row_json" JSONB,
    "payload_json" JSONB,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dong_sao_ke_tho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giao_dich_ngan_hang" (
    "id" SERIAL NOT NULL,
    "lo_nhap_du_lieu_id" INTEGER NOT NULL,
    "van_tay_giao_dich" TEXT NOT NULL,
    "tham_chieu_ngan_hang" TEXT,
    "ngay_giao_dich" TIMESTAMP(3),
    "so_tien" DECIMAL(14,2) NOT NULL,
    "noi_dung_goc" TEXT NOT NULL,
    "noi_dung_chuan_hoa" TEXT,
    "ten_nguoi_chuyen" TEXT,
    "tai_khoan_nguoi_chuyen" TEXT,
    "ma_giao_dich_text" TEXT,
    "payload_goc_json" JSONB,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "giao_dich_ngan_hang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ket_qua_parse_giao_dich" (
    "id" SERIAL NOT NULL,
    "giao_dich_ngan_hang_id" INTEGER NOT NULL,
    "phien_ban_parser" TEXT,
    "ma_can_parse" TEXT,
    "trang_thai_khop" "TrangThaiKhop" NOT NULL,
    "ly_do_khop" TEXT NOT NULL,
    "do_tin_cay" DECIMAL(5,2),
    "la_giao_dich_noi_bo" BOOLEAN NOT NULL DEFAULT false,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ket_qua_parse_giao_dich_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ung_vien_khop_giao_dich" (
    "id" SERIAL NOT NULL,
    "ket_qua_parse_giao_dich_id" INTEGER NOT NULL,
    "ma_can" TEXT NOT NULL,
    "diem" DECIMAL(5,2) NOT NULL,
    "ly_do" TEXT NOT NULL,
    "thu_hang" INTEGER NOT NULL,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ung_vien_khop_giao_dich_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duyet_giao_dich" (
    "id" SERIAL NOT NULL,
    "giao_dich_ngan_hang_id" INTEGER NOT NULL,
    "trang_thai_duyet" "TrangThaiDuyetGiaoDich" NOT NULL DEFAULT 'CHUA_DUYET',
    "ma_can_duoc_chon" TEXT,
    "ghi_chu_duyet" TEXT,
    "nguoi_duyet" TEXT,
    "ngay_duyet" TIMESTAMP(3),

    CONSTRAINT "duyet_giao_dich_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phan_bo_giao_dich" (
    "id" SERIAL NOT NULL,
    "giao_dich_ngan_hang_id" INTEGER NOT NULL,
    "can_ho_id" INTEGER NOT NULL,
    "so_tien_phan_bo" DECIMAL(14,2) NOT NULL,
    "cach_phan_bo" "CachPhanBo" NOT NULL,
    "ghi_chu" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phan_bo_giao_dich_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ngoai_le_giao_dich" (
    "id" SERIAL NOT NULL,
    "giao_dich_ngan_hang_id" INTEGER NOT NULL,
    "can_ho_id" INTEGER,
    "loai_ngoai_le" TEXT NOT NULL,
    "trang_thai" TEXT NOT NULL,
    "ghi_chu" TEXT,
    "nguoi_xu_ly" TEXT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ngoai_le_giao_dich_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tai_khoan_quan_tri" (
    "id" SERIAL NOT NULL,
    "ten_dang_nhap" TEXT NOT NULL,
    "email" TEXT,
    "mat_khau_hash" TEXT NOT NULL,
    "vai_tro" "VaiTroQuanTri" NOT NULL,
    "trang_thai" "TrangThaiTaiKhoan" NOT NULL DEFAULT 'DANG_HOAT_DONG',
    "ten_hien_thi" TEXT,
    "lan_dang_nhap_cuoi" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tai_khoan_quan_tri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dong_theo_doi_thu_phi_tho" (
    "id" SERIAL NOT NULL,
    "lo_nhap_du_lieu_id" INTEGER NOT NULL,
    "ten_sheet" TEXT NOT NULL,
    "so_dong_nguon" INTEGER NOT NULL,
    "header_values_json" JSONB,
    "values_json" JSONB NOT NULL,
    "mapped_row_json" JSONB,
    "ma_can" TEXT,
    "thang_da_dong_den_hien_tai" TEXT,
    "payload_json" JSONB,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dong_theo_doi_thu_phi_tho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_trang_thai_phi_public" (
    "id" SERIAL NOT NULL,
    "lo_nhap_du_lieu_id" INTEGER,
    "ky_du_lieu" TEXT NOT NULL,
    "ten_file_nguon" TEXT,
    "trang_thai" "TrangThaiBatchPhiPublic" NOT NULL DEFAULT 'NHAP',
    "la_batch_public_hien_hanh" BOOLEAN NOT NULL DEFAULT false,
    "tong_so_can" INTEGER,
    "tong_quan_loi" TEXT,
    "metadata_json" JSONB,
    "nguoi_public_id" INTEGER,
    "public_luc" TIMESTAMP(3),
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_trang_thai_phi_public_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trang_thai_phi_can_ho_public" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "can_ho_id" INTEGER NOT NULL,
    "ma_can" TEXT NOT NULL,
    "thang_da_dong_den_hien_tai" TEXT,
    "ky_du_lieu" TEXT NOT NULL,
    "ghi_chu_public" TEXT,
    "payload_public_json" JSONB,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trang_thai_phi_can_ho_public_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "can_ho_ma_can_key" ON "can_ho"("ma_can");

-- CreateIndex
CREATE INDEX "lien_he_can_ho_can_ho_id_idx" ON "lien_he_can_ho"("can_ho_id");

-- CreateIndex
CREATE INDEX "lien_he_can_ho_so_dien_thoai_idx" ON "lien_he_can_ho"("so_dien_thoai");

-- CreateIndex
CREATE INDEX "lien_he_can_ho_nguon_dong_du_lieu_tho_id_idx" ON "lien_he_can_ho"("nguon_dong_du_lieu_tho_id");

-- CreateIndex
CREATE INDEX "quy_tac_phi_loai_can_ma_phi_hieu_luc_tu_ngay_idx" ON "quy_tac_phi"("loai_can", "ma_phi", "hieu_luc_tu_ngay");

-- CreateIndex
CREATE INDEX "lo_nhap_du_lieu_nguoi_nhap_id_idx" ON "lo_nhap_du_lieu"("nguoi_nhap_id");

-- CreateIndex
CREATE INDEX "dong_du_lieu_quan_ly_tho_lo_nhap_du_lieu_id_ten_sheet_so_do_idx" ON "dong_du_lieu_quan_ly_tho"("lo_nhap_du_lieu_id", "ten_sheet", "so_dong_nguon");

-- CreateIndex
CREATE INDEX "ung_vien_lien_he_can_ho_lo_nhap_du_lieu_id_idx" ON "ung_vien_lien_he_can_ho"("lo_nhap_du_lieu_id");

-- CreateIndex
CREATE INDEX "ung_vien_lien_he_can_ho_ma_can_idx" ON "ung_vien_lien_he_can_ho"("ma_can");

-- CreateIndex
CREATE INDEX "dong_sao_ke_tho_lo_nhap_du_lieu_id_so_dong_nguon_idx" ON "dong_sao_ke_tho"("lo_nhap_du_lieu_id", "so_dong_nguon");

-- CreateIndex
CREATE UNIQUE INDEX "giao_dich_ngan_hang_van_tay_giao_dich_key" ON "giao_dich_ngan_hang"("van_tay_giao_dich");

-- CreateIndex
CREATE UNIQUE INDEX "giao_dich_ngan_hang_tham_chieu_ngan_hang_key" ON "giao_dich_ngan_hang"("tham_chieu_ngan_hang");

-- CreateIndex
CREATE INDEX "giao_dich_ngan_hang_lo_nhap_du_lieu_id_idx" ON "giao_dich_ngan_hang"("lo_nhap_du_lieu_id");

-- CreateIndex
CREATE INDEX "giao_dich_ngan_hang_ngay_giao_dich_idx" ON "giao_dich_ngan_hang"("ngay_giao_dich");

-- CreateIndex
CREATE UNIQUE INDEX "ket_qua_parse_giao_dich_giao_dich_ngan_hang_id_key" ON "ket_qua_parse_giao_dich"("giao_dich_ngan_hang_id");

-- CreateIndex
CREATE INDEX "ung_vien_khop_giao_dich_ket_qua_parse_giao_dich_id_thu_hang_idx" ON "ung_vien_khop_giao_dich"("ket_qua_parse_giao_dich_id", "thu_hang");

-- CreateIndex
CREATE INDEX "duyet_giao_dich_giao_dich_ngan_hang_id_idx" ON "duyet_giao_dich"("giao_dich_ngan_hang_id");

-- CreateIndex
CREATE INDEX "phan_bo_giao_dich_giao_dich_ngan_hang_id_idx" ON "phan_bo_giao_dich"("giao_dich_ngan_hang_id");

-- CreateIndex
CREATE INDEX "phan_bo_giao_dich_can_ho_id_idx" ON "phan_bo_giao_dich"("can_ho_id");

-- CreateIndex
CREATE INDEX "ngoai_le_giao_dich_giao_dich_ngan_hang_id_idx" ON "ngoai_le_giao_dich"("giao_dich_ngan_hang_id");

-- CreateIndex
CREATE INDEX "ngoai_le_giao_dich_can_ho_id_idx" ON "ngoai_le_giao_dich"("can_ho_id");

-- CreateIndex
CREATE UNIQUE INDEX "tai_khoan_quan_tri_ten_dang_nhap_key" ON "tai_khoan_quan_tri"("ten_dang_nhap");

-- CreateIndex
CREATE UNIQUE INDEX "tai_khoan_quan_tri_email_key" ON "tai_khoan_quan_tri"("email");

-- CreateIndex
CREATE INDEX "dong_theo_doi_thu_phi_tho_lo_nhap_du_lieu_id_ten_sheet_so_d_idx" ON "dong_theo_doi_thu_phi_tho"("lo_nhap_du_lieu_id", "ten_sheet", "so_dong_nguon");

-- CreateIndex
CREATE INDEX "dong_theo_doi_thu_phi_tho_ma_can_idx" ON "dong_theo_doi_thu_phi_tho"("ma_can");

-- CreateIndex
CREATE INDEX "batch_trang_thai_phi_public_trang_thai_la_batch_public_hien_idx" ON "batch_trang_thai_phi_public"("trang_thai", "la_batch_public_hien_hanh");

-- CreateIndex
CREATE INDEX "batch_trang_thai_phi_public_lo_nhap_du_lieu_id_idx" ON "batch_trang_thai_phi_public"("lo_nhap_du_lieu_id");

-- CreateIndex
CREATE INDEX "batch_trang_thai_phi_public_nguoi_public_id_idx" ON "batch_trang_thai_phi_public"("nguoi_public_id");

-- CreateIndex
CREATE INDEX "trang_thai_phi_can_ho_public_ma_can_idx" ON "trang_thai_phi_can_ho_public"("ma_can");

-- CreateIndex
CREATE INDEX "trang_thai_phi_can_ho_public_can_ho_id_idx" ON "trang_thai_phi_can_ho_public"("can_ho_id");

-- CreateIndex
CREATE UNIQUE INDEX "trang_thai_phi_can_ho_public_batch_id_can_ho_id_key" ON "trang_thai_phi_can_ho_public"("batch_id", "can_ho_id");

-- AddForeignKey
ALTER TABLE "lien_he_can_ho" ADD CONSTRAINT "lien_he_can_ho_can_ho_id_fkey" FOREIGN KEY ("can_ho_id") REFERENCES "can_ho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lien_he_can_ho" ADD CONSTRAINT "lien_he_can_ho_nguon_dong_du_lieu_tho_id_fkey" FOREIGN KEY ("nguon_dong_du_lieu_tho_id") REFERENCES "dong_du_lieu_quan_ly_tho"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_nhap_du_lieu" ADD CONSTRAINT "lo_nhap_du_lieu_nguoi_nhap_id_fkey" FOREIGN KEY ("nguoi_nhap_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dong_du_lieu_quan_ly_tho" ADD CONSTRAINT "dong_du_lieu_quan_ly_tho_lo_nhap_du_lieu_id_fkey" FOREIGN KEY ("lo_nhap_du_lieu_id") REFERENCES "lo_nhap_du_lieu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ung_vien_lien_he_can_ho" ADD CONSTRAINT "ung_vien_lien_he_can_ho_lo_nhap_du_lieu_id_fkey" FOREIGN KEY ("lo_nhap_du_lieu_id") REFERENCES "lo_nhap_du_lieu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ung_vien_lien_he_can_ho" ADD CONSTRAINT "ung_vien_lien_he_can_ho_dong_du_lieu_tho_id_fkey" FOREIGN KEY ("dong_du_lieu_tho_id") REFERENCES "dong_du_lieu_quan_ly_tho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dong_sao_ke_tho" ADD CONSTRAINT "dong_sao_ke_tho_lo_nhap_du_lieu_id_fkey" FOREIGN KEY ("lo_nhap_du_lieu_id") REFERENCES "lo_nhap_du_lieu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_ngan_hang" ADD CONSTRAINT "giao_dich_ngan_hang_lo_nhap_du_lieu_id_fkey" FOREIGN KEY ("lo_nhap_du_lieu_id") REFERENCES "lo_nhap_du_lieu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ket_qua_parse_giao_dich" ADD CONSTRAINT "ket_qua_parse_giao_dich_giao_dich_ngan_hang_id_fkey" FOREIGN KEY ("giao_dich_ngan_hang_id") REFERENCES "giao_dich_ngan_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ung_vien_khop_giao_dich" ADD CONSTRAINT "ung_vien_khop_giao_dich_ket_qua_parse_giao_dich_id_fkey" FOREIGN KEY ("ket_qua_parse_giao_dich_id") REFERENCES "ket_qua_parse_giao_dich"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duyet_giao_dich" ADD CONSTRAINT "duyet_giao_dich_giao_dich_ngan_hang_id_fkey" FOREIGN KEY ("giao_dich_ngan_hang_id") REFERENCES "giao_dich_ngan_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phan_bo_giao_dich" ADD CONSTRAINT "phan_bo_giao_dich_giao_dich_ngan_hang_id_fkey" FOREIGN KEY ("giao_dich_ngan_hang_id") REFERENCES "giao_dich_ngan_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phan_bo_giao_dich" ADD CONSTRAINT "phan_bo_giao_dich_can_ho_id_fkey" FOREIGN KEY ("can_ho_id") REFERENCES "can_ho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ngoai_le_giao_dich" ADD CONSTRAINT "ngoai_le_giao_dich_giao_dich_ngan_hang_id_fkey" FOREIGN KEY ("giao_dich_ngan_hang_id") REFERENCES "giao_dich_ngan_hang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ngoai_le_giao_dich" ADD CONSTRAINT "ngoai_le_giao_dich_can_ho_id_fkey" FOREIGN KEY ("can_ho_id") REFERENCES "can_ho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dong_theo_doi_thu_phi_tho" ADD CONSTRAINT "dong_theo_doi_thu_phi_tho_lo_nhap_du_lieu_id_fkey" FOREIGN KEY ("lo_nhap_du_lieu_id") REFERENCES "lo_nhap_du_lieu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_trang_thai_phi_public" ADD CONSTRAINT "batch_trang_thai_phi_public_lo_nhap_du_lieu_id_fkey" FOREIGN KEY ("lo_nhap_du_lieu_id") REFERENCES "lo_nhap_du_lieu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_trang_thai_phi_public" ADD CONSTRAINT "batch_trang_thai_phi_public_nguoi_public_id_fkey" FOREIGN KEY ("nguoi_public_id") REFERENCES "tai_khoan_quan_tri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trang_thai_phi_can_ho_public" ADD CONSTRAINT "trang_thai_phi_can_ho_public_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch_trang_thai_phi_public"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trang_thai_phi_can_ho_public" ADD CONSTRAINT "trang_thai_phi_can_ho_public_can_ho_id_fkey" FOREIGN KEY ("can_ho_id") REFERENCES "can_ho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

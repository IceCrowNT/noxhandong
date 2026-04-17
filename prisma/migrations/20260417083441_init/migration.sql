-- CreateEnum
CREATE TYPE "ApartmentType" AS ENUM ('CHUNG_CU', 'LIEN_KE');

-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('DANG_O', 'TRONG', 'KHOA');

-- CreateEnum
CREATE TYPE "OccupancyRole" AS ENUM ('CHU_HO', 'THUE_CHINH', 'THANH_VIEN');

-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('MANAGEMENT_WORKBOOK', 'BANK_STATEMENT', 'RECEIPT_IMPORT');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RawManagementRowType" AS ENUM ('CUSTOMER', 'FEE_HISTORY', 'OTHER');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('EXACT_MATCH', 'NORMALIZED_MATCH', 'MULTI_MATCH', 'INVALID_CODE', 'UNPARSED', 'IGNORED_INTERNAL', 'NEED_REVIEW', 'MANUAL_FIXED', 'APPROVED');

-- CreateEnum
CREATE TYPE "ReviewDecisionStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AllocationMethod" AS ENUM ('SINGLE', 'MULTI_EXACT', 'MULTI_PRORATED', 'MANUAL');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('AN_DIEN', 'CK_NHAM', 'NOP_HO', 'GHI_SAI_MA_CAN', 'THIEU_TIEN', 'THUA_TIEN', 'KHONG_RO_CAN', 'NOI_BO');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingPeriodStatus" AS ENUM ('OPEN', 'CLOSED', 'LOCKED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PARTIAL', 'PAID', 'OVERPAID', 'VOID');

-- CreateTable
CREATE TABLE "Apartment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "apartmentType" "ApartmentType" NOT NULL,
    "blockCode" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "areaM2" DECIMAL(10,2),
    "status" "ApartmentStatus" NOT NULL DEFAULT 'DANG_O',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "zaloLink" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occupancy" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "role" "OccupancyRole" NOT NULL,
    "receiveNotifications" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Occupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRule" (
    "id" TEXT NOT NULL,
    "apartmentType" "ApartmentType" NOT NULL,
    "feeCode" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "sourceType" "ImportSourceType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT,
    "mimeType" TEXT,
    "rowCount" INTEGER,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'PENDING',
    "errorSummary" TEXT,
    "metadata" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawManagementRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "rowType" "RawManagementRowType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawManagementRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawBankStatementRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawBankStatementRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "transactionFingerprint" TEXT NOT NULL,
    "bankReference" TEXT,
    "transactionDate" TIMESTAMP(3),
    "amount" DECIMAL(14,2) NOT NULL,
    "descriptionRaw" TEXT NOT NULL,
    "descriptionNormalized" TEXT,
    "senderName" TEXT,
    "senderAccount" TEXT,
    "transactionIdText" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionParseResult" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "parserVersion" TEXT,
    "parsedApartmentCode" TEXT,
    "matchStatus" "MatchStatus" NOT NULL,
    "matchReason" TEXT NOT NULL,
    "matchConfidence" DECIMAL(5,2),
    "isInternalTransaction" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionParseResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCandidate" (
    "id" TEXT NOT NULL,
    "parseResultId" TEXT NOT NULL,
    "apartmentCode" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "rankOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionReview" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "decisionStatus" "ReviewDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "selectedApartmentCode" TEXT,
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionAllocation" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "apartmentId" TEXT,
    "allocatedAmount" DECIMAL(14,2) NOT NULL,
    "allocationMethod" "AllocationMethod" NOT NULL,
    "allocationNote" TEXT,
    "sequenceNo" INTEGER NOT NULL DEFAULT 1,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExceptionCase" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "apartmentId" TEXT,
    "exceptionType" "ExceptionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExceptionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingPeriod" (
    "id" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "BillingPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "billingPeriodId" TEXT NOT NULL,
    "carryOverAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCharge" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "feeCode" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sourceRuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentApplication" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "appliedAmount" DECIMAL(14,2) NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "PaymentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT,
    "transactionId" TEXT,
    "documentType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalFileName" TEXT,
    "documentDate" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_code_key" ON "Apartment"("code");

-- CreateIndex
CREATE INDEX "Occupancy_apartmentId_idx" ON "Occupancy"("apartmentId");

-- CreateIndex
CREATE INDEX "Occupancy_residentId_idx" ON "Occupancy"("residentId");

-- CreateIndex
CREATE INDEX "FeeRule_apartmentType_feeCode_effectiveFrom_idx" ON "FeeRule"("apartmentType", "feeCode", "effectiveFrom");

-- CreateIndex
CREATE INDEX "ImportBatch_sourceType_importedAt_idx" ON "ImportBatch"("sourceType", "importedAt");

-- CreateIndex
CREATE INDEX "RawManagementRow_batchId_sheetName_rowIndex_idx" ON "RawManagementRow"("batchId", "sheetName", "rowIndex");

-- CreateIndex
CREATE INDEX "RawBankStatementRow_batchId_rowIndex_idx" ON "RawBankStatementRow"("batchId", "rowIndex");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_transactionFingerprint_key" ON "BankTransaction"("transactionFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_bankReference_key" ON "BankTransaction"("bankReference");

-- CreateIndex
CREATE INDEX "BankTransaction_batchId_idx" ON "BankTransaction"("batchId");

-- CreateIndex
CREATE INDEX "BankTransaction_transactionDate_idx" ON "BankTransaction"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionParseResult_transactionId_key" ON "TransactionParseResult"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionCandidate_parseResultId_rankOrder_idx" ON "TransactionCandidate"("parseResultId", "rankOrder");

-- CreateIndex
CREATE INDEX "TransactionReview_transactionId_createdAt_idx" ON "TransactionReview"("transactionId", "createdAt");

-- CreateIndex
CREATE INDEX "TransactionAllocation_transactionId_sequenceNo_idx" ON "TransactionAllocation"("transactionId", "sequenceNo");

-- CreateIndex
CREATE INDEX "TransactionAllocation_apartmentId_idx" ON "TransactionAllocation"("apartmentId");

-- CreateIndex
CREATE INDEX "ExceptionCase_transactionId_idx" ON "ExceptionCase"("transactionId");

-- CreateIndex
CREATE INDEX "ExceptionCase_apartmentId_idx" ON "ExceptionCase"("apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPeriod_periodKey_key" ON "BillingPeriod"("periodKey");

-- CreateIndex
CREATE INDEX "BillingPeriod_year_month_idx" ON "BillingPeriod"("year", "month");

-- CreateIndex
CREATE INDEX "Invoice_billingPeriodId_idx" ON "Invoice"("billingPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_apartmentId_billingPeriodId_key" ON "Invoice"("apartmentId", "billingPeriodId");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentApplication_allocationId_idx" ON "PaymentApplication"("allocationId");

-- CreateIndex
CREATE INDEX "PaymentApplication_invoiceId_idx" ON "PaymentApplication"("invoiceId");

-- CreateIndex
CREATE INDEX "Document_apartmentId_idx" ON "Document"("apartmentId");

-- CreateIndex
CREATE INDEX "Document_transactionId_idx" ON "Document"("transactionId");

-- AddForeignKey
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occupancy" ADD CONSTRAINT "Occupancy_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawManagementRow" ADD CONSTRAINT "RawManagementRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawBankStatementRow" ADD CONSTRAINT "RawBankStatementRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionParseResult" ADD CONSTRAINT "TransactionParseResult_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "BankTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCandidate" ADD CONSTRAINT "TransactionCandidate_parseResultId_fkey" FOREIGN KEY ("parseResultId") REFERENCES "TransactionParseResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionReview" ADD CONSTRAINT "TransactionReview_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "BankTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "BankTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionAllocation" ADD CONSTRAINT "TransactionAllocation_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExceptionCase" ADD CONSTRAINT "ExceptionCase_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "BankTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExceptionCase" ADD CONSTRAINT "ExceptionCase_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billingPeriodId_fkey" FOREIGN KEY ("billingPeriodId") REFERENCES "BillingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_sourceRuleId_fkey" FOREIGN KEY ("sourceRuleId") REFERENCES "FeeRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentApplication" ADD CONSTRAINT "PaymentApplication_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "TransactionAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentApplication" ADD CONSTRAINT "PaymentApplication_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "BankTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

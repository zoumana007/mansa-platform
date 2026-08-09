CREATE TYPE "ReconciliationBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_MISMATCHES', 'FAILED');
CREATE TYPE "ReconciliationItemStatus" AS ENUM ('PENDING', 'MATCHED', 'PARTIALLY_MATCHED', 'MISMATCHED', 'RESOLVED', 'IGNORED');
CREATE TYPE "ReconciliationMismatchReason" AS ENUM ('MISSING_INTERNAL_TRANSACTION', 'MISSING_PROVIDER_TRANSACTION', 'AMOUNT_MISMATCH', 'CURRENCY_MISMATCH', 'STATUS_MISMATCH', 'DUPLICATE_PROVIDER_TRANSACTION', 'OTHER');

CREATE TABLE "ReconciliationBatch" (
  "id" UUID NOT NULL,
  "providerId" TEXT NOT NULL,
  "sourceFileReference" TEXT,
  "sourceFingerprint" TEXT,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "status" "ReconciliationBatchStatus" NOT NULL DEFAULT 'PENDING',
  "totalItems" INTEGER NOT NULL DEFAULT 0,
  "matchedItems" INTEGER NOT NULL DEFAULT 0,
  "mismatchedItems" INTEGER NOT NULL DEFAULT 0,
  "resolvedItems" INTEGER NOT NULL DEFAULT 0,
  "ignoredItems" INTEGER NOT NULL DEFAULT 0,
  "failureReason" TEXT,
  "metadata" JSONB,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReconciliationBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReconciliationItem" (
  "id" UUID NOT NULL,
  "batchId" UUID NOT NULL,
  "internalReference" TEXT,
  "providerReference" TEXT,
  "internalAmountMinor" BIGINT,
  "providerAmountMinor" BIGINT,
  "currency" CHAR(3) NOT NULL,
  "internalStatus" TEXT,
  "providerStatus" TEXT,
  "providerOccurrenceCount" INTEGER NOT NULL DEFAULT 1,
  "status" "ReconciliationItemStatus" NOT NULL DEFAULT 'PENDING',
  "mismatchReason" "ReconciliationMismatchReason",
  "rawLineFingerprint" TEXT,
  "resolutionNote" TEXT,
  "resolutionReasonCode" TEXT,
  "resolvedBy" TEXT,
  "resolutionCorrelationId" TEXT,
  "resolutionIdempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReconciliationBatch_providerId_sourceFingerprint_key"
  ON "ReconciliationBatch"("providerId", "sourceFingerprint");
CREATE INDEX "ReconciliationBatch_providerId_status_createdAt_idx"
  ON "ReconciliationBatch"("providerId", "status", "createdAt");
CREATE INDEX "ReconciliationBatch_periodStart_periodEnd_idx"
  ON "ReconciliationBatch"("periodStart", "periodEnd");

CREATE UNIQUE INDEX "ReconciliationItem_resolutionIdempotencyKey_key"
  ON "ReconciliationItem"("resolutionIdempotencyKey");
CREATE INDEX "ReconciliationItem_batchId_status_idx"
  ON "ReconciliationItem"("batchId", "status");
CREATE INDEX "ReconciliationItem_batchId_mismatchReason_idx"
  ON "ReconciliationItem"("batchId", "mismatchReason");
CREATE INDEX "ReconciliationItem_internalReference_idx"
  ON "ReconciliationItem"("internalReference");
CREATE INDEX "ReconciliationItem_providerReference_idx"
  ON "ReconciliationItem"("providerReference");
CREATE INDEX "ReconciliationItem_createdAt_id_idx"
  ON "ReconciliationItem"("createdAt", "id");

ALTER TABLE "ReconciliationItem"
  ADD CONSTRAINT "ReconciliationItem_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "ReconciliationBatch"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

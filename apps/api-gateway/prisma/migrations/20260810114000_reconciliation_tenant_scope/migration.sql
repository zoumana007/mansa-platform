-- Isolation tenant du rapprochement.
-- Cette migration refuse explicitement d'inventer un tenant pour des lignes existantes.
-- Sur une base déjà peuplée, effectuer d'abord le backfill contrôlé décrit dans
-- docs/reconciliation-tenant-migration-runbook.md puis rejouer la migration adaptée.

ALTER TABLE "ReconciliationBatch" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "ReconciliationItem" ADD COLUMN "organizationId" TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "ReconciliationBatch") OR EXISTS (SELECT 1 FROM "ReconciliationItem") THEN
    RAISE EXCEPTION 'Reconciliation tenant migration requires an explicit organizationId backfill before NOT NULL enforcement';
  END IF;
END
$$;

ALTER TABLE "ReconciliationBatch" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ReconciliationItem" ALTER COLUMN "organizationId" SET NOT NULL;

DROP INDEX IF EXISTS "ReconciliationBatch_providerId_sourceFingerprint_key";
DROP INDEX IF EXISTS "ReconciliationBatch_providerId_status_createdAt_idx";
DROP INDEX IF EXISTS "ReconciliationBatch_periodStart_periodEnd_idx";
DROP INDEX IF EXISTS "ReconciliationItem_resolutionIdempotencyKey_key";
DROP INDEX IF EXISTS "ReconciliationItem_batchId_status_idx";
DROP INDEX IF EXISTS "ReconciliationItem_batchId_mismatchReason_idx";
DROP INDEX IF EXISTS "ReconciliationItem_internalReference_idx";
DROP INDEX IF EXISTS "ReconciliationItem_providerReference_idx";
DROP INDEX IF EXISTS "ReconciliationItem_createdAt_id_idx";

CREATE UNIQUE INDEX "ReconciliationBatch_organizationId_providerId_sourceFingerprint_key"
  ON "ReconciliationBatch"("organizationId", "providerId", "sourceFingerprint");
CREATE INDEX "ReconciliationBatch_organizationId_status_createdAt_idx"
  ON "ReconciliationBatch"("organizationId", "status", "createdAt");
CREATE INDEX "ReconciliationBatch_organizationId_providerId_status_createdAt_idx"
  ON "ReconciliationBatch"("organizationId", "providerId", "status", "createdAt");
CREATE INDEX "ReconciliationBatch_organizationId_periodStart_periodEnd_idx"
  ON "ReconciliationBatch"("organizationId", "periodStart", "periodEnd");

CREATE UNIQUE INDEX "ReconciliationItem_organizationId_resolutionIdempotencyKey_key"
  ON "ReconciliationItem"("organizationId", "resolutionIdempotencyKey");
CREATE INDEX "ReconciliationItem_organizationId_batchId_status_idx"
  ON "ReconciliationItem"("organizationId", "batchId", "status");
CREATE INDEX "ReconciliationItem_organizationId_batchId_mismatchReason_idx"
  ON "ReconciliationItem"("organizationId", "batchId", "mismatchReason");
CREATE INDEX "ReconciliationItem_organizationId_internalReference_idx"
  ON "ReconciliationItem"("organizationId", "internalReference");
CREATE INDEX "ReconciliationItem_organizationId_providerReference_idx"
  ON "ReconciliationItem"("organizationId", "providerReference");
CREATE INDEX "ReconciliationItem_organizationId_createdAt_id_idx"
  ON "ReconciliationItem"("organizationId", "createdAt", "id");

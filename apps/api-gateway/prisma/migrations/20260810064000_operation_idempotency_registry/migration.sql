CREATE TABLE "OperationIdempotencyRecord" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestFingerprint" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "response" JSONB,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "OperationIdempotencyRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OperationIdempotencyRecord_status_check" CHECK ("status" IN ('PROCESSING', 'COMPLETED'))
);

CREATE UNIQUE INDEX "OperationIdempotencyRecord_scope_org_key_key"
  ON "OperationIdempotencyRecord"("scope", "organizationId", "idempotencyKey");

CREATE INDEX "OperationIdempotencyRecord_org_created_idx"
  ON "OperationIdempotencyRecord"("organizationId", "createdAt");

CREATE INDEX "OperationIdempotencyRecord_correlation_idx"
  ON "OperationIdempotencyRecord"("correlationId");

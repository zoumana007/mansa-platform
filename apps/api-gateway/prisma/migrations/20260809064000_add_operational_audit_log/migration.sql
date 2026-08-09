CREATE TABLE "OperationalAuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "correlationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalAuditLog_correlationId_idx" ON "OperationalAuditLog"("correlationId");
CREATE INDEX "OperationalAuditLog_action_occurredAt_idx" ON "OperationalAuditLog"("action", "occurredAt");
CREATE INDEX "OperationalAuditLog_resourceType_resourceId_idx" ON "OperationalAuditLog"("resourceType", "resourceId");
CREATE INDEX "OperationalAuditLog_actorId_occurredAt_idx" ON "OperationalAuditLog"("actorId", "occurredAt");

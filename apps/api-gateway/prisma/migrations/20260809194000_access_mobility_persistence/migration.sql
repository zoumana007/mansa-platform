CREATE TABLE "AccessCredentialRecord" (
  "id" UUID NOT NULL,
  "organizationId" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "credentialType" TEXT NOT NULL,
  "publicReference" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessCredentialRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessEntitlementRecord" (
  "id" UUID NOT NULL,
  "organizationId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "useCase" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3),
  "allowedLocationIds" JSONB,
  "allowedProductCodes" JSONB,
  "maxUsesPerPeriod" INTEGER,
  "period" TEXT,
  "amountLimitMinor" BIGINT,
  "amountLimitCurrency" CHAR(3),
  "refundPolicy" TEXT,
  "outageCompensationPolicy" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessEntitlementRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessServiceAvailabilityRecord" (
  "id" UUID NOT NULL,
  "organizationId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "laneKey" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL,
  "matchPolicy" TEXT,
  "availablePaymentMethods" JSONB NOT NULL,
  "equipment" JSONB NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "expectedRecoveryAt" TIMESTAMP(3),
  "alternativeLocationId" TEXT,
  "publicMessageKey" TEXT,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessServiceAvailabilityRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessTerminalProfileRecord" (
  "terminalId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "laneKey" TEXT NOT NULL DEFAULT '',
  "heightProfile" TEXT NOT NULL,
  "paymentMethods" JSONB NOT NULL,
  "qrModes" JSONB,
  "supportedCurrencies" JSONB NOT NULL,
  "acceptedBillDenominationsMinor" JSONB,
  "acceptedCoinDenominationsMinor" JSONB,
  "canGiveChange" BOOLEAN NOT NULL DEFAULT false,
  "receiptPrinter" BOOLEAN NOT NULL DEFAULT false,
  "intercom" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessTerminalProfileRecord_pkey" PRIMARY KEY ("terminalId")
);

CREATE TABLE "AccessDecisionRecord" (
  "id" UUID NOT NULL,
  "organizationId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "credentialId" TEXT,
  "subjectId" TEXT,
  "entitlementId" TEXT,
  "approvedAmountMinor" BIGINT,
  "approvedAmountCurrency" CHAR(3),
  "fallbackPaymentMethods" JSONB,
  "alternativeLocationId" TEXT,
  "publicMessageKey" TEXT,
  "decidedAt" TIMESTAMP(3) NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessDecisionRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessUsageRecord" (
  "id" UUID NOT NULL,
  "organizationId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "credentialId" TEXT,
  "subjectId" TEXT,
  "entitlementId" TEXT,
  "locationId" TEXT NOT NULL,
  "terminalId" TEXT,
  "chargedAmountMinor" BIGINT,
  "chargedAmountCurrency" CHAR(3),
  "paymentMethod" TEXT,
  "externalReference" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessUsageRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessQuotaCounter" (
  "id" UUID NOT NULL,
  "organizationId" TEXT NOT NULL,
  "entitlementId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "used" INTEGER NOT NULL DEFAULT 0,
  "limit" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccessQuotaCounter_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AccessQuotaCounter_non_negative" CHECK ("used" >= 0 AND "limit" >= 0 AND "used" <= "limit")
);

CREATE TABLE "AccessQuotaReservationRecord" (
  "id" UUID NOT NULL,
  "organizationId" TEXT NOT NULL,
  "entitlementId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "correlationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessQuotaReservationRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessCredentialRecord_org_type_ref_key" ON "AccessCredentialRecord"("organizationId", "credentialType", "publicReference");
CREATE INDEX "AccessCredentialRecord_org_subject_status_idx" ON "AccessCredentialRecord"("organizationId", "subjectId", "status");
CREATE INDEX "AccessEntitlementRecord_org_subject_case_status_idx" ON "AccessEntitlementRecord"("organizationId", "subjectId", "useCase", "status");
CREATE INDEX "AccessEntitlementRecord_org_validity_idx" ON "AccessEntitlementRecord"("organizationId", "validFrom", "validUntil");
CREATE UNIQUE INDEX "AccessServiceAvailabilityRecord_org_location_lane_key" ON "AccessServiceAvailabilityRecord"("organizationId", "locationId", "laneKey");
CREATE INDEX "AccessServiceAvailabilityRecord_org_status_updated_idx" ON "AccessServiceAvailabilityRecord"("organizationId", "status", "updatedAt");
CREATE INDEX "AccessTerminalProfileRecord_org_location_lane_idx" ON "AccessTerminalProfileRecord"("organizationId", "locationId", "laneKey");
CREATE UNIQUE INDEX "AccessDecisionRecord_org_request_key" ON "AccessDecisionRecord"("organizationId", "requestId");
CREATE INDEX "AccessDecisionRecord_org_decided_idx" ON "AccessDecisionRecord"("organizationId", "decidedAt");
CREATE INDEX "AccessDecisionRecord_correlation_idx" ON "AccessDecisionRecord"("correlationId");
CREATE UNIQUE INDEX "AccessUsageRecord_org_request_key" ON "AccessUsageRecord"("organizationId", "requestId");
CREATE INDEX "AccessUsageRecord_org_entitlement_occurred_idx" ON "AccessUsageRecord"("organizationId", "entitlementId", "occurredAt");
CREATE INDEX "AccessUsageRecord_org_location_occurred_idx" ON "AccessUsageRecord"("organizationId", "locationId", "occurredAt");
CREATE INDEX "AccessUsageRecord_correlation_idx" ON "AccessUsageRecord"("correlationId");
CREATE UNIQUE INDEX "AccessQuotaCounter_org_entitlement_period_key" ON "AccessQuotaCounter"("organizationId", "entitlementId", "periodStart");
CREATE INDEX "AccessQuotaCounter_org_period_end_idx" ON "AccessQuotaCounter"("organizationId", "periodEnd");
CREATE UNIQUE INDEX "AccessQuotaReservationRecord_org_entitlement_period_request_key" ON "AccessQuotaReservationRecord"("organizationId", "entitlementId", "periodStart", "requestId");
CREATE INDEX "AccessQuotaReservationRecord_org_entitlement_period_idx" ON "AccessQuotaReservationRecord"("organizationId", "entitlementId", "periodStart");
CREATE INDEX "AccessQuotaReservationRecord_correlation_idx" ON "AccessQuotaReservationRecord"("correlationId");

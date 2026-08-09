import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AccessApplicationRepository,
  AccessDecisionJournal,
  AccessQuotaReservation,
} from '@mansa/contracts/access-application-service';
import type {
  AccessCredential,
  AccessDecision,
  AccessEntitlement,
  AccessRequest,
  AccessServiceAvailability,
  AccessTerminalProfile,
  RecordAccessUsageCommand,
} from '@mansa/contracts/access-mobility';
import { calculateAccessQuotaWindow } from '@mansa/contracts/access-persistence';

import { PrismaService } from '../prisma.service';

function strings(value: Prisma.JsonValue | null): readonly string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function numbers(value: Prisma.JsonValue | null): readonly number[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : undefined;
}

function metadata(value: Prisma.JsonValue | null): Readonly<Record<string, string>> | undefined {
  if (value === null || Array.isArray(value) || typeof value !== 'object') return undefined;
  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  return Object.fromEntries(entries);
}

function credentialFromRow(row: Awaited<ReturnType<PrismaService['accessCredentialRecord']['findFirstOrThrow']>>): AccessCredential {
  const parsedMetadata = metadata(row.metadata);
  return {
    id: row.id,
    organizationId: row.organizationId,
    subjectType: row.subjectType as AccessCredential['subjectType'],
    subjectId: row.subjectId,
    credentialType: row.credentialType as AccessCredential['credentialType'],
    publicReference: row.publicReference,
    status: row.status as AccessCredential['status'],
    ...(row.validFrom ? { validFrom: row.validFrom.toISOString() } : {}),
    ...(row.validUntil ? { validUntil: row.validUntil.toISOString() } : {}),
    ...(parsedMetadata ? { metadata: parsedMetadata } : {}),
  };
}

function entitlementFromRow(row: Awaited<ReturnType<PrismaService['accessEntitlementRecord']['findFirstOrThrow']>>): AccessEntitlement {
  const allowedLocationIds = strings(row.allowedLocationIds);
  const allowedProductCodes = strings(row.allowedProductCodes);
  const parsedMetadata = metadata(row.metadata);
  return {
    id: row.id,
    organizationId: row.organizationId,
    subjectId: row.subjectId,
    useCase: row.useCase as AccessEntitlement['useCase'],
    status: row.status as AccessEntitlement['status'],
    validFrom: row.validFrom.toISOString(),
    ...(row.validUntil ? { validUntil: row.validUntil.toISOString() } : {}),
    ...(allowedLocationIds ? { allowedLocationIds } : {}),
    ...(allowedProductCodes ? { allowedProductCodes } : {}),
    ...(row.maxUsesPerPeriod === null ? {} : { maxUsesPerPeriod: row.maxUsesPerPeriod }),
    ...(row.period === null ? {} : { period: row.period as NonNullable<AccessEntitlement['period']> }),
    ...(row.amountLimitMinor === null || row.amountLimitCurrency === null
      ? {}
      : { amountLimit: { amountMinor: row.amountLimitMinor.toString(), currency: row.amountLimitCurrency } }),
    ...(row.refundPolicy === null ? {} : { refundPolicy: row.refundPolicy as NonNullable<AccessEntitlement['refundPolicy']> }),
    ...(row.outageCompensationPolicy === null
      ? {}
      : { outageCompensationPolicy: row.outageCompensationPolicy as NonNullable<AccessEntitlement['outageCompensationPolicy']> }),
    ...(parsedMetadata ? { metadata: parsedMetadata } : {}),
  };
}

@Injectable()
export class PrismaAccessRepository
  implements AccessApplicationRepository, AccessQuotaReservation, AccessDecisionJournal
{
  public constructor(private readonly prisma: PrismaService) {}

  public async resolveCredential(request: AccessRequest): Promise<AccessCredential | undefined> {
    const row = await this.prisma.accessCredentialRecord.findFirst({
      where: {
        organizationId: request.organizationId,
        credentialType: request.credentialType,
        publicReference: request.credentialReference,
      },
    });
    return row ? credentialFromRow(row) : undefined;
  }

  public async resolveEntitlement(
    request: AccessRequest,
    credential: AccessCredential,
  ): Promise<AccessEntitlement | undefined> {
    const row = await this.prisma.accessEntitlementRecord.findFirst({
      where: {
        organizationId: request.organizationId,
        subjectId: credential.subjectId,
        useCase: request.useCase,
      },
      orderBy: [{ validFrom: 'desc' }, { id: 'desc' }],
    });
    return row ? entitlementFromRow(row) : undefined;
  }

  public async loadServiceAvailability(request: AccessRequest): Promise<AccessServiceAvailability | undefined> {
    const laneKey = request.terminalId
      ? (await this.prisma.accessTerminalProfileRecord.findUnique({
          where: { terminalId: request.terminalId },
          select: { laneKey: true },
        }))?.laneKey ?? ''
      : '';
    const row = await this.prisma.accessServiceAvailabilityRecord.findUnique({
      where: {
        organizationId_locationId_laneKey: {
          organizationId: request.organizationId,
          locationId: request.locationId,
          laneKey,
        },
      },
    });
    if (!row) return undefined;
    const availablePaymentMethods = strings(row.availablePaymentMethods) ?? [];
    return {
      organizationId: row.organizationId,
      locationId: row.locationId,
      ...(row.laneKey ? { laneId: row.laneKey } : {}),
      status: row.status as AccessServiceAvailability['status'],
      ...(row.matchPolicy ? { matchPolicy: row.matchPolicy as NonNullable<AccessServiceAvailability['matchPolicy']> } : {}),
      availablePaymentMethods: availablePaymentMethods as AccessServiceAvailability['availablePaymentMethods'],
      equipment: Array.isArray(row.equipment) ? (row.equipment as unknown as AccessServiceAvailability['equipment']) : [],
      effectiveFrom: row.effectiveFrom.toISOString(),
      ...(row.expectedRecoveryAt ? { expectedRecoveryAt: row.expectedRecoveryAt.toISOString() } : {}),
      ...(row.alternativeLocationId ? { alternativeLocationId: row.alternativeLocationId } : {}),
      ...(row.publicMessageKey ? { publicMessageKey: row.publicMessageKey } : {}),
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
    };
  }

  public async loadTerminalProfile(request: AccessRequest): Promise<AccessTerminalProfile | undefined> {
    if (!request.terminalId) return undefined;
    const row = await this.prisma.accessTerminalProfileRecord.findUnique({ where: { terminalId: request.terminalId } });
    if (!row) return undefined;
    const paymentMethods = strings(row.paymentMethods) ?? [];
    const qrModes = strings(row.qrModes);
    const billDenominations = numbers(row.acceptedBillDenominationsMinor);
    const coinDenominations = numbers(row.acceptedCoinDenominationsMinor);
    return {
      terminalId: row.terminalId,
      organizationId: row.organizationId,
      locationId: row.locationId,
      ...(row.laneKey ? { laneId: row.laneKey } : {}),
      heightProfile: row.heightProfile as AccessTerminalProfile['heightProfile'],
      paymentMethods: paymentMethods as AccessTerminalProfile['paymentMethods'],
      ...(qrModes ? { qrModes: qrModes as AccessTerminalProfile['qrModes'] } : {}),
      supportedCurrencies: strings(row.supportedCurrencies) ?? [],
      ...(billDenominations ? { acceptedBillDenominationsMinor: billDenominations } : {}),
      ...(coinDenominations ? { acceptedCoinDenominationsMinor: coinDenominations } : {}),
      canGiveChange: row.canGiveChange,
      receiptPrinter: row.receiptPrinter,
      intercom: row.intercom,
    };
  }

  public async countUsageInCurrentPeriod(request: AccessRequest, entitlement: AccessEntitlement): Promise<number> {
    if (!entitlement.period) return 0;
    const window = calculateAccessQuotaWindow(request.occurredAt, entitlement.period);
    return this.prisma.accessUsageRecord.count({
      where: {
        organizationId: request.organizationId,
        entitlementId: entitlement.id,
        occurredAt: { gte: new Date(window.startInclusive), lt: new Date(window.endExclusive) },
      },
    });
  }

  public async reserve(command: Parameters<AccessQuotaReservation['reserve']>[0]): Promise<boolean> {
    const window = calculateAccessQuotaWindow(command.occurredAt, command.period);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const key = {
            organizationId: command.organizationId,
            entitlementId: command.entitlementId,
            periodStart: new Date(window.startInclusive),
            requestId: command.requestId,
          };
          const existing = await tx.accessQuotaReservationRecord.findUnique({
            where: { organizationId_entitlementId_periodStart_requestId: key },
          });
          if (existing) return true;

          await tx.accessQuotaCounter.upsert({
            where: {
              organizationId_entitlementId_periodStart: {
                organizationId: command.organizationId,
                entitlementId: command.entitlementId,
                periodStart: key.periodStart,
              },
            },
            create: {
              organizationId: command.organizationId,
              entitlementId: command.entitlementId,
              period: command.period,
              periodStart: key.periodStart,
              periodEnd: new Date(window.endExclusive),
              used: 0,
              limit: command.maxUsesPerPeriod,
            },
            update: { limit: command.maxUsesPerPeriod, periodEnd: new Date(window.endExclusive) },
          });

          const updated = await tx.accessQuotaCounter.updateMany({
            where: {
              organizationId: command.organizationId,
              entitlementId: command.entitlementId,
              periodStart: key.periodStart,
              used: { lt: command.maxUsesPerPeriod },
            },
            data: { used: { increment: 1 } },
          });
          if (updated.count !== 1) return false;

          await tx.accessQuotaReservationRecord.create({
            data: {
              ...key,
              periodEnd: new Date(window.endExclusive),
              correlationId: command.correlationId,
            },
          });
          return true;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2002' || error.code === 'P2034')) {
        const replay = await this.prisma.accessQuotaReservationRecord.findUnique({
          where: {
            organizationId_entitlementId_periodStart_requestId: {
              organizationId: command.organizationId,
              entitlementId: command.entitlementId,
              periodStart: new Date(window.startInclusive),
              requestId: command.requestId,
            },
          },
        });
        if (replay) return true;
        if (error.code === 'P2034') return this.reserve(command);
      }
      throw error;
    }
  }

  public async recordDecision(request: AccessRequest, decision: AccessDecision): Promise<void> {
    await this.prisma.accessDecisionRecord.upsert({
      where: {
        organizationId_requestId: {
          organizationId: request.organizationId,
          requestId: request.requestId,
        },
      },
      create: {
        organizationId: request.organizationId,
        requestId: decision.requestId,
        decision: decision.decision,
        reason: decision.reason,
        credentialId: decision.credentialId,
        subjectId: decision.subjectId,
        entitlementId: decision.entitlementId,
        approvedAmountMinor: decision.approvedAmount ? BigInt(decision.approvedAmount.amountMinor) : null,
        approvedAmountCurrency: decision.approvedAmount?.currency,
        fallbackPaymentMethods: decision.fallbackPaymentMethods ? [...decision.fallbackPaymentMethods] : Prisma.JsonNull,
        alternativeLocationId: decision.alternativeLocationId,
        publicMessageKey: decision.publicMessageKey,
        decidedAt: new Date(decision.decidedAt),
        correlationId: decision.correlationId,
      },
      update: {},
    });
  }

  public async recordUsage(request: AccessRequest, command: RecordAccessUsageCommand): Promise<void> {
    await this.prisma.accessUsageRecord.upsert({
      where: {
        organizationId_requestId: {
          organizationId: request.organizationId,
          requestId: command.requestId,
        },
      },
      create: {
        organizationId: request.organizationId,
        requestId: command.requestId,
        decision: command.decision,
        credentialId: command.credentialId,
        subjectId: command.subjectId,
        entitlementId: command.entitlementId,
        locationId: command.locationId,
        terminalId: command.terminalId,
        chargedAmountMinor: command.chargedAmount ? BigInt(command.chargedAmount.amountMinor) : null,
        chargedAmountCurrency: command.chargedAmount?.currency,
        paymentMethod: command.paymentMethod,
        externalReference: command.externalReference,
        occurredAt: new Date(command.occurredAt),
        correlationId: command.correlationId,
      },
      update: {},
    });
  }

  public async findRecordedDecision(organizationId: string, requestId: string): Promise<AccessDecision | undefined> {
    const row = await this.prisma.accessDecisionRecord.findUnique({
      where: { organizationId_requestId: { organizationId, requestId } },
    });
    if (!row) return undefined;
    const fallbackPaymentMethods = strings(row.fallbackPaymentMethods);
    return {
      requestId: row.requestId,
      decision: row.decision as AccessDecision['decision'],
      reason: row.reason as AccessDecision['reason'],
      ...(row.credentialId ? { credentialId: row.credentialId } : {}),
      ...(row.subjectId ? { subjectId: row.subjectId } : {}),
      ...(row.entitlementId ? { entitlementId: row.entitlementId } : {}),
      ...(row.approvedAmountMinor !== null && row.approvedAmountCurrency
        ? { approvedAmount: { amountMinor: row.approvedAmountMinor.toString(), currency: row.approvedAmountCurrency } }
        : {}),
      ...(fallbackPaymentMethods
        ? { fallbackPaymentMethods: fallbackPaymentMethods as AccessDecision['fallbackPaymentMethods'] }
        : {}),
      ...(row.alternativeLocationId ? { alternativeLocationId: row.alternativeLocationId } : {}),
      ...(row.publicMessageKey ? { publicMessageKey: row.publicMessageKey } : {}),
      decidedAt: row.decidedAt.toISOString(),
      correlationId: row.correlationId,
    };
  }
}

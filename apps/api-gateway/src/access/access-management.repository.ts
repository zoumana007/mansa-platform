import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CreateAccessCredentialCommand,
  CreateAccessEntitlementCommand,
  ReplaceAccessCredentialCommand,
  ReplaceAccessCredentialResult,
  UpdateAccessCredentialStatusCommand,
  UpdateAccessEntitlementStatusCommand,
} from '@mansa/contracts/access-mobility-api';
import type { AccessCredential, AccessEntitlement } from '@mansa/contracts/access-mobility';

import { PrismaService } from '../prisma.service';

const CREDENTIAL_TRANSITIONS: Readonly<Record<AccessCredential['status'], readonly AccessCredential['status'][]>> = {
  PENDING: ['ACTIVE', 'SUSPENDED', 'REVOKED'],
  ACTIVE: ['SUSPENDED', 'REVOKED', 'EXPIRED'],
  SUSPENDED: ['ACTIVE', 'REVOKED', 'EXPIRED'],
  REVOKED: [],
  EXPIRED: [],
};

const ENTITLEMENT_TRANSITIONS: Readonly<Record<AccessEntitlement['status'], readonly AccessEntitlement['status'][]>> = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['SUSPENDED', 'EXPIRED', 'CANCELLED', 'TERMINATED'],
  SUSPENDED: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'TERMINATED'],
  EXPIRED: [],
  CANCELLED: [],
  TERMINATED: [],
};

function normalizeRequired(name: string, value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

function normalizeDate(value: string | undefined, name: string): Date | undefined {
  if (value === undefined) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${name} must be a valid ISO date`);
  return date;
}

function metadata(value: Prisma.JsonValue | null): Readonly<Record<string, string>> | undefined {
  if (value === null || Array.isArray(value) || typeof value !== 'object') return undefined;
  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  return Object.fromEntries(entries);
}

function credentialFromRow(row: {
  id: string; organizationId: string; subjectType: string; subjectId: string; credentialType: string;
  publicReference: string; status: string; validFrom: Date | null; validUntil: Date | null; metadata: Prisma.JsonValue | null;
}): AccessCredential {
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

function entitlementFromRow(row: {
  id: string; organizationId: string; subjectId: string; useCase: string; status: string; validFrom: Date;
  validUntil: Date | null; allowedLocationIds: Prisma.JsonValue | null; allowedProductCodes: Prisma.JsonValue | null;
  maxUsesPerPeriod: number | null; period: string | null; amountLimitMinor: bigint | null; amountLimitCurrency: string | null;
  refundPolicy: string | null; outageCompensationPolicy: string | null; metadata: Prisma.JsonValue | null;
}): AccessEntitlement {
  const locations = Array.isArray(row.allowedLocationIds) ? row.allowedLocationIds.filter((value): value is string => typeof value === 'string') : undefined;
  const products = Array.isArray(row.allowedProductCodes) ? row.allowedProductCodes.filter((value): value is string => typeof value === 'string') : undefined;
  const parsedMetadata = metadata(row.metadata);
  return {
    id: row.id,
    organizationId: row.organizationId,
    subjectId: row.subjectId,
    useCase: row.useCase as AccessEntitlement['useCase'],
    status: row.status as AccessEntitlement['status'],
    validFrom: row.validFrom.toISOString(),
    ...(row.validUntil ? { validUntil: row.validUntil.toISOString() } : {}),
    ...(locations ? { allowedLocationIds: locations } : {}),
    ...(products ? { allowedProductCodes: products } : {}),
    ...(row.maxUsesPerPeriod === null ? {} : { maxUsesPerPeriod: row.maxUsesPerPeriod }),
    ...(row.period === null ? {} : { period: row.period as NonNullable<AccessEntitlement['period']> }),
    ...(row.amountLimitMinor === null || row.amountLimitCurrency === null ? {} : { amountLimit: { amountMinor: row.amountLimitMinor.toString(), currency: row.amountLimitCurrency } }),
    ...(row.refundPolicy === null ? {} : { refundPolicy: row.refundPolicy as NonNullable<AccessEntitlement['refundPolicy']> }),
    ...(row.outageCompensationPolicy === null ? {} : { outageCompensationPolicy: row.outageCompensationPolicy as NonNullable<AccessEntitlement['outageCompensationPolicy']> }),
    ...(parsedMetadata ? { metadata: parsedMetadata } : {}),
  };
}

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function assertCredentialTransition(current: AccessCredential['status'], target: AccessCredential['status']): void {
  if (current === target) return;
  if (!CREDENTIAL_TRANSITIONS[current].includes(target)) throw new Error(`credential status transition ${current} -> ${target} is not allowed`);
}

function assertEntitlementTransition(current: AccessEntitlement['status'], target: AccessEntitlement['status']): void {
  if (current === target) return;
  if (!ENTITLEMENT_TRANSITIONS[current].includes(target)) throw new Error(`entitlement status transition ${current} -> ${target} is not allowed`);
}

@Injectable()
export class AccessManagementRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async createCredential(command: CreateAccessCredentialCommand): Promise<AccessCredential> {
    const idempotencyKey = normalizeRequired('idempotencyKey', command.idempotencyKey);
    const correlationId = normalizeRequired('correlationId', command.correlationId);
    const credential = command.credential;
    const id = normalizeRequired('credential.id', credential.id);
    const organizationId = normalizeRequired('credential.organizationId', credential.organizationId);
    const subjectId = normalizeRequired('credential.subjectId', credential.subjectId);
    const publicReference = normalizeRequired('credential.publicReference', credential.publicReference);
    const validFrom = normalizeDate(credential.validFrom, 'credential.validFrom');
    const validUntil = normalizeDate(credential.validUntil, 'credential.validUntil');
    if (validFrom && validUntil && validUntil < validFrom) throw new Error('credential.validUntil must not precede validFrom');

    const existing = await this.prisma.accessCredentialRecord.findFirst({ where: { OR: [{ id }, { organizationId, credentialType: credential.credentialType, publicReference }] } });
    if (existing) {
      if (existing.organizationId !== organizationId || existing.id !== id) throw new Error('credential identifier or public reference already belongs to another resource');
      return credentialFromRow(existing);
    }

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const created = await tx.accessCredentialRecord.create({
          data: {
            id, organizationId, subjectType: credential.subjectType, subjectId, credentialType: credential.credentialType,
            publicReference, status: credential.status,
            ...(validFrom ? { validFrom } : {}), ...(validUntil ? { validUntil } : {}),
            ...(credential.metadata ? { metadata: credential.metadata as Prisma.InputJsonValue } : {}),
          },
        });
        await tx.operationalAuditLog.create({
          data: {
            correlationId, actorId: 'internal-service', actorType: 'SERVICE', action: 'ACCESS_CREDENTIAL_CREATED',
            resourceType: 'AccessCredential', resourceId: id, reason: 'CREATE', metadata: { organizationId, subjectId, idempotencyKey },
          },
        });
        return created;
      });
      return credentialFromRow(row);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        const replay = await this.prisma.accessCredentialRecord.findFirst({ where: { OR: [{ id }, { organizationId, credentialType: credential.credentialType, publicReference }] } });
        if (replay?.id === id && replay.organizationId === organizationId) return credentialFromRow(replay);
      }
      throw error;
    }
  }

  public async updateCredentialStatus(command: UpdateAccessCredentialStatusCommand): Promise<AccessCredential> {
    const organizationId = normalizeRequired('organizationId', command.organizationId);
    const credentialId = normalizeRequired('credentialId', command.credentialId);
    const reason = normalizeRequired('reason', command.reason);
    const idempotencyKey = normalizeRequired('idempotencyKey', command.idempotencyKey);
    const correlationId = normalizeRequired('correlationId', command.correlationId);

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.accessCredentialRecord.findUnique({ where: { id: credentialId } });
      if (!current || current.organizationId !== organizationId) throw new Error('credential not found for tenant');
      const currentStatus = current.status as AccessCredential['status'];
      assertCredentialTransition(currentStatus, command.targetStatus);
      if (currentStatus === command.targetStatus) return credentialFromRow(current);
      const updated = await tx.accessCredentialRecord.update({ where: { id: credentialId }, data: { status: command.targetStatus } });
      await tx.operationalAuditLog.create({
        data: {
          correlationId, actorId: 'internal-service', actorType: 'SERVICE', action: 'ACCESS_CREDENTIAL_STATUS_CHANGED',
          resourceType: 'AccessCredential', resourceId: credentialId, reason,
          metadata: { organizationId, previousStatus: currentStatus, targetStatus: command.targetStatus, idempotencyKey },
        },
      });
      return credentialFromRow(updated);
    });
  }

  public async replaceCredential(command: ReplaceAccessCredentialCommand): Promise<ReplaceAccessCredentialResult> {
    const organizationId = normalizeRequired('organizationId', command.organizationId);
    const credentialId = normalizeRequired('credentialId', command.credentialId);
    const reason = normalizeRequired('reason', command.reason);
    const idempotencyKey = normalizeRequired('idempotencyKey', command.idempotencyKey);
    const correlationId = normalizeRequired('correlationId', command.correlationId);
    const replacement = command.replacement;
    const replacementId = normalizeRequired('replacement.id', replacement.id);
    const replacementOrganizationId = normalizeRequired('replacement.organizationId', replacement.organizationId);
    const replacementSubjectId = normalizeRequired('replacement.subjectId', replacement.subjectId);
    const replacementPublicReference = normalizeRequired('replacement.publicReference', replacement.publicReference);
    if (replacementOrganizationId !== organizationId) throw new Error('replacement credential must belong to the same tenant');
    if (replacementId === credentialId) throw new Error('replacement credential must use a different identifier');
    const validFrom = normalizeDate(replacement.validFrom, 'replacement.validFrom');
    const validUntil = normalizeDate(replacement.validUntil, 'replacement.validUntil');
    if (validFrom && validUntil && validUntil < validFrom) throw new Error('replacement.validUntil must not precede validFrom');

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.accessCredentialRecord.findUnique({ where: { id: credentialId } });
      if (!current || current.organizationId !== organizationId) throw new Error('credential not found for tenant');
      if (current.status === 'REVOKED' || current.status === 'EXPIRED') throw new Error('credential can no longer be replaced');
      if (current.subjectId !== replacementSubjectId) throw new Error('replacement credential must keep the same subject');

      const duplicate = await tx.accessCredentialRecord.findFirst({
        where: { OR: [{ id: replacementId }, { organizationId, credentialType: replacement.credentialType, publicReference: replacementPublicReference }] },
      });
      if (duplicate) throw new Error('replacement credential identifier or public reference already exists');

      const revoked = await tx.accessCredentialRecord.update({ where: { id: credentialId }, data: { status: 'REVOKED' } });
      const created = await tx.accessCredentialRecord.create({
        data: {
          id: replacementId, organizationId, subjectType: replacement.subjectType, subjectId: replacementSubjectId,
          credentialType: replacement.credentialType, publicReference: replacementPublicReference, status: replacement.status,
          ...(validFrom ? { validFrom } : {}), ...(validUntil ? { validUntil } : {}),
          ...(replacement.metadata ? { metadata: replacement.metadata as Prisma.InputJsonValue } : {}),
        },
      });
      await tx.operationalAuditLog.create({
        data: {
          correlationId, actorId: 'internal-service', actorType: 'SERVICE', action: 'ACCESS_CREDENTIAL_REPLACED',
          resourceType: 'AccessCredential', resourceId: credentialId, reason,
          metadata: {
            organizationId, idempotencyKey, replacesCredentialId: credentialId, replacedByCredentialId: replacementId,
            subjectId: current.subjectId, previousStatus: current.status, replacementStatus: replacement.status,
          },
        },
      });
      return { revokedCredential: credentialFromRow(revoked), replacementCredential: credentialFromRow(created) };
    });
  }

  public async createEntitlement(command: CreateAccessEntitlementCommand): Promise<AccessEntitlement> {
    const idempotencyKey = normalizeRequired('idempotencyKey', command.idempotencyKey);
    const correlationId = normalizeRequired('correlationId', command.correlationId);
    const entitlement = command.entitlement;
    const id = normalizeRequired('entitlement.id', entitlement.id);
    const organizationId = normalizeRequired('entitlement.organizationId', entitlement.organizationId);
    const subjectId = normalizeRequired('entitlement.subjectId', entitlement.subjectId);
    const validFrom = normalizeDate(entitlement.validFrom, 'entitlement.validFrom');
    if (!validFrom) throw new Error('entitlement.validFrom is required');
    const validUntil = normalizeDate(entitlement.validUntil, 'entitlement.validUntil');
    if (validUntil && validUntil < validFrom) throw new Error('entitlement.validUntil must not precede validFrom');
    if (entitlement.maxUsesPerPeriod !== undefined && (!Number.isSafeInteger(entitlement.maxUsesPerPeriod) || entitlement.maxUsesPerPeriod < 1)) throw new Error('entitlement.maxUsesPerPeriod must be a positive safe integer');
    const amountMinor = entitlement.amountLimit ? BigInt(entitlement.amountLimit.amountMinor) : undefined;

    const existing = await this.prisma.accessEntitlementRecord.findUnique({ where: { id } });
    if (existing) {
      if (existing.organizationId !== organizationId) throw new Error('entitlement identifier already belongs to another tenant');
      return entitlementFromRow(existing);
    }

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const created = await tx.accessEntitlementRecord.create({
          data: {
            id, organizationId, subjectId, useCase: entitlement.useCase, status: entitlement.status, validFrom,
            ...(validUntil ? { validUntil } : {}),
            ...(entitlement.allowedLocationIds ? { allowedLocationIds: [...entitlement.allowedLocationIds] } : {}),
            ...(entitlement.allowedProductCodes ? { allowedProductCodes: [...entitlement.allowedProductCodes] } : {}),
            ...(entitlement.maxUsesPerPeriod === undefined ? {} : { maxUsesPerPeriod: entitlement.maxUsesPerPeriod }),
            ...(entitlement.period ? { period: entitlement.period } : {}),
            ...(amountMinor === undefined ? {} : { amountLimitMinor: amountMinor, amountLimitCurrency: entitlement.amountLimit?.currency }),
            ...(entitlement.refundPolicy ? { refundPolicy: entitlement.refundPolicy } : {}),
            ...(entitlement.outageCompensationPolicy ? { outageCompensationPolicy: entitlement.outageCompensationPolicy } : {}),
            ...(entitlement.metadata ? { metadata: entitlement.metadata as Prisma.InputJsonValue } : {}),
          },
        });
        await tx.operationalAuditLog.create({
          data: {
            correlationId, actorId: 'internal-service', actorType: 'SERVICE', action: 'ACCESS_ENTITLEMENT_CREATED',
            resourceType: 'AccessEntitlement', resourceId: id, reason: 'CREATE', metadata: { organizationId, subjectId, idempotencyKey },
          },
        });
        return created;
      });
      return entitlementFromRow(row);
    } catch (error) {
      if (isUniqueConstraint(error)) {
        const replay = await this.prisma.accessEntitlementRecord.findUnique({ where: { id } });
        if (replay?.organizationId === organizationId) return entitlementFromRow(replay);
      }
      throw error;
    }
  }

  public async updateEntitlementStatus(command: UpdateAccessEntitlementStatusCommand): Promise<AccessEntitlement> {
    const organizationId = normalizeRequired('organizationId', command.organizationId);
    const entitlementId = normalizeRequired('entitlementId', command.entitlementId);
    const reason = normalizeRequired('reason', command.reason);
    const idempotencyKey = normalizeRequired('idempotencyKey', command.idempotencyKey);
    const correlationId = normalizeRequired('correlationId', command.correlationId);
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.accessEntitlementRecord.findUnique({ where: { id: entitlementId } });
      if (!current || current.organizationId !== organizationId) throw new Error('entitlement not found for tenant');
      const currentStatus = current.status as AccessEntitlement['status'];
      assertEntitlementTransition(currentStatus, command.targetStatus);
      if (currentStatus === command.targetStatus) return entitlementFromRow(current);
      const updated = await tx.accessEntitlementRecord.update({ where: { id: entitlementId }, data: { status: command.targetStatus } });
      await tx.operationalAuditLog.create({
        data: {
          correlationId, actorId: 'internal-service', actorType: 'SERVICE', action: 'ACCESS_ENTITLEMENT_STATUS_CHANGED',
          resourceType: 'AccessEntitlement', resourceId: entitlementId, reason,
          metadata: { organizationId, previousStatus: currentStatus, targetStatus: command.targetStatus, idempotencyKey },
        },
      });
      return entitlementFromRow(updated);
    });
  }
}

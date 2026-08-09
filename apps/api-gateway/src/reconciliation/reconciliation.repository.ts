import { Injectable } from '@nestjs/common';
import {
  Prisma,
  ReconciliationBatchStatus,
  ReconciliationItemStatus,
  ReconciliationMismatchReason,
} from '@prisma/client';

import { PrismaService } from '../prisma.service';

export interface ReconciliationImportItemInput {
  internalReference?: string;
  providerReference?: string;
  internalAmountMinor?: bigint;
  providerAmountMinor?: bigint;
  currency: string;
  internalStatus?: string;
  providerStatus?: string;
  providerOccurrenceCount?: number;
  status: ReconciliationItemStatus;
  mismatchReason?: ReconciliationMismatchReason;
  rawLineFingerprint?: string;
}

export interface CreateReconciliationBatchInput {
  providerId: string;
  sourceFileReference?: string;
  sourceFingerprint: string;
  periodStart: Date;
  periodEnd: Date;
  metadata?: Prisma.InputJsonValue;
  items: readonly ReconciliationImportItemInput[];
}

export interface ReconciliationBatchImportResult {
  batchId: string;
  reused: boolean;
  status: ReconciliationBatchStatus;
  totalItems: number;
  matchedItems: number;
  mismatchedItems: number;
}

export interface ReconciliationPage<T> {
  data: T[];
  nextCursor?: string;
  hasNextPage: boolean;
}

export interface ResolveReconciliationItemInput {
  itemId: string;
  status: 'RESOLVED' | 'IGNORED';
  resolutionNote: string;
  reasonCode: string;
  idempotencyKey: string;
  correlationId: string;
  actorId: string;
  actorType: string;
}

type CursorPayload = { createdAt: string; id: string };

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id } satisfies CursorPayload)).toString('base64url');
}

function decodeCursor(cursor: string | undefined): { createdAt: Date; id: string } | undefined {
  if (!cursor) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as Partial<CursorPayload>;
    if (typeof parsed.createdAt !== 'string' || typeof parsed.id !== 'string' || !parsed.id) {
      throw new Error('invalid cursor');
    }
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) throw new Error('invalid cursor date');
    return { createdAt, id: parsed.id };
  } catch {
    throw new Error('invalid reconciliation cursor');
  }
}

function validateInput(input: CreateReconciliationBatchInput): void {
  if (!input.providerId.trim()) throw new Error('providerId is required');
  if (!input.sourceFingerprint.trim()) throw new Error('sourceFingerprint is required');
  if (input.periodEnd.getTime() < input.periodStart.getTime()) {
    throw new Error('periodEnd must be greater than or equal to periodStart');
  }

  for (const item of input.items) {
    if (!item.internalReference?.trim() && !item.providerReference?.trim()) {
      throw new Error('each reconciliation item requires at least one transaction reference');
    }
    if (!/^[A-Z]{3}$/.test(item.currency.trim().toUpperCase())) {
      throw new Error('currency must be a three-letter uppercase code after normalization');
    }
    if ((item.providerOccurrenceCount ?? 1) < 1) {
      throw new Error('providerOccurrenceCount must be greater than or equal to 1');
    }
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

@Injectable()
export class ReconciliationRepository {
  public constructor(private readonly prisma: PrismaService) {}

  private async getImportSnapshot(batchId: string, reused: boolean): Promise<ReconciliationBatchImportResult> {
    const snapshot = await this.prisma.reconciliationBatch.findUniqueOrThrow({
      where: { id: batchId },
      select: { id: true, status: true, totalItems: true, matchedItems: true, mismatchedItems: true },
    });
    return { ...snapshot, batchId: snapshot.id, reused };
  }

  public async findBatchBySource(providerId: string, sourceFingerprint: string) {
    return this.prisma.reconciliationBatch.findUnique({
      where: { providerId_sourceFingerprint: { providerId, sourceFingerprint } },
      select: { id: true, status: true },
    });
  }

  public async importBatch(input: CreateReconciliationBatchInput): Promise<ReconciliationBatchImportResult> {
    validateInput(input);
    const providerId = input.providerId.trim();
    const sourceFingerprint = input.sourceFingerprint.trim();
    const existing = await this.findBatchBySource(providerId, sourceFingerprint);
    if (existing) return this.getImportSnapshot(existing.id, true);

    const matchedItems = input.items.filter((item) => item.status === 'MATCHED').length;
    const mismatchedItems = input.items.filter((item) => item.status === 'MISMATCHED' || item.status === 'PARTIALLY_MATCHED').length;
    const completedStatus: ReconciliationBatchStatus = mismatchedItems > 0 ? 'COMPLETED_WITH_MISMATCHES' : 'COMPLETED';

    try {
      return await this.prisma.$transaction(async (tx) => {
        const batch = await tx.reconciliationBatch.create({
          data: {
            providerId,
            ...(input.sourceFileReference ? { sourceFileReference: input.sourceFileReference.trim() } : {}),
            sourceFingerprint,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            status: 'PROCESSING',
            totalItems: input.items.length,
            matchedItems: 0,
            mismatchedItems: 0,
            ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
            startedAt: new Date(),
          },
          select: { id: true },
        });
        if (input.items.length > 0) {
          await tx.reconciliationItem.createMany({
            data: input.items.map((item) => ({
              batchId: batch.id,
              ...(item.internalReference ? { internalReference: item.internalReference.trim() } : {}),
              ...(item.providerReference ? { providerReference: item.providerReference.trim() } : {}),
              ...(item.internalAmountMinor === undefined ? {} : { internalAmountMinor: item.internalAmountMinor }),
              ...(item.providerAmountMinor === undefined ? {} : { providerAmountMinor: item.providerAmountMinor }),
              currency: item.currency.trim().toUpperCase(),
              ...(item.internalStatus ? { internalStatus: item.internalStatus.trim().toUpperCase() } : {}),
              ...(item.providerStatus ? { providerStatus: item.providerStatus.trim().toUpperCase() } : {}),
              providerOccurrenceCount: item.providerOccurrenceCount ?? 1,
              status: item.status,
              ...(item.mismatchReason === undefined ? {} : { mismatchReason: item.mismatchReason }),
              ...(item.rawLineFingerprint ? { rawLineFingerprint: item.rawLineFingerprint.trim() } : {}),
            })),
          });
        }
        const completed = await tx.reconciliationBatch.update({
          where: { id: batch.id },
          data: { status: completedStatus, matchedItems, mismatchedItems, completedAt: new Date() },
          select: { id: true, status: true, totalItems: true, matchedItems: true, mismatchedItems: true },
        });
        return { batchId: completed.id, reused: false, status: completed.status, totalItems: completed.totalItems, matchedItems: completed.matchedItems, mismatchedItems: completed.mismatchedItems };
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const concurrent = await this.findBatchBySource(providerId, sourceFingerprint);
        if (concurrent) return this.getImportSnapshot(concurrent.id, true);
      }
      throw error;
    }
  }

  public async getBatch(batchId: string) {
    return this.prisma.reconciliationBatch.findUnique({ where: { id: batchId } });
  }

  public async getItem(itemId: string) {
    return this.prisma.reconciliationItem.findUnique({ where: { id: itemId } });
  }

  public async listBatches(take = 50, cursor?: string): Promise<ReconciliationPage<Awaited<ReturnType<typeof this.getBatch>> extends infer U ? NonNullable<U> : never>> {
    const boundedTake = Math.max(1, Math.min(take, 100));
    const decoded = decodeCursor(cursor);
    const rows = await this.prisma.reconciliationBatch.findMany({
      ...(decoded ? { where: { OR: [{ createdAt: { lt: decoded.createdAt } }, { createdAt: decoded.createdAt, id: { lt: decoded.id } }] } } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: boundedTake + 1,
    });
    const hasNextPage = rows.length > boundedTake;
    const data = rows.slice(0, boundedTake);
    const last = data.at(-1);
    return { data, hasNextPage, ...(hasNextPage && last ? { nextCursor: encodeCursor(last.createdAt, last.id) } : {}) };
  }

  public async listItems(batchId: string, take = 100, cursor?: string): Promise<ReconciliationPage<NonNullable<Awaited<ReturnType<typeof this.getItem>>>>> {
    const boundedTake = Math.max(1, Math.min(take, 500));
    const decoded = decodeCursor(cursor);
    const rows = await this.prisma.reconciliationItem.findMany({
      where: {
        batchId,
        ...(decoded ? { OR: [{ createdAt: { gt: decoded.createdAt } }, { createdAt: decoded.createdAt, id: { gt: decoded.id } }] } : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: boundedTake + 1,
    });
    const hasNextPage = rows.length > boundedTake;
    const data = rows.slice(0, boundedTake);
    const last = data.at(-1);
    return { data, hasNextPage, ...(hasNextPage && last ? { nextCursor: encodeCursor(last.createdAt, last.id) } : {}) };
  }

  public async resolveItem(input: ResolveReconciliationItemInput) {
    const resolutionNote = input.resolutionNote.trim();
    const reasonCode = input.reasonCode.trim();
    const idempotencyKey = input.idempotencyKey.trim();
    const correlationId = input.correlationId.trim();
    const actorId = input.actorId.trim();
    const actorType = input.actorType.trim();
    if (!resolutionNote || !reasonCode || !idempotencyKey || !correlationId || !actorId || !actorType) {
      throw new Error('resolutionNote, reasonCode, idempotencyKey, correlationId, actorId and actorType are required');
    }

    return this.prisma.$transaction(async (tx) => {
      const replay = await tx.reconciliationItem.findUnique({ where: { resolutionIdempotencyKey: idempotencyKey } });
      if (replay) {
        if (replay.id !== input.itemId || replay.status !== input.status) throw new Error('idempotency key already used for a different resolution');
        return replay;
      }

      const current = await tx.reconciliationItem.findUnique({ where: { id: input.itemId } });
      if (!current) throw new Error('reconciliation item not found');
      if (current.status !== 'MISMATCHED' && current.status !== 'PARTIALLY_MATCHED') {
        throw new Error('only unresolved mismatches can be resolved or ignored');
      }

      const updated = await tx.reconciliationItem.update({
        where: { id: input.itemId },
        data: {
          status: input.status,
          resolutionNote,
          resolutionReasonCode: reasonCode,
          resolvedBy: actorId,
          resolutionCorrelationId: correlationId,
          resolutionIdempotencyKey: idempotencyKey,
        },
      });
      await tx.reconciliationBatch.update({
        where: { id: current.batchId },
        data: input.status === 'RESOLVED' ? { resolvedItems: { increment: 1 } } : { ignoredItems: { increment: 1 } },
      });
      await tx.operationalAuditLog.create({
        data: {
          correlationId,
          actorId,
          actorType,
          action: input.status === 'RESOLVED' ? 'RECONCILIATION_ITEM_RESOLVED' : 'RECONCILIATION_ITEM_IGNORED',
          resourceType: 'ReconciliationItem',
          resourceId: input.itemId,
          reason: reasonCode,
          metadata: { resolutionNote, batchId: current.batchId, mismatchReason: current.mismatchReason },
        },
      });
      return updated;
    });
  }
}

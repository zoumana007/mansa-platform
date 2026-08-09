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

@Injectable()
export class ReconciliationRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async findBatchBySource(
    providerId: string,
    sourceFingerprint: string,
  ): Promise<{ id: string; status: ReconciliationBatchStatus } | null> {
    return this.prisma.reconciliationBatch.findUnique({
      where: {
        providerId_sourceFingerprint: {
          providerId,
          sourceFingerprint,
        },
      },
      select: { id: true, status: true },
    });
  }

  public async importBatch(
    input: CreateReconciliationBatchInput,
  ): Promise<ReconciliationBatchImportResult> {
    validateInput(input);

    const existing = await this.findBatchBySource(input.providerId.trim(), input.sourceFingerprint.trim());
    if (existing) {
      const snapshot = await this.prisma.reconciliationBatch.findUniqueOrThrow({
        where: { id: existing.id },
        select: {
          id: true,
          status: true,
          totalItems: true,
          matchedItems: true,
          mismatchedItems: true,
        },
      });
      return { ...snapshot, batchId: snapshot.id, reused: true };
    }

    const matchedItems = input.items.filter((item) => item.status === 'MATCHED').length;
    const mismatchedItems = input.items.filter(
      (item) => item.status === 'MISMATCHED' || item.status === 'PARTIALLY_MATCHED',
    ).length;
    const completedStatus: ReconciliationBatchStatus =
      mismatchedItems > 0 ? 'COMPLETED_WITH_MISMATCHES' : 'COMPLETED';

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.reconciliationBatch.create({
        data: {
          providerId: input.providerId.trim(),
          ...(input.sourceFileReference ? { sourceFileReference: input.sourceFileReference.trim() } : {}),
          sourceFingerprint: input.sourceFingerprint.trim(),
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
        data: {
          status: completedStatus,
          matchedItems,
          mismatchedItems,
          completedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          totalItems: true,
          matchedItems: true,
          mismatchedItems: true,
        },
      });

      return {
        batchId: completed.id,
        reused: false,
        status: completed.status,
        totalItems: completed.totalItems,
        matchedItems: completed.matchedItems,
        mismatchedItems: completed.mismatchedItems,
      };
    });
  }

  public async getBatch(batchId: string) {
    return this.prisma.reconciliationBatch.findUnique({ where: { id: batchId } });
  }

  public async listBatches(take = 50) {
    const boundedTake = Math.max(1, Math.min(take, 100));
    return this.prisma.reconciliationBatch.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: boundedTake,
    });
  }

  public async listItems(batchId: string, take = 100) {
    const boundedTake = Math.max(1, Math.min(take, 500));
    return this.prisma.reconciliationItem.findMany({
      where: { batchId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: boundedTake,
    });
  }
}

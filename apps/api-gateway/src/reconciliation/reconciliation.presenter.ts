import type {
  ReconciliationBatchSummary,
} from '@mansa/contracts/reconciliation-api';
import type { ReconciliationItem } from '@mansa/contracts/reconciliation';
import type {
  ReconciliationBatch,
  ReconciliationItem as PrismaReconciliationItem,
} from '@prisma/client';

function optionalIso(value: Date | null): string | undefined {
  return value === null ? undefined : value.toISOString();
}

function optionalText(value: string | null): string | undefined {
  return value === null ? undefined : value;
}

function optionalAmount(value: bigint | null, field: string): number | undefined {
  if (value === null) return undefined;
  const numberValue = Number(value);
  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    throw new Error(`${field} cannot be serialized as a non-negative safe integer`);
  }
  return numberValue;
}

export function presentReconciliationBatch(
  batch: ReconciliationBatch,
): ReconciliationBatchSummary {
  return {
    batchId: batch.id,
    providerId: batch.providerId,
    ...(optionalText(batch.sourceFileReference) === undefined
      ? {}
      : { sourceFileReference: optionalText(batch.sourceFileReference) }),
    periodStart: batch.periodStart.toISOString(),
    periodEnd: batch.periodEnd.toISOString(),
    status: batch.status,
    totalItems: batch.totalItems,
    matchedItems: batch.matchedItems,
    mismatchedItems: batch.mismatchedItems,
    resolvedItems: batch.resolvedItems,
    ignoredItems: batch.ignoredItems,
    createdAt: batch.createdAt.toISOString(),
    ...(optionalIso(batch.startedAt) === undefined
      ? {}
      : { startedAt: optionalIso(batch.startedAt) }),
    ...(optionalIso(batch.completedAt) === undefined
      ? {}
      : { completedAt: optionalIso(batch.completedAt) }),
    ...(optionalText(batch.failureReason) === undefined
      ? {}
      : { failureReason: optionalText(batch.failureReason) }),
  };
}

export function presentReconciliationItem(
  item: PrismaReconciliationItem,
): ReconciliationItem {
  const internalAmountMinor = optionalAmount(item.internalAmountMinor, 'internalAmountMinor');
  const providerAmountMinor = optionalAmount(item.providerAmountMinor, 'providerAmountMinor');
  return {
    itemId: item.id,
    batchId: item.batchId,
    ...(optionalText(item.internalReference) === undefined
      ? {}
      : { internalReference: optionalText(item.internalReference) }),
    ...(optionalText(item.providerReference) === undefined
      ? {}
      : { providerReference: optionalText(item.providerReference) }),
    ...(internalAmountMinor === undefined ? {} : { internalAmountMinor }),
    ...(providerAmountMinor === undefined ? {} : { providerAmountMinor }),
    currency: item.currency,
    status: item.status,
    ...(item.mismatchReason === null ? {} : { mismatchReason: item.mismatchReason }),
    ...(optionalText(item.resolutionNote) === undefined
      ? {}
      : { resolutionNote: optionalText(item.resolutionNote) }),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

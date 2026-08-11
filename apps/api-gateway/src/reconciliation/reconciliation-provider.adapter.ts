import { createHash } from 'node:crypto';

import {
  compareReconciliationTransactions,
  type ReconciliationComparisonResult,
  type ReconciliationTransactionSnapshot,
} from '@mansa/contracts/reconciliation';

export interface ProviderReconciliationRow {
  readonly providerReference: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly status: string;
}

export interface InternalReconciliationRow {
  readonly internalReference: string;
  readonly providerReference?: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly status: string;
}

export interface ProviderReconciliationSource {
  readonly providerId: string;
  readonly sourceFileReference?: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly rows: readonly ProviderReconciliationRow[];
}

export interface ReconciliationPreparedItem {
  readonly comparison: ReconciliationComparisonResult;
  readonly providerOccurrenceCount: number;
  readonly rawLineFingerprint: string;
}

export interface ReconciliationPreparedBatch {
  readonly providerId: string;
  readonly sourceFileReference?: string;
  readonly sourceFingerprint: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly items: readonly ReconciliationPreparedItem[];
}

function normalizeProviderRow(row: ProviderReconciliationRow): ProviderReconciliationRow {
  if (!row.providerReference.trim()) throw new Error('providerReference is required');
  if (!Number.isSafeInteger(row.amountMinor) || row.amountMinor < 0) {
    throw new Error('provider amountMinor must be a non-negative safe integer');
  }
  const currency = row.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('provider currency must be a three-letter code');
  const status = row.status.trim().toUpperCase();
  if (!status) throw new Error('provider status is required');
  return {
    providerReference: row.providerReference.trim(),
    amountMinor: row.amountMinor,
    currency,
    status,
  };
}

function normalizeInternalRow(row: InternalReconciliationRow): InternalReconciliationRow {
  if (!row.internalReference.trim()) throw new Error('internalReference is required');
  if (!Number.isSafeInteger(row.amountMinor) || row.amountMinor < 0) {
    throw new Error('internal amountMinor must be a non-negative safe integer');
  }
  const currency = row.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('internal currency must be a three-letter code');
  const status = row.status.trim().toUpperCase();
  if (!status) throw new Error('internal status is required');
  return {
    internalReference: row.internalReference.trim(),
    ...(row.providerReference?.trim() ? { providerReference: row.providerReference.trim() } : {}),
    amountMinor: row.amountMinor,
    currency,
    status,
  };
}

function snapshotFromProvider(row: ProviderReconciliationRow): ReconciliationTransactionSnapshot {
  return {
    reference: row.providerReference,
    amountMinor: row.amountMinor,
    currency: row.currency,
    status: row.status,
  };
}

function snapshotFromInternal(row: InternalReconciliationRow): ReconciliationTransactionSnapshot {
  return {
    reference: row.internalReference,
    amountMinor: row.amountMinor,
    currency: row.currency,
    status: row.status,
  };
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/**
 * Adaptateur fournisseur déterministe utilisé pour le développement et les tests.
 * Il transforme une source normalisée en comparaisons métier sans dépendre d'un
 * format bancaire réel ni d'un secret fournisseur.
 */
export class TestReconciliationProviderAdapter {
  public readonly adapterId = 'test-normalized-v1';

  public supports(providerId: string): boolean {
    return providerId.trim().toUpperCase().startsWith('TEST');
  }

  public prepare(
    source: ProviderReconciliationSource,
    internalRows: readonly InternalReconciliationRow[],
  ): ReconciliationPreparedBatch {
    if (!source.providerId.trim()) throw new Error('providerId is required');
    if (source.periodEnd.getTime() < source.periodStart.getTime()) {
      throw new Error('periodEnd must be greater than or equal to periodStart');
    }

    const providerRows = source.rows.map(normalizeProviderRow);
    const normalizedInternalRows = internalRows.map(normalizeInternalRow);
    const occurrences = new Map<string, number>();
    for (const row of providerRows) {
      occurrences.set(row.providerReference, (occurrences.get(row.providerReference) ?? 0) + 1);
    }

    const internalByProviderReference = new Map<string, InternalReconciliationRow>();
    for (const row of normalizedInternalRows) {
      if (row.providerReference) internalByProviderReference.set(row.providerReference, row);
    }

    const seenInternalReferences = new Set<string>();
    const items: ReconciliationPreparedItem[] = providerRows.map((provider) => {
      const internal = internalByProviderReference.get(provider.providerReference);
      if (internal) seenInternalReferences.add(internal.internalReference);
      const providerOccurrenceCount = occurrences.get(provider.providerReference) ?? 1;
      return {
        comparison: compareReconciliationTransactions({
          ...(internal ? { internal: snapshotFromInternal(internal) } : {}),
          provider: snapshotFromProvider(provider),
          providerOccurrenceCount,
        }),
        providerOccurrenceCount,
        rawLineFingerprint: hashJson(provider),
      };
    });

    for (const internal of normalizedInternalRows) {
      if (seenInternalReferences.has(internal.internalReference)) continue;
      items.push({
        comparison: compareReconciliationTransactions({ internal: snapshotFromInternal(internal) }),
        providerOccurrenceCount: 1,
        rawLineFingerprint: hashJson({ missingProviderFor: internal.internalReference }),
      });
    }

    const normalizedSource = {
      providerId: source.providerId.trim(),
      sourceFileReference: source.sourceFileReference?.trim() ?? null,
      periodStart: source.periodStart.toISOString(),
      periodEnd: source.periodEnd.toISOString(),
      rows: providerRows,
    };

    return {
      providerId: source.providerId.trim(),
      ...(source.sourceFileReference?.trim()
        ? { sourceFileReference: source.sourceFileReference.trim() }
        : {}),
      sourceFingerprint: hashJson(normalizedSource),
      periodStart: source.periodStart,
      periodEnd: source.periodEnd,
      items,
    };
  }
}

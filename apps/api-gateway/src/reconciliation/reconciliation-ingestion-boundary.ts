import { createHash } from 'node:crypto';

import type { ProviderReconciliationSource } from './reconciliation-provider.adapter';

export type ReconciliationIngestionRejectionCode =
  | 'PROVIDER_ID_REQUIRED'
  | 'INVALID_PERIOD'
  | 'EMPTY_SOURCE'
  | 'SOURCE_TOO_LARGE'
  | 'INVALID_PROVIDER_REFERENCE'
  | 'INVALID_AMOUNT'
  | 'INVALID_CURRENCY'
  | 'INVALID_STATUS';

export interface ReconciliationIngestionPolicyOptions {
  readonly maxRows: number;
}

export interface ReconciliationIngestionAccepted {
  readonly accepted: true;
  readonly sourceFingerprint: string;
  readonly rowCount: number;
}

export interface ReconciliationIngestionQuarantined {
  readonly accepted: false;
  readonly code: ReconciliationIngestionRejectionCode;
  readonly rowIndex?: number;
  readonly sourceFingerprint: string;
  readonly rowCount: number;
}

export type ReconciliationIngestionDecision =
  | ReconciliationIngestionAccepted
  | ReconciliationIngestionQuarantined;

const DEFAULT_MAX_ROWS = 100_000;

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function sourceFingerprint(source: ProviderReconciliationSource): string {
  return hash({
    providerId: source.providerId.trim(),
    sourceFileReference: source.sourceFileReference?.trim() ?? null,
    periodStart: Number.isFinite(source.periodStart.getTime())
      ? source.periodStart.toISOString()
      : 'INVALID_DATE',
    periodEnd: Number.isFinite(source.periodEnd.getTime())
      ? source.periodEnd.toISOString()
      : 'INVALID_DATE',
    rowCount: source.rows.length,
  });
}

export class ReconciliationIngestionBoundary {
  private readonly maxRows: number;

  public constructor(options: Partial<ReconciliationIngestionPolicyOptions> = {}) {
    const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
    if (!Number.isSafeInteger(maxRows) || maxRows <= 0) {
      throw new Error('reconciliation ingestion maxRows must be a positive safe integer');
    }
    this.maxRows = maxRows;
  }

  public evaluate(source: ProviderReconciliationSource): ReconciliationIngestionDecision {
    const fingerprint = sourceFingerprint(source);
    const rowCount = source.rows.length;

    if (!source.providerId.trim()) {
      return { accepted: false, code: 'PROVIDER_ID_REQUIRED', sourceFingerprint: fingerprint, rowCount };
    }

    const periodStartMs = source.periodStart.getTime();
    const periodEndMs = source.periodEnd.getTime();
    if (!Number.isFinite(periodStartMs) || !Number.isFinite(periodEndMs) || periodEndMs < periodStartMs) {
      return { accepted: false, code: 'INVALID_PERIOD', sourceFingerprint: fingerprint, rowCount };
    }

    if (rowCount === 0) {
      return { accepted: false, code: 'EMPTY_SOURCE', sourceFingerprint: fingerprint, rowCount };
    }

    if (rowCount > this.maxRows) {
      return { accepted: false, code: 'SOURCE_TOO_LARGE', sourceFingerprint: fingerprint, rowCount };
    }

    for (let index = 0; index < source.rows.length; index += 1) {
      const row = source.rows[index];
      if (!row.providerReference.trim()) {
        return { accepted: false, code: 'INVALID_PROVIDER_REFERENCE', rowIndex: index, sourceFingerprint: fingerprint, rowCount };
      }
      if (!Number.isSafeInteger(row.amountMinor) || row.amountMinor < 0) {
        return { accepted: false, code: 'INVALID_AMOUNT', rowIndex: index, sourceFingerprint: fingerprint, rowCount };
      }
      if (!/^[A-Za-z]{3}$/.test(row.currency.trim())) {
        return { accepted: false, code: 'INVALID_CURRENCY', rowIndex: index, sourceFingerprint: fingerprint, rowCount };
      }
      if (!row.status.trim()) {
        return { accepted: false, code: 'INVALID_STATUS', rowIndex: index, sourceFingerprint: fingerprint, rowCount };
      }
    }

    return { accepted: true, sourceFingerprint: fingerprint, rowCount };
  }
}

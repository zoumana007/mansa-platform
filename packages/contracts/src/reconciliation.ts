export const RECONCILIATION_STATUSES = [
  'PENDING',
  'MATCHED',
  'PARTIALLY_MATCHED',
  'MISMATCHED',
  'RESOLVED',
  'IGNORED',
] as const;

export const RECONCILIATION_MISMATCH_REASONS = [
  'MISSING_INTERNAL_TRANSACTION',
  'MISSING_PROVIDER_TRANSACTION',
  'AMOUNT_MISMATCH',
  'CURRENCY_MISMATCH',
  'STATUS_MISMATCH',
  'DUPLICATE_PROVIDER_TRANSACTION',
  'OTHER',
] as const;

export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];
export type ReconciliationMismatchReason = (typeof RECONCILIATION_MISMATCH_REASONS)[number];

export interface ReconciliationItem {
  readonly itemId: string;
  readonly batchId: string;
  readonly internalReference?: string;
  readonly providerReference?: string;
  readonly internalAmountMinor?: number;
  readonly providerAmountMinor?: number;
  readonly currency: string;
  readonly status: ReconciliationStatus;
  readonly mismatchReason?: ReconciliationMismatchReason;
  readonly resolutionNote?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateReconciliationItemCommand {
  readonly itemId: string;
  readonly batchId: string;
  readonly internalReference?: string;
  readonly providerReference?: string;
  readonly internalAmountMinor?: number;
  readonly providerAmountMinor?: number;
  readonly currency: string;
  readonly createdAt: string;
}

export interface ResolveReconciliationItemCommand {
  readonly status: 'RESOLVED' | 'IGNORED';
  readonly resolutionNote: string;
  readonly updatedAt: string;
}

function assertOptionalAmount(value: number | undefined, name: string): void {
  if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
}

export function isReconciliationStatus(value: string): value is ReconciliationStatus {
  return RECONCILIATION_STATUSES.includes(value as ReconciliationStatus);
}

export function isReconciliationMismatchReason(value: string): value is ReconciliationMismatchReason {
  return RECONCILIATION_MISMATCH_REASONS.includes(value as ReconciliationMismatchReason);
}

export function createReconciliationItem(
  command: CreateReconciliationItemCommand,
): ReconciliationItem {
  if (!command.itemId || !command.batchId) throw new Error('itemId and batchId are required');
  if (!command.internalReference && !command.providerReference) {
    throw new Error('at least one transaction reference is required');
  }
  assertOptionalAmount(command.internalAmountMinor, 'internalAmountMinor');
  assertOptionalAmount(command.providerAmountMinor, 'providerAmountMinor');

  const currency = command.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('currency must be a three-letter code');

  let status: ReconciliationStatus = 'PENDING';
  let mismatchReason: ReconciliationMismatchReason | undefined;

  if (!command.internalReference) {
    status = 'MISMATCHED';
    mismatchReason = 'MISSING_INTERNAL_TRANSACTION';
  } else if (!command.providerReference) {
    status = 'MISMATCHED';
    mismatchReason = 'MISSING_PROVIDER_TRANSACTION';
  } else if (command.internalAmountMinor !== command.providerAmountMinor) {
    status = 'MISMATCHED';
    mismatchReason = 'AMOUNT_MISMATCH';
  } else {
    status = 'MATCHED';
  }

  return {
    ...command,
    currency,
    status,
    ...(mismatchReason === undefined ? {} : { mismatchReason }),
    updatedAt: command.createdAt,
  };
}

export function resolveReconciliationItem(
  item: ReconciliationItem,
  command: ResolveReconciliationItemCommand,
): ReconciliationItem {
  if (item.status !== 'MISMATCHED' && item.status !== 'PARTIALLY_MATCHED') {
    throw new Error('only unresolved reconciliation mismatches can be resolved or ignored');
  }
  if (!command.resolutionNote.trim()) throw new Error('resolutionNote is required');

  return {
    ...item,
    status: command.status,
    resolutionNote: command.resolutionNote.trim(),
    updatedAt: command.updatedAt,
  };
}

export function isFinalReconciliationStatus(status: ReconciliationStatus): boolean {
  return status === 'MATCHED' || status === 'RESOLVED' || status === 'IGNORED';
}

/**
 * Snapshot minimal d'une transaction telle qu'observée par Mansa ou un fournisseur.
 * Les montants sont toujours exprimés en unités mineures entières.
 */
export interface ReconciliationTransactionSnapshot {
  readonly reference: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly status: string;
}

export interface CompareReconciliationTransactionsInput {
  readonly internal?: ReconciliationTransactionSnapshot;
  readonly provider?: ReconciliationTransactionSnapshot;
  /** Nombre d'occurrences de la référence fournisseur dans la source importée. */
  readonly providerOccurrenceCount?: number;
}

export interface ReconciliationComparisonResult {
  readonly status: 'MATCHED' | 'MISMATCHED';
  readonly mismatchReason?: ReconciliationMismatchReason;
  readonly internalReference?: string;
  readonly providerReference?: string;
  readonly internalAmountMinor?: number;
  readonly providerAmountMinor?: number;
  readonly internalCurrency?: string;
  readonly providerCurrency?: string;
  readonly internalStatus?: string;
  readonly providerStatus?: string;
}

function normalizeSnapshot(snapshot: ReconciliationTransactionSnapshot, label: string) {
  if (!snapshot.reference.trim()) throw new Error(`${label}.reference is required`);
  if (!Number.isSafeInteger(snapshot.amountMinor) || snapshot.amountMinor < 0) {
    throw new Error(`${label}.amountMinor must be a non-negative safe integer`);
  }
  const currency = snapshot.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(`${label}.currency must be a three-letter code`);
  }
  const status = snapshot.status.trim().toUpperCase();
  if (!status) throw new Error(`${label}.status is required`);
  return {
    reference: snapshot.reference.trim(),
    amountMinor: snapshot.amountMinor,
    currency,
    status,
  };
}

/**
 * Compare une transaction interne avec l'observation fournisseur selon un ordre
 * de priorité stable. La fonction est pure, déterministe et indépendante du
 * fournisseur afin que le même résultat puisse être rejoué en audit.
 */
export function compareReconciliationTransactions(
  input: CompareReconciliationTransactionsInput,
): ReconciliationComparisonResult {
  const internal = input.internal ? normalizeSnapshot(input.internal, 'internal') : undefined;
  const provider = input.provider ? normalizeSnapshot(input.provider, 'provider') : undefined;

  if (!internal && !provider) {
    throw new Error('at least one reconciliation transaction snapshot is required');
  }
  if (!internal) {
    if (!provider) throw new Error('provider snapshot is required');
    return {
      status: 'MISMATCHED',
      mismatchReason: 'MISSING_INTERNAL_TRANSACTION',
      providerReference: provider.reference,
      providerAmountMinor: provider.amountMinor,
      providerCurrency: provider.currency,
      providerStatus: provider.status,
    };
  }
  if (!provider) {
    return {
      status: 'MISMATCHED',
      mismatchReason: 'MISSING_PROVIDER_TRANSACTION',
      internalReference: internal.reference,
      internalAmountMinor: internal.amountMinor,
      internalCurrency: internal.currency,
      internalStatus: internal.status,
    };
  }

  const providerOccurrenceCount = input.providerOccurrenceCount ?? 1;
  if (!Number.isSafeInteger(providerOccurrenceCount) || providerOccurrenceCount < 1) {
    throw new Error('providerOccurrenceCount must be a positive safe integer');
  }

  const base = {
    internalReference: internal.reference,
    providerReference: provider.reference,
    internalAmountMinor: internal.amountMinor,
    providerAmountMinor: provider.amountMinor,
    internalCurrency: internal.currency,
    providerCurrency: provider.currency,
    internalStatus: internal.status,
    providerStatus: provider.status,
  };

  if (providerOccurrenceCount > 1) {
    return { ...base, status: 'MISMATCHED', mismatchReason: 'DUPLICATE_PROVIDER_TRANSACTION' };
  }
  if (internal.currency !== provider.currency) {
    return { ...base, status: 'MISMATCHED', mismatchReason: 'CURRENCY_MISMATCH' };
  }
  if (internal.amountMinor !== provider.amountMinor) {
    return { ...base, status: 'MISMATCHED', mismatchReason: 'AMOUNT_MISMATCH' };
  }
  if (internal.status !== provider.status) {
    return { ...base, status: 'MISMATCHED', mismatchReason: 'STATUS_MISMATCH' };
  }

  return { ...base, status: 'MATCHED' };
}

export interface ReconciliationComparisonSummary {
  readonly total: number;
  readonly matched: number;
  readonly mismatched: number;
  readonly byReason: Readonly<Partial<Record<ReconciliationMismatchReason, number>>>;
}

export function summarizeReconciliationComparisons(
  results: readonly ReconciliationComparisonResult[],
): ReconciliationComparisonSummary {
  const byReason: Partial<Record<ReconciliationMismatchReason, number>> = {};
  let matched = 0;
  for (const result of results) {
    if (result.status === 'MATCHED') {
      matched += 1;
      continue;
    }
    if (result.mismatchReason) {
      byReason[result.mismatchReason] = (byReason[result.mismatchReason] ?? 0) + 1;
    }
  }
  return {
    total: results.length,
    matched,
    mismatched: results.length - matched,
    byReason,
  };
}

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
    mismatchReason,
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

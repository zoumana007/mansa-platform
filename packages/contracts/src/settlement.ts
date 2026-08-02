export const SETTLEMENT_BATCH_STATUSES = [
  'DRAFT',
  'READY',
  'PROCESSING',
  'PAID',
  'PARTIALLY_PAID',
  'FAILED',
  'CANCELLED',
] as const;

export const SETTLEMENT_DESTINATION_TYPES = [
  'BANK_ACCOUNT',
  'MOBILE_MONEY',
  'MANSA_WALLET',
] as const;

export type SettlementBatchStatus = (typeof SETTLEMENT_BATCH_STATUSES)[number];
export type SettlementDestinationType = (typeof SETTLEMENT_DESTINATION_TYPES)[number];

export interface SettlementDestination {
  readonly type: SettlementDestinationType;
  readonly reference: string;
  readonly providerCode?: string;
}

export interface SettlementBatch {
  readonly settlementId: string;
  readonly merchantId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly grossAmountMinor: number;
  readonly feeAmountMinor: number;
  readonly adjustmentAmountMinor: number;
  readonly netAmountMinor: number;
  readonly currency: string;
  readonly destination: SettlementDestination;
  readonly status: SettlementBatchStatus;
  readonly providerReference?: string;
  readonly failureReason?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateSettlementBatchCommand {
  readonly settlementId: string;
  readonly merchantId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly grossAmountMinor: number;
  readonly feeAmountMinor: number;
  readonly adjustmentAmountMinor?: number;
  readonly currency: string;
  readonly destination: SettlementDestination;
  readonly createdAt: string;
}

export interface TransitionSettlementBatchCommand {
  readonly status: Exclude<SettlementBatchStatus, 'DRAFT'>;
  readonly updatedAt: string;
  readonly providerReference?: string;
  readonly failureReason?: string;
}

const TRANSITIONS: Readonly<Record<SettlementBatchStatus, readonly SettlementBatchStatus[]>> = {
  DRAFT: ['READY', 'CANCELLED'],
  READY: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PAID', 'PARTIALLY_PAID', 'FAILED'],
  PAID: [],
  PARTIALLY_PAID: ['PROCESSING', 'PAID', 'FAILED'],
  FAILED: ['READY', 'CANCELLED'],
  CANCELLED: [],
};

function assertNonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
}

export function isSettlementBatchStatus(value: string): value is SettlementBatchStatus {
  return SETTLEMENT_BATCH_STATUSES.includes(value as SettlementBatchStatus);
}

export function isSettlementDestinationType(value: string): value is SettlementDestinationType {
  return SETTLEMENT_DESTINATION_TYPES.includes(value as SettlementDestinationType);
}

export function canTransitionSettlementBatch(
  from: SettlementBatchStatus,
  to: SettlementBatchStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function createSettlementBatch(
  command: CreateSettlementBatchCommand,
): SettlementBatch {
  if (!command.settlementId || !command.merchantId) {
    throw new Error('settlementId and merchantId are required');
  }
  if (!command.periodStart || !command.periodEnd || command.periodStart >= command.periodEnd) {
    throw new Error('periodStart must be before periodEnd');
  }
  if (!command.destination.reference.trim()) {
    throw new Error('destination reference is required');
  }

  assertNonNegativeSafeInteger(command.grossAmountMinor, 'grossAmountMinor');
  assertNonNegativeSafeInteger(command.feeAmountMinor, 'feeAmountMinor');
  const adjustmentAmountMinor = command.adjustmentAmountMinor ?? 0;
  if (!Number.isSafeInteger(adjustmentAmountMinor)) {
    throw new Error('adjustmentAmountMinor must be a safe integer');
  }

  const netAmountMinor = command.grossAmountMinor - command.feeAmountMinor + adjustmentAmountMinor;
  if (!Number.isSafeInteger(netAmountMinor) || netAmountMinor < 0) {
    throw new Error('netAmountMinor must be a non-negative safe integer');
  }

  const currency = command.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('currency must be a three-letter code');

  return {
    ...command,
    adjustmentAmountMinor,
    netAmountMinor,
    currency,
    destination: {
      ...command.destination,
      reference: command.destination.reference.trim(),
      providerCode: command.destination.providerCode?.trim() || undefined,
    },
    status: 'DRAFT',
    updatedAt: command.createdAt,
  };
}

export function transitionSettlementBatch(
  settlement: SettlementBatch,
  command: TransitionSettlementBatchCommand,
): SettlementBatch {
  if (!canTransitionSettlementBatch(settlement.status, command.status)) {
    throw new Error(`invalid settlement transition: ${settlement.status} -> ${command.status}`);
  }
  if ((command.status === 'PAID' || command.status === 'PARTIALLY_PAID') && !command.providerReference?.trim()) {
    throw new Error('providerReference is required for paid settlements');
  }
  if (command.status === 'FAILED' && !command.failureReason?.trim()) {
    throw new Error('failureReason is required for failed settlements');
  }

  return {
    ...settlement,
    status: command.status,
    providerReference: command.providerReference?.trim() || settlement.providerReference,
    failureReason: command.status === 'FAILED' ? command.failureReason?.trim() : undefined,
    updatedAt: command.updatedAt,
  };
}

export function isFinalSettlementBatchStatus(status: SettlementBatchStatus): boolean {
  return status === 'PAID' || status === 'CANCELLED';
}

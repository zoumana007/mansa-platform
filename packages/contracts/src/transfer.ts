import type { IdempotencyKey } from './idempotency.js';
import type { Money } from './money.js';

export const TRANSFER_STATUSES = [
  'CREATED',
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REVERSED',
] as const;

export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export interface CreateInternalTransferCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly sourceWalletId: string;
  readonly destinationWalletId: string;
  readonly amount: Money;
  readonly description?: string;
  readonly clientReference?: string;
}

export interface TransferFeeBreakdown {
  readonly serviceFee: Money;
  readonly tax: Money;
  readonly total: Money;
}

export interface InternalTransfer {
  readonly id: string;
  readonly sourceWalletId: string;
  readonly destinationWalletId: string;
  readonly amount: Money;
  readonly fees: TransferFeeBreakdown;
  readonly status: TransferStatus;
  readonly failureCode?: string;
  readonly description?: string;
  readonly clientReference?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
}

export function isTransferStatus(value: string): value is TransferStatus {
  return TRANSFER_STATUSES.includes(value as TransferStatus);
}

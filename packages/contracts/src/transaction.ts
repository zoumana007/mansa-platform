import type { Money } from './money.js';

export type TransactionStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export type TransactionType =
  | 'TRANSFER'
  | 'PAYMENT'
  | 'CASH_IN'
  | 'CASH_OUT'
  | 'REFUND'
  | 'FEE'
  | 'REVERSAL';

export interface TransactionReference {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly type: TransactionType;
  readonly status: TransactionStatus;
  readonly amount: Money;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const FINAL_TRANSACTION_STATUSES = [
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REVERSED',
] as const satisfies readonly TransactionStatus[];

export function isFinalTransactionStatus(status: TransactionStatus): boolean {
  return FINAL_TRANSACTION_STATUSES.includes(
    status as (typeof FINAL_TRANSACTION_STATUSES)[number],
  );
}

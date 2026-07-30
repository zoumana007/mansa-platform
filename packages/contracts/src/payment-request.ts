import type { IdempotencyKey } from './idempotency.js';
import type { Money } from './money.js';

export const PAYMENT_REQUEST_STATUSES = [
  'OPEN',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
  'EXPIRED',
] as const;

export type PaymentRequestStatus = (typeof PAYMENT_REQUEST_STATUSES)[number];

export interface CreatePaymentRequestCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly requesterId: string;
  readonly requesterWalletId: string;
  readonly payerId?: string;
  readonly amount: Money;
  readonly description?: string;
  readonly expiresAt: string;
}

export interface PaymentRequest {
  readonly id: string;
  readonly requesterId: string;
  readonly requesterWalletId: string;
  readonly payerId?: string;
  readonly amount: Money;
  readonly status: PaymentRequestStatus;
  readonly description?: string;
  readonly paymentId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt: string;
  readonly resolvedAt?: string;
}

export function isPaymentRequestStatus(
  value: string,
): value is PaymentRequestStatus {
  return PAYMENT_REQUEST_STATUSES.includes(value as PaymentRequestStatus);
}

import type { IdempotencyKey } from './idempotency.js';
import type { Money } from './money.js';

export const PAYMENT_STATUSES = [
  'CREATED',
  'REQUIRES_ACTION',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
  'REVERSED',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_CHANNELS = [
  'INTERNAL',
  'QR_STATIC',
  'QR_DYNAMIC',
  'PAYMENT_REQUEST',
  'TPE',
  'MOBILE_MONEY',
  'CARD',
  'PUBLIC_SERVICE',
] as const;

export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number];

export interface PaymentFeeBreakdown {
  readonly serviceFee: Money;
  readonly partnerFee: Money;
  readonly tax: Money;
  readonly total: Money;
}

export interface CreatePaymentCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly payerWalletId: string;
  readonly beneficiaryId: string;
  readonly beneficiaryWalletId?: string;
  readonly amount: Money;
  readonly channel: PaymentChannel;
  readonly description?: string;
  readonly clientReference?: string;
  readonly paymentIntentId?: string;
}

export interface Payment {
  readonly id: string;
  readonly payerWalletId: string;
  readonly beneficiaryId: string;
  readonly beneficiaryWalletId?: string;
  readonly amount: Money;
  readonly fees: PaymentFeeBreakdown;
  readonly channel: PaymentChannel;
  readonly status: PaymentStatus;
  readonly description?: string;
  readonly clientReference?: string;
  readonly failureCode?: string;
  readonly reversalOfPaymentId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
  readonly expiresAt?: string;
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus);
}

export function isPaymentChannel(value: string): value is PaymentChannel {
  return PAYMENT_CHANNELS.includes(value as PaymentChannel);
}

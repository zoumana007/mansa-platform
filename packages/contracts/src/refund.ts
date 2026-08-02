export const REFUND_STATUSES = [
  'REQUESTED',
  'REVIEW_REQUIRED',
  'APPROVED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;

export const REFUND_REASONS = [
  'CUSTOMER_REQUEST',
  'DUPLICATE_PAYMENT',
  'FRAUD_CONFIRMED',
  'ORDER_CANCELLED',
  'SERVICE_NOT_DELIVERED',
  'MERCHANT_GESTURE',
  'TECHNICAL_CORRECTION',
  'OTHER',
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];
export type RefundReason = (typeof REFUND_REASONS)[number];

export interface Refund {
  readonly refundId: string;
  readonly paymentId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly reason: RefundReason;
  readonly status: RefundStatus;
  readonly requestedBy: string;
  readonly idempotencyKey: string;
  readonly providerReference?: string;
  readonly failureCode?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateRefundCommand {
  readonly refundId: string;
  readonly paymentId: string;
  readonly amountMinor: number;
  readonly currency: string;
  readonly reason: RefundReason;
  readonly requestedBy: string;
  readonly idempotencyKey: string;
  readonly createdAt: string;
  readonly reviewRequired?: boolean;
}

export interface TransitionRefundCommand {
  readonly status: RefundStatus;
  readonly updatedAt: string;
  readonly providerReference?: string;
  readonly failureCode?: string;
}

const ALLOWED_TRANSITIONS: Readonly<Record<RefundStatus, readonly RefundStatus[]>> = {
  REQUESTED: ['REVIEW_REQUIRED', 'APPROVED', 'CANCELLED'],
  REVIEW_REQUIRED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SUCCEEDED', 'FAILED'],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

export function isRefundStatus(value: string): value is RefundStatus {
  return REFUND_STATUSES.includes(value as RefundStatus);
}

export function isRefundReason(value: string): value is RefundReason {
  return REFUND_REASONS.includes(value as RefundReason);
}

export function isFinalRefundStatus(status: RefundStatus): boolean {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELLED';
}

export function canTransitionRefund(currentStatus: RefundStatus, nextStatus: RefundStatus): boolean {
  return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function createRefund(command: CreateRefundCommand): Refund {
  if (!command.refundId || !command.paymentId || !command.requestedBy || !command.idempotencyKey) {
    throw new Error('refund identifiers, requester and idempotencyKey are required');
  }
  if (!Number.isSafeInteger(command.amountMinor) || command.amountMinor <= 0) {
    throw new Error('amountMinor must be a positive safe integer');
  }
  const currency = command.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('currency must be a three-letter code');

  return {
    refundId: command.refundId,
    paymentId: command.paymentId,
    amountMinor: command.amountMinor,
    currency,
    reason: command.reason,
    status: command.reviewRequired ? 'REVIEW_REQUIRED' : 'REQUESTED',
    requestedBy: command.requestedBy,
    idempotencyKey: command.idempotencyKey,
    createdAt: command.createdAt,
    updatedAt: command.createdAt,
  };
}

export function transitionRefund(refund: Refund, command: TransitionRefundCommand): Refund {
  if (!canTransitionRefund(refund.status, command.status)) {
    throw new Error(`Invalid refund transition: ${refund.status} -> ${command.status}`);
  }
  if (command.status === 'FAILED' && !command.failureCode) {
    throw new Error('failureCode is required for a failed refund');
  }
  if (command.status !== 'FAILED' && command.failureCode !== undefined) {
    throw new Error('failureCode is only allowed for a failed refund');
  }

  return {
    ...refund,
    status: command.status,
    updatedAt: command.updatedAt,
    providerReference: command.providerReference ?? refund.providerReference,
    failureCode: command.failureCode,
  };
}

export function remainingRefundableAmount(
  paymentAmountMinor: number,
  successfulRefundAmountsMinor: readonly number[],
): number {
  if (!Number.isSafeInteger(paymentAmountMinor) || paymentAmountMinor < 0) {
    throw new Error('paymentAmountMinor must be a non-negative safe integer');
  }
  const refunded = successfulRefundAmountsMinor.reduce((total, amount) => {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new Error('refund amounts must be non-negative safe integers');
    }
    return total + amount;
  }, 0);
  return Math.max(0, paymentAmountMinor - refunded);
}

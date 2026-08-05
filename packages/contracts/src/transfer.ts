import type { IdempotencyKey } from './idempotency.js';
import type { Money } from './money.js';

export const TRANSFER_TYPES = [
  'INTERNAL',
  'BANK',
  'MOBILE_MONEY',
  'MERCHANT',
  'PUBLIC_SERVICE',
] as const;

export const TRANSFER_STATUSES = [
  'CREATED',
  'PENDING_AUTHORIZATION',
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REVERSED',
] as const;

export const TRANSFER_FAILURE_CODES = [
  'INSUFFICIENT_FUNDS',
  'LIMIT_EXCEEDED',
  'BENEFICIARY_BLOCKED',
  'COMPLIANCE_REVIEW_REQUIRED',
  'PROVIDER_UNAVAILABLE',
  'DESTINATION_REJECTED',
  'TECHNICAL_ERROR',
] as const;

export type TransferType = (typeof TRANSFER_TYPES)[number];
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];
export type TransferFailureCode = (typeof TRANSFER_FAILURE_CODES)[number];

export interface CreateInternalTransferCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly sourceWalletId: string;
  readonly destinationWalletId: string;
  readonly amount: Money;
  readonly description?: string;
  readonly clientReference?: string;
}

export interface QuoteTransferCommand {
  readonly ownerUserId: string;
  readonly sourceWalletId: string;
  readonly beneficiaryId: string;
  readonly amount: Money;
  readonly clientReference?: string;
}

export interface TransferFeeBreakdown {
  readonly serviceFee: Money;
  readonly partnerFee?: Money;
  readonly tax: Money;
  readonly total: Money;
}

export interface TransferQuote {
  readonly quoteId: string;
  readonly ownerUserId: string;
  readonly sourceWalletId: string;
  readonly beneficiaryId: string;
  readonly type: TransferType;
  readonly amount: Money;
  readonly fees: TransferFeeBreakdown;
  readonly expiresAt: string;
}

export interface CreateTransferCommand {
  readonly ownerUserId: string;
  readonly quoteId: string;
  readonly idempotencyKey: IdempotencyKey;
  readonly description?: string;
  readonly clientReference?: string;
}

export interface AuthorizeTransferCommand {
  readonly transferId: string;
  readonly ownerUserId: string;
  readonly authenticationMethod:
    | 'PIN'
    | 'BIOMETRIC'
    | 'OTP'
    | 'STRONG_AUTHENTICATION';
  readonly challengeId?: string;
  readonly verificationCode?: string;
}

export interface CancelTransferCommand {
  readonly transferId: string;
  readonly ownerUserId: string;
  readonly reason: string;
}

export interface InternalTransfer {
  readonly id: string;
  readonly sourceWalletId: string;
  readonly destinationWalletId: string;
  readonly amount: Money;
  readonly fees: TransferFeeBreakdown;
  readonly status: TransferStatus;
  readonly failureCode?: TransferFailureCode;
  readonly description?: string;
  readonly clientReference?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
}

export interface Transfer {
  readonly id: string;
  readonly ownerUserId: string;
  readonly sourceWalletId: string;
  readonly beneficiaryId: string;
  readonly type: TransferType;
  readonly amount: Money;
  readonly fees: TransferFeeBreakdown;
  readonly status: TransferStatus;
  readonly idempotencyKey: IdempotencyKey;
  readonly failureCode?: TransferFailureCode;
  readonly failureReason?: string;
  readonly description?: string;
  readonly clientReference?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
}

export interface TransferReceipt {
  readonly transferId: string;
  readonly reference: string;
  readonly status: TransferStatus;
  readonly type: TransferType;
  readonly amount: Money;
  readonly fees: TransferFeeBreakdown;
  readonly sourceLabel: string;
  readonly beneficiaryLabel: string;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export function isTransferType(value: string): value is TransferType {
  return TRANSFER_TYPES.includes(value as TransferType);
}

export function isTransferStatus(value: string): value is TransferStatus {
  return TRANSFER_STATUSES.includes(value as TransferStatus);
}

export function isTransferFailureCode(value: string): value is TransferFailureCode {
  return TRANSFER_FAILURE_CODES.includes(value as TransferFailureCode);
}

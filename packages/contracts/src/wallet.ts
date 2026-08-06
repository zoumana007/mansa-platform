import type { CurrencyCode, Money } from './money.js';

export const WALLET_STATUSES = [
  'PENDING_ACTIVATION',
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'CLOSED',
] as const;

export const WALLET_HOLD_REASONS = [
  'PAYMENT_AUTHORIZATION',
  'TRANSFER_PENDING',
  'WITHDRAWAL_PENDING',
  'DISPUTE',
  'COMPLIANCE_REVIEW',
  'MANUAL_REVIEW',
] as const;

export type WalletStatus = (typeof WALLET_STATUSES)[number];
export type WalletHoldReason = (typeof WALLET_HOLD_REASONS)[number];

export interface Wallet {
  readonly id: string;
  readonly ownerId: string;
  readonly countryCode: string;
  readonly currency: CurrencyCode;
  readonly status: WalletStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly closedAt?: string;
}

export interface WalletBalance {
  readonly walletId: string;
  readonly available: Money;
  readonly reserved: Money;
  readonly total: Money;
  readonly ledgerSequence: number;
  readonly asOf: string;
}

export interface WalletHold {
  readonly id: string;
  readonly walletId: string;
  readonly reason: WalletHoldReason;
  readonly amount: Money;
  readonly referenceType: string;
  readonly referenceId: string;
  readonly status: 'ACTIVE' | 'RELEASED' | 'CAPTURED' | 'EXPIRED';
  readonly expiresAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateWalletCommand {
  readonly ownerId: string;
  readonly countryCode: string;
  readonly currency: CurrencyCode;
  readonly idempotencyKey: string;
}

export interface ChangeWalletStatusCommand {
  readonly walletId: string;
  readonly targetStatus: WalletStatus;
  readonly reasonCode: string;
  readonly actorId: string;
  readonly expectedVersion: number;
  readonly idempotencyKey: string;
}

export interface CreateWalletHoldCommand {
  readonly walletId: string;
  readonly reason: WalletHoldReason;
  readonly amount: Money;
  readonly referenceType: string;
  readonly referenceId: string;
  readonly expiresAt?: string;
  readonly idempotencyKey: string;
}

export interface ReleaseWalletHoldCommand {
  readonly walletId: string;
  readonly holdId: string;
  readonly reasonCode: string;
  readonly idempotencyKey: string;
}

export function isWalletStatus(value: string): value is WalletStatus {
  return WALLET_STATUSES.includes(value as WalletStatus);
}

export function isWalletHoldReason(value: string): value is WalletHoldReason {
  return WALLET_HOLD_REASONS.includes(value as WalletHoldReason);
}

export function isFinalWalletStatus(status: WalletStatus): boolean {
  return status === 'CLOSED';
}

export function canTransitionWalletStatus(
  current: WalletStatus,
  target: WalletStatus,
): boolean {
  if (current === target) {
    return true;
  }

  const transitions: Readonly<Record<WalletStatus, readonly WalletStatus[]>> = {
    PENDING_ACTIVATION: ['ACTIVE', 'RESTRICTED', 'CLOSED'],
    ACTIVE: ['RESTRICTED', 'SUSPENDED', 'CLOSED'],
    RESTRICTED: ['ACTIVE', 'SUSPENDED', 'CLOSED'],
    SUSPENDED: ['ACTIVE', 'RESTRICTED', 'CLOSED'],
    CLOSED: [],
  };

  return transitions[current].includes(target);
}

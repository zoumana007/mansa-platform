import type { CurrencyCode, Money } from './money.js';

export const WALLET_STATUSES = [
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'CLOSED',
] as const;

export type WalletStatus = (typeof WALLET_STATUSES)[number];

export interface Wallet {
  readonly id: string;
  readonly ownerId: string;
  readonly countryCode: string;
  readonly currency: CurrencyCode;
  readonly status: WalletStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WalletBalance {
  readonly walletId: string;
  readonly available: Money;
  readonly reserved: Money;
  readonly total: Money;
  readonly asOf: string;
}

export function isWalletStatus(value: string): value is WalletStatus {
  return WALLET_STATUSES.includes(value as WalletStatus);
}

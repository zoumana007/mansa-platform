import type { IdempotencyKey } from './idempotency.js';
import type { Money } from './money.js';

export const CARD_TYPES = [
  'PHYSICAL',
  'VIRTUAL',
  'VIRTUAL_TEMPORARY',
  'VIRTUAL_DISPOSABLE',
] as const;

export type CardType = (typeof CARD_TYPES)[number];

export const CARD_STATUSES = [
  'PENDING',
  'ACTIVE',
  'FROZEN',
  'BLOCKED',
  'EXPIRED',
  'CANCELLED',
] as const;

export type CardStatus = (typeof CARD_STATUSES)[number];

export const CARD_NETWORKS = ['VISA', 'MASTERCARD', 'LOCAL'] as const;

export type CardNetwork = (typeof CARD_NETWORKS)[number];

export interface CardUsageControls {
  readonly inStoreEnabled: boolean;
  readonly onlineEnabled: boolean;
  readonly contactlessEnabled: boolean;
  readonly cashWithdrawalEnabled: boolean;
  readonly internationalEnabled: boolean;
}

export interface CardSpendingLimits {
  readonly paymentPerTransaction: Money;
  readonly paymentDaily: Money;
  readonly cashWithdrawalPerTransaction: Money;
  readonly cashWithdrawalDaily: Money;
  readonly onlinePaymentDaily: Money;
}

export interface CardReference {
  readonly id: string;
  readonly walletId: string;
  readonly productId: string;
  readonly type: CardType;
  readonly network: CardNetwork;
  readonly status: CardStatus;
  readonly displayName: string;
  readonly lastFour: string;
  readonly expiryMonth: number;
  readonly expiryYear: number;
  readonly controls: CardUsageControls;
  readonly limits: CardSpendingLimits;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateCardCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly walletId: string;
  readonly productId: string;
  readonly type: CardType;
  readonly deliveryAddressId?: string;
}

export interface ChangeCardStatusCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly cardId: string;
  readonly targetStatus: 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'CANCELLED';
  readonly reason?: string;
}

export interface UpdateCardControlsCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly cardId: string;
  readonly controls: CardUsageControls;
}

export interface UpdateCardLimitsCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly cardId: string;
  readonly limits: CardSpendingLimits;
}

export function isCardType(value: string): value is CardType {
  return CARD_TYPES.includes(value as CardType);
}

export function isCardStatus(value: string): value is CardStatus {
  return CARD_STATUSES.includes(value as CardStatus);
}

export function isCardNetwork(value: string): value is CardNetwork {
  return CARD_NETWORKS.includes(value as CardNetwork);
}

export function isFinalCardStatus(status: CardStatus): boolean {
  return status === 'EXPIRED' || status === 'CANCELLED';
}

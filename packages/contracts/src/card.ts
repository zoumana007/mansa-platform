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

export const CARD_DELIVERY_STATUSES = [
  'NOT_REQUIRED',
  'PENDING',
  'IN_PRODUCTION',
  'SHIPPED',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
] as const;

export type CardDeliveryStatus = (typeof CARD_DELIVERY_STATUSES)[number];

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

export interface CardProduct {
  readonly id: string;
  readonly code: string;
  readonly displayName: string;
  readonly type: CardType;
  readonly network: CardNetwork;
  readonly supportedCurrencyCodes: readonly string[];
  readonly issuanceFee: Money;
  readonly replacementFee: Money;
  readonly defaultControls: CardUsageControls;
  readonly defaultLimits: CardSpendingLimits;
  readonly active: boolean;
}

export interface CardDelivery {
  readonly status: CardDeliveryStatus;
  readonly addressId?: string;
  readonly carrierReference?: string;
  readonly estimatedDeliveryAt?: string;
  readonly deliveredAt?: string;
  readonly failureReason?: string;
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
  readonly delivery: CardDelivery;
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

export interface RequestCardReplacementCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly cardId: string;
  readonly reason: 'DAMAGED' | 'LOST' | 'STOLEN' | 'EXPIRED' | 'OTHER';
  readonly deliveryAddressId?: string;
  readonly comment?: string;
}

export interface CardReplacement {
  readonly id: string;
  readonly previousCardId: string;
  readonly replacementCardId?: string;
  readonly reason: RequestCardReplacementCommand['reason'];
  readonly fee: Money;
  readonly status: 'REQUESTED' | 'APPROVED' | 'ISSUED' | 'REJECTED' | 'CANCELLED';
  readonly requestedAt: string;
  readonly completedAt?: string;
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

export function isCardDeliveryStatus(value: string): value is CardDeliveryStatus {
  return CARD_DELIVERY_STATUSES.includes(value as CardDeliveryStatus);
}

export function isFinalCardStatus(status: CardStatus): boolean {
  return status === 'EXPIRED' || status === 'CANCELLED';
}

export function canTransitionCardStatus(
  currentStatus: CardStatus,
  targetStatus: CardStatus,
): boolean {
  if (currentStatus === targetStatus || isFinalCardStatus(currentStatus)) {
    return false;
  }

  const allowedTransitions: Readonly<Record<CardStatus, readonly CardStatus[]>> = {
    PENDING: ['ACTIVE', 'BLOCKED', 'CANCELLED'],
    ACTIVE: ['FROZEN', 'BLOCKED', 'EXPIRED', 'CANCELLED'],
    FROZEN: ['ACTIVE', 'BLOCKED', 'EXPIRED', 'CANCELLED'],
    BLOCKED: ['CANCELLED'],
    EXPIRED: [],
    CANCELLED: [],
  };

  return allowedTransitions[currentStatus].includes(targetStatus);
}

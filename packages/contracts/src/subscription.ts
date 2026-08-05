import type { Money } from './money.js';

export const SUBSCRIPTION_FREQUENCIES = [
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'IRREGULAR',
] as const;
export type SubscriptionFrequency = (typeof SUBSCRIPTION_FREQUENCIES)[number];

export const SUBSCRIPTION_STATUSES = [
  'DETECTED',
  'CONFIRMED',
  'IGNORED',
  'CANCELLED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_SOURCES = ['AUTOMATIC', 'MANUAL'] as const;
export type SubscriptionSource = (typeof SUBSCRIPTION_SOURCES)[number];

export interface RecurringSubscription {
  id: string;
  ownerId: string;
  walletId: string;
  merchantName: string;
  merchantId?: string;
  categoryCode?: string;
  expectedAmount: Money;
  frequency: SubscriptionFrequency;
  source: SubscriptionSource;
  status: SubscriptionStatus;
  confidenceScore?: number;
  lastTransactionId?: string;
  lastChargedAt?: string;
  nextExpectedChargeAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetectSubscriptionCandidateCommand {
  ownerId: string;
  walletId: string;
  merchantName: string;
  merchantId?: string;
  categoryCode?: string;
  expectedAmount: Money;
  frequency: SubscriptionFrequency;
  confidenceScore: number;
  lastTransactionId: string;
  lastChargedAt: string;
  nextExpectedChargeAt?: string;
}

export interface CreateManualSubscriptionCommand {
  ownerId: string;
  walletId: string;
  merchantName: string;
  merchantId?: string;
  categoryCode?: string;
  expectedAmount: Money;
  frequency: SubscriptionFrequency;
  nextExpectedChargeAt?: string;
}

export interface UpdateSubscriptionCommand {
  subscriptionId: string;
  merchantName?: string;
  categoryCode?: string;
  expectedAmount?: Money;
  frequency?: SubscriptionFrequency;
  status?: SubscriptionStatus;
  nextExpectedChargeAt?: string;
}

export interface SubscriptionCharge {
  id: string;
  subscriptionId: string;
  transactionId: string;
  amount: Money;
  chargedAt: string;
}

export function isSubscriptionFrequency(
  value: string,
): value is SubscriptionFrequency {
  return SUBSCRIPTION_FREQUENCIES.includes(value as SubscriptionFrequency);
}

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return SUBSCRIPTION_STATUSES.includes(value as SubscriptionStatus);
}

export function isSubscriptionSource(value: string): value is SubscriptionSource {
  return SUBSCRIPTION_SOURCES.includes(value as SubscriptionSource);
}

export function isValidSubscriptionConfidenceScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

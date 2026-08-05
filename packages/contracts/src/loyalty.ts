import type { Money } from './money.js';

export const LOYALTY_PROGRAM_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'] as const;
export type LoyaltyProgramStatus = (typeof LOYALTY_PROGRAM_STATUSES)[number];

export const LOYALTY_ACCOUNT_STATUSES = ['ACTIVE', 'SUSPENDED', 'CLOSED'] as const;
export type LoyaltyAccountStatus = (typeof LOYALTY_ACCOUNT_STATUSES)[number];

export const LOYALTY_TRANSACTION_TYPES = [
  'EARN',
  'REDEEM',
  'ADJUSTMENT',
  'EXPIRATION',
  'REVERSAL',
] as const;
export type LoyaltyTransactionType = (typeof LOYALTY_TRANSACTION_TYPES)[number];

export const REWARD_TYPES = ['DISCOUNT', 'CASHBACK', 'VOUCHER', 'GIFT', 'POINTS'] as const;
export type RewardType = (typeof REWARD_TYPES)[number];

export const REWARD_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'EXHAUSTED', 'ENDED'] as const;
export type RewardStatus = (typeof REWARD_STATUSES)[number];

export interface LoyaltyProgram {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  status: LoyaltyProgramStatus;
  pointsName: string;
  earnRate: number;
  minimumSpend?: Money;
  pointsExpireAfterDays?: number;
  startsAt: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyAccount {
  id: string;
  programId: string;
  customerId: string;
  status: LoyaltyAccountStatus;
  availablePoints: number;
  pendingPoints: number;
  lifetimeEarnedPoints: number;
  lifetimeRedeemedPoints: number;
  enrolledAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  accountId: string;
  type: LoyaltyTransactionType;
  points: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  programId: string;
  name: string;
  description?: string;
  type: RewardType;
  status: RewardStatus;
  pointsCost: number;
  monetaryValue?: Money;
  stock?: number;
  perCustomerLimit?: number;
  startsAt: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  accountId: string;
  pointsSpent: number;
  redemptionCode: string;
  redeemedAt: string;
  consumedAt?: string;
  expiresAt?: string;
  reversedAt?: string;
}

export interface CreateLoyaltyProgramCommand {
  merchantId: string;
  name: string;
  description?: string;
  pointsName: string;
  earnRate: number;
  minimumSpend?: Money;
  pointsExpireAfterDays?: number;
  startsAt: string;
  endsAt?: string;
}

export interface UpdateLoyaltyProgramCommand {
  programId: string;
  name?: string;
  description?: string;
  status?: LoyaltyProgramStatus;
  pointsName?: string;
  earnRate?: number;
  minimumSpend?: Money;
  pointsExpireAfterDays?: number;
  startsAt?: string;
  endsAt?: string;
}

export interface EnrollLoyaltyAccountCommand {
  programId: string;
  customerId: string;
}

export interface EarnLoyaltyPointsCommand {
  accountId: string;
  points: number;
  referenceType: string;
  referenceId: string;
  reason?: string;
  expiresAt?: string;
}

export interface RedeemRewardCommand {
  accountId: string;
  rewardId: string;
}

export function isLoyaltyProgramStatus(value: string): value is LoyaltyProgramStatus {
  return LOYALTY_PROGRAM_STATUSES.includes(value as LoyaltyProgramStatus);
}

export function isLoyaltyAccountStatus(value: string): value is LoyaltyAccountStatus {
  return LOYALTY_ACCOUNT_STATUSES.includes(value as LoyaltyAccountStatus);
}

export function isLoyaltyTransactionType(value: string): value is LoyaltyTransactionType {
  return LOYALTY_TRANSACTION_TYPES.includes(value as LoyaltyTransactionType);
}

export function isRewardType(value: string): value is RewardType {
  return REWARD_TYPES.includes(value as RewardType);
}

export function isRewardStatus(value: string): value is RewardStatus {
  return REWARD_STATUSES.includes(value as RewardStatus);
}

export function isValidPoints(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function isValidEarnRate(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

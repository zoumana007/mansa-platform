import type { CurrencyCode, Money } from './money.js';

export const MERCHANT_STATUSES = [
  'DRAFT',
  'UNDER_REVIEW',
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'CLOSED',
] as const;

export type MerchantStatus = (typeof MERCHANT_STATUSES)[number];

export const MERCHANT_MEMBER_ROLES = [
  'OWNER',
  'MANAGER',
  'CASHIER',
  'ACCOUNTANT',
  'SUPPORT',
] as const;

export type MerchantMemberRole = (typeof MERCHANT_MEMBER_ROLES)[number];

export const MERCHANT_MEMBER_STATUSES = [
  'INVITED',
  'ACTIVE',
  'SUSPENDED',
  'REVOKED',
] as const;

export type MerchantMemberStatus = (typeof MERCHANT_MEMBER_STATUSES)[number];

export const SETTLEMENT_STATUSES = [
  'SCHEDULED',
  'PROCESSING',
  'PAID',
  'FAILED',
  'HELD',
  'CANCELLED',
] as const;

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

export const LOYALTY_PROGRAM_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'] as const;
export const LOYALTY_ACCOUNT_STATUSES = ['ACTIVE', 'SUSPENDED', 'CLOSED'] as const;
export const LOYALTY_TRANSACTION_TYPES = ['EARN', 'REDEEM', 'ADJUST', 'EXPIRE', 'REVERSE'] as const;
export const LOYALTY_REWARD_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'EXHAUSTED', 'EXPIRED', 'ARCHIVED'] as const;

export type LoyaltyProgramStatus = (typeof LOYALTY_PROGRAM_STATUSES)[number];
export type LoyaltyAccountStatus = (typeof LOYALTY_ACCOUNT_STATUSES)[number];
export type LoyaltyTransactionType = (typeof LOYALTY_TRANSACTION_TYPES)[number];
export type LoyaltyRewardStatus = (typeof LOYALTY_REWARD_STATUSES)[number];

export interface Merchant {
  id: string;
  legalName: string;
  displayName: string;
  countryCode: string;
  defaultCurrency: CurrencyCode;
  status: MerchantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantLocation {
  id: string;
  merchantId: string;
  name: string;
  countryCode: string;
  city?: string;
  addressLine?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantMember {
  id: string;
  merchantId: string;
  userId: string;
  role: MerchantMemberRole;
  status: MerchantMemberStatus;
  locationIds: string[];
  invitedAt?: string;
  activatedAt?: string;
  revokedAt?: string;
}

export interface CreateMerchantCommand {
  ownerUserId: string;
  legalName: string;
  displayName: string;
  countryCode: string;
  defaultCurrency: CurrencyCode;
  businessCategory: string;
  registrationNumber?: string;
  taxIdentifier?: string;
}

export interface CreateMerchantLocationCommand {
  merchantId: string;
  name: string;
  countryCode: string;
  city?: string;
  addressLine?: string;
}

export interface InviteMerchantMemberCommand {
  merchantId: string;
  invitedByUserId: string;
  contact: string;
  role: MerchantMemberRole;
  locationIds: string[];
}

export interface Settlement {
  id: string;
  merchantId: string;
  settlementAccountId: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: Money;
  refundAmount: Money;
  feeAmount: Money;
  adjustmentAmount: Money;
  netAmount: Money;
  status: SettlementStatus;
  scheduledAt: string;
  completedAt?: string;
  failureCode?: string;
}

export interface MerchantDashboardSummary {
  merchantId: string;
  locationId?: string;
  periodStart: string;
  periodEnd: string;
  grossSales: Money;
  refunds: Money;
  fees: Money;
  netSales: Money;
  successfulPaymentCount: number;
  failedPaymentCount: number;
}

export interface LoyaltyProgram {
  id: string;
  merchantId: string;
  name: string;
  pointsName: string;
  earnRatePoints: number;
  earnRateAmount: Money;
  minimumRedeemablePoints: number;
  pointsValidityDays?: number;
  status: LoyaltyProgramStatus;
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
  openedAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  accountId: string;
  type: LoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  businessReference: string;
  idempotencyKey: string;
  reasonCode?: string;
  expiresAt?: string;
  reversedTransactionId?: string;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  programId: string;
  name: string;
  description?: string;
  pointsCost: number;
  status: LoyaltyRewardStatus;
  fixedDiscount?: Money;
  percentageDiscountBps?: number;
  maximumRedemptions?: number;
  redemptionsCount: number;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EarnLoyaltyPointsCommand {
  accountId: string;
  points: number;
  businessReference: string;
  idempotencyKey: string;
  occurredAt: string;
}

export interface RedeemLoyaltyRewardCommand {
  accountId: string;
  rewardId: string;
  businessReference: string;
  idempotencyKey: string;
}

export interface AdjustLoyaltyPointsCommand {
  accountId: string;
  pointsDelta: number;
  reasonCode: string;
  justification: string;
  idempotencyKey: string;
}

export function isMerchantStatus(value: string): value is MerchantStatus {
  return MERCHANT_STATUSES.includes(value as MerchantStatus);
}

export function isMerchantMemberRole(value: string): value is MerchantMemberRole {
  return MERCHANT_MEMBER_ROLES.includes(value as MerchantMemberRole);
}

export function isMerchantMemberStatus(value: string): value is MerchantMemberStatus {
  return MERCHANT_MEMBER_STATUSES.includes(value as MerchantMemberStatus);
}

export function isSettlementStatus(value: string): value is SettlementStatus {
  return SETTLEMENT_STATUSES.includes(value as SettlementStatus);
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

export function isLoyaltyRewardStatus(value: string): value is LoyaltyRewardStatus {
  return LOYALTY_REWARD_STATUSES.includes(value as LoyaltyRewardStatus);
}

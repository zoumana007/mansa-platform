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

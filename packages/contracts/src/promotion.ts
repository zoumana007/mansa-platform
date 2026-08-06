import type { Money } from './money.js';

export const PROMOTION_STATUSES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED', 'CANCELLED'] as const;
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export const PROMOTION_TYPES = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'CASHBACK', 'BONUS_POINTS'] as const;
export type PromotionType = (typeof PROMOTION_TYPES)[number];

export const PROMOTION_AUDIENCE_TYPES = ['ALL', 'CUSTOMER_SEGMENT', 'CUSTOMER_LIST', 'NEW_CUSTOMERS'] as const;
export type PromotionAudienceType = (typeof PROMOTION_AUDIENCE_TYPES)[number];

export const PROMOTION_TRIGGER_TYPES = ['AUTOMATIC', 'PROMO_CODE'] as const;
export type PromotionTriggerType = (typeof PROMOTION_TRIGGER_TYPES)[number];

export interface PromotionBenefit {
  type: PromotionType;
  percentageBasisPoints?: number;
  fixedAmount?: Money;
  cashbackAmount?: Money;
  bonusPoints?: number;
  maximumBenefit?: Money;
}

export interface PromotionEligibility {
  audienceType: PromotionAudienceType;
  customerSegmentIds?: string[];
  customerIds?: string[];
  minimumBasket?: Money;
  eligibleProductIds?: string[];
  eligibleLocationIds?: string[];
  excludedProductIds?: string[];
  firstPurchaseOnly?: boolean;
}

export interface PromotionUsageLimits {
  totalRedemptions?: number;
  redemptionsPerCustomer?: number;
  budget?: Money;
}

export interface Promotion {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  status: PromotionStatus;
  triggerType: PromotionTriggerType;
  promoCode?: string;
  benefit: PromotionBenefit;
  eligibility: PromotionEligibility;
  usageLimits?: PromotionUsageLimits;
  startsAt: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionRedemption {
  id: string;
  promotionId: string;
  customerId: string;
  paymentId: string;
  orderId?: string;
  benefitAmount?: Money;
  bonusPoints?: number;
  redeemedAt: string;
  reversedAt?: string;
}

export interface CreatePromotionCommand {
  merchantId: string;
  name: string;
  description?: string;
  triggerType: PromotionTriggerType;
  promoCode?: string;
  benefit: PromotionBenefit;
  eligibility: PromotionEligibility;
  usageLimits?: PromotionUsageLimits;
  startsAt: string;
  endsAt?: string;
}

export interface UpdatePromotionCommand {
  promotionId: string;
  name?: string;
  description?: string;
  status?: PromotionStatus;
  triggerType?: PromotionTriggerType;
  promoCode?: string;
  benefit?: PromotionBenefit;
  eligibility?: PromotionEligibility;
  usageLimits?: PromotionUsageLimits;
  startsAt?: string;
  endsAt?: string;
}

export interface EvaluatePromotionCommand {
  promotionId: string;
  customerId: string;
  basketAmount: Money;
  productIds?: string[];
  locationId?: string;
  promoCode?: string;
  evaluatedAt: string;
}

export interface PromotionEvaluation {
  eligible: boolean;
  reasonCode?: string;
  benefitAmount?: Money;
  bonusPoints?: number;
}

export function isPromotionStatus(value: string): value is PromotionStatus {
  return PROMOTION_STATUSES.includes(value as PromotionStatus);
}

export function isPromotionType(value: string): value is PromotionType {
  return PROMOTION_TYPES.includes(value as PromotionType);
}

export function isPromotionAudienceType(value: string): value is PromotionAudienceType {
  return PROMOTION_AUDIENCE_TYPES.includes(value as PromotionAudienceType);
}

export function isPromotionTriggerType(value: string): value is PromotionTriggerType {
  return PROMOTION_TRIGGER_TYPES.includes(value as PromotionTriggerType);
}

export function isValidPercentageBasisPoints(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0 && value <= 10_000;
}

export function normalizePromoCode(value: string): string {
  return value.trim().toUpperCase();
}

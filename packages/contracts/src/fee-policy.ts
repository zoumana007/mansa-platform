import type { CurrencyCode, Money } from './money.js';

export const FEE_CALCULATION_METHODS = ['FIXED', 'PERCENTAGE', 'FIXED_PLUS_PERCENTAGE'] as const;
export const FEE_PAYER_TYPES = ['CUSTOMER', 'MERCHANT', 'SHARED', 'SPONSOR'] as const;
export const FEE_POLICY_STATUSES = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'RETIRED'] as const;

export type FeeCalculationMethod = (typeof FEE_CALCULATION_METHODS)[number];
export type FeePayerType = (typeof FEE_PAYER_TYPES)[number];
export type FeePolicyStatus = (typeof FEE_POLICY_STATUSES)[number];

export interface FeePolicy {
  readonly policyId: string;
  readonly operationType: string;
  readonly channel?: string;
  readonly countryCode: string;
  readonly currency: CurrencyCode;
  readonly method: FeeCalculationMethod;
  readonly fixedAmountMinor?: bigint;
  readonly percentageBasisPoints?: number;
  readonly minimumFeeMinor?: bigint;
  readonly maximumFeeMinor?: bigint;
  readonly payer: FeePayerType;
  readonly status: FeePolicyStatus;
  readonly effectiveFrom: string;
  readonly effectiveUntil?: string;
}

export interface FeeQuote {
  readonly policyId: string;
  readonly baseAmount: Money;
  readonly feeAmount: Money;
  readonly totalDebitedAmount: Money;
  readonly netCreditedAmount: Money;
  readonly payer: FeePayerType;
}

export function isFeeCalculationMethod(value: string): value is FeeCalculationMethod {
  return FEE_CALCULATION_METHODS.includes(value as FeeCalculationMethod);
}

export function isFeePayerType(value: string): value is FeePayerType {
  return FEE_PAYER_TYPES.includes(value as FeePayerType);
}

export function isFeePolicyStatus(value: string): value is FeePolicyStatus {
  return FEE_POLICY_STATUSES.includes(value as FeePolicyStatus);
}

export function calculateFeeQuote(policy: FeePolicy, baseAmount: Money): FeeQuote {
  if (policy.status !== 'ACTIVE') throw new Error('Fee policy must be active');
  if (policy.currency !== baseAmount.currency) throw new Error('Fee policy currency mismatch');
  if (baseAmount.amountMinor < 0n) throw new Error('Base amount must be non-negative');

  let feeAmountMinor = 0n;

  if (policy.method === 'FIXED' || policy.method === 'FIXED_PLUS_PERCENTAGE') {
    feeAmountMinor += requireNonNegative(policy.fixedAmountMinor, 'fixedAmountMinor');
  }

  if (policy.method === 'PERCENTAGE' || policy.method === 'FIXED_PLUS_PERCENTAGE') {
    const basisPoints = policy.percentageBasisPoints;
    if (!Number.isInteger(basisPoints) || basisPoints === undefined || basisPoints < 0) {
      throw new Error('percentageBasisPoints must be a non-negative integer');
    }
    feeAmountMinor += (baseAmount.amountMinor * BigInt(basisPoints)) / 10_000n;
  }

  if (policy.minimumFeeMinor !== undefined && feeAmountMinor < policy.minimumFeeMinor) {
    feeAmountMinor = requireNonNegative(policy.minimumFeeMinor, 'minimumFeeMinor');
  }

  if (policy.maximumFeeMinor !== undefined && feeAmountMinor > policy.maximumFeeMinor) {
    feeAmountMinor = requireNonNegative(policy.maximumFeeMinor, 'maximumFeeMinor');
  }

  const customerFee = policy.payer === 'CUSTOMER' ? feeAmountMinor : policy.payer === 'SHARED' ? feeAmountMinor / 2n : 0n;
  const merchantFee = policy.payer === 'MERCHANT' ? feeAmountMinor : policy.payer === 'SHARED' ? feeAmountMinor - customerFee : 0n;

  return {
    policyId: policy.policyId,
    baseAmount,
    feeAmount: { amountMinor: feeAmountMinor, currency: baseAmount.currency },
    totalDebitedAmount: { amountMinor: baseAmount.amountMinor + customerFee, currency: baseAmount.currency },
    netCreditedAmount: { amountMinor: baseAmount.amountMinor - merchantFee, currency: baseAmount.currency },
    payer: policy.payer,
  };
}

function requireNonNegative(value: bigint | undefined, field: string): bigint {
  if (value === undefined || value < 0n) throw new Error(`${field} must be non-negative`);
  return value;
}

import type { CurrencyCode, Money } from './money.js';

export const COMMISSION_BENEFICIARY_TYPES = [
  'PLATFORM',
  'AGENT',
  'MERCHANT',
  'PARTNER',
  'STATE',
  'NETWORK',
] as const;

export const COMMISSION_CALCULATION_METHODS = [
  'FIXED',
  'PERCENTAGE',
  'FIXED_PLUS_PERCENTAGE',
] as const;

export const COMMISSION_POLICY_STATUSES = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'RETIRED'] as const;
export const COMMISSION_ACCRUAL_STATUSES = ['PENDING', 'ACCRUED', 'REVERSED', 'PAID'] as const;

export type CommissionBeneficiaryType = (typeof COMMISSION_BENEFICIARY_TYPES)[number];
export type CommissionCalculationMethod = (typeof COMMISSION_CALCULATION_METHODS)[number];
export type CommissionPolicyStatus = (typeof COMMISSION_POLICY_STATUSES)[number];
export type CommissionAccrualStatus = (typeof COMMISSION_ACCRUAL_STATUSES)[number];

export interface CommissionRule {
  readonly ruleId: string;
  readonly beneficiaryType: CommissionBeneficiaryType;
  readonly beneficiaryId?: string;
  readonly method: CommissionCalculationMethod;
  readonly fixedAmountMinor?: bigint;
  readonly percentageBasisPoints?: number;
  readonly minimumAmountMinor?: bigint;
  readonly maximumAmountMinor?: bigint;
  readonly priority: number;
}

export interface CommissionPolicy {
  readonly policyId: string;
  readonly operationType: string;
  readonly channel?: string;
  readonly countryCode: string;
  readonly currency: CurrencyCode;
  readonly status: CommissionPolicyStatus;
  readonly effectiveFrom: string;
  readonly effectiveUntil?: string;
  readonly rules: readonly CommissionRule[];
}

export interface CommissionAllocation {
  readonly ruleId: string;
  readonly beneficiaryType: CommissionBeneficiaryType;
  readonly beneficiaryId?: string;
  readonly amount: Money;
}

export interface CommissionQuote {
  readonly policyId: string;
  readonly baseAmount: Money;
  readonly totalCommission: Money;
  readonly allocations: readonly CommissionAllocation[];
}

export interface CommissionAccrual {
  readonly accrualId: string;
  readonly policyId: string;
  readonly transactionId: string;
  readonly beneficiaryType: CommissionBeneficiaryType;
  readonly beneficiaryId?: string;
  readonly amount: Money;
  readonly status: CommissionAccrualStatus;
  readonly accruedAt?: string;
  readonly reversedAt?: string;
  readonly paidAt?: string;
}

export function isCommissionBeneficiaryType(value: string): value is CommissionBeneficiaryType {
  return COMMISSION_BENEFICIARY_TYPES.includes(value as CommissionBeneficiaryType);
}

export function isCommissionCalculationMethod(value: string): value is CommissionCalculationMethod {
  return COMMISSION_CALCULATION_METHODS.includes(value as CommissionCalculationMethod);
}

export function isCommissionPolicyStatus(value: string): value is CommissionPolicyStatus {
  return COMMISSION_POLICY_STATUSES.includes(value as CommissionPolicyStatus);
}

export function isCommissionAccrualStatus(value: string): value is CommissionAccrualStatus {
  return COMMISSION_ACCRUAL_STATUSES.includes(value as CommissionAccrualStatus);
}

export function calculateCommissionQuote(
  policy: CommissionPolicy,
  baseAmount: Money,
): CommissionQuote {
  if (policy.status !== 'ACTIVE') throw new Error('Commission policy must be active');
  if (policy.currency !== baseAmount.currency) throw new Error('Commission policy currency mismatch');
  if (baseAmount.amountMinor < 0n) throw new Error('Base amount must be non-negative');

  const allocations = [...policy.rules]
    .sort((left, right) => left.priority - right.priority)
    .map((rule) => ({
      ruleId: rule.ruleId,
      beneficiaryType: rule.beneficiaryType,
      beneficiaryId: rule.beneficiaryId,
      amount: {
        amountMinor: calculateRuleAmount(rule, baseAmount.amountMinor),
        currency: baseAmount.currency,
      },
    }));

  const totalAmountMinor = allocations.reduce(
    (total, allocation) => total + allocation.amount.amountMinor,
    0n,
  );

  return {
    policyId: policy.policyId,
    baseAmount,
    totalCommission: { amountMinor: totalAmountMinor, currency: baseAmount.currency },
    allocations,
  };
}

function calculateRuleAmount(rule: CommissionRule, baseAmountMinor: bigint): bigint {
  let amountMinor = 0n;

  if (rule.method === 'FIXED' || rule.method === 'FIXED_PLUS_PERCENTAGE') {
    amountMinor += requireNonNegative(rule.fixedAmountMinor, 'fixedAmountMinor');
  }

  if (rule.method === 'PERCENTAGE' || rule.method === 'FIXED_PLUS_PERCENTAGE') {
    const basisPoints = rule.percentageBasisPoints;
    if (basisPoints === undefined || !Number.isInteger(basisPoints) || basisPoints < 0) {
      throw new Error('percentageBasisPoints must be a non-negative integer');
    }
    amountMinor += (baseAmountMinor * BigInt(basisPoints)) / 10_000n;
  }

  if (rule.minimumAmountMinor !== undefined && amountMinor < rule.minimumAmountMinor) {
    amountMinor = requireNonNegative(rule.minimumAmountMinor, 'minimumAmountMinor');
  }

  if (rule.maximumAmountMinor !== undefined && amountMinor > rule.maximumAmountMinor) {
    amountMinor = requireNonNegative(rule.maximumAmountMinor, 'maximumAmountMinor');
  }

  return amountMinor;
}

function requireNonNegative(value: bigint | undefined, field: string): bigint {
  if (value === undefined || value < 0n) throw new Error(`${field} must be non-negative`);
  return value;
}

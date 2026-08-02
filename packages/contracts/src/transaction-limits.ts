import type { CurrencyCode, Money } from './money.js';

export const TRANSACTION_LIMIT_PERIODS = ['PER_TRANSACTION', 'DAILY', 'WEEKLY', 'MONTHLY'] as const;
export const TRANSACTION_LIMIT_SCOPES = ['USER', 'WALLET', 'MERCHANT', 'TERMINAL', 'COUNTRY'] as const;
export const TRANSACTION_LIMIT_STATUSES = ['ACTIVE', 'SUSPENDED', 'EXPIRED'] as const;

export type TransactionLimitPeriod = (typeof TRANSACTION_LIMIT_PERIODS)[number];
export type TransactionLimitScope = (typeof TRANSACTION_LIMIT_SCOPES)[number];
export type TransactionLimitStatus = (typeof TRANSACTION_LIMIT_STATUSES)[number];

export interface TransactionLimit {
  readonly limitId: string;
  readonly scope: TransactionLimitScope;
  readonly scopeId: string;
  readonly period: TransactionLimitPeriod;
  readonly amount: Money;
  readonly status: TransactionLimitStatus;
  readonly effectiveFrom: string;
  readonly effectiveUntil?: string;
}

export interface TransactionLimitConsumption {
  readonly limitId: string;
  readonly consumedAmountMinor: bigint;
  readonly operationCount: number;
  readonly periodStartedAt: string;
  readonly periodEndsAt: string;
}

export interface TransactionLimitEvaluation {
  readonly allowed: boolean;
  readonly reason: 'WITHIN_LIMIT' | 'LIMIT_EXCEEDED' | 'CURRENCY_MISMATCH' | 'LIMIT_INACTIVE';
  readonly remainingAmountMinor: bigint;
}

export function isTransactionLimitPeriod(value: string): value is TransactionLimitPeriod {
  return TRANSACTION_LIMIT_PERIODS.includes(value as TransactionLimitPeriod);
}

export function isTransactionLimitScope(value: string): value is TransactionLimitScope {
  return TRANSACTION_LIMIT_SCOPES.includes(value as TransactionLimitScope);
}

export function isTransactionLimitStatus(value: string): value is TransactionLimitStatus {
  return TRANSACTION_LIMIT_STATUSES.includes(value as TransactionLimitStatus);
}

export function evaluateTransactionLimit(
  limit: TransactionLimit,
  consumption: TransactionLimitConsumption,
  requestedAmount: Money,
  evaluatedAt: Date = new Date(),
): TransactionLimitEvaluation {
  if (!isLimitActiveAt(limit, evaluatedAt)) {
    return {
      allowed: false,
      reason: 'LIMIT_INACTIVE',
      remainingAmountMinor: 0n,
    };
  }

  if (limit.amount.currency !== requestedAmount.currency) {
    return {
      allowed: false,
      reason: 'CURRENCY_MISMATCH',
      remainingAmountMinor: remaining(limit, consumption),
    };
  }

  const remainingAmountMinor = remaining(limit, consumption);
  const allowed = requestedAmount.amountMinor >= 0n && requestedAmount.amountMinor <= remainingAmountMinor;

  return {
    allowed,
    reason: allowed ? 'WITHIN_LIMIT' : 'LIMIT_EXCEEDED',
    remainingAmountMinor,
  };
}

export function createTransactionLimitAmount(
  amountMinor: bigint,
  currency: CurrencyCode,
): Money {
  if (amountMinor < 0n) throw new Error('Transaction limit amount must be non-negative');
  return { amountMinor, currency };
}

function remaining(
  limit: TransactionLimit,
  consumption: TransactionLimitConsumption,
): bigint {
  const value = limit.amount.amountMinor - consumption.consumedAmountMinor;
  return value > 0n ? value : 0n;
}

function isLimitActiveAt(limit: TransactionLimit, evaluatedAt: Date): boolean {
  if (limit.status !== 'ACTIVE') return false;

  const instant = evaluatedAt.getTime();
  const startsAt = Date.parse(limit.effectiveFrom);
  const endsAt = limit.effectiveUntil
    ? Date.parse(limit.effectiveUntil)
    : Number.POSITIVE_INFINITY;

  return startsAt <= instant && instant < endsAt;
}

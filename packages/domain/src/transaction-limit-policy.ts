import { Money } from "./money.js";

export type TransactionLimitReason =
  | "non_positive_amount"
  | "currency_mismatch"
  | "per_transaction_limit_exceeded"
  | "daily_limit_exceeded"
  | "monthly_limit_exceeded";

export type TransactionLimitDecision =
  | {
      allowed: true;
      dailyRemaining: Money | null;
      monthlyRemaining: Money | null;
    }
  | {
      allowed: false;
      reason: TransactionLimitReason;
      dailyRemaining: Money | null;
      monthlyRemaining: Money | null;
    };

export interface TransactionLimitPolicyInput {
  amount: Money;
  consumedToday: Money;
  consumedThisMonth: Money;
}

export interface TransactionLimitPolicyConfig {
  currency: string;
  perTransaction?: Money;
  daily?: Money;
  monthly?: Money;
}

export class TransactionLimitPolicy {
  private readonly currency: string;
  private readonly perTransaction: Money | null;
  private readonly daily: Money | null;
  private readonly monthly: Money | null;

  constructor(config: TransactionLimitPolicyConfig) {
    this.currency = config.currency;
    this.perTransaction = config.perTransaction ?? null;
    this.daily = config.daily ?? null;
    this.monthly = config.monthly ?? null;

    for (const limit of [this.perTransaction, this.daily, this.monthly]) {
      if (limit && limit.currency !== this.currency) {
        throw new Error("Transaction limit currency mismatch");
      }

      if (limit && limit.minor < 0n) {
        throw new Error("Transaction limits cannot be negative");
      }
    }
  }

  evaluate(input: TransactionLimitPolicyInput): TransactionLimitDecision {
    const { amount, consumedToday, consumedThisMonth } = input;

    if (
      amount.currency !== this.currency ||
      consumedToday.currency !== this.currency ||
      consumedThisMonth.currency !== this.currency
    ) {
      return this.denied("currency_mismatch", consumedToday, consumedThisMonth);
    }

    if (!amount.isPositive()) {
      return this.denied("non_positive_amount", consumedToday, consumedThisMonth);
    }

    if (this.perTransaction && amount.minor > this.perTransaction.minor) {
      return this.denied(
        "per_transaction_limit_exceeded",
        consumedToday,
        consumedThisMonth,
      );
    }

    if (this.daily && consumedToday.minor + amount.minor > this.daily.minor) {
      return this.denied("daily_limit_exceeded", consumedToday, consumedThisMonth);
    }

    if (
      this.monthly &&
      consumedThisMonth.minor + amount.minor > this.monthly.minor
    ) {
      return this.denied("monthly_limit_exceeded", consumedToday, consumedThisMonth);
    }

    return {
      allowed: true,
      dailyRemaining: this.remaining(this.daily, consumedToday.add(amount)),
      monthlyRemaining: this.remaining(
        this.monthly,
        consumedThisMonth.add(amount),
      ),
    };
  }

  private denied(
    reason: TransactionLimitReason,
    consumedToday: Money,
    consumedThisMonth: Money,
  ): TransactionLimitDecision {
    return {
      allowed: false,
      reason,
      dailyRemaining: this.safeRemaining(this.daily, consumedToday),
      monthlyRemaining: this.safeRemaining(this.monthly, consumedThisMonth),
    };
  }

  private safeRemaining(limit: Money | null, consumed: Money): Money | null {
    if (!limit || consumed.currency !== this.currency) {
      return null;
    }

    return this.remaining(limit, consumed);
  }

  private remaining(limit: Money | null, consumed: Money): Money | null {
    if (!limit) {
      return null;
    }

    const minor = limit.minor - consumed.minor;
    return Money.ofMinor(minor > 0n ? minor : 0n, this.currency);
  }
}

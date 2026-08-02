export type TransactionLimitDecision =
  | "ALLOW"
  | "DENY_PER_TRANSACTION"
  | "DENY_DAILY_AMOUNT"
  | "DENY_DAILY_COUNT"
  | "DENY_MONTHLY_AMOUNT"
  | "DENY_MONTHLY_COUNT";

export interface TransactionLimitPolicy {
  readonly id: string;
  readonly version: string;
  readonly currency: string;
  readonly perTransactionMinor?: bigint;
  readonly dailyAmountMinor?: bigint;
  readonly dailyCount?: number;
  readonly monthlyAmountMinor?: bigint;
  readonly monthlyCount?: number;
}

export interface TransactionLimitRequest {
  readonly amountMinor: bigint;
  readonly currency: string;
  readonly currentDailyAmountMinor: bigint;
  readonly currentDailyCount: number;
  readonly currentMonthlyAmountMinor: bigint;
  readonly currentMonthlyCount: number;
}

export interface TransactionLimitEvaluation {
  readonly decision: TransactionLimitDecision;
  readonly exceededRule?: Exclude<TransactionLimitDecision, "ALLOW">;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly projectedDailyAmountMinor: bigint;
  readonly projectedDailyCount: number;
  readonly projectedMonthlyAmountMinor: bigint;
  readonly projectedMonthlyCount: number;
}

function assertNonNegativeBigInt(value: bigint, field: string): void {
  if (value < 0n) {
    throw new RangeError(`${field} must be non-negative`);
  }
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative safe integer`);
  }
}

function validatePolicy(policy: TransactionLimitPolicy): void {
  if (policy.id.trim().length === 0) throw new TypeError("policy.id must not be empty");
  if (policy.version.trim().length === 0) throw new TypeError("policy.version must not be empty");
  if (policy.currency.trim().length === 0) throw new TypeError("policy.currency must not be empty");

  if (policy.perTransactionMinor !== undefined) {
    assertNonNegativeBigInt(policy.perTransactionMinor, "policy.perTransactionMinor");
  }
  if (policy.dailyAmountMinor !== undefined) {
    assertNonNegativeBigInt(policy.dailyAmountMinor, "policy.dailyAmountMinor");
  }
  if (policy.dailyCount !== undefined) {
    assertNonNegativeInteger(policy.dailyCount, "policy.dailyCount");
  }
  if (policy.monthlyAmountMinor !== undefined) {
    assertNonNegativeBigInt(policy.monthlyAmountMinor, "policy.monthlyAmountMinor");
  }
  if (policy.monthlyCount !== undefined) {
    assertNonNegativeInteger(policy.monthlyCount, "policy.monthlyCount");
  }
}

export function evaluateTransactionLimits(
  request: TransactionLimitRequest,
  policy: TransactionLimitPolicy,
): TransactionLimitEvaluation {
  validatePolicy(policy);
  assertNonNegativeBigInt(request.amountMinor, "amountMinor");
  assertNonNegativeBigInt(request.currentDailyAmountMinor, "currentDailyAmountMinor");
  assertNonNegativeInteger(request.currentDailyCount, "currentDailyCount");
  assertNonNegativeBigInt(request.currentMonthlyAmountMinor, "currentMonthlyAmountMinor");
  assertNonNegativeInteger(request.currentMonthlyCount, "currentMonthlyCount");

  if (request.currency !== policy.currency) {
    throw new RangeError("request currency must match policy currency");
  }

  const projectedDailyAmountMinor = request.currentDailyAmountMinor + request.amountMinor;
  const projectedDailyCount = request.currentDailyCount + 1;
  const projectedMonthlyAmountMinor = request.currentMonthlyAmountMinor + request.amountMinor;
  const projectedMonthlyCount = request.currentMonthlyCount + 1;

  let exceededRule: TransactionLimitEvaluation["exceededRule"];
  if (policy.perTransactionMinor !== undefined && request.amountMinor > policy.perTransactionMinor) {
    exceededRule = "DENY_PER_TRANSACTION";
  } else if (
    policy.dailyAmountMinor !== undefined &&
    projectedDailyAmountMinor > policy.dailyAmountMinor
  ) {
    exceededRule = "DENY_DAILY_AMOUNT";
  } else if (policy.dailyCount !== undefined && projectedDailyCount > policy.dailyCount) {
    exceededRule = "DENY_DAILY_COUNT";
  } else if (
    policy.monthlyAmountMinor !== undefined &&
    projectedMonthlyAmountMinor > policy.monthlyAmountMinor
  ) {
    exceededRule = "DENY_MONTHLY_AMOUNT";
  } else if (policy.monthlyCount !== undefined && projectedMonthlyCount > policy.monthlyCount) {
    exceededRule = "DENY_MONTHLY_COUNT";
  }

  return {
    decision: exceededRule ?? "ALLOW",
    ...(exceededRule === undefined ? {} : { exceededRule }),
    policyId: policy.id,
    policyVersion: policy.version,
    projectedDailyAmountMinor,
    projectedDailyCount,
    projectedMonthlyAmountMinor,
    projectedMonthlyCount,
  };
}

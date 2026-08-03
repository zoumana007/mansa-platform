export type VelocityOperation =
  | "LOGIN"
  | "OTP_REQUEST"
  | "TRANSFER"
  | "PAYMENT"
  | "CASH_OUT"
  | "BENEFICIARY_CREATE";

export type VelocityWindow = "MINUTE" | "HOUR" | "DAY";

export interface VelocityCounter {
  readonly operation: VelocityOperation;
  readonly window: VelocityWindow;
  readonly count: number;
  readonly amountMinor?: bigint;
}

export interface VelocityRule {
  readonly id: string;
  readonly operation: VelocityOperation;
  readonly window: VelocityWindow;
  readonly maxCount?: number;
  readonly maxAmountMinor?: bigint;
  readonly enabled: boolean;
}

export type VelocityDenialReason =
  | "COUNT_LIMIT_EXCEEDED"
  | "AMOUNT_LIMIT_EXCEEDED";

export type VelocityDecision =
  | {
      readonly allowed: true;
      readonly reason: "VELOCITY_ALLOWED";
      readonly matchedRuleIds: readonly string[];
    }
  | {
      readonly allowed: false;
      readonly reason: VelocityDenialReason;
      readonly ruleId: string;
    };

function matches(counter: VelocityCounter, rule: VelocityRule): boolean {
  return (
    rule.enabled &&
    counter.operation === rule.operation &&
    counter.window === rule.window
  );
}

export function evaluateVelocity(
  counters: readonly VelocityCounter[],
  rules: readonly VelocityRule[],
): VelocityDecision {
  const matchedRuleIds: string[] = [];

  for (const rule of rules) {
    const counter = counters.find((candidate) => matches(candidate, rule));
    if (counter === undefined) {
      continue;
    }

    matchedRuleIds.push(rule.id);

    if (rule.maxCount !== undefined && counter.count >= rule.maxCount) {
      return {
        allowed: false,
        reason: "COUNT_LIMIT_EXCEEDED",
        ruleId: rule.id,
      };
    }

    if (
      rule.maxAmountMinor !== undefined &&
      counter.amountMinor !== undefined &&
      counter.amountMinor >= rule.maxAmountMinor
    ) {
      return {
        allowed: false,
        reason: "AMOUNT_LIMIT_EXCEEDED",
        ruleId: rule.id,
      };
    }
  }

  return {
    allowed: true,
    reason: "VELOCITY_ALLOWED",
    matchedRuleIds,
  };
}

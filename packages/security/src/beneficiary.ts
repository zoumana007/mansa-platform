export type BeneficiaryState = "NEW" | "KNOWN" | "TRUSTED" | "BLOCKED";
export type SessionRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type BeneficiaryDecision =
  | "ALLOW"
  | "REQUIRE_STEP_UP"
  | "REQUIRE_REVIEW"
  | "DENY_BLOCKED_BENEFICIARY"
  | "DENY_NAME_MISMATCH";

export interface BeneficiaryPolicy {
  readonly id: string;
  readonly version: string;
  readonly sensitiveAmountMinor: bigint;
  readonly maxStepUpAgeMinutes: number;
}

export interface BeneficiaryRequest {
  readonly beneficiaryId: string;
  readonly state: BeneficiaryState;
  readonly relationshipAgeMinutes: number;
  readonly amountMinor: bigint;
  readonly sessionRisk: SessionRiskLevel;
  readonly nameMatches: boolean;
  readonly stepUpAgeMinutes?: number;
}

export interface BeneficiaryEvaluation {
  readonly decision: BeneficiaryDecision;
  readonly reason: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly stepUpSatisfied: boolean;
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) throw new TypeError(`${field} must not be empty`);
}

function assertNonNegativeBigInt(value: bigint, field: string): void {
  if (value < 0n) throw new RangeError(`${field} must be non-negative`);
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative safe integer`);
  }
}

function validatePolicy(policy: BeneficiaryPolicy): void {
  assertNonEmpty(policy.id, "policy.id");
  assertNonEmpty(policy.version, "policy.version");
  assertNonNegativeBigInt(policy.sensitiveAmountMinor, "policy.sensitiveAmountMinor");
  assertNonNegativeInteger(policy.maxStepUpAgeMinutes, "policy.maxStepUpAgeMinutes");
}

export function evaluateBeneficiary(
  request: BeneficiaryRequest,
  policy: BeneficiaryPolicy,
): BeneficiaryEvaluation {
  validatePolicy(policy);
  assertNonEmpty(request.beneficiaryId, "beneficiaryId");
  assertNonNegativeInteger(request.relationshipAgeMinutes, "relationshipAgeMinutes");
  assertNonNegativeBigInt(request.amountMinor, "amountMinor");
  if (request.stepUpAgeMinutes !== undefined) {
    assertNonNegativeInteger(request.stepUpAgeMinutes, "stepUpAgeMinutes");
  }

  const stepUpSatisfied =
    request.stepUpAgeMinutes !== undefined &&
    request.stepUpAgeMinutes <= policy.maxStepUpAgeMinutes;

  let decision: BeneficiaryDecision;
  let reason: string;

  if (request.state === "BLOCKED") {
    decision = "DENY_BLOCKED_BENEFICIARY";
    reason = "beneficiary is blocked";
  } else if (!request.nameMatches) {
    decision = "DENY_NAME_MISMATCH";
    reason = "resolved beneficiary name does not match confirmation";
  } else if (request.sessionRisk === "HIGH") {
    decision = "REQUIRE_REVIEW";
    reason = "high-risk session requires review";
  } else if (
    request.state === "NEW" &&
    request.amountMinor >= policy.sensitiveAmountMinor &&
    !stepUpSatisfied
  ) {
    decision = "REQUIRE_STEP_UP";
    reason = "new beneficiary and sensitive amount require recent step-up";
  } else {
    decision = "ALLOW";
    reason = stepUpSatisfied ? "recent step-up satisfies policy" : "beneficiary policy satisfied";
  }

  return {
    decision,
    reason,
    policyId: policy.id,
    policyVersion: policy.version,
    stepUpSatisfied,
  };
}

export type DeviceState = "NEW" | "KNOWN" | "TRUSTED" | "COMPROMISED" | "BLOCKED";
export type DeviceIntegrity = "PASS" | "UNKNOWN" | "FAIL";
export type DeviceSessionRisk = "LOW" | "MEDIUM" | "HIGH";

export type DeviceDecision =
  | "ALLOW"
  | "REQUIRE_STEP_UP"
  | "REQUIRE_REENROLLMENT"
  | "REQUIRE_REVIEW"
  | "DENY_BLOCKED_DEVICE"
  | "DENY_COMPROMISED_DEVICE"
  | "DENY_INTEGRITY_FAILURE";

export interface DevicePolicy {
  readonly id: string;
  readonly version: string;
  readonly maxTrustAgeMinutes: number;
  readonly maxStepUpAgeMinutes: number;
}

export interface DeviceRequest {
  readonly deviceId: string;
  readonly state: DeviceState;
  readonly integrity: DeviceIntegrity;
  readonly sessionRisk: DeviceSessionRisk;
  readonly sensitiveOperation: boolean;
  readonly trustAgeMinutes?: number;
  readonly stepUpAgeMinutes?: number;
}

export interface DeviceEvaluation {
  readonly decision: DeviceDecision;
  readonly reason: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly stepUpSatisfied: boolean;
  readonly trustFresh: boolean;
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) throw new TypeError(`${field} must not be empty`);
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative safe integer`);
  }
}

function validatePolicy(policy: DevicePolicy): void {
  assertNonEmpty(policy.id, "policy.id");
  assertNonEmpty(policy.version, "policy.version");
  assertNonNegativeInteger(policy.maxTrustAgeMinutes, "policy.maxTrustAgeMinutes");
  assertNonNegativeInteger(policy.maxStepUpAgeMinutes, "policy.maxStepUpAgeMinutes");
}

export function evaluateDevice(
  request: DeviceRequest,
  policy: DevicePolicy,
): DeviceEvaluation {
  validatePolicy(policy);
  assertNonEmpty(request.deviceId, "deviceId");
  if (request.trustAgeMinutes !== undefined) {
    assertNonNegativeInteger(request.trustAgeMinutes, "trustAgeMinutes");
  }
  if (request.stepUpAgeMinutes !== undefined) {
    assertNonNegativeInteger(request.stepUpAgeMinutes, "stepUpAgeMinutes");
  }

  const stepUpSatisfied =
    request.stepUpAgeMinutes !== undefined &&
    request.stepUpAgeMinutes <= policy.maxStepUpAgeMinutes;
  const trustFresh =
    request.trustAgeMinutes !== undefined &&
    request.trustAgeMinutes <= policy.maxTrustAgeMinutes;

  let decision: DeviceDecision;
  let reason: string;

  if (request.state === "BLOCKED") {
    decision = "DENY_BLOCKED_DEVICE";
    reason = "device is blocked";
  } else if (request.state === "COMPROMISED") {
    decision = "DENY_COMPROMISED_DEVICE";
    reason = "device is compromised";
  } else if (request.sensitiveOperation && request.integrity === "FAIL") {
    decision = "DENY_INTEGRITY_FAILURE";
    reason = "device integrity failed for sensitive operation";
  } else if (request.sessionRisk === "HIGH") {
    decision = "REQUIRE_REVIEW";
    reason = "high-risk session requires review";
  } else if (request.state === "TRUSTED" && !trustFresh) {
    decision = "REQUIRE_REENROLLMENT";
    reason = "device trust has expired";
  } else if (
    request.sensitiveOperation &&
    (request.state === "NEW" || request.integrity === "UNKNOWN") &&
    !stepUpSatisfied
  ) {
    decision = "REQUIRE_STEP_UP";
    reason = "new or unattested device requires recent step-up";
  } else {
    decision = "ALLOW";
    reason = stepUpSatisfied ? "recent step-up satisfies policy" : "device policy satisfied";
  }

  return {
    decision,
    reason,
    policyId: policy.id,
    policyVersion: policy.version,
    stepUpSatisfied,
    trustFresh,
  };
}

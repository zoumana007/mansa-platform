import type { DeviceEvaluation } from "./device.js";
import type { RiskEvaluation } from "./risk.js";

export type TransactionGateDecision =
  | "ALLOW"
  | "REQUIRE_STEP_UP"
  | "REQUIRE_REVIEW"
  | "BLOCK";

export interface TransactionGateRequest {
  readonly risk: RiskEvaluation;
  readonly device: DeviceEvaluation;
  readonly limitAllowed: boolean;
  readonly beneficiaryAllowed: boolean;
}

export interface TransactionGateEvaluation {
  readonly decision: TransactionGateDecision;
  readonly reasons: readonly string[];
}

const DEVICE_BLOCK_DECISIONS = new Set([
  "DENY_BLOCKED_DEVICE",
  "DENY_COMPROMISED_DEVICE",
  "DENY_INTEGRITY_FAILURE",
]);

export function evaluateTransactionGate(
  request: TransactionGateRequest,
): TransactionGateEvaluation {
  const reasons: string[] = [];

  if (!request.limitAllowed) reasons.push("LIMIT_REJECTED");
  if (!request.beneficiaryAllowed) reasons.push("BENEFICIARY_REJECTED");
  if (request.risk.decision === "BLOCK") reasons.push("RISK_BLOCKED");
  if (DEVICE_BLOCK_DECISIONS.has(request.device.decision)) {
    reasons.push(request.device.decision);
  }

  if (reasons.length > 0) {
    return { decision: "BLOCK", reasons };
  }

  if (
    request.risk.decision === "REVIEW" ||
    request.device.decision === "REQUIRE_REVIEW" ||
    request.device.decision === "REQUIRE_REENROLLMENT"
  ) {
    return {
      decision: "REQUIRE_REVIEW",
      reasons: [
        ...(request.risk.decision === "REVIEW" ? ["RISK_REVIEW"] : []),
        ...(request.device.decision === "REQUIRE_REVIEW"
          ? ["DEVICE_REVIEW"]
          : []),
        ...(request.device.decision === "REQUIRE_REENROLLMENT"
          ? ["DEVICE_REENROLLMENT"]
          : []),
      ],
    };
  }

  if (
    request.risk.decision === "STEP_UP" ||
    request.device.decision === "REQUIRE_STEP_UP"
  ) {
    return {
      decision: "REQUIRE_STEP_UP",
      reasons: [
        ...(request.risk.decision === "STEP_UP" ? ["RISK_STEP_UP"] : []),
        ...(request.device.decision === "REQUIRE_STEP_UP"
          ? ["DEVICE_STEP_UP"]
          : []),
      ],
    };
  }

  return { decision: "ALLOW", reasons: [] };
}

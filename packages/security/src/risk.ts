import type { RiskLevel } from "./index.js";

export type RiskDecision = "ALLOW" | "STEP_UP" | "REVIEW" | "BLOCK";
export type RiskAssuranceLevel = "BASIC" | "STRONG" | "HARDWARE_BOUND";

export interface RiskEvaluationRequest {
  readonly amountMinor: bigint;
  readonly assuranceLevel: RiskAssuranceLevel;
  readonly newDevice?: boolean;
  readonly newBeneficiary?: boolean;
  readonly geographicAnomaly?: boolean;
  readonly velocityCount?: number;
  readonly complianceAlert?: boolean;
}

export interface RiskEvaluation {
  readonly score: number;
  readonly level: RiskLevel;
  readonly decision: RiskDecision;
  readonly reasons: readonly string[];
  readonly policyVersion: "1.0";
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative integer`);
  }
}

function levelFor(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

export function evaluateRisk(request: RiskEvaluationRequest): RiskEvaluation {
  if (request.amountMinor < 0n) {
    throw new RangeError("amountMinor must be non-negative");
  }

  const velocityCount = request.velocityCount ?? 0;
  assertNonNegativeInteger(velocityCount, "velocityCount");

  let score = 0;
  const reasons: string[] = [];

  if (request.amountMinor >= 1_000_000n) {
    score += 25;
    reasons.push("HIGH_AMOUNT");
  }
  if (request.newDevice === true) {
    score += 20;
    reasons.push("NEW_DEVICE");
  }
  if (request.newBeneficiary === true) {
    score += 15;
    reasons.push("NEW_BENEFICIARY");
  }
  if (request.geographicAnomaly === true) {
    score += 30;
    reasons.push("GEOGRAPHIC_ANOMALY");
  }
  if (velocityCount >= 5) {
    score += Math.min(30, (velocityCount - 4) * 5);
    reasons.push("HIGH_VELOCITY");
  }
  if (request.complianceAlert === true) {
    score = 100;
    reasons.push("COMPLIANCE_ALERT");
  }

  score = Math.min(100, score);
  const level = levelFor(score);

  let decision: RiskDecision;
  if (request.complianceAlert === true || level === "CRITICAL") {
    decision = "BLOCK";
  } else if (level === "HIGH") {
    decision = "REVIEW";
  } else if (level === "MEDIUM" && request.assuranceLevel === "BASIC") {
    decision = "STEP_UP";
  } else {
    decision = "ALLOW";
  }

  return { score, level, decision, reasons, policyVersion: "1.0" };
}

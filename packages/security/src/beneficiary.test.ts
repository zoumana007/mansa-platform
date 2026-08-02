import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateBeneficiary,
  type BeneficiaryPolicy,
  type BeneficiaryRequest,
} from "./beneficiary.js";

const policy: BeneficiaryPolicy = {
  id: "ml-transfer-beneficiary-standard",
  version: "1.0",
  sensitiveAmountMinor: 100_000n,
  maxStepUpAgeMinutes: 5,
};

function request(overrides: Partial<BeneficiaryRequest> = {}): BeneficiaryRequest {
  return {
    beneficiaryId: "beneficiary-1",
    state: "KNOWN",
    relationshipAgeMinutes: 1_440,
    amountMinor: 10_000n,
    sessionRisk: "LOW",
    nameMatches: true,
    ...overrides,
  };
}

test("refuse toujours un bénéficiaire bloqué", () => {
  const result = evaluateBeneficiary(
    request({ state: "BLOCKED", nameMatches: false, stepUpAgeMinutes: 0 }),
    policy,
  );
  assert.equal(result.decision, "DENY_BLOCKED_BENEFICIARY");
});

test("refuse une incohérence de nom", () => {
  const result = evaluateBeneficiary(request({ nameMatches: false }), policy);
  assert.equal(result.decision, "DENY_NAME_MISMATCH");
});

test("impose une revue pour une session à risque élevé", () => {
  const result = evaluateBeneficiary(
    request({ state: "TRUSTED", sessionRisk: "HIGH", stepUpAgeMinutes: 0 }),
    policy,
  );
  assert.equal(result.decision, "REQUIRE_REVIEW");
});

test("impose une étape renforcée pour un nouveau bénéficiaire sensible", () => {
  const result = evaluateBeneficiary(
    request({ state: "NEW", amountMinor: 100_000n }),
    policy,
  );
  assert.equal(result.decision, "REQUIRE_STEP_UP");
  assert.equal(result.stepUpSatisfied, false);
});

test("autorise avec une preuve forte récente", () => {
  const result = evaluateBeneficiary(
    request({ state: "NEW", amountMinor: 500_000n, stepUpAgeMinutes: 5 }),
    policy,
  );
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.stepUpSatisfied, true);
});

test("refuse une preuve forte trop ancienne", () => {
  const result = evaluateBeneficiary(
    request({ state: "NEW", amountMinor: 100_000n, stepUpAgeMinutes: 6 }),
    policy,
  );
  assert.equal(result.decision, "REQUIRE_STEP_UP");
});

test("autorise un bénéficiaire connu sous le seuil", () => {
  const result = evaluateBeneficiary(request(), policy);
  assert.equal(result.decision, "ALLOW");
});

test("rejette les entrées invalides", () => {
  assert.throws(
    () => evaluateBeneficiary(request({ beneficiaryId: "" }), policy),
    /beneficiaryId must not be empty/,
  );
  assert.throws(
    () => evaluateBeneficiary(request({ amountMinor: -1n }), policy),
    /amountMinor must be non-negative/,
  );
  assert.throws(
    () => evaluateBeneficiary(request({ relationshipAgeMinutes: 1.5 }), policy),
    /relationshipAgeMinutes must be a non-negative safe integer/,
  );
});

test("rejette une politique invalide", () => {
  assert.throws(
    () => evaluateBeneficiary(request(), { ...policy, maxStepUpAgeMinutes: -1 }),
    /policy.maxStepUpAgeMinutes must be a non-negative safe integer/,
  );
});

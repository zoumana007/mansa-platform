import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTHORIZATION_DECISION_REASON_CODES,
  AUTHORIZATION_OBLIGATIONS,
  createAllowedAuthorizationDecision,
  createDeniedAuthorizationDecision,
  isAuthorizationDecisionReasonCode,
  isAuthorizationObligation,
} from "../dist/authorization-decision.js";

test("les codes de décision sont uniques et reconnus", () => {
  assert.equal(
    new Set(AUTHORIZATION_DECISION_REASON_CODES).size,
    AUTHORIZATION_DECISION_REASON_CODES.length,
  );

  for (const reasonCode of AUTHORIZATION_DECISION_REASON_CODES) {
    assert.equal(isAuthorizationDecisionReasonCode(reasonCode), true);
  }

  assert.equal(isAuthorizationDecisionReasonCode("UNKNOWN"), false);
});

test("les obligations sont uniques et reconnues", () => {
  assert.equal(
    new Set(AUTHORIZATION_OBLIGATIONS).size,
    AUTHORIZATION_OBLIGATIONS.length,
  );

  for (const obligation of AUTHORIZATION_OBLIGATIONS) {
    assert.equal(isAuthorizationObligation(obligation), true);
  }

  assert.equal(isAuthorizationObligation("SKIP_AUDIT"), false);
});

test("une autorisation conserve les obligations et politiques évaluées", () => {
  const decision = createAllowedAuthorizationDecision(
    "ALLOWED_BY_POLICY",
    ["REQUIRE_MULTI_FACTOR", "REQUIRE_AUDIT_EVENT"],
    ["policy-payment-001"],
  );

  assert.equal(decision.allowed, true);
  assert.equal(decision.reasonCode, "ALLOWED_BY_POLICY");
  assert.deepEqual(decision.obligations, [
    "REQUIRE_MULTI_FACTOR",
    "REQUIRE_AUDIT_EVENT",
  ]);
  assert.deepEqual(decision.evaluatedPolicyIds, ["policy-payment-001"]);
});

test("un refus est audité par défaut", () => {
  const decision = createDeniedAuthorizationDecision(
    "DENIED_MISSING_PERMISSION",
  );

  assert.equal(decision.allowed, false);
  assert.deepEqual(decision.obligations, ["REQUIRE_AUDIT_EVENT"]);
  assert.deepEqual(decision.evaluatedPolicyIds, []);
});

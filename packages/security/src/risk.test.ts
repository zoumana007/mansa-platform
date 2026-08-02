import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRisk } from "./risk.js";

test("autorise une opération à faible risque", () => {
  assert.deepEqual(
    evaluateRisk({ amountMinor: 10_000n, assuranceLevel: "BASIC" }),
    {
      score: 0,
      level: "LOW",
      decision: "ALLOW",
      reasons: [],
      policyVersion: "1.0",
    },
  );
});

test("demande une authentification renforcée au risque moyen", () => {
  const result = evaluateRisk({
    amountMinor: 1_000_000n,
    assuranceLevel: "BASIC",
  });
  assert.equal(result.score, 25);
  assert.equal(result.level, "MEDIUM");
  assert.equal(result.decision, "STEP_UP");
});

test("autorise un risque moyen avec une session forte", () => {
  const result = evaluateRisk({
    amountMinor: 1_000_000n,
    assuranceLevel: "STRONG",
  });
  assert.equal(result.decision, "ALLOW");
});

test("place une opération à haut risque en revue", () => {
  const result = evaluateRisk({
    amountMinor: 1_000_000n,
    assuranceLevel: "STRONG",
    newDevice: true,
    newBeneficiary: true,
  });
  assert.equal(result.score, 60);
  assert.equal(result.level, "HIGH");
  assert.equal(result.decision, "REVIEW");
});

test("bloque et sature le score en présence d’une alerte conformité", () => {
  const result = evaluateRisk({
    amountMinor: 1_000_000n,
    assuranceLevel: "HARDWARE_BOUND",
    newDevice: true,
    newBeneficiary: true,
    geographicAnomaly: true,
    velocityCount: 20,
    complianceAlert: true,
  });
  assert.equal(result.score, 100);
  assert.equal(result.level, "CRITICAL");
  assert.equal(result.decision, "BLOCK");
  assert.ok(result.reasons.includes("COMPLIANCE_ALERT"));
});

test("refuse les nombres invalides", () => {
  assert.throws(
    () => evaluateRisk({ amountMinor: -1n, assuranceLevel: "BASIC" }),
    /amountMinor must be non-negative/,
  );
  assert.throws(
    () =>
      evaluateRisk({
        amountMinor: 0n,
        assuranceLevel: "BASIC",
        velocityCount: 1.5,
      }),
    /velocityCount must be a non-negative integer/,
  );
});

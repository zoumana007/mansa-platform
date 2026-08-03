import assert from "node:assert/strict";
import test from "node:test";

import { evaluateTransactionGate } from "./transaction-gate.js";

const allowedRisk = {
  score: 0,
  level: "LOW" as const,
  decision: "ALLOW" as const,
  reasons: [],
  policyVersion: "1.0" as const,
};

const allowedDevice = {
  decision: "ALLOW" as const,
  reason: "device policy satisfied",
  policyId: "device-default",
  policyVersion: "1.0",
  stepUpSatisfied: false,
  trustFresh: true,
};

test("autorise lorsque tous les contrôles sont satisfaits", () => {
  assert.deepEqual(
    evaluateTransactionGate({
      risk: allowedRisk,
      device: allowedDevice,
      limitAllowed: true,
      beneficiaryAllowed: true,
    }),
    { decision: "ALLOW", reasons: [] },
  );
});

test("bloque avec toutes les causes bloquantes", () => {
  assert.deepEqual(
    evaluateTransactionGate({
      risk: { ...allowedRisk, decision: "BLOCK", level: "CRITICAL" },
      device: { ...allowedDevice, decision: "DENY_COMPROMISED_DEVICE" },
      limitAllowed: false,
      beneficiaryAllowed: false,
    }),
    {
      decision: "BLOCK",
      reasons: [
        "LIMIT_REJECTED",
        "BENEFICIARY_REJECTED",
        "RISK_BLOCKED",
        "DENY_COMPROMISED_DEVICE",
      ],
    },
  );
});

test("la revue est prioritaire sur une élévation d’authentification", () => {
  assert.deepEqual(
    evaluateTransactionGate({
      risk: { ...allowedRisk, decision: "STEP_UP", level: "MEDIUM" },
      device: { ...allowedDevice, decision: "REQUIRE_REVIEW" },
      limitAllowed: true,
      beneficiaryAllowed: true,
    }),
    { decision: "REQUIRE_REVIEW", reasons: ["DEVICE_REVIEW"] },
  );
});

test("demande une élévation quand le risque ou l’appareil l’impose", () => {
  assert.deepEqual(
    evaluateTransactionGate({
      risk: { ...allowedRisk, decision: "STEP_UP", level: "MEDIUM" },
      device: { ...allowedDevice, decision: "REQUIRE_STEP_UP" },
      limitAllowed: true,
      beneficiaryAllowed: true,
    }),
    {
      decision: "REQUIRE_STEP_UP",
      reasons: ["RISK_STEP_UP", "DEVICE_STEP_UP"],
    },
  );
});

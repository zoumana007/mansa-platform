import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateDevice,
  type DevicePolicy,
  type DeviceRequest,
} from "./device.js";

const policy: DevicePolicy = {
  id: "ml-device-standard",
  version: "1.0",
  maxTrustAgeMinutes: 43_200,
  maxStepUpAgeMinutes: 5,
};

function request(overrides: Partial<DeviceRequest> = {}): DeviceRequest {
  return {
    deviceId: "device-1",
    state: "KNOWN",
    integrity: "PASS",
    sessionRisk: "LOW",
    sensitiveOperation: true,
    trustAgeMinutes: 60,
    ...overrides,
  };
}

test("refuse toujours un appareil bloqué", () => {
  const result = evaluateDevice(
    request({ state: "BLOCKED", integrity: "FAIL", sessionRisk: "HIGH" }),
    policy,
  );
  assert.equal(result.decision, "DENY_BLOCKED_DEVICE");
});

test("refuse toujours un appareil compromis", () => {
  const result = evaluateDevice(request({ state: "COMPROMISED" }), policy);
  assert.equal(result.decision, "DENY_COMPROMISED_DEVICE");
});

test("refuse un échec d’intégrité sur une opération sensible", () => {
  const result = evaluateDevice(request({ integrity: "FAIL" }), policy);
  assert.equal(result.decision, "DENY_INTEGRITY_FAILURE");
});

test("impose une revue pour une session à risque élevé", () => {
  const result = evaluateDevice(
    request({ state: "TRUSTED", sessionRisk: "HIGH", trustAgeMinutes: 1 }),
    policy,
  );
  assert.equal(result.decision, "REQUIRE_REVIEW");
});

test("impose un réenrôlement lorsque la confiance est expirée", () => {
  const result = evaluateDevice(
    request({ state: "TRUSTED", trustAgeMinutes: 43_201 }),
    policy,
  );
  assert.equal(result.decision, "REQUIRE_REENROLLMENT");
  assert.equal(result.trustFresh, false);
});

test("impose une étape renforcée pour un appareil nouveau", () => {
  const result = evaluateDevice(request({ state: "NEW", trustAgeMinutes: undefined }), policy);
  assert.equal(result.decision, "REQUIRE_STEP_UP");
  assert.equal(result.stepUpSatisfied, false);
});

test("autorise un appareil nouveau avec une étape renforcée récente", () => {
  const result = evaluateDevice(
    request({ state: "NEW", trustAgeMinutes: undefined, stepUpAgeMinutes: 5 }),
    policy,
  );
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.stepUpSatisfied, true);
});

test("autorise un appareil connu et intègre", () => {
  const result = evaluateDevice(request(), policy);
  assert.equal(result.decision, "ALLOW");
});

test("tolère un échec d’intégrité pour une opération non sensible", () => {
  const result = evaluateDevice(
    request({ sensitiveOperation: false, integrity: "FAIL" }),
    policy,
  );
  assert.equal(result.decision, "ALLOW");
});

test("rejette les entrées invalides", () => {
  assert.throws(
    () => evaluateDevice(request({ deviceId: "" }), policy),
    /deviceId must not be empty/,
  );
  assert.throws(
    () => evaluateDevice(request({ trustAgeMinutes: -1 }), policy),
    /trustAgeMinutes must be a non-negative safe integer/,
  );
  assert.throws(
    () => evaluateDevice(request({ stepUpAgeMinutes: 1.5 }), policy),
    /stepUpAgeMinutes must be a non-negative safe integer/,
  );
});

test("rejette une politique invalide", () => {
  assert.throws(
    () => evaluateDevice(request(), { ...policy, maxTrustAgeMinutes: -1 }),
    /policy.maxTrustAgeMinutes must be a non-negative safe integer/,
  );
});

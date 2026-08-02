import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateSession,
  type SecuritySession,
  type SessionEvaluationRequest,
} from "./session.js";

const activeSession: SecuritySession = {
  sessionId: "session-1",
  actorId: "customer-1",
  channel: "MOBILE_CLIENT",
  environment: "DEMO",
  assuranceLevel: "STRONG",
  status: "ACTIVE",
  createdAt: "2026-08-02T10:00:00.000Z",
  lastActivityAt: "2026-08-02T10:20:00.000Z",
  absoluteExpiresAt: "2026-08-02T12:00:00.000Z",
  deviceFingerprint: "device-hash-1",
};

function request(
  overrides: Partial<SessionEvaluationRequest> = {},
): SessionEvaluationRequest {
  return {
    session: activeSession,
    environment: "DEMO",
    evaluatedAt: "2026-08-02T10:25:00.000Z",
    inactivityTimeoutSeconds: 600,
    ...overrides,
  };
}

test("accepte une session active dans ses limites", () => {
  assert.deepEqual(evaluateSession(request()), {
    allowed: true,
    reason: "SESSION_VALID",
  });
});

test("refuse une session révoquée", () => {
  assert.deepEqual(
    evaluateSession(
      request({ session: { ...activeSession, status: "REVOKED" } }),
    ),
    { allowed: false, reason: "SESSION_REVOKED" },
  );
});

test("refuse une session utilisée dans un autre environnement", () => {
  assert.deepEqual(evaluateSession(request({ environment: "PRODUCTION" })), {
    allowed: false,
    reason: "ENVIRONMENT_MISMATCH",
  });
});

test("refuse une session arrivée à expiration absolue", () => {
  assert.deepEqual(
    evaluateSession(request({ evaluatedAt: "2026-08-02T12:00:00.000Z" })),
    { allowed: false, reason: "SESSION_EXPIRED" },
  );
});

test("refuse une session inactive au seuil configuré", () => {
  assert.deepEqual(
    evaluateSession(request({ evaluatedAt: "2026-08-02T10:30:00.000Z" })),
    { allowed: false, reason: "SESSION_INACTIVE" },
  );
});

test("refuse un niveau d’assurance insuffisant", () => {
  assert.deepEqual(
    evaluateSession(
      request({
        session: { ...activeSession, assuranceLevel: "BASIC" },
        minimumAssuranceLevel: "STRONG",
      }),
    ),
    { allowed: false, reason: "INSUFFICIENT_ASSURANCE" },
  );
});

test("refuse une empreinte appareil différente", () => {
  assert.deepEqual(
    evaluateSession(request({ requiredDeviceFingerprint: "device-hash-2" })),
    { allowed: false, reason: "DEVICE_MISMATCH" },
  );
});

test("valide les paramètres temporels", () => {
  assert.throws(
    () => evaluateSession(request({ inactivityTimeoutSeconds: -1 })),
    /non-negative integer/,
  );
});

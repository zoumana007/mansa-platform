import assert from "node:assert/strict";
import test from "node:test";

import {
  authorize,
  createAuthorizationAuditEvent,
  type AuthorizationActor,
  type AuthorizationRequest,
} from "./index.js";

const financeOperator: AuthorizationActor = {
  actorId: "finance-1",
  roles: ["FINANCE_OPERATOR"],
  permissions: ["payment.read", "payment.refund"],
  scope: { countryCode: "ML", organizationId: "org-1" },
};

function baseRequest(): AuthorizationRequest {
  return {
    actor: financeOperator,
    permission: "payment.read",
    environment: "PRODUCTION",
    resourceScope: { countryCode: "ML", organizationId: "org-1" },
  };
}

test("crée un événement ALLOW corrélé", () => {
  const request = baseRequest();
  const decision = authorize(request);

  assert.deepEqual(
    createAuthorizationAuditEvent(request, decision, {
      eventId: "event-1",
      correlationId: "corr-1",
      occurredAt: "2026-08-02T18:00:00Z",
      actorType: "USER",
      resourceType: "PAYMENT",
      resourceId: "payment-1",
      channel: "ADMIN_WEB",
    }),
    {
      eventId: "event-1",
      correlationId: "corr-1",
      occurredAt: "2026-08-02T18:00:00.000Z",
      actorId: "finance-1",
      actorType: "USER",
      roles: ["FINANCE_OPERATOR"],
      permission: "payment.read",
      environment: "PRODUCTION",
      decision: "ALLOW",
      reason: "AUTHORIZED",
      scope: { countryCode: "ML", organizationId: "org-1" },
      resourceType: "PAYMENT",
      resourceId: "payment-1",
      requiresDualApproval: false,
      channel: "ADMIN_WEB",
    },
  );
});

test("crée un événement DENY avec le motif canonique", () => {
  const request: AuthorizationRequest = {
    ...baseRequest(),
    permission: "fee_rule.manage",
  };
  const decision = authorize(request);
  const event = createAuthorizationAuditEvent(request, decision, {
    eventId: "event-2",
    correlationId: "corr-2",
    occurredAt: "2026-08-02T18:01:00Z",
    actorType: "USER",
  });

  assert.equal(event.decision, "DENY");
  assert.equal(event.reason, "MISSING_PERMISSION");
});

test("sérialise un montant bigint sans perte", () => {
  const request: AuthorizationRequest = {
    ...baseRequest(),
    permission: "payment.refund",
    amountMinor: 9_007_199_254_740_993n,
    riskLevel: "HIGH",
    requiresDualApproval: true,
    approverActorId: "finance-2",
  };
  const event = createAuthorizationAuditEvent(request, authorize(request), {
    eventId: "event-3",
    correlationId: "corr-3",
    occurredAt: "2026-08-02T18:02:00Z",
    actorType: "USER",
    currency: "XOF",
  });

  assert.equal(event.amountMinor, "9007199254740993");
  assert.equal(event.currency, "XOF");
  assert.equal(event.approverActorId, "finance-2");
  assert.equal(event.requiresDualApproval, true);
});

test("refuse les identifiants vides et les dates invalides", () => {
  const request = baseRequest();
  const decision = authorize(request);

  assert.throws(
    () =>
      createAuthorizationAuditEvent(request, decision, {
        eventId: " ",
        correlationId: "corr-4",
        occurredAt: "2026-08-02T18:03:00Z",
        actorType: "USER",
      }),
    /eventId must not be empty/,
  );

  assert.throws(
    () =>
      createAuthorizationAuditEvent(request, decision, {
        eventId: "event-4",
        correlationId: "corr-4",
        occurredAt: "not-a-date",
        actorType: "USER",
      }),
    /occurredAt must be a valid ISO 8601 date/,
  );
});

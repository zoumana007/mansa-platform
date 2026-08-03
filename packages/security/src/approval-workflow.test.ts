import assert from "node:assert/strict";
import test from "node:test";

import {
  approveRequest,
  cancelRequest,
  expireApprovalRequest,
  rejectRequest,
  type ApprovalRequest,
} from "./approval-workflow.js";

const createdAt = new Date("2026-08-03T12:00:00.000Z");
const expiresAt = new Date("2026-08-03T13:00:00.000Z");
const now = new Date("2026-08-03T12:30:00.000Z");

function pendingRequest(): ApprovalRequest {
  return {
    approvalId: "approval-1",
    actionType: "FEE_RULE_UPDATE",
    permission: "fee_rule.manage",
    initiatorActorId: "actor-1",
    environment: "PRODUCTION",
    scope: { countryCode: "ML" },
    justification: "Mise à jour validée par la direction financière",
    correlationId: "correlation-1",
    createdAt,
    expiresAt,
    status: "PENDING",
  };
}

test("approuve une demande avec une identité distincte", () => {
  const result = approveRequest(pendingRequest(), "actor-2", now, "Validé");

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.request.status, "APPROVED");
    assert.equal(result.request.decidedByActorId, "actor-2");
    assert.equal(result.request.decisionComment, "Validé");
    assert.equal(result.request.decidedAt, now);
  }
});

test("refuse l'auto-approbation", () => {
  const result = approveRequest(pendingRequest(), "actor-1", now);

  assert.deepEqual(result, {
    ok: false,
    reason: "SELF_APPROVAL_FORBIDDEN",
  });
});

test("exige un motif de refus", () => {
  const result = rejectRequest(pendingRequest(), "actor-2", "   ", now);

  assert.deepEqual(result, {
    ok: false,
    reason: "REJECTION_REASON_REQUIRED",
  });
});

test("seul l'initiateur peut annuler", () => {
  const result = cancelRequest(pendingRequest(), "actor-2", now);

  assert.deepEqual(result, {
    ok: false,
    reason: "ONLY_INITIATOR_CAN_CANCEL",
  });
});

test("expire une demande arrivée à échéance", () => {
  const expiredAt = new Date("2026-08-03T13:00:00.000Z");
  const request = expireApprovalRequest(pendingRequest(), expiredAt);

  assert.equal(request.status, "EXPIRED");
  assert.equal(request.decidedAt, expiredAt);
});

test("refuse une décision sur une demande expirée", () => {
  const result = approveRequest(
    pendingRequest(),
    "actor-2",
    new Date("2026-08-03T13:00:00.000Z"),
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "REQUEST_EXPIRED",
  });
});

test("refuse une nouvelle décision sur un état terminal", () => {
  const approved = approveRequest(pendingRequest(), "actor-2", now);
  assert.equal(approved.ok, true);

  if (approved.ok) {
    const secondDecision = rejectRequest(
      approved.request,
      "actor-3",
      "Nouvelle décision",
      now,
    );

    assert.deepEqual(secondDecision, {
      ok: false,
      reason: "REQUEST_NOT_PENDING",
    });
  }
});

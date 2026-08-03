import assert from "node:assert/strict";
import test from "node:test";

import {
  beginApprovalExecution,
  createApprovalExecution,
  failApprovalExecution,
  succeedApprovalExecution,
} from "./approval-execution.js";
import type { ApprovalRequest } from "./approval-workflow.js";

const now = new Date("2026-08-03T14:00:00.000Z");
const completedAt = new Date("2026-08-03T14:01:00.000Z");

function approvedRequest(): ApprovalRequest {
  return {
    approvalId: "approval-1",
    actionType: "FEE_RULE_UPDATE",
    permission: "fee_rule.manage",
    initiatorActorId: "actor-1",
    environment: "PRODUCTION",
    scope: { countryCode: "ML" },
    justification: "Mise à jour validée",
    correlationId: "correlation-1",
    createdAt: new Date("2026-08-03T13:00:00.000Z"),
    expiresAt: new Date("2026-08-03T15:00:00.000Z"),
    status: "APPROVED",
    decidedByActorId: "actor-2",
    decidedAt: new Date("2026-08-03T13:30:00.000Z"),
  };
}

test("démarre une exécution approuvée avec une clé d'idempotence", () => {
  const execution = createApprovalExecution("approval-1", " idem-1 ");
  const result = beginApprovalExecution(approvedRequest(), execution, now);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.execution.status, "EXECUTING");
    assert.equal(result.execution.idempotencyKey, "idem-1");
    assert.equal(result.execution.startedAt, now);
  }
});

test("refuse l'exécution d'une demande non approuvée", () => {
  const approval = { ...approvedRequest(), status: "PENDING" as const };
  const result = beginApprovalExecution(
    approval,
    createApprovalExecution("approval-1", "idem-1"),
    now,
  );

  assert.deepEqual(result, {
    ok: false,
    reason: "APPROVAL_NOT_APPROVED",
  });
});

test("refuse une deuxième consommation de la même exécution", () => {
  const first = beginApprovalExecution(
    approvedRequest(),
    createApprovalExecution("approval-1", "idem-1"),
    now,
  );
  assert.equal(first.ok, true);

  if (first.ok) {
    const second = beginApprovalExecution(
      approvedRequest(),
      first.execution,
      completedAt,
    );
    assert.deepEqual(second, {
      ok: false,
      reason: "EXECUTION_ALREADY_STARTED",
    });
  }
});

test("termine une exécution avec la référence métier", () => {
  const started = beginApprovalExecution(
    approvedRequest(),
    createApprovalExecution("approval-1", "idem-1"),
    now,
  );
  assert.equal(started.ok, true);

  if (started.ok) {
    const result = succeedApprovalExecution(
      started.execution,
      " payment-42 ",
      completedAt,
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.execution.status, "SUCCEEDED");
      assert.equal(result.execution.operationReference, "payment-42");
      assert.equal(result.execution.completedAt, completedAt);
    }
  }
});

test("conserve un code d'échec exploitable pour la reprise", () => {
  const started = beginApprovalExecution(
    approvedRequest(),
    createApprovalExecution("approval-1", "idem-1"),
    now,
  );
  assert.equal(started.ok, true);

  if (started.ok) {
    const result = failApprovalExecution(
      started.execution,
      " PARTNER_TIMEOUT ",
      completedAt,
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.execution.status, "FAILED");
      assert.equal(result.execution.failureCode, "PARTNER_TIMEOUT");
    }
  }
});

test("refuse de terminer deux fois une exécution", () => {
  const started = beginApprovalExecution(
    approvedRequest(),
    createApprovalExecution("approval-1", "idem-1"),
    now,
  );
  assert.equal(started.ok, true);

  if (started.ok) {
    const succeeded = succeedApprovalExecution(
      started.execution,
      "payment-42",
      completedAt,
    );
    assert.equal(succeeded.ok, true);

    if (succeeded.ok) {
      assert.deepEqual(
        failApprovalExecution(succeeded.execution, "LATE_FAILURE", completedAt),
        { ok: false, reason: "EXECUTION_ALREADY_TERMINAL" },
      );
    }
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import { transitionComplianceCase, type ComplianceCase } from "./compliance-case.js";

const baseCase: ComplianceCase = {
  id: "case-1",
  subjectId: "customer-1",
  sourceType: "TRANSACTION_MONITORING",
  sourceReference: "txn-1",
  status: "OPEN",
  priority: "HIGH",
  updatedAt: "2026-08-03T07:00:00.000Z",
};

test("assigne puis démarre la revue d'un dossier", () => {
  const assigned = transitionComplianceCase(baseCase, {
    type: "ASSIGN",
    actorId: "officer-1",
    ownerId: "officer-2",
    occurredAt: "2026-08-03T07:01:00.000Z",
  });

  assert.equal(assigned.case.ownerId, "officer-2");
  assert.equal(assigned.auditAction, "COMPLIANCE_CASE_ASSIGNED");

  const review = transitionComplianceCase(assigned.case, {
    type: "START_REVIEW",
    actorId: "officer-2",
    occurredAt: "2026-08-03T07:02:00.000Z",
  });

  assert.equal(review.case.status, "IN_REVIEW");
  assert.equal(review.auditAction, "COMPLIANCE_CASE_REVIEW_STARTED");
});

test("escalade un dossier et impose une justification", () => {
  assert.throws(
    () =>
      transitionComplianceCase(baseCase, {
        type: "ESCALATE",
        actorId: "officer-1",
        occurredAt: "2026-08-03T07:03:00.000Z",
        reason: "",
      }),
    /reason is required/,
  );

  const escalated = transitionComplianceCase(baseCase, {
    type: "ESCALATE",
    actorId: "officer-1",
    occurredAt: "2026-08-03T07:03:00.000Z",
    reason: "correspondance renforcée",
  });

  assert.equal(escalated.case.status, "ESCALATED");
  assert.equal(escalated.case.priority, "CRITICAL");
});

test("résout, ferme puis rouvre un dossier", () => {
  const inReview: ComplianceCase = {
    ...baseCase,
    status: "IN_REVIEW",
    ownerId: "officer-2",
  };

  const resolved = transitionComplianceCase(inReview, {
    type: "RESOLVE",
    actorId: "officer-2",
    occurredAt: "2026-08-03T07:04:00.000Z",
    resolutionCode: "FALSE_POSITIVE",
    rationale: "identité et origine des fonds vérifiées",
  });
  assert.equal(resolved.case.status, "RESOLVED");
  assert.equal(resolved.case.resolutionCode, "FALSE_POSITIVE");

  const closed = transitionComplianceCase(resolved.case, {
    type: "CLOSE",
    actorId: "officer-3",
    occurredAt: "2026-08-03T07:05:00.000Z",
  });
  assert.equal(closed.case.status, "CLOSED");

  const reopened = transitionComplianceCase(closed.case, {
    type: "REOPEN",
    actorId: "officer-3",
    occurredAt: "2026-08-03T07:06:00.000Z",
    reason: "nouveau signal reçu",
  });
  assert.equal(reopened.case.status, "OPEN");
  assert.equal(reopened.case.resolutionCode, undefined);
});

test("refuse les transitions métier invalides", () => {
  assert.throws(
    () =>
      transitionComplianceCase(baseCase, {
        type: "START_REVIEW",
        actorId: "officer-1",
        occurredAt: "2026-08-03T07:07:00.000Z",
      }),
    /assigned before review/,
  );

  assert.throws(
    () =>
      transitionComplianceCase(baseCase, {
        type: "CLOSE",
        actorId: "officer-1",
        occurredAt: "2026-08-03T07:08:00.000Z",
      }),
    /only a resolved compliance case/,
  );
});

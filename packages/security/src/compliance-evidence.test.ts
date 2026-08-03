import assert from "node:assert/strict";
import test from "node:test";

import {
  addComplianceEvidence,
  isComplianceEvidenceActive,
  removeComplianceEvidence,
} from "./compliance-evidence.js";

test("ajoute un justificatif avec une référence externe", () => {
  const mutation = addComplianceEvidence({
    id: "evidence-1",
    caseId: "case-1",
    type: "DOCUMENT",
    reference: "vault://compliance/case-1/evidence-1",
    checksum: "sha256:example",
    classification: "RESTRICTED",
    actorId: "officer-1",
    occurredAt: "2026-08-03T08:00:00.000Z",
  });

  assert.equal(mutation.auditAction, "COMPLIANCE_EVIDENCE_ADDED");
  assert.equal(mutation.evidence.addedBy, "officer-1");
  assert.equal(isComplianceEvidenceActive(mutation.evidence), true);
});

test("retire logiquement un justificatif sans effacer sa trace", () => {
  const added = addComplianceEvidence({
    id: "evidence-2",
    caseId: "case-1",
    type: "ANALYST_NOTE",
    reference: "note://case-1/2",
    classification: "CONFIDENTIAL",
    actorId: "officer-1",
    occurredAt: "2026-08-03T08:01:00.000Z",
  });

  const removed = removeComplianceEvidence(added.evidence, {
    actorId: "officer-2",
    occurredAt: "2026-08-03T08:02:00.000Z",
    reason: "pièce versée au mauvais dossier",
  });

  assert.equal(removed.auditAction, "COMPLIANCE_EVIDENCE_REMOVED");
  assert.equal(removed.evidence.reference, added.evidence.reference);
  assert.equal(removed.evidence.removedBy, "officer-2");
  assert.equal(isComplianceEvidenceActive(removed.evidence), false);
});

test("refuse les champs obligatoires vides", () => {
  assert.throws(
    () =>
      addComplianceEvidence({
        id: "",
        caseId: "case-1",
        type: "TRANSACTION",
        reference: "txn-1",
        classification: "INTERNAL",
        actorId: "officer-1",
        occurredAt: "2026-08-03T08:03:00.000Z",
      }),
    /id is required/,
  );
});

test("refuse un second retrait du même justificatif", () => {
  const added = addComplianceEvidence({
    id: "evidence-3",
    caseId: "case-1",
    type: "EXTERNAL_REFERENCE",
    reference: "partner://reference-3",
    classification: "INTERNAL",
    actorId: "officer-1",
    occurredAt: "2026-08-03T08:04:00.000Z",
  });
  const removed = removeComplianceEvidence(added.evidence, {
    actorId: "officer-2",
    occurredAt: "2026-08-03T08:05:00.000Z",
    reason: "référence remplacée",
  });

  assert.throws(
    () =>
      removeComplianceEvidence(removed.evidence, {
        actorId: "officer-3",
        occurredAt: "2026-08-03T08:06:00.000Z",
        reason: "nouvelle demande",
      }),
    /already removed/,
  );
});

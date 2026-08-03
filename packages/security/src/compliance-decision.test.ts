import assert from "node:assert/strict";
import test from "node:test";

import {
  decideComplianceDecision,
  isComplianceDecisionFinal,
  proposeComplianceDecision,
} from "./compliance-decision.js";

test("propose une décision conformité traçable", () => {
  const mutation = proposeComplianceDecision({
    id: "decision-1",
    caseId: "case-1",
    outcome: "REQUEST_INFORMATION",
    rationale: "justificatif de provenance des fonds manquant",
    actorId: "analyst-1",
    occurredAt: "2026-08-03T09:00:00.000Z",
  });

  assert.equal(mutation.auditAction, "COMPLIANCE_DECISION_PROPOSED");
  assert.equal(mutation.decision.status, "PROPOSED");
  assert.equal(isComplianceDecisionFinal(mutation.decision), false);
});

test("impose le principe des quatre yeux pour une approbation", () => {
  const proposed = proposeComplianceDecision({
    id: "decision-2",
    caseId: "case-2",
    outcome: "RESTRICT_ACCOUNT",
    rationale: "risque élevé confirmé",
    actorId: "analyst-1",
    occurredAt: "2026-08-03T09:01:00.000Z",
  });

  assert.throws(
    () =>
      decideComplianceDecision(proposed.decision, {
        type: "APPROVE",
        actorId: "analyst-1",
        occurredAt: "2026-08-03T09:02:00.000Z",
        reason: "validation",
      }),
    /requires a different approver/,
  );

  const approved = decideComplianceDecision(proposed.decision, {
    type: "APPROVE",
    actorId: "officer-2",
    occurredAt: "2026-08-03T09:03:00.000Z",
    reason: "dossier et preuves vérifiés",
  });

  assert.equal(approved.auditAction, "COMPLIANCE_DECISION_APPROVED");
  assert.equal(approved.decision.status, "APPROVED");
  assert.equal(approved.decision.decidedBy, "officer-2");
  assert.equal(isComplianceDecisionFinal(approved.decision), true);
});

test("autorise le proposant à annuler une proposition", () => {
  const proposed = proposeComplianceDecision({
    id: "decision-3",
    caseId: "case-3",
    outcome: "NO_ACTION",
    rationale: "alerte probablement non pertinente",
    actorId: "analyst-3",
    occurredAt: "2026-08-03T09:04:00.000Z",
  });

  const cancelled = decideComplianceDecision(proposed.decision, {
    type: "CANCEL",
    actorId: "analyst-3",
    occurredAt: "2026-08-03T09:05:00.000Z",
    reason: "analyse complémentaire nécessaire",
  });

  assert.equal(cancelled.auditAction, "COMPLIANCE_DECISION_CANCELLED");
  assert.equal(cancelled.decision.status, "CANCELLED");
});

test("refuse de décider deux fois et valide les champs obligatoires", () => {
  assert.throws(
    () =>
      proposeComplianceDecision({
        id: "",
        caseId: "case-4",
        outcome: "NO_ACTION",
        rationale: "analyse terminée",
        actorId: "analyst-4",
        occurredAt: "2026-08-03T09:06:00.000Z",
      }),
    /id is required/,
  );

  const proposed = proposeComplianceDecision({
    id: "decision-4",
    caseId: "case-4",
    outcome: "REJECT_OPERATION",
    rationale: "opération incohérente avec le profil",
    actorId: "analyst-4",
    occurredAt: "2026-08-03T09:07:00.000Z",
  });
  const rejected = decideComplianceDecision(proposed.decision, {
    type: "REJECT",
    actorId: "officer-4",
    occurredAt: "2026-08-03T09:08:00.000Z",
    reason: "preuves insuffisantes",
  });

  assert.throws(
    () =>
      decideComplianceDecision(rejected.decision, {
        type: "APPROVE",
        actorId: "officer-5",
        occurredAt: "2026-08-03T09:09:00.000Z",
        reason: "seconde décision",
      }),
    /only a proposed compliance decision/,
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  createRegulatoryReport,
  isRegulatoryReportFinal,
  transitionRegulatoryReport,
} from "./regulatory-report.js";

function draftReport() {
  return createRegulatoryReport({
    id: "report-1",
    caseId: "case-1",
    countryCode: "ML",
    reportType: "SUSPICIOUS_ACTIVITY",
    authorityCode: "AUTHORITY-ML",
    summary: "activité inhabituelle documentée",
    actorId: "analyst-1",
    occurredAt: "2026-08-03T10:00:00.000Z",
  }).report;
}

test("crée une déclaration réglementaire à l’état brouillon", () => {
  const mutation = createRegulatoryReport({
    id: "report-1",
    caseId: "case-1",
    countryCode: "ML",
    reportType: "SUSPICIOUS_ACTIVITY",
    authorityCode: "AUTHORITY-ML",
    summary: "activité inhabituelle documentée",
    actorId: "analyst-1",
    occurredAt: "2026-08-03T10:00:00.000Z",
  });

  assert.equal(mutation.auditAction, "REGULATORY_REPORT_CREATED");
  assert.equal(mutation.report.status, "DRAFT");
  assert.equal(isRegulatoryReportFinal(mutation.report), false);
});

test("applique la revue à quatre yeux avant soumission", () => {
  const ready = transitionRegulatoryReport(draftReport(), {
    type: "REQUEST_REVIEW",
    actorId: "analyst-1",
    occurredAt: "2026-08-03T10:01:00.000Z",
  });

  assert.throws(
    () =>
      transitionRegulatoryReport(ready.report, {
        type: "APPROVE",
        actorId: "analyst-1",
        occurredAt: "2026-08-03T10:02:00.000Z",
        reason: "validation",
      }),
    /different approver/,
  );

  const approved = transitionRegulatoryReport(ready.report, {
    type: "APPROVE",
    actorId: "officer-2",
    occurredAt: "2026-08-03T10:03:00.000Z",
    reason: "contenu et pièces vérifiés",
  });
  const submitted = transitionRegulatoryReport(approved.report, {
    type: "MARK_SUBMITTED",
    actorId: "officer-3",
    occurredAt: "2026-08-03T10:04:00.000Z",
    externalReference: "receipt-123",
  });

  assert.equal(submitted.auditAction, "REGULATORY_REPORT_SUBMITTED");
  assert.equal(submitted.report.status, "SUBMITTED");
  assert.equal(submitted.report.externalReference, "receipt-123");
  assert.equal(isRegulatoryReportFinal(submitted.report), true);
});

test("refuse une soumission sans approbation et protège les états finaux", () => {
  assert.throws(
    () =>
      transitionRegulatoryReport(draftReport(), {
        type: "MARK_SUBMITTED",
        actorId: "officer-1",
        occurredAt: "2026-08-03T10:05:00.000Z",
        externalReference: "receipt-124",
      }),
    /only an approved report/,
  );

  const cancelled = transitionRegulatoryReport(draftReport(), {
    type: "CANCEL",
    actorId: "analyst-1",
    occurredAt: "2026-08-03T10:06:00.000Z",
    reason: "dossier fusionné",
  });

  assert.throws(
    () =>
      transitionRegulatoryReport(cancelled.report, {
        type: "REQUEST_REVIEW",
        actorId: "analyst-2",
        occurredAt: "2026-08-03T10:07:00.000Z",
      }),
    /final regulatory report/,
  );
});

test("valide les données obligatoires", () => {
  assert.throws(
    () =>
      createRegulatoryReport({
        id: "",
        caseId: "case-2",
        countryCode: "ML",
        reportType: "PERIODIC",
        authorityCode: "AUTHORITY-ML",
        summary: "rapport périodique",
        actorId: "analyst-2",
        occurredAt: "2026-08-03T10:08:00.000Z",
      }),
    /id is required/,
  );
});

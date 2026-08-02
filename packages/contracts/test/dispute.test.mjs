import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addDisputeEvidence,
  canTransitionDispute,
  isDisputeResponseOverdue,
  isFinalDisputeStatus,
  openDispute,
  transitionDispute,
} from '../dist/dispute.js';

const baseCommand = {
  disputeId: 'dispute-1',
  paymentId: 'payment-1',
  amountMinor: 5000,
  currency: 'xof',
  reason: 'GOODS_NOT_RECEIVED',
  openedAt: '2026-08-02T12:00:00.000Z',
  responseDeadlineAt: '2026-08-09T12:00:00.000Z',
};

const evidence = {
  evidenceId: 'evidence-1',
  type: 'DELIVERY_PROOF',
  storageReference: 'vault://evidence-1',
  submittedBy: 'merchant-1',
  submittedAt: '2026-08-03T10:00:00.000Z',
};

test('ouvre un litige et normalise la devise', () => {
  const dispute = openDispute(baseCommand);
  assert.equal(dispute.status, 'OPENED');
  assert.equal(dispute.currency, 'XOF');
});

test('ouvre directement un litige avec preuve requise', () => {
  const dispute = openDispute({ ...baseCommand, evidenceRequired: true });
  assert.equal(dispute.status, 'EVIDENCE_REQUIRED');
});

test('ajoute une preuve puis applique le cycle nominal', () => {
  const opened = openDispute(baseCommand);
  const withEvidence = addDisputeEvidence(opened, evidence);
  const underReview = transitionDispute(withEvidence, {
    status: 'UNDER_REVIEW',
    updatedAt: '2026-08-03T11:00:00.000Z',
  });
  const won = transitionDispute(underReview, {
    status: 'WON',
    resolutionNote: 'Preuve de livraison acceptée',
    updatedAt: '2026-08-04T12:00:00.000Z',
  });

  assert.equal(won.evidence.length, 1);
  assert.equal(isFinalDisputeStatus(won.status), true);
  assert.equal(canTransitionDispute('WON', 'LOST'), false);
});

test('refuse la revue sans preuve et la résolution sans motif', () => {
  const opened = openDispute(baseCommand);
  assert.throws(() => transitionDispute(opened, {
    status: 'UNDER_REVIEW',
    updatedAt: '2026-08-03T11:00:00.000Z',
  }));

  const underReview = transitionDispute(addDisputeEvidence(opened, evidence), {
    status: 'UNDER_REVIEW',
    updatedAt: '2026-08-03T11:00:00.000Z',
  });
  assert.throws(() => transitionDispute(underReview, {
    status: 'LOST',
    updatedAt: '2026-08-04T12:00:00.000Z',
  }));
});

test('détecte une échéance de réponse dépassée', () => {
  const dispute = openDispute(baseCommand);
  assert.equal(isDisputeResponseOverdue(dispute, '2026-08-10T00:00:00.000Z'), true);
  assert.equal(isDisputeResponseOverdue(dispute, '2026-08-08T00:00:00.000Z'), false);
});

test('refuse les données invalides et les preuves dupliquées', () => {
  assert.throws(() => openDispute({ ...baseCommand, amountMinor: 0 }));
  assert.throws(() => openDispute({ ...baseCommand, currency: 'EURO' }));
  assert.throws(() => openDispute({
    ...baseCommand,
    responseDeadlineAt: '2026-08-01T12:00:00.000Z',
  }));

  const withEvidence = addDisputeEvidence(openDispute(baseCommand), evidence);
  assert.throws(() => addDisputeEvidence(withEvidence, evidence));
});

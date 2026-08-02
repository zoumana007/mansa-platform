import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canTransitionRefund,
  createRefund,
  isFinalRefundStatus,
  remainingRefundableAmount,
  transitionRefund,
} from '../dist/refund.js';

const baseCommand = {
  refundId: 'refund-1',
  paymentId: 'payment-1',
  amountMinor: 2500,
  currency: 'xof',
  reason: 'CUSTOMER_REQUEST',
  requestedBy: 'user-1',
  idempotencyKey: 'refund-idem-1',
  createdAt: '2026-08-02T11:00:00.000Z',
};

test('crée un remboursement et normalise la devise', () => {
  const refund = createRefund(baseCommand);
  assert.equal(refund.status, 'REQUESTED');
  assert.equal(refund.currency, 'XOF');
});

test('crée directement une demande à réviser', () => {
  const refund = createRefund({ ...baseCommand, reviewRequired: true });
  assert.equal(refund.status, 'REVIEW_REQUIRED');
});

test('applique le cycle nominal jusqu’au succès', () => {
  const requested = createRefund(baseCommand);
  const approved = transitionRefund(requested, {
    status: 'APPROVED',
    updatedAt: '2026-08-02T11:01:00.000Z',
  });
  const processing = transitionRefund(approved, {
    status: 'PROCESSING',
    updatedAt: '2026-08-02T11:02:00.000Z',
  });
  const succeeded = transitionRefund(processing, {
    status: 'SUCCEEDED',
    updatedAt: '2026-08-02T11:03:00.000Z',
    providerReference: 'provider-refund-1',
  });

  assert.equal(succeeded.providerReference, 'provider-refund-1');
  assert.equal(isFinalRefundStatus(succeeded.status), true);
  assert.equal(canTransitionRefund('SUCCEEDED', 'FAILED'), false);
});

test('exige un code pour un échec et refuse ce code ailleurs', () => {
  const approved = transitionRefund(createRefund(baseCommand), {
    status: 'APPROVED',
    updatedAt: '2026-08-02T11:01:00.000Z',
  });
  const processing = transitionRefund(approved, {
    status: 'PROCESSING',
    updatedAt: '2026-08-02T11:02:00.000Z',
  });

  assert.throws(() => transitionRefund(processing, {
    status: 'FAILED',
    updatedAt: '2026-08-02T11:03:00.000Z',
  }));
  assert.throws(() => transitionRefund(processing, {
    status: 'SUCCEEDED',
    updatedAt: '2026-08-02T11:03:00.000Z',
    failureCode: 'INVALID',
  }));
});

test('calcule le montant encore remboursable', () => {
  assert.equal(remainingRefundableAmount(10000, [2500, 1500]), 6000);
  assert.equal(remainingRefundableAmount(10000, [12000]), 0);
});

test('refuse les montants et devises invalides', () => {
  assert.throws(() => createRefund({ ...baseCommand, amountMinor: 0 }));
  assert.throws(() => createRefund({ ...baseCommand, amountMinor: 1.5 }));
  assert.throws(() => createRefund({ ...baseCommand, currency: 'EURO' }));
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canTransitionSettlementBatch,
  createSettlementBatch,
  isFinalSettlementBatchStatus,
  transitionSettlementBatch,
} from '../dist/settlement.js';

const base = {
  settlementId: 'settlement-1',
  merchantId: 'merchant-1',
  periodStart: '2026-08-01T00:00:00.000Z',
  periodEnd: '2026-08-02T00:00:00.000Z',
  grossAmountMinor: 100000,
  feeAmountMinor: 2500,
  adjustmentAmountMinor: -500,
  currency: 'xof',
  destination: {
    type: 'BANK_ACCOUNT',
    reference: 'merchant-bank-account-1',
    providerCode: 'bank-partner',
  },
  createdAt: '2026-08-02T02:00:00.000Z',
};

test('crée un lot de règlement avec un montant net déterministe', () => {
  const settlement = createSettlementBatch(base);
  assert.equal(settlement.status, 'DRAFT');
  assert.equal(settlement.netAmountMinor, 97000);
  assert.equal(settlement.currency, 'XOF');
});

test('applique le cycle nominal de règlement', () => {
  const draft = createSettlementBatch(base);
  const ready = transitionSettlementBatch(draft, {
    status: 'READY',
    updatedAt: '2026-08-02T02:05:00.000Z',
  });
  const processing = transitionSettlementBatch(ready, {
    status: 'PROCESSING',
    updatedAt: '2026-08-02T02:10:00.000Z',
  });
  const paid = transitionSettlementBatch(processing, {
    status: 'PAID',
    providerReference: 'provider-settlement-1',
    updatedAt: '2026-08-02T02:20:00.000Z',
  });

  assert.equal(paid.status, 'PAID');
  assert.equal(paid.providerReference, 'provider-settlement-1');
  assert.equal(isFinalSettlementBatchStatus(paid.status), true);
});

test('autorise la reprise après un échec', () => {
  const draft = createSettlementBatch(base);
  const ready = transitionSettlementBatch(draft, {
    status: 'READY',
    updatedAt: '2026-08-02T02:05:00.000Z',
  });
  const processing = transitionSettlementBatch(ready, {
    status: 'PROCESSING',
    updatedAt: '2026-08-02T02:10:00.000Z',
  });
  const failed = transitionSettlementBatch(processing, {
    status: 'FAILED',
    failureReason: 'Compte partenaire indisponible',
    updatedAt: '2026-08-02T02:15:00.000Z',
  });

  assert.equal(canTransitionSettlementBatch(failed.status, 'READY'), true);
  assert.equal(failed.failureReason, 'Compte partenaire indisponible');
});

test('refuse les montants, périodes et transitions invalides', () => {
  assert.throws(() => createSettlementBatch({ ...base, grossAmountMinor: -1 }));
  assert.throws(() => createSettlementBatch({ ...base, periodEnd: base.periodStart }));
  assert.throws(() => createSettlementBatch({ ...base, feeAmountMinor: 200000 }));

  const draft = createSettlementBatch(base);
  assert.throws(() => transitionSettlementBatch(draft, {
    status: 'PAID',
    providerReference: 'provider-settlement-1',
    updatedAt: '2026-08-02T02:20:00.000Z',
  }));
});

test('exige les références de paiement et les motifs d’échec', () => {
  const draft = createSettlementBatch(base);
  const ready = transitionSettlementBatch(draft, {
    status: 'READY',
    updatedAt: '2026-08-02T02:05:00.000Z',
  });
  const processing = transitionSettlementBatch(ready, {
    status: 'PROCESSING',
    updatedAt: '2026-08-02T02:10:00.000Z',
  });

  assert.throws(() => transitionSettlementBatch(processing, {
    status: 'PAID',
    updatedAt: '2026-08-02T02:20:00.000Z',
  }));
  assert.throws(() => transitionSettlementBatch(processing, {
    status: 'FAILED',
    failureReason: ' ',
    updatedAt: '2026-08-02T02:20:00.000Z',
  }));
});

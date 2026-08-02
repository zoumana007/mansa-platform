import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createReconciliationItem,
  isFinalReconciliationStatus,
  resolveReconciliationItem,
} from '../dist/reconciliation.js';

const base = {
  itemId: 'item-1',
  batchId: 'batch-1',
  internalReference: 'payment-1',
  providerReference: 'provider-1',
  internalAmountMinor: 5000,
  providerAmountMinor: 5000,
  currency: 'xof',
  createdAt: '2026-08-02T13:00:00.000Z',
};

test('rapproche automatiquement une transaction identique', () => {
  const item = createReconciliationItem(base);
  assert.equal(item.status, 'MATCHED');
  assert.equal(item.currency, 'XOF');
  assert.equal(isFinalReconciliationStatus(item.status), true);
});

test('détecte une transaction fournisseur absente', () => {
  const item = createReconciliationItem({ ...base, providerReference: undefined });
  assert.equal(item.status, 'MISMATCHED');
  assert.equal(item.mismatchReason, 'MISSING_PROVIDER_TRANSACTION');
});

test('détecte un écart de montant', () => {
  const item = createReconciliationItem({ ...base, providerAmountMinor: 4900 });
  assert.equal(item.status, 'MISMATCHED');
  assert.equal(item.mismatchReason, 'AMOUNT_MISMATCH');
});

test('résout un écart avec une justification', () => {
  const mismatch = createReconciliationItem({ ...base, providerAmountMinor: 4900 });
  const resolved = resolveReconciliationItem(mismatch, {
    status: 'RESOLVED',
    resolutionNote: 'Frais fournisseur isolés et comptabilisés',
    updatedAt: '2026-08-02T14:00:00.000Z',
  });
  assert.equal(resolved.status, 'RESOLVED');
  assert.equal(isFinalReconciliationStatus(resolved.status), true);
});

test('refuse les entrées invalides et la résolution sans motif', () => {
  assert.throws(() => createReconciliationItem({ ...base, internalReference: undefined, providerReference: undefined }));
  assert.throws(() => createReconciliationItem({ ...base, internalAmountMinor: -1 }));
  assert.throws(() => createReconciliationItem({ ...base, currency: 'EURO' }));

  const mismatch = createReconciliationItem({ ...base, providerAmountMinor: 4900 });
  assert.throws(() => resolveReconciliationItem(mismatch, {
    status: 'IGNORED',
    resolutionNote: ' ',
    updatedAt: '2026-08-02T14:00:00.000Z',
  }));
});

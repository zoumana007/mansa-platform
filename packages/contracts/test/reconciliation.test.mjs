import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareReconciliationTransactions,
  createReconciliationItem,
  isFinalReconciliationStatus,
  resolveReconciliationItem,
  summarizeReconciliationComparisons,
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

const internalSnapshot = {
  reference: 'payment-1',
  amountMinor: 5000,
  currency: 'xof',
  status: 'settled',
};

const providerSnapshot = {
  reference: 'provider-1',
  amountMinor: 5000,
  currency: 'XOF',
  status: 'SETTLED',
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

test('compare deux snapshots après normalisation sans modifier les sources', () => {
  const result = compareReconciliationTransactions({
    internal: internalSnapshot,
    provider: providerSnapshot,
  });
  assert.equal(result.status, 'MATCHED');
  assert.equal(result.internalCurrency, 'XOF');
  assert.equal(result.providerStatus, 'SETTLED');
  assert.equal(internalSnapshot.currency, 'xof');
});

test('détecte les transactions manquantes dans les deux sens', () => {
  const missingInternal = compareReconciliationTransactions({ provider: providerSnapshot });
  assert.equal(missingInternal.mismatchReason, 'MISSING_INTERNAL_TRANSACTION');

  const missingProvider = compareReconciliationTransactions({ internal: internalSnapshot });
  assert.equal(missingProvider.mismatchReason, 'MISSING_PROVIDER_TRANSACTION');
});

test('priorise doublon, devise, montant puis statut', () => {
  const duplicate = compareReconciliationTransactions({
    internal: internalSnapshot,
    provider: { ...providerSnapshot, currency: 'EUR', amountMinor: 4000, status: 'FAILED' },
    providerOccurrenceCount: 2,
  });
  assert.equal(duplicate.mismatchReason, 'DUPLICATE_PROVIDER_TRANSACTION');

  const currency = compareReconciliationTransactions({
    internal: internalSnapshot,
    provider: { ...providerSnapshot, currency: 'EUR' },
  });
  assert.equal(currency.mismatchReason, 'CURRENCY_MISMATCH');

  const amount = compareReconciliationTransactions({
    internal: internalSnapshot,
    provider: { ...providerSnapshot, amountMinor: 4999 },
  });
  assert.equal(amount.mismatchReason, 'AMOUNT_MISMATCH');

  const status = compareReconciliationTransactions({
    internal: internalSnapshot,
    provider: { ...providerSnapshot, status: 'FAILED' },
  });
  assert.equal(status.mismatchReason, 'STATUS_MISMATCH');
});

test('rejette les snapshots et compteurs invalides', () => {
  assert.throws(() => compareReconciliationTransactions({}));
  assert.throws(() => compareReconciliationTransactions({
    internal: { ...internalSnapshot, amountMinor: -1 },
  }));
  assert.throws(() => compareReconciliationTransactions({
    internal: internalSnapshot,
    provider: providerSnapshot,
    providerOccurrenceCount: 0,
  }));
});

test('résume un lot de rapprochement par motif', () => {
  const results = [
    compareReconciliationTransactions({ internal: internalSnapshot, provider: providerSnapshot }),
    compareReconciliationTransactions({ internal: internalSnapshot }),
    compareReconciliationTransactions({
      internal: internalSnapshot,
      provider: { ...providerSnapshot, amountMinor: 4900 },
    }),
  ];
  const summary = summarizeReconciliationComparisons(results);
  assert.deepEqual(summary, {
    total: 3,
    matched: 1,
    mismatched: 2,
    byReason: {
      MISSING_PROVIDER_TRANSACTION: 1,
      AMOUNT_MISMATCH: 1,
    },
  });
});

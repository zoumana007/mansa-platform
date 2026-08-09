import assert from 'node:assert/strict';
import test from 'node:test';

import { TestReconciliationProviderAdapter } from '../dist/reconciliation/reconciliation-provider.adapter.js';

const adapter = new TestReconciliationProviderAdapter();
const periodStart = new Date('2026-08-01T00:00:00.000Z');
const periodEnd = new Date('2026-08-01T23:59:59.000Z');

function source(rows) {
  return {
    providerId: 'mock-provider',
    sourceFileReference: 'settlement-2026-08-01.csv',
    periodStart,
    periodEnd,
    rows,
  };
}

test('reconciliation test adapter is deterministic and normalizes provider data', () => {
  const input = source([
    { providerReference: ' p-1 ', amountMinor: 1000, currency: 'xof', status: ' settled ' },
  ]);
  const internal = [
    {
      internalReference: 'i-1',
      providerReference: 'p-1',
      amountMinor: 1000,
      currency: 'XOF',
      status: 'SETTLED',
    },
  ];

  const first = adapter.prepare(input, internal);
  const second = adapter.prepare(input, internal);

  assert.equal(first.sourceFingerprint, second.sourceFingerprint);
  assert.equal(first.items.length, 1);
  assert.equal(first.items[0].comparison.status, 'MATCHED');
  assert.equal(first.items[0].providerOccurrenceCount, 1);
});

test('reconciliation test adapter prioritizes duplicate provider references', () => {
  const prepared = adapter.prepare(
    source([
      { providerReference: 'p-2', amountMinor: 1000, currency: 'XOF', status: 'SETTLED' },
      { providerReference: 'p-2', amountMinor: 9999, currency: 'EUR', status: 'FAILED' },
    ]),
    [
      {
        internalReference: 'i-2',
        providerReference: 'p-2',
        amountMinor: 1000,
        currency: 'XOF',
        status: 'SETTLED',
      },
    ],
  );

  assert.equal(prepared.items.length, 2);
  for (const item of prepared.items) {
    assert.equal(item.providerOccurrenceCount, 2);
    assert.equal(item.comparison.status, 'MISMATCHED');
    assert.equal(item.comparison.mismatchReason, 'DUPLICATE_PROVIDER_TRANSACTION');
  }
});

test('reconciliation test adapter reports missing transactions in both directions', () => {
  const prepared = adapter.prepare(
    source([{ providerReference: 'provider-only', amountMinor: 500, currency: 'XOF', status: 'SETTLED' }]),
    [{ internalReference: 'internal-only', amountMinor: 700, currency: 'XOF', status: 'SETTLED' }],
  );

  const reasons = prepared.items.map((item) => item.comparison.mismatchReason).sort();
  assert.deepEqual(reasons, ['MISSING_INTERNAL_TRANSACTION', 'MISSING_PROVIDER_TRANSACTION']);
});

test('reconciliation test adapter rejects invalid monetary snapshots', () => {
  assert.throws(
    () =>
      adapter.prepare(
        source([{ providerReference: 'p-3', amountMinor: -1, currency: 'XOF', status: 'SETTLED' }]),
        [],
      ),
    /non-negative safe integer/,
  );
});

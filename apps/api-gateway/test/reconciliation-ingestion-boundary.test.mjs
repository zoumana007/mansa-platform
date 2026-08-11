import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationIngestionBoundary } from '../dist/reconciliation/reconciliation-ingestion-boundary.js';

function source(overrides = {}) {
  return {
    providerId: 'TEST-BANK',
    sourceFileReference: 'batch-001.csv',
    periodStart: new Date('2026-08-01T00:00:00.000Z'),
    periodEnd: new Date('2026-08-01T23:59:59.999Z'),
    rows: [
      {
        providerReference: 'P-1',
        amountMinor: 1250,
        currency: 'XOF',
        status: 'SETTLED',
      },
    ],
    ...overrides,
  };
}

test('ingestion boundary accepts a bounded normalized source', () => {
  const decision = new ReconciliationIngestionBoundary().evaluate(source());

  assert.equal(decision.accepted, true);
  assert.equal(decision.rowCount, 1);
  assert.match(decision.sourceFingerprint, /^[a-f0-9]{64}$/);
});

test('ingestion boundary quarantines an empty provider identifier', () => {
  const decision = new ReconciliationIngestionBoundary().evaluate(source({ providerId: '   ' }));

  assert.equal(decision.accepted, false);
  assert.equal(decision.code, 'PROVIDER_ID_REQUIRED');
});

test('ingestion boundary quarantines an invalid period', () => {
  const decision = new ReconciliationIngestionBoundary().evaluate(
    source({
      periodStart: new Date('2026-08-02T00:00:00.000Z'),
      periodEnd: new Date('2026-08-01T00:00:00.000Z'),
    }),
  );

  assert.equal(decision.accepted, false);
  assert.equal(decision.code, 'INVALID_PERIOD');
});

test('ingestion boundary rejects an empty source and a source above the configured limit', () => {
  const boundary = new ReconciliationIngestionBoundary({ maxRows: 1 });

  const emptyDecision = boundary.evaluate(source({ rows: [] }));
  assert.equal(emptyDecision.accepted, false);
  assert.equal(emptyDecision.code, 'EMPTY_SOURCE');

  const tooLargeDecision = boundary.evaluate(
    source({
      rows: [
        { providerReference: 'P-1', amountMinor: 100, currency: 'XOF', status: 'SETTLED' },
        { providerReference: 'P-2', amountMinor: 200, currency: 'XOF', status: 'SETTLED' },
      ],
    }),
  );
  assert.equal(tooLargeDecision.accepted, false);
  assert.equal(tooLargeDecision.code, 'SOURCE_TOO_LARGE');
});

test('ingestion boundary returns only a bounded code and row index for malformed rows', () => {
  const decision = new ReconciliationIngestionBoundary().evaluate(
    source({
      rows: [{ providerReference: 'P-1', amountMinor: -1, currency: 'XOF', status: 'SETTLED' }],
    }),
  );

  assert.equal(decision.accepted, false);
  assert.equal(decision.code, 'INVALID_AMOUNT');
  assert.equal(decision.rowIndex, 0);
  assert.equal('rawRow' in decision, false);
});

test('ingestion boundary validates its own row limit configuration', () => {
  assert.throws(() => new ReconciliationIngestionBoundary({ maxRows: 0 }), /positive safe integer/);
});

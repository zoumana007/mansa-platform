import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationOperationalMonitor } from '../dist/reconciliation/reconciliation-operational-monitor.js';

test('reconciliation monitor records successful imports without sensitive payloads', () => {
  const monitor = new ReconciliationOperationalMonitor();
  const startedAt = new Date('2026-08-10T17:00:00.000Z');
  const succeededAt = new Date('2026-08-10T17:00:01.000Z');

  monitor.recordImportStarted(startedAt);
  monitor.recordImportSucceeded(4, succeededAt, 125.5, {
    matched: 2,
    mismatched: 2,
    byReason: {
      AMOUNT_MISMATCH: 1,
      MISSING_PROVIDER_TRANSACTION: 1,
    },
  });

  assert.deepEqual(monitor.snapshot(), {
    importsStarted: 1,
    importsSucceeded: 1,
    importsFailed: 0,
    importedItems: 4,
    matchedItems: 2,
    mismatchedItems: 2,
    mismatchReasons: {
      MISSING_INTERNAL_TRANSACTION: 0,
      MISSING_PROVIDER_TRANSACTION: 1,
      AMOUNT_MISMATCH: 1,
      CURRENCY_MISMATCH: 0,
      STATUS_MISMATCH: 0,
      DUPLICATE_PROVIDER_TRANSACTION: 0,
      OTHER: 0,
    },
    completedImportDurationMsTotal: 125.5,
    lastCompletedImportDurationMs: 125.5,
    lastImportStartedAt: startedAt.toISOString(),
    lastImportSucceededAt: succeededAt.toISOString(),
    lastImportFailedAt: null,
  });
});

test('reconciliation monitor accumulates bounded outcome aggregates across imports', () => {
  const monitor = new ReconciliationOperationalMonitor();

  monitor.recordImportSucceeded(3, new Date(), 10, {
    matched: 1,
    mismatched: 2,
    byReason: { CURRENCY_MISMATCH: 1, STATUS_MISMATCH: 1 },
  });
  monitor.recordImportSucceeded(2, new Date(), 5, {
    matched: 1,
    mismatched: 1,
    byReason: { CURRENCY_MISMATCH: 1 },
  });

  const snapshot = monitor.snapshot();
  assert.equal(snapshot.importedItems, 5);
  assert.equal(snapshot.matchedItems, 2);
  assert.equal(snapshot.mismatchedItems, 3);
  assert.equal(snapshot.mismatchReasons.CURRENCY_MISMATCH, 2);
  assert.equal(snapshot.mismatchReasons.STATUS_MISMATCH, 1);
});

test('reconciliation monitor records failures and duration independently from successes', () => {
  const monitor = new ReconciliationOperationalMonitor();
  const failedAt = new Date('2026-08-10T17:01:00.000Z');

  monitor.recordImportStarted();
  monitor.recordImportFailed(failedAt, 80.25);

  const snapshot = monitor.snapshot();
  assert.equal(snapshot.importsStarted, 1);
  assert.equal(snapshot.importsSucceeded, 0);
  assert.equal(snapshot.importsFailed, 1);
  assert.equal(snapshot.importedItems, 0);
  assert.equal(snapshot.matchedItems, 0);
  assert.equal(snapshot.mismatchedItems, 0);
  assert.equal(snapshot.completedImportDurationMsTotal, 80.25);
  assert.equal(snapshot.lastCompletedImportDurationMs, 80.25);
  assert.equal(snapshot.lastImportFailedAt, failedAt.toISOString());
});

test('reconciliation monitor accumulates completed import duration across outcomes', () => {
  const monitor = new ReconciliationOperationalMonitor();

  monitor.recordImportSucceeded(2, new Date(), 10.5);
  monitor.recordImportFailed(new Date(), 4.25);

  const snapshot = monitor.snapshot();
  assert.equal(snapshot.completedImportDurationMsTotal, 14.75);
  assert.equal(snapshot.lastCompletedImportDurationMs, 4.25);
});

test('reconciliation monitor rejects inconsistent or invalid outcome aggregates', () => {
  const monitor = new ReconciliationOperationalMonitor();

  assert.throws(() => monitor.recordImportSucceeded(-1), /non-negative safe integer/);
  assert.throws(
    () => monitor.recordImportSucceeded(Number.MAX_SAFE_INTEGER + 1),
    /non-negative safe integer/,
  );
  assert.throws(
    () =>
      monitor.recordImportSucceeded(2, new Date(), 1, {
        matched: 2,
        mismatched: 1,
      }),
    /must equal itemCount/,
  );
  assert.throws(
    () =>
      monitor.recordImportSucceeded(1, new Date(), 1, {
        matched: 0,
        mismatched: 1,
        byReason: { AMOUNT_MISMATCH: 2 },
      }),
    /cannot exceed outcome.mismatched/,
  );
  assert.throws(
    () => monitor.recordImportSucceeded(1, new Date(), -1),
    /finite non-negative number/,
  );
  assert.throws(
    () => monitor.recordImportFailed(new Date(), Number.NaN),
    /finite non-negative number/,
  );
  assert.throws(
    () => monitor.recordImportFailed(new Date(), Number.POSITIVE_INFINITY),
    /finite non-negative number/,
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationOperationalMonitor } from '../dist/reconciliation/reconciliation-operational-monitor.js';

test('reconciliation monitor records successful imports without sensitive payloads', () => {
  const monitor = new ReconciliationOperationalMonitor();
  const startedAt = new Date('2026-08-10T17:00:00.000Z');
  const succeededAt = new Date('2026-08-10T17:00:01.000Z');

  monitor.recordImportStarted(startedAt);
  monitor.recordImportSucceeded(4, succeededAt);

  assert.deepEqual(monitor.snapshot(), {
    importsStarted: 1,
    importsSucceeded: 1,
    importsFailed: 0,
    importedItems: 4,
    lastImportStartedAt: startedAt.toISOString(),
    lastImportSucceededAt: succeededAt.toISOString(),
    lastImportFailedAt: null,
  });
});

test('reconciliation monitor records failures independently from successes', () => {
  const monitor = new ReconciliationOperationalMonitor();
  const failedAt = new Date('2026-08-10T17:01:00.000Z');

  monitor.recordImportStarted();
  monitor.recordImportFailed(failedAt);

  const snapshot = monitor.snapshot();
  assert.equal(snapshot.importsStarted, 1);
  assert.equal(snapshot.importsSucceeded, 0);
  assert.equal(snapshot.importsFailed, 1);
  assert.equal(snapshot.importedItems, 0);
  assert.equal(snapshot.lastImportFailedAt, failedAt.toISOString());
});

test('reconciliation monitor rejects invalid item counters', () => {
  const monitor = new ReconciliationOperationalMonitor();

  assert.throws(() => monitor.recordImportSucceeded(-1), /non-negative safe integer/);
  assert.throws(() => monitor.recordImportSucceeded(Number.MAX_SAFE_INTEGER + 1), /non-negative safe integer/);
});

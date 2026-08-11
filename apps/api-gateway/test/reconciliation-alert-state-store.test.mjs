import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryReconciliationAlertStateStore } from '../dist/reconciliation/reconciliation-alert-state-store.js';
import { ReconciliationAlertingPolicy } from '../dist/reconciliation/reconciliation-alerting-policy.js';

const evaluation = (status) => ({
  status,
  sli: {
    completedImports: 1,
    importFailureRate: 0,
    comparedItems: 1,
    mismatchRate: 0,
    lastImportDurationMs: 100,
  },
  breaches: [],
});

const T0 = Date.parse('2026-08-11T00:00:00.000Z');

test('shared alert state deduplicates concurrent replicas atomically', async () => {
  const store = new InMemoryReconciliationAlertStateStore();
  const replicaA = new ReconciliationAlertingPolicy(store);
  const replicaB = new ReconciliationAlertingPolicy(store);

  const decisions = await Promise.all([
    replicaA.evaluateShared(evaluation('WARNING'), T0),
    replicaB.evaluateShared(evaluation('WARNING'), T0),
  ]);

  assert.equal(decisions.filter((decision) => decision.shouldNotify).length, 1);
  assert.equal(decisions.filter((decision) => decision.reason === 'COOLDOWN_ACTIVE').length, 1);
});

test('shared alert state is visible across policy instances', async () => {
  const store = new InMemoryReconciliationAlertStateStore();
  const replicaA = new ReconciliationAlertingPolicy(store);
  const replicaB = new ReconciliationAlertingPolicy(store);

  const warning = await replicaA.evaluateShared(evaluation('WARNING'), T0);
  const recovered = await replicaB.evaluateShared(evaluation('HEALTHY'), T0 + 1_000);

  assert.equal(warning.event, 'WARNING');
  assert.equal(recovered.event, 'RECOVERED');
  assert.equal(recovered.previousStatus, 'WARNING');
});

test('shared state reset makes the next unhealthy evaluation a fresh transition', async () => {
  const store = new InMemoryReconciliationAlertStateStore();
  const policy = new ReconciliationAlertingPolicy(store);

  await policy.evaluateShared(evaluation('CRITICAL'), T0);
  await policy.resetShared();
  const afterReset = await policy.evaluateShared(evaluation('CRITICAL'), T0 + 1_000);

  assert.equal(afterReset.previousStatus, null);
  assert.equal(afterReset.shouldNotify, true);
  assert.equal(afterReset.event, 'CRITICAL');
});

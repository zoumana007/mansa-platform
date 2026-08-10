import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_RECONCILIATION_ALERTING_OPTIONS,
  ReconciliationAlertingPolicy,
} from '../dist/reconciliation/reconciliation-alerting-policy.js';

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

test('alerting policy ignores NO_DATA without notifying', () => {
  const policy = new ReconciliationAlertingPolicy();
  const result = policy.evaluate(evaluation('NO_DATA'), T0);

  assert.equal(result.shouldNotify, false);
  assert.equal(result.event, null);
  assert.equal(result.reason, 'NO_DATA');
  assert.equal(result.currentStatus, 'NO_DATA');
});

test('alerting policy emits warning on transition and deduplicates inside cooldown', () => {
  const policy = new ReconciliationAlertingPolicy();

  const first = policy.evaluate(evaluation('WARNING'), T0);
  assert.equal(first.shouldNotify, true);
  assert.equal(first.event, 'WARNING');
  assert.equal(first.reason, 'STATE_CHANGE');

  const duplicate = policy.evaluate(evaluation('WARNING'), T0 + 60_000);
  assert.equal(duplicate.shouldNotify, false);
  assert.equal(duplicate.event, null);
  assert.equal(duplicate.reason, 'COOLDOWN_ACTIVE');
});

test('alerting policy emits reminder after cooldown elapsed', () => {
  const policy = new ReconciliationAlertingPolicy();
  const cooldown = DEFAULT_RECONCILIATION_ALERTING_OPTIONS.cooldownMs;

  policy.evaluate(evaluation('CRITICAL'), T0);
  const reminder = policy.evaluate(evaluation('CRITICAL'), T0 + cooldown);

  assert.equal(reminder.shouldNotify, true);
  assert.equal(reminder.event, 'REMINDER');
  assert.equal(reminder.reason, 'COOLDOWN_ELAPSED');
  assert.equal(reminder.previousStatus, 'CRITICAL');
  assert.equal(reminder.currentStatus, 'CRITICAL');
});

test('alerting policy emits immediately when severity changes', () => {
  const policy = new ReconciliationAlertingPolicy();

  policy.evaluate(evaluation('WARNING'), T0);
  const escalated = policy.evaluate(evaluation('CRITICAL'), T0 + 1_000);

  assert.equal(escalated.shouldNotify, true);
  assert.equal(escalated.event, 'CRITICAL');
  assert.equal(escalated.reason, 'STATE_CHANGE');
  assert.equal(escalated.previousStatus, 'WARNING');
});

test('alerting policy emits recovered after unhealthy state becomes healthy', () => {
  const policy = new ReconciliationAlertingPolicy();

  policy.evaluate(evaluation('CRITICAL'), T0);
  const recovered = policy.evaluate(evaluation('HEALTHY'), T0 + 5_000);

  assert.equal(recovered.shouldNotify, true);
  assert.equal(recovered.event, 'RECOVERED');
  assert.equal(recovered.reason, 'STATE_CHANGE');
  assert.equal(recovered.previousStatus, 'CRITICAL');
  assert.equal(recovered.currentStatus, 'HEALTHY');
  assert.equal(recovered.nextEligibleReminderAt, null);
});

test('alerting policy stays quiet on stable healthy state', () => {
  const policy = new ReconciliationAlertingPolicy();

  policy.evaluate(evaluation('HEALTHY'), T0);
  const healthy = policy.evaluate(evaluation('HEALTHY'), T0 + 5_000);

  assert.equal(healthy.shouldNotify, false);
  assert.equal(healthy.event, null);
  assert.equal(healthy.reason, 'HEALTHY_STEADY');
});

test('alerting policy validates cooldown and supports reset', () => {
  const policy = new ReconciliationAlertingPolicy();

  assert.throws(
    () => policy.evaluate(evaluation('WARNING'), T0, { cooldownMs: -1 }),
    /cooldownMs/,
  );

  policy.evaluate(evaluation('WARNING'), T0);
  policy.reset();
  const afterReset = policy.evaluate(evaluation('WARNING'), T0 + 1_000);

  assert.equal(afterReset.previousStatus, null);
  assert.equal(afterReset.shouldNotify, true);
  assert.equal(afterReset.event, 'WARNING');
});

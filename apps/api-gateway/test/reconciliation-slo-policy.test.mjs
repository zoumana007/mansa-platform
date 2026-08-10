import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_RECONCILIATION_SLO_THRESHOLDS,
  ReconciliationSloPolicy,
} from '../dist/reconciliation/reconciliation-slo-policy.js';

const sample = (name, value, kind = 'COUNTER', unit = 'count') => ({
  name,
  kind,
  value,
  unit,
});

test('reconciliation SLO policy reports NO_DATA without completed activity', () => {
  const policy = new ReconciliationSloPolicy();

  assert.deepEqual(policy.evaluate([]), {
    status: 'NO_DATA',
    sli: {
      completedImports: 0,
      importFailureRate: null,
      comparedItems: 0,
      mismatchRate: null,
      lastImportDurationMs: null,
    },
    breaches: [],
  });
});

test('reconciliation SLO policy reports HEALTHY inside default objectives', () => {
  const policy = new ReconciliationSloPolicy();
  const metrics = [
    sample('mansa_reconciliation_imports_succeeded_total', 999),
    sample('mansa_reconciliation_imports_failed_total', 1),
    sample('mansa_reconciliation_matched_items_total', 9996),
    sample('mansa_reconciliation_mismatched_items_total', 4),
    sample('mansa_reconciliation_last_import_duration_ms', 12_000, 'GAUGE', 'milliseconds'),
  ];

  const result = policy.evaluate(metrics);

  assert.equal(result.status, 'HEALTHY');
  assert.equal(result.sli.completedImports, 1000);
  assert.equal(result.sli.importFailureRate, 0.001);
  assert.equal(result.sli.comparedItems, 10_000);
  assert.equal(result.sli.mismatchRate, 0.0004);
  assert.equal(result.sli.lastImportDurationMs, 12_000);
  assert.deepEqual(result.breaches, []);
});

test('reconciliation SLO policy reports warning for a single moderate breach', () => {
  const policy = new ReconciliationSloPolicy();
  const metrics = [
    sample('mansa_reconciliation_imports_succeeded_total', 98),
    sample('mansa_reconciliation_imports_failed_total', 2),
    sample('mansa_reconciliation_matched_items_total', 1000),
    sample('mansa_reconciliation_mismatched_items_total', 0),
    sample('mansa_reconciliation_last_import_duration_ms', 10_000, 'GAUGE', 'milliseconds'),
  ];

  const result = policy.evaluate(metrics);

  assert.equal(result.status, 'WARNING');
  assert.deepEqual(result.breaches, [
    {
      indicator: 'IMPORT_FAILURE_RATE',
      severity: 'WARNING',
      observed: 0.02,
      threshold: DEFAULT_RECONCILIATION_SLO_THRESHOLDS.maximumImportFailureRate,
    },
  ]);
});

test('reconciliation SLO policy reports critical when threshold is doubled', () => {
  const policy = new ReconciliationSloPolicy();
  const metrics = [
    sample('mansa_reconciliation_imports_succeeded_total', 97),
    sample('mansa_reconciliation_imports_failed_total', 3),
    sample('mansa_reconciliation_matched_items_total', 990),
    sample('mansa_reconciliation_mismatched_items_total', 10),
    sample('mansa_reconciliation_last_import_duration_ms', 70_000, 'GAUGE', 'milliseconds'),
  ];

  const result = policy.evaluate(metrics);

  assert.equal(result.status, 'CRITICAL');
  assert.deepEqual(
    result.breaches.map(({ indicator, severity }) => ({ indicator, severity })),
    [
      { indicator: 'IMPORT_FAILURE_RATE', severity: 'CRITICAL' },
      { indicator: 'MISMATCH_RATE', severity: 'CRITICAL' },
      { indicator: 'LAST_IMPORT_DURATION_MS', severity: 'CRITICAL' },
    ],
  );
});

test('reconciliation SLO policy accepts explicit thresholds without mutating defaults', () => {
  const policy = new ReconciliationSloPolicy();
  const custom = {
    maximumImportFailureRate: 0.1,
    maximumMismatchRate: 0.1,
    maximumLastImportDurationMs: 120_000,
  };

  const result = policy.evaluate(
    [
      sample('mansa_reconciliation_imports_succeeded_total', 95),
      sample('mansa_reconciliation_imports_failed_total', 5),
      sample('mansa_reconciliation_matched_items_total', 95),
      sample('mansa_reconciliation_mismatched_items_total', 5),
      sample('mansa_reconciliation_last_import_duration_ms', 60_000, 'GAUGE', 'milliseconds'),
    ],
    custom,
  );

  assert.equal(result.status, 'HEALTHY');
  assert.deepEqual(DEFAULT_RECONCILIATION_SLO_THRESHOLDS, {
    maximumImportFailureRate: 0.01,
    maximumMismatchRate: 0.005,
    maximumLastImportDurationMs: 30_000,
  });
});

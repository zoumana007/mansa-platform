import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationOperationalMonitor } from '../dist/reconciliation/reconciliation-operational-monitor.js';
import { LowCardinalityReconciliationMetricsExporter } from '../dist/reconciliation/reconciliation-metrics-exporter.js';

test('reconciliation metrics exporter exposes only bounded aggregate counters and duration', () => {
  const monitor = new ReconciliationOperationalMonitor();
  monitor.recordImportStarted(new Date('2026-08-10T18:00:00.000Z'));
  monitor.recordImportSucceeded(3, new Date('2026-08-10T18:00:01.000Z'), 120.5);
  monitor.recordImportStarted(new Date('2026-08-10T18:01:00.000Z'));
  monitor.recordImportFailed(new Date('2026-08-10T18:01:01.000Z'), 80.25);

  const exporter = new LowCardinalityReconciliationMetricsExporter(monitor);

  assert.deepEqual(exporter.export(), [
    {
      name: 'mansa_reconciliation_imports_started_total',
      kind: 'COUNTER',
      value: 2,
      unit: 'count',
    },
    {
      name: 'mansa_reconciliation_imports_succeeded_total',
      kind: 'COUNTER',
      value: 1,
      unit: 'count',
    },
    {
      name: 'mansa_reconciliation_imports_failed_total',
      kind: 'COUNTER',
      value: 1,
      unit: 'count',
    },
    {
      name: 'mansa_reconciliation_imported_items_total',
      kind: 'COUNTER',
      value: 3,
      unit: 'count',
    },
    {
      name: 'mansa_reconciliation_import_duration_ms_total',
      kind: 'COUNTER',
      value: 200.75,
      unit: 'milliseconds',
    },
    {
      name: 'mansa_reconciliation_last_import_duration_ms',
      kind: 'GAUGE',
      value: 80.25,
      unit: 'milliseconds',
    },
  ]);
});

test('reconciliation metrics exporter omits last duration before any completed import', () => {
  const monitor = new ReconciliationOperationalMonitor();
  const exporter = new LowCardinalityReconciliationMetricsExporter(monitor);

  assert.equal(
    exporter.export().some((sample) => sample.name === 'mansa_reconciliation_last_import_duration_ms'),
    false,
  );
});

test('reconciliation metrics exporter does not expose identifiers or labels', () => {
  const monitor = new ReconciliationOperationalMonitor();
  const exporter = new LowCardinalityReconciliationMetricsExporter(monitor);

  for (const sample of exporter.export()) {
    assert.deepEqual(Object.keys(sample).sort(), ['kind', 'name', 'unit', 'value']);
    assert.equal('labels' in sample, false);
    assert.equal('organizationId' in sample, false);
    assert.equal('providerId' in sample, false);
    assert.equal('transactionId' in sample, false);
  }
});

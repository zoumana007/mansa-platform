import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationOperationalMonitor } from '../dist/reconciliation/reconciliation-operational-monitor.js';
import { LowCardinalityReconciliationMetricsExporter } from '../dist/reconciliation/reconciliation-metrics-exporter.js';

test('reconciliation metrics exporter exposes only bounded aggregate counters', () => {
  const monitor = new ReconciliationOperationalMonitor();
  monitor.recordImportStarted(new Date('2026-08-10T18:00:00.000Z'));
  monitor.recordImportSucceeded(3, new Date('2026-08-10T18:00:01.000Z'));
  monitor.recordImportStarted(new Date('2026-08-10T18:01:00.000Z'));
  monitor.recordImportFailed(new Date('2026-08-10T18:01:01.000Z'));

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
  ]);
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

import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationOperationalMonitor } from '../dist/reconciliation/reconciliation-operational-monitor.js';
import { LowCardinalityReconciliationMetricsExporter } from '../dist/reconciliation/reconciliation-metrics-exporter.js';

function metricMap(samples) {
  return new Map(samples.map((sample) => [sample.name, sample]));
}

test('reconciliation metrics exporter exposes only bounded aggregate counters and duration', () => {
  const monitor = new ReconciliationOperationalMonitor();
  monitor.recordImportStarted(new Date('2026-08-10T18:00:00.000Z'));
  monitor.recordImportSucceeded(3, new Date('2026-08-10T18:00:01.000Z'), 120.5, {
    matched: 1,
    mismatched: 2,
    byReason: { AMOUNT_MISMATCH: 1, MISSING_INTERNAL_TRANSACTION: 1 },
  });
  monitor.recordImportStarted(new Date('2026-08-10T18:01:00.000Z'));
  monitor.recordImportQuarantined('INVALID_AMOUNT');
  monitor.recordImportFailed(new Date('2026-08-10T18:01:01.000Z'), 80.25);

  const exporter = new LowCardinalityReconciliationMetricsExporter(monitor);
  const metrics = metricMap(exporter.export());

  assert.equal(metrics.get('mansa_reconciliation_imports_started_total').value, 2);
  assert.equal(metrics.get('mansa_reconciliation_imports_succeeded_total').value, 1);
  assert.equal(metrics.get('mansa_reconciliation_imports_failed_total').value, 1);
  assert.equal(metrics.get('mansa_reconciliation_imports_quarantined_total').value, 1);
  assert.equal(metrics.get('mansa_reconciliation_quarantine_invalid_amount_total').value, 1);
  assert.equal(metrics.get('mansa_reconciliation_quarantine_empty_source_total').value, 0);
  assert.equal(metrics.get('mansa_reconciliation_imported_items_total').value, 3);
  assert.equal(metrics.get('mansa_reconciliation_matched_items_total').value, 1);
  assert.equal(metrics.get('mansa_reconciliation_mismatched_items_total').value, 2);
  assert.equal(metrics.get('mansa_reconciliation_mismatch_missing_internal_transaction_total').value, 1);
  assert.equal(metrics.get('mansa_reconciliation_mismatch_amount_total').value, 1);
  assert.equal(metrics.get('mansa_reconciliation_import_duration_ms_total').value, 200.75);
  assert.equal(metrics.get('mansa_reconciliation_last_import_duration_ms').value, 80.25);
});

test('reconciliation metrics exporter publishes every quarantine code as a fixed metric name', () => {
  const monitor = new ReconciliationOperationalMonitor();
  const exporter = new LowCardinalityReconciliationMetricsExporter(monitor);
  const names = new Set(exporter.export().map((sample) => sample.name));
  for (const name of [
    'mansa_reconciliation_quarantine_provider_id_required_total',
    'mansa_reconciliation_quarantine_invalid_period_total',
    'mansa_reconciliation_quarantine_empty_source_total',
    'mansa_reconciliation_quarantine_source_too_large_total',
    'mansa_reconciliation_quarantine_invalid_provider_reference_total',
    'mansa_reconciliation_quarantine_invalid_amount_total',
    'mansa_reconciliation_quarantine_invalid_currency_total',
    'mansa_reconciliation_quarantine_invalid_status_total',
  ]) {
    assert.equal(names.has(name), true);
  }
});

test('reconciliation metrics exporter omits last duration before any completed import', () => {
  const monitor = new ReconciliationOperationalMonitor();
  const exporter = new LowCardinalityReconciliationMetricsExporter(monitor);
  assert.equal(exporter.export().some((sample) => sample.name === 'mansa_reconciliation_last_import_duration_ms'), false);
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

import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationAlertDispatcher } from '../dist/reconciliation/reconciliation-alert-dispatcher.js';
import { ReconciliationAlertingPolicy } from '../dist/reconciliation/reconciliation-alerting-policy.js';
import { LowCardinalityReconciliationMetricsExporter } from '../dist/reconciliation/reconciliation-metrics-exporter.js';
import { ReconciliationMonitoringOrchestrator } from '../dist/reconciliation/reconciliation-monitoring-orchestrator.js';
import { ReconciliationOperationalMonitor } from '../dist/reconciliation/reconciliation-operational-monitor.js';
import { ReconciliationSloPolicy } from '../dist/reconciliation/reconciliation-slo-policy.js';

const T0 = Date.parse('2026-08-11T00:00:00.000Z');

class RecordingSink {
  constructor() {
    this.payloads = [];
  }

  async send(payload) {
    this.payloads.push(payload);
  }
}

const setup = () => {
  const monitor = new ReconciliationOperationalMonitor();
  const exporter = new LowCardinalityReconciliationMetricsExporter(monitor);
  const slo = new ReconciliationSloPolicy();
  const sink = new RecordingSink();
  const dispatcher = new ReconciliationAlertDispatcher(new ReconciliationAlertingPolicy(), sink);
  const orchestrator = new ReconciliationMonitoringOrchestrator(
    monitor,
    exporter,
    slo,
    dispatcher,
  );
  return { monitor, sink, orchestrator };
};

test('monitoring cycle remains silent when no reconciliation data exists', async () => {
  const { sink, orchestrator } = setup();

  const result = await orchestrator.runCycle({ evaluatedAtMs: T0 });

  assert.equal(result.evaluation.status, 'NO_DATA');
  assert.equal(result.alerting.delivered, false);
  assert.equal(sink.payloads.length, 0);
  assert.ok(result.metrics.some((sample) => sample.name === 'mansa_reconciliation_imports_started_total'));
});

test('monitoring cycle emits critical alert from bounded operational metrics', async () => {
  const { monitor, sink, orchestrator } = setup();

  monitor.recordImportStarted(new Date(T0));
  monitor.recordImportFailed(new Date(T0 + 1_000), 70_000);

  const result = await orchestrator.runCycle({ evaluatedAtMs: T0 + 2_000 });

  assert.equal(result.evaluation.status, 'CRITICAL');
  assert.equal(result.alerting.delivered, true);
  assert.equal(result.alerting.decision.event, 'CRITICAL');
  assert.equal(sink.payloads.length, 1);
  assert.equal(sink.payloads[0].status, 'CRITICAL');
  assert.ok(
    sink.payloads[0].breaches.some((breach) => breach.indicator === 'IMPORT_FAILURE_RATE'),
  );
});

test('monitoring cycle honors custom SLO thresholds and alert cooldown', async () => {
  const { monitor, sink, orchestrator } = setup();

  monitor.recordImportStarted(new Date(T0));
  monitor.recordImportSucceeded(
    10,
    new Date(T0 + 1_000),
    500,
    { matched: 9, mismatched: 1, byReason: { AMOUNT_MISMATCH: 1 } },
  );

  const options = {
    evaluatedAtMs: T0 + 2_000,
    sloThresholds: {
      maximumImportFailureRate: 1,
      maximumMismatchRate: 0.05,
      maximumLastImportDurationMs: 10_000,
    },
    alerting: { cooldownMs: 60_000 },
  };

  const first = await orchestrator.runCycle(options);
  const duplicate = await orchestrator.runCycle({ ...options, evaluatedAtMs: T0 + 3_000 });

  assert.equal(first.evaluation.status, 'WARNING');
  assert.equal(first.alerting.delivered, true);
  assert.equal(duplicate.alerting.delivered, false);
  assert.equal(sink.payloads.length, 1);
});

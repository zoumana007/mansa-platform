import { Inject, Injectable } from '@nestjs/common';

import {
  type ReconciliationAlertDispatchResult,
  ReconciliationAlertDispatcher,
} from './reconciliation-alert-dispatcher';
import type { ReconciliationAlertingOptions } from './reconciliation-alerting-policy';
import { DEFAULT_RECONCILIATION_ALERTING_OPTIONS } from './reconciliation-alerting-policy';
import {
  RECONCILIATION_METRICS_EXPORTER,
  type ReconciliationMetricSample,
  type ReconciliationMetricsExporter,
} from './reconciliation-metrics-exporter';
import { ReconciliationOperationalMonitor } from './reconciliation-operational-monitor';
import {
  DEFAULT_RECONCILIATION_SLO_THRESHOLDS,
  type ReconciliationSloEvaluation,
  ReconciliationSloPolicy,
  type ReconciliationSloThresholds,
} from './reconciliation-slo-policy';

export interface ReconciliationMonitoringCycleOptions {
  readonly sloThresholds?: ReconciliationSloThresholds;
  readonly alerting?: ReconciliationAlertingOptions;
  readonly evaluatedAtMs?: number;
}

export interface ReconciliationMonitoringCycleResult {
  readonly metrics: readonly ReconciliationMetricSample[];
  readonly evaluation: ReconciliationSloEvaluation;
  readonly alerting: ReconciliationAlertDispatchResult;
}

/**
 * Runs one bounded monitoring cycle for reconciliation.
 *
 * This orchestrator intentionally performs no scheduling and knows no external
 * alert provider. A scheduler/worker can call runCycle(), while provider wiring
 * remains isolated behind ReconciliationAlertSink.
 */
@Injectable()
export class ReconciliationMonitoringOrchestrator {
  public constructor(
    private readonly monitor: ReconciliationOperationalMonitor,
    @Inject(RECONCILIATION_METRICS_EXPORTER)
    private readonly metricsExporter: ReconciliationMetricsExporter,
    private readonly sloPolicy: ReconciliationSloPolicy,
    private readonly alertDispatcher: ReconciliationAlertDispatcher,
  ) {}

  public async runCycle(
    options: ReconciliationMonitoringCycleOptions = {},
  ): Promise<ReconciliationMonitoringCycleResult> {
    const snapshot = this.monitor.snapshot();
    const metrics = this.metricsExporter.export(snapshot);
    const evaluation = this.sloPolicy.evaluate(
      metrics,
      options.sloThresholds ?? DEFAULT_RECONCILIATION_SLO_THRESHOLDS,
    );
    const alerting = await this.alertDispatcher.dispatch(
      evaluation,
      options.evaluatedAtMs ?? Date.now(),
      options.alerting ?? DEFAULT_RECONCILIATION_ALERTING_OPTIONS,
    );

    return Object.freeze({ metrics, evaluation, alerting });
  }
}

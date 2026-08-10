import { Injectable } from '@nestjs/common';

import type { ReconciliationMetricSample } from './reconciliation-metrics-exporter';

export type ReconciliationSloStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'NO_DATA';

export interface ReconciliationSloThresholds {
  readonly maximumImportFailureRate: number;
  readonly maximumMismatchRate: number;
  readonly maximumLastImportDurationMs: number;
}

export interface ReconciliationSliSnapshot {
  readonly completedImports: number;
  readonly importFailureRate: number | null;
  readonly comparedItems: number;
  readonly mismatchRate: number | null;
  readonly lastImportDurationMs: number | null;
}

export interface ReconciliationSloEvaluation {
  readonly status: ReconciliationSloStatus;
  readonly sli: ReconciliationSliSnapshot;
  readonly breaches: readonly ReconciliationSloBreach[];
}

export interface ReconciliationSloBreach {
  readonly indicator: 'IMPORT_FAILURE_RATE' | 'MISMATCH_RATE' | 'LAST_IMPORT_DURATION_MS';
  readonly severity: 'WARNING' | 'CRITICAL';
  readonly observed: number;
  readonly threshold: number;
}

export const DEFAULT_RECONCILIATION_SLO_THRESHOLDS: ReconciliationSloThresholds = Object.freeze({
  maximumImportFailureRate: 0.01,
  maximumMismatchRate: 0.005,
  maximumLastImportDurationMs: 30_000,
});

const metricValue = (samples: readonly ReconciliationMetricSample[], name: string): number =>
  samples.find((sample) => sample.name === name)?.value ?? 0;

const optionalMetricValue = (
  samples: readonly ReconciliationMetricSample[],
  name: string,
): number | null => samples.find((sample) => sample.name === name)?.value ?? null;

/**
 * Evaluates process-local reconciliation SLI from the bounded metrics contract.
 *
 * The evaluator is intentionally provider-neutral: it does not page, persist,
 * aggregate across replicas or emit alerts. A monitoring adapter may consume
 * the returned evaluation without changing reconciliation business contracts.
 */
@Injectable()
export class ReconciliationSloPolicy {
  public evaluate(
    samples: readonly ReconciliationMetricSample[],
    thresholds: ReconciliationSloThresholds = DEFAULT_RECONCILIATION_SLO_THRESHOLDS,
  ): ReconciliationSloEvaluation {
    const succeeded = metricValue(samples, 'mansa_reconciliation_imports_succeeded_total');
    const failed = metricValue(samples, 'mansa_reconciliation_imports_failed_total');
    const matched = metricValue(samples, 'mansa_reconciliation_matched_items_total');
    const mismatched = metricValue(samples, 'mansa_reconciliation_mismatched_items_total');
    const completedImports = succeeded + failed;
    const comparedItems = matched + mismatched;

    const importFailureRate = completedImports > 0 ? failed / completedImports : null;
    const mismatchRate = comparedItems > 0 ? mismatched / comparedItems : null;
    const lastImportDurationMs = optionalMetricValue(
      samples,
      'mansa_reconciliation_last_import_duration_ms',
    );

    const sli: ReconciliationSliSnapshot = Object.freeze({
      completedImports,
      importFailureRate,
      comparedItems,
      mismatchRate,
      lastImportDurationMs,
    });

    if (completedImports === 0 && comparedItems === 0 && lastImportDurationMs === null) {
      return Object.freeze({ status: 'NO_DATA', sli, breaches: Object.freeze([]) });
    }

    const breaches: ReconciliationSloBreach[] = [];

    this.recordRatioBreach(
      breaches,
      'IMPORT_FAILURE_RATE',
      importFailureRate,
      thresholds.maximumImportFailureRate,
    );
    this.recordRatioBreach(
      breaches,
      'MISMATCH_RATE',
      mismatchRate,
      thresholds.maximumMismatchRate,
    );
    this.recordDurationBreach(
      breaches,
      lastImportDurationMs,
      thresholds.maximumLastImportDurationMs,
    );

    const frozenBreaches = Object.freeze(breaches.map((breach) => Object.freeze(breach)));
    const status: ReconciliationSloStatus = frozenBreaches.some(
      (breach) => breach.severity === 'CRITICAL',
    )
      ? 'CRITICAL'
      : frozenBreaches.length > 0
        ? 'WARNING'
        : 'HEALTHY';

    return Object.freeze({ status, sli, breaches: frozenBreaches });
  }

  private recordRatioBreach(
    breaches: ReconciliationSloBreach[],
    indicator: 'IMPORT_FAILURE_RATE' | 'MISMATCH_RATE',
    observed: number | null,
    threshold: number,
  ): void {
    if (observed === null || observed <= threshold) {
      return;
    }

    breaches.push({
      indicator,
      severity: observed >= threshold * 2 ? 'CRITICAL' : 'WARNING',
      observed,
      threshold,
    });
  }

  private recordDurationBreach(
    breaches: ReconciliationSloBreach[],
    observed: number | null,
    threshold: number,
  ): void {
    if (observed === null || observed <= threshold) {
      return;
    }

    breaches.push({
      indicator: 'LAST_IMPORT_DURATION_MS',
      severity: observed >= threshold * 2 ? 'CRITICAL' : 'WARNING',
      observed,
      threshold,
    });
  }
}

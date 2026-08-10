import { Injectable } from '@nestjs/common';

import {
  ReconciliationOperationalMonitor,
  type ReconciliationOperationalSnapshot,
} from './reconciliation-operational-monitor';

export type ReconciliationMetricKind = 'COUNTER' | 'GAUGE';
export type ReconciliationMetricUnit = 'count' | 'milliseconds';

export interface ReconciliationMetricSample {
  readonly name: string;
  readonly kind: ReconciliationMetricKind;
  readonly value: number;
  readonly unit: ReconciliationMetricUnit;
}

export interface ReconciliationMetricsExporter {
  export(snapshot: ReconciliationOperationalSnapshot): readonly ReconciliationMetricSample[];
}

export const RECONCILIATION_METRICS_EXPORTER = Symbol('RECONCILIATION_METRICS_EXPORTER');

/**
 * Provider-neutral exporter exposing only bounded, process-local metrics.
 *
 * It deliberately does not attach labels. Tenant, transaction, batch, client,
 * file or provider identifiers must never become metric dimensions here.
 */
@Injectable()
export class LowCardinalityReconciliationMetricsExporter
  implements ReconciliationMetricsExporter
{
  public constructor(private readonly monitor: ReconciliationOperationalMonitor) {}

  public export(
    snapshot: ReconciliationOperationalSnapshot = this.monitor.snapshot(),
  ): readonly ReconciliationMetricSample[] {
    const samples: ReconciliationMetricSample[] = [
      {
        name: 'mansa_reconciliation_imports_started_total',
        kind: 'COUNTER',
        value: snapshot.importsStarted,
        unit: 'count',
      },
      {
        name: 'mansa_reconciliation_imports_succeeded_total',
        kind: 'COUNTER',
        value: snapshot.importsSucceeded,
        unit: 'count',
      },
      {
        name: 'mansa_reconciliation_imports_failed_total',
        kind: 'COUNTER',
        value: snapshot.importsFailed,
        unit: 'count',
      },
      {
        name: 'mansa_reconciliation_imported_items_total',
        kind: 'COUNTER',
        value: snapshot.importedItems,
        unit: 'count',
      },
      {
        name: 'mansa_reconciliation_import_duration_ms_total',
        kind: 'COUNTER',
        value: snapshot.completedImportDurationMsTotal,
        unit: 'milliseconds',
      },
    ];

    if (snapshot.lastCompletedImportDurationMs !== null) {
      samples.push({
        name: 'mansa_reconciliation_last_import_duration_ms',
        kind: 'GAUGE',
        value: snapshot.lastCompletedImportDurationMs,
        unit: 'milliseconds',
      });
    }

    return Object.freeze(samples.map((sample) => Object.freeze(sample)));
  }
}

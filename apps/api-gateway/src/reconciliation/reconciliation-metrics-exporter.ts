import { Injectable } from '@nestjs/common';

import {
  ReconciliationOperationalMonitor,
  type ReconciliationOperationalSnapshot,
} from './reconciliation-operational-monitor';

export type ReconciliationMetricKind = 'COUNTER' | 'GAUGE';

export interface ReconciliationMetricSample {
  readonly name: string;
  readonly kind: ReconciliationMetricKind;
  readonly value: number;
  readonly unit: 'count';
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
    return Object.freeze([
      Object.freeze({
        name: 'mansa_reconciliation_imports_started_total',
        kind: 'COUNTER' as const,
        value: snapshot.importsStarted,
        unit: 'count' as const,
      }),
      Object.freeze({
        name: 'mansa_reconciliation_imports_succeeded_total',
        kind: 'COUNTER' as const,
        value: snapshot.importsSucceeded,
        unit: 'count' as const,
      }),
      Object.freeze({
        name: 'mansa_reconciliation_imports_failed_total',
        kind: 'COUNTER' as const,
        value: snapshot.importsFailed,
        unit: 'count' as const,
      }),
      Object.freeze({
        name: 'mansa_reconciliation_imported_items_total',
        kind: 'COUNTER' as const,
        value: snapshot.importedItems,
        unit: 'count' as const,
      }),
    ]);
  }
}

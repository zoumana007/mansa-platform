import { Controller, Get, Inject, UseGuards } from '@nestjs/common';

import { WorkloadIdentityGuard } from '../workload-identity.guard';
import {
  RequireWorkloadScopes,
  WorkloadScopeGuard,
} from '../workload-scope.guard';
import {
  RECONCILIATION_METRICS_EXPORTER,
  type ReconciliationMetricsExporter,
} from './reconciliation-metrics-exporter';

@UseGuards(WorkloadIdentityGuard, WorkloadScopeGuard)
@Controller({ path: 'internal/metrics/reconciliation', version: '1' })
export class ReconciliationMetricsController {
  public constructor(
    @Inject(RECONCILIATION_METRICS_EXPORTER)
    private readonly exporter: ReconciliationMetricsExporter,
  ) {}

  @Get()
  @RequireWorkloadScopes('reconciliation:metrics:read')
  public getMetrics() {
    return {
      data: this.exporter.export(),
    };
  }
}

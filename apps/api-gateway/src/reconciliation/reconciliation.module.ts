import { Module } from '@nestjs/common';

import { HmacWorkloadIdentityVerifier } from '../hmac-workload-identity.verifier';
import { PrismaService } from '../prisma.service';
import { WorkloadIdentityGuard } from '../workload-identity.guard';
import { WORKLOAD_IDENTITY_VERIFIER } from '../workload-identity.verifier';
import { WorkloadScopeGuard } from '../workload-scope.guard';
import { ReconciliationAlertingPolicy } from './reconciliation-alerting-policy';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationImportService } from './reconciliation-import.service';
import { ReconciliationMetricsController } from './reconciliation-metrics.controller';
import {
  LowCardinalityReconciliationMetricsExporter,
  RECONCILIATION_METRICS_EXPORTER,
} from './reconciliation-metrics-exporter';
import { ReconciliationOperationalMonitor } from './reconciliation-operational-monitor';
import { TestReconciliationProviderAdapter } from './reconciliation-provider.adapter';
import { ReconciliationRepository } from './reconciliation.repository';
import { ReconciliationSloPolicy } from './reconciliation-slo-policy';

@Module({
  controllers: [ReconciliationController, ReconciliationMetricsController],
  providers: [
    PrismaService,
    ReconciliationRepository,
    ReconciliationImportService,
    ReconciliationOperationalMonitor,
    ReconciliationSloPolicy,
    ReconciliationAlertingPolicy,
    LowCardinalityReconciliationMetricsExporter,
    TestReconciliationProviderAdapter,
    WorkloadIdentityGuard,
    WorkloadScopeGuard,
    HmacWorkloadIdentityVerifier,
    {
      provide: WORKLOAD_IDENTITY_VERIFIER,
      useExisting: HmacWorkloadIdentityVerifier,
    },
    {
      provide: RECONCILIATION_METRICS_EXPORTER,
      useExisting: LowCardinalityReconciliationMetricsExporter,
    },
  ],
  exports: [
    ReconciliationImportService,
    ReconciliationOperationalMonitor,
    ReconciliationSloPolicy,
    ReconciliationAlertingPolicy,
    LowCardinalityReconciliationMetricsExporter,
    RECONCILIATION_METRICS_EXPORTER,
    ReconciliationRepository,
  ],
})
export class ReconciliationModule {}

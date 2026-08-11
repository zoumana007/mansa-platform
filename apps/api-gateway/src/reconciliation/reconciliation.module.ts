import { Module } from '@nestjs/common';

import { HmacWorkloadIdentityVerifier } from '../hmac-workload-identity.verifier';
import { PrismaService } from '../prisma.service';
import { WorkloadIdentityGuard } from '../workload-identity.guard';
import { WORKLOAD_IDENTITY_VERIFIER } from '../workload-identity.verifier';
import { WorkloadScopeGuard } from '../workload-scope.guard';
import {
  NoopReconciliationAlertSink,
  RECONCILIATION_ALERT_SINK,
  ReconciliationAlertDispatcher,
} from './reconciliation-alert-dispatcher';
import {
  InMemoryReconciliationAlertStateStore,
  RECONCILIATION_ALERT_STATE_STORE,
} from './reconciliation-alert-state-store';
import { ReconciliationAlertingPolicy } from './reconciliation-alerting-policy';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationImportService } from './reconciliation-import.service';
import { ReconciliationMetricsController } from './reconciliation-metrics.controller';
import {
  LowCardinalityReconciliationMetricsExporter,
  RECONCILIATION_METRICS_EXPORTER,
} from './reconciliation-metrics-exporter';
import { ReconciliationMonitoringOrchestrator } from './reconciliation-monitoring-orchestrator';
import { ReconciliationOperationalMonitor } from './reconciliation-operational-monitor';
import { ReconciliationProviderRegistry } from './reconciliation-provider-registry';
import { TestReconciliationProviderAdapter } from './reconciliation-provider.adapter';
import { ReconciliationQuarantineDecisionService } from './reconciliation-quarantine-decision.service';
import { ReconciliationQuarantinePersistencePolicy } from './reconciliation-quarantine-persistence-policy';
import { ReconciliationQuarantinePolicyController } from './reconciliation-quarantine-policy.controller';
import { ReconciliationQuarantinePolicyRegistry } from './reconciliation-quarantine-policy-registry';
import { ReconciliationRepository } from './reconciliation.repository';
import { ReconciliationSloPolicy } from './reconciliation-slo-policy';

@Module({
  controllers: [
    ReconciliationController,
    ReconciliationMetricsController,
    ReconciliationQuarantinePolicyController,
  ],
  providers: [
    PrismaService,
    ReconciliationRepository,
    ReconciliationImportService,
    ReconciliationOperationalMonitor,
    ReconciliationSloPolicy,
    ReconciliationAlertingPolicy,
    ReconciliationAlertDispatcher,
    ReconciliationMonitoringOrchestrator,
    ReconciliationQuarantinePolicyRegistry,
    ReconciliationQuarantinePersistencePolicy,
    ReconciliationQuarantineDecisionService,
    NoopReconciliationAlertSink,
    InMemoryReconciliationAlertStateStore,
    LowCardinalityReconciliationMetricsExporter,
    TestReconciliationProviderAdapter,
    {
      provide: ReconciliationProviderRegistry,
      inject: [TestReconciliationProviderAdapter],
      useFactory: (testAdapter: TestReconciliationProviderAdapter) => {
        const registry = new ReconciliationProviderRegistry();
        registry.register(testAdapter);
        return registry;
      },
    },
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
    {
      provide: RECONCILIATION_ALERT_SINK,
      useExisting: NoopReconciliationAlertSink,
    },
    {
      provide: RECONCILIATION_ALERT_STATE_STORE,
      useExisting: InMemoryReconciliationAlertStateStore,
    },
  ],
  exports: [
    ReconciliationImportService,
    ReconciliationOperationalMonitor,
    ReconciliationSloPolicy,
    ReconciliationAlertingPolicy,
    ReconciliationAlertDispatcher,
    ReconciliationMonitoringOrchestrator,
    ReconciliationProviderRegistry,
    ReconciliationQuarantinePolicyRegistry,
    ReconciliationQuarantinePersistencePolicy,
    ReconciliationQuarantineDecisionService,
    RECONCILIATION_ALERT_SINK,
    RECONCILIATION_ALERT_STATE_STORE,
    LowCardinalityReconciliationMetricsExporter,
    RECONCILIATION_METRICS_EXPORTER,
    ReconciliationRepository,
  ],
})
export class ReconciliationModule {}

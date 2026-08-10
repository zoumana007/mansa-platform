import { Module } from '@nestjs/common';

import { HmacWorkloadIdentityVerifier } from '../hmac-workload-identity.verifier';
import { PrismaService } from '../prisma.service';
import { WorkloadIdentityGuard } from '../workload-identity.guard';
import { WORKLOAD_IDENTITY_VERIFIER } from '../workload-identity.verifier';
import { WorkloadScopeGuard } from '../workload-scope.guard';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationImportService } from './reconciliation-import.service';
import { ReconciliationOperationalMonitor } from './reconciliation-operational-monitor';
import { TestReconciliationProviderAdapter } from './reconciliation-provider.adapter';
import { ReconciliationRepository } from './reconciliation.repository';

@Module({
  controllers: [ReconciliationController],
  providers: [
    PrismaService,
    ReconciliationRepository,
    ReconciliationImportService,
    ReconciliationOperationalMonitor,
    TestReconciliationProviderAdapter,
    WorkloadIdentityGuard,
    WorkloadScopeGuard,
    HmacWorkloadIdentityVerifier,
    {
      provide: WORKLOAD_IDENTITY_VERIFIER,
      useExisting: HmacWorkloadIdentityVerifier,
    },
  ],
  exports: [
    ReconciliationImportService,
    ReconciliationOperationalMonitor,
    ReconciliationRepository,
  ],
})
export class ReconciliationModule {}

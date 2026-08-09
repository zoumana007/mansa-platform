import { Module } from '@nestjs/common';

import { InternalServiceGuard } from '../internal-service.guard';
import { PrismaService } from '../prisma.service';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationImportService } from './reconciliation-import.service';
import { TestReconciliationProviderAdapter } from './reconciliation-provider.adapter';
import { ReconciliationRepository } from './reconciliation.repository';

@Module({
  controllers: [ReconciliationController],
  providers: [
    PrismaService,
    InternalServiceGuard,
    ReconciliationRepository,
    ReconciliationImportService,
    TestReconciliationProviderAdapter,
  ],
  exports: [ReconciliationImportService, ReconciliationRepository],
})
export class ReconciliationModule {}

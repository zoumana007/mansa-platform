import { Module } from '@nestjs/common';

import { InternalServiceGuard } from './internal-service.guard';
import { LedgerController } from './ledger.controller';
import { LedgerOutboxDispatcherService } from './ledger-outbox-dispatcher.service';
import { LedgerOutboxOperationsController } from './ledger-outbox-operations.controller';
import { LedgerOutboxService } from './ledger-outbox.service';
import { LedgerReadService } from './ledger-read.service';
import { LedgerWriteService } from './ledger-write.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [LedgerController, LedgerOutboxOperationsController],
  providers: [
    PrismaService,
    LedgerReadService,
    LedgerWriteService,
    LedgerOutboxService,
    LedgerOutboxDispatcherService,
    InternalServiceGuard,
  ],
})
export class LedgerModule {}

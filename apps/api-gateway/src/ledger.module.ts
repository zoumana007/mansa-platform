import { Module } from '@nestjs/common';

import { InternalServiceGuard } from './internal-service.guard';
import { LedgerController } from './ledger.controller';
import { LedgerOutboxDispatcherService } from './ledger-outbox-dispatcher.service';
import { LedgerOutboxLifecycleService } from './ledger-outbox-lifecycle.service';
import { LedgerOutboxOperationsController } from './ledger-outbox-operations.controller';
import {
  LEDGER_OUTBOX_PUBLISHER,
  UNCONFIGURED_LEDGER_OUTBOX_PUBLISHER,
} from './ledger-outbox-publisher.provider';
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
    LedgerOutboxLifecycleService,
    InternalServiceGuard,
    {
      provide: LEDGER_OUTBOX_PUBLISHER,
      useValue: UNCONFIGURED_LEDGER_OUTBOX_PUBLISHER,
    },
  ],
})
export class LedgerModule {}

import { Module } from '@nestjs/common';

import { InternalServiceGuard } from './internal-service.guard';
import { LedgerController } from './ledger.controller';
import { LedgerOutboxService } from './ledger-outbox.service';
import { LedgerReadService } from './ledger-read.service';
import { LedgerWriteService } from './ledger-write.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [LedgerController],
  providers: [
    PrismaService,
    LedgerReadService,
    LedgerWriteService,
    LedgerOutboxService,
    InternalServiceGuard,
  ],
})
export class LedgerModule {}

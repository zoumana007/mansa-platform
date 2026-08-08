import { Module } from '@nestjs/common';

import { InternalServiceGuard } from './internal-service.guard';
import { LedgerController } from './ledger.controller';
import { LedgerReadService } from './ledger-read.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [LedgerController],
  providers: [PrismaService, LedgerReadService, InternalServiceGuard],
})
export class LedgerModule {}

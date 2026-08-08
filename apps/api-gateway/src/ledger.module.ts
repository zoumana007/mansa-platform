import { Module } from '@nestjs/common';

import { LedgerController } from './ledger.controller';
import { LedgerReadService } from './ledger-read.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [LedgerController],
  providers: [PrismaService, LedgerReadService],
})
export class LedgerModule {}

import { Module } from '@nestjs/common';

import { InternalServiceGuard } from '../internal-service.guard';
import { PrismaService } from '../prisma.service';
import { AccessController } from './access.controller';
import { PrismaAccessRepository } from './access.repository';
import { AccessService } from './access.service';

@Module({
  controllers: [AccessController],
  providers: [PrismaService, InternalServiceGuard, PrismaAccessRepository, AccessService],
  exports: [PrismaAccessRepository, AccessService],
})
export class AccessModule {}

import { Module } from '@nestjs/common';

import { InternalServiceGuard } from '../internal-service.guard';
import { OperationIdempotencyRegistry } from '../idempotency/operation-idempotency.registry';
import { PrismaService } from '../prisma.service';
import { AccessController } from './access.controller';
import { AccessManagementRepository } from './access-management.repository';
import { PrismaAccessRepository } from './access.repository';
import { AccessService } from './access.service';

@Module({
  controllers: [AccessController],
  providers: [
    PrismaService,
    InternalServiceGuard,
    OperationIdempotencyRegistry,
    PrismaAccessRepository,
    AccessManagementRepository,
    AccessService,
  ],
  exports: [PrismaAccessRepository, AccessManagementRepository, AccessService],
})
export class AccessModule {}

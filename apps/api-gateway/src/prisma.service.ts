import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma client for the API gateway.
 *
 * Connection establishment remains lazy so commands such as `build`, `lint` and
 * contract-only tests do not require a reachable PostgreSQL instance.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

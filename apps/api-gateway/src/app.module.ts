import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { CorrelationInterceptor } from './correlation.interceptor';
import { HealthController } from './health.controller';
import { HttpExceptionFilter } from './http-exception.filter';
import { LedgerModule } from './ledger.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';

@Module({
  imports: [LedgerModule, ReconciliationModule],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

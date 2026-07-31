import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { CorrelationInterceptor } from './correlation.interceptor';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationInterceptor,
    },
  ],
})
export class AppModule {}

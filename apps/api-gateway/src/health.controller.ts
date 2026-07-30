import { Controller, Get } from '@nestjs/common';

export interface HealthResponse {
  readonly status: 'ok';
  readonly service: 'mansa-api-gateway';
  readonly timestamp: string;
}

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'mansa-api-gateway',
      timestamp: new Date().toISOString(),
    };
  }
}

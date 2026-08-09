import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InternalServiceGuard } from './internal-service.guard';
import { LedgerOutboxService } from './ledger-outbox.service';

const parsePositiveInteger = (
  value: string | undefined,
  field: string,
  fallback: number,
  max: number,
): number => {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException(`${field} must be an integer between 1 and ${max}.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new BadRequestException(`${field} must be an integer between 1 and ${max}.`);
  }
  return parsed;
};

@UseGuards(InternalServiceGuard)
@Controller({ path: 'internal/ledger/outbox', version: '1' })
export class LedgerOutboxOperationsController {
  public constructor(private readonly outbox: LedgerOutboxService) {}

  @Get('dead-letters')
  public async listDeadLetters(
    @Query('limit') limit?: string,
    @Query('maxAttempts') maxAttempts?: string,
  ) {
    return this.outbox.listDeadLetters({
      limit: parsePositiveInteger(limit, 'limit', 50, 100),
      maxAttempts: parsePositiveInteger(maxAttempts, 'maxAttempts', 10, 1000),
    });
  }

  @Post('dead-letters/:eventId/requeue')
  public async requeueDeadLetter(
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Query('maxAttempts') maxAttempts?: string,
  ) {
    const requeued = await this.outbox.requeueDeadLetter(eventId, {
      maxAttempts: parsePositiveInteger(maxAttempts, 'maxAttempts', 10, 1000),
    });

    if (!requeued) {
      throw new NotFoundException('Dead-letter outbox event not found or no longer eligible.');
    }

    return { eventId, requeued: true };
  }
}

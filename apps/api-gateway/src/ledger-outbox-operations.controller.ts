import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { InternalServiceGuard } from './internal-service.guard';
import { LedgerOutboxService } from './ledger-outbox.service';
import { OperationalAuditService } from './operational-audit.service';

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

const requireHeader = (value: string | undefined, field: string, maxLength = 256): string => {
  const normalized = value?.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new BadRequestException(`${field} header is required and must be at most ${maxLength} characters.`);
  }
  return normalized;
};

type CorrelatedRequest = { readonly correlationId?: string };

@UseGuards(InternalServiceGuard)
@Controller({ path: 'internal/ledger/outbox', version: '1' })
export class LedgerOutboxOperationsController {
  public constructor(
    private readonly outbox: LedgerOutboxService,
    private readonly audit: OperationalAuditService,
  ) {}

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
    @Headers('x-mansa-actor-id') actorIdHeader: string | undefined,
    @Headers('x-mansa-operation-reason') reasonHeader: string | undefined,
    @Req() request: CorrelatedRequest,
    @Query('maxAttempts') maxAttempts?: string,
  ) {
    const actorId = requireHeader(actorIdHeader, 'x-mansa-actor-id');
    const reason = requireHeader(reasonHeader, 'x-mansa-operation-reason', 1000);
    const threshold = parsePositiveInteger(maxAttempts, 'maxAttempts', 10, 1000);
    const auditRecord = {
      correlationId: request.correlationId ?? 'missing-correlation-id',
      actorId,
      actorType: 'SERVICE_ACCOUNT' as const,
      action: 'LEDGER_OUTBOX_DEAD_LETTER_REQUEUED',
      resourceType: 'OUTBOX_EVENT',
      resourceId: eventId,
      reason,
      metadata: { maxAttempts: threshold },
    };

    const requeued = await this.audit.requeueDeadLetterWithAudit({
      eventId,
      maxAttempts: threshold,
      audit: auditRecord,
    });

    if (!requeued) {
      throw new NotFoundException('Dead-letter outbox event not found or no longer eligible.');
    }

    return { eventId, requeued: true };
  }
}

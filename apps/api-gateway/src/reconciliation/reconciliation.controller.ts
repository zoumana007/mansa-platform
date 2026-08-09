import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InternalServiceGuard } from '../internal-service.guard';
import { ReconciliationRepository } from './reconciliation.repository';

function parseLimit(value: string | undefined, fallback: number, max: number): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) throw new BadRequestException('limit must be an integer');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new BadRequestException(`limit must be between 1 and ${max}`);
  }
  return parsed;
}

interface ResolveItemBody {
  status?: string;
  resolutionNote?: string;
  reasonCode?: string;
  idempotencyKey?: string;
  correlationId?: string;
  actorId?: string;
  actorType?: string;
}

@UseGuards(InternalServiceGuard)
@Controller({ path: 'internal/reconciliation', version: '1' })
export class ReconciliationController {
  public constructor(private readonly repository: ReconciliationRepository) {}

  @Get('batches')
  public async listBatches(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    try {
      return await this.repository.listBatches(parseLimit(limit, 50, 100), cursor);
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid reconciliation cursor') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('batches/:batchId')
  public async getBatch(
    @Param('batchId', new ParseUUIDPipe({ version: '4' })) batchId: string,
  ) {
    const batch = await this.repository.getBatch(batchId);
    if (batch === null) throw new NotFoundException('Reconciliation batch not found.');
    return batch;
  }

  @Get('batches/:batchId/items')
  public async listItems(
    @Param('batchId', new ParseUUIDPipe({ version: '4' })) batchId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const batch = await this.repository.getBatch(batchId);
    if (batch === null) throw new NotFoundException('Reconciliation batch not found.');
    try {
      return await this.repository.listItems(batchId, parseLimit(limit, 100, 500), cursor);
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid reconciliation cursor') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('items/:itemId')
  public async getItem(
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    const item = await this.repository.getItem(itemId);
    if (item === null) throw new NotFoundException('Reconciliation item not found.');
    return item;
  }

  @Post('items/:itemId/resolve')
  public async resolveItem(
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() body: ResolveItemBody,
  ) {
    if (body.status !== 'RESOLVED' && body.status !== 'IGNORED') {
      throw new BadRequestException('status must be RESOLVED or IGNORED');
    }
    try {
      return await this.repository.resolveItem({
        itemId,
        status: body.status,
        resolutionNote: body.resolutionNote ?? '',
        reasonCode: body.reasonCode ?? '',
        idempotencyKey: body.idempotencyKey ?? '',
        correlationId: body.correlationId ?? '',
        actorId: body.actorId ?? '',
        actorType: body.actorType ?? '',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'reconciliation item not found') {
          throw new NotFoundException('Reconciliation item not found.');
        }
        if (
          error.message.includes('required') ||
          error.message.includes('only unresolved') ||
          error.message.includes('idempotency key')
        ) {
          throw new BadRequestException(error.message);
        }
      }
      throw error;
    }
  }
}

import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
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

@UseGuards(InternalServiceGuard)
@Controller({ path: 'internal/reconciliation', version: '1' })
export class ReconciliationController {
  public constructor(private readonly repository: ReconciliationRepository) {}

  @Get('batches')
  public async listBatches(@Query('limit') limit?: string) {
    return this.repository.listBatches(parseLimit(limit, 50, 100));
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
  ) {
    const batch = await this.repository.getBatch(batchId);
    if (batch === null) throw new NotFoundException('Reconciliation batch not found.');
    return this.repository.listItems(batchId, parseLimit(limit, 100, 500));
  }
}

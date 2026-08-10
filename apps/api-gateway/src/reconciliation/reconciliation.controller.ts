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
  Req,
  UseGuards,
} from '@nestjs/common';
import { RECONCILIATION_BATCH_STATUSES } from '@mansa/contracts/reconciliation-api';
import {
  RECONCILIATION_MISMATCH_REASONS,
  RECONCILIATION_STATUSES,
} from '@mansa/contracts/reconciliation';

import {
  WorkloadIdentityGuard,
  type WorkloadAuthenticatedRequest,
} from '../workload-identity.guard';
import {
  RequireWorkloadScopes,
  WorkloadScopeGuard,
} from '../workload-scope.guard';
import {
  presentReconciliationBatch,
  presentReconciliationItem,
} from './reconciliation.presenter';
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

function requireWorkloadIdentity(request: WorkloadAuthenticatedRequest) {
  if (!request.workloadIdentity) {
    throw new BadRequestException('Authenticated workload context is required.');
  }
  return request.workloadIdentity;
}

function optionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parseDate(value: string | undefined, field: string): Date | undefined {
  if (value === undefined) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException(`${field} must be a valid date`);
  return date;
}

function parseEnum<T extends string>(
  value: string | undefined,
  field: string,
  allowed: readonly T[],
): T | undefined {
  if (value === undefined) return undefined;
  if (!allowed.includes(value as T)) {
    throw new BadRequestException(`${field} has an unsupported value`);
  }
  return value as T;
}

interface ResolveItemBody {
  status?: string;
  resolutionNote?: string;
  reasonCode?: string;
  idempotencyKey?: string;
  correlationId?: string;
}

@UseGuards(WorkloadIdentityGuard, WorkloadScopeGuard)
@Controller({ path: 'internal/reconciliation', version: '1' })
export class ReconciliationController {
  public constructor(private readonly repository: ReconciliationRepository) {}

  @Get('batches')
  @RequireWorkloadScopes('reconciliation:read')
  public async listBatches(
    @Req() request: WorkloadAuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('providerId') providerId?: string,
    @Query('status') status?: string,
    @Query('periodStartFrom') periodStartFrom?: string,
    @Query('periodEndTo') periodEndTo?: string,
  ) {
    try {
      const identity = requireWorkloadIdentity(request);
      const result = await this.repository.listBatches(
        identity.organizationId,
        parseLimit(limit, 50, 100),
        cursor,
        {
          ...(optionalText(providerId) ? { providerId: optionalText(providerId) } : {}),
          ...(status
            ? { status: parseEnum(status, 'status', RECONCILIATION_BATCH_STATUSES) }
            : {}),
          ...(periodStartFrom
            ? { periodStartFrom: parseDate(periodStartFrom, 'periodStartFrom') }
            : {}),
          ...(periodEndTo ? { periodEndTo: parseDate(periodEndTo, 'periodEndTo') } : {}),
        },
      );
      return { data: result.data.map(presentReconciliationBatch), page: result.page };
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid reconciliation cursor') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('batches/:batchId')
  @RequireWorkloadScopes('reconciliation:read')
  public async getBatch(
    @Req() request: WorkloadAuthenticatedRequest,
    @Param('batchId', new ParseUUIDPipe({ version: '4' })) batchId: string,
  ) {
    const identity = requireWorkloadIdentity(request);
    const batch = await this.repository.getBatch(identity.organizationId, batchId);
    if (batch === null) throw new NotFoundException('Reconciliation batch not found.');
    return presentReconciliationBatch(batch);
  }

  @Get('batches/:batchId/items')
  @RequireWorkloadScopes('reconciliation:read')
  public async listItems(
    @Req() request: WorkloadAuthenticatedRequest,
    @Param('batchId', new ParseUUIDPipe({ version: '4' })) batchId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('providerId') providerId?: string,
    @Query('status') status?: string,
    @Query('mismatchReason') mismatchReason?: string,
    @Query('internalReference') internalReference?: string,
    @Query('providerReference') providerReference?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
  ) {
    const identity = requireWorkloadIdentity(request);
    const scope = identity.organizationId;
    const batch = await this.repository.getBatch(scope, batchId);
    if (batch === null) throw new NotFoundException('Reconciliation batch not found.');
    try {
      const result = await this.repository.listItems(
        scope,
        batchId,
        parseLimit(limit, 100, 500),
        cursor,
        {
          ...(optionalText(providerId) ? { providerId: optionalText(providerId) } : {}),
          ...(status ? { status: parseEnum(status, 'status', RECONCILIATION_STATUSES) } : {}),
          ...(mismatchReason
            ? {
                mismatchReason: parseEnum(
                  mismatchReason,
                  'mismatchReason',
                  RECONCILIATION_MISMATCH_REASONS,
                ),
              }
            : {}),
          ...(optionalText(internalReference)
            ? { internalReference: optionalText(internalReference) }
            : {}),
          ...(optionalText(providerReference)
            ? { providerReference: optionalText(providerReference) }
            : {}),
          ...(createdFrom ? { createdFrom: parseDate(createdFrom, 'createdFrom') } : {}),
          ...(createdTo ? { createdTo: parseDate(createdTo, 'createdTo') } : {}),
        },
      );
      return { data: result.data.map(presentReconciliationItem), page: result.page };
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid reconciliation cursor') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('items/:itemId')
  @RequireWorkloadScopes('reconciliation:read')
  public async getItem(
    @Req() request: WorkloadAuthenticatedRequest,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    const identity = requireWorkloadIdentity(request);
    const item = await this.repository.getItem(identity.organizationId, itemId);
    if (item === null) throw new NotFoundException('Reconciliation item not found.');
    return presentReconciliationItem(item);
  }

  @Post('items/:itemId/resolve')
  @RequireWorkloadScopes('reconciliation:write')
  public async resolveItem(
    @Req() request: WorkloadAuthenticatedRequest,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() body: ResolveItemBody,
  ) {
    if (body.status !== 'RESOLVED' && body.status !== 'IGNORED') {
      throw new BadRequestException('status must be RESOLVED or IGNORED');
    }
    const identity = requireWorkloadIdentity(request);
    try {
      const item = await this.repository.resolveItem({
        organizationId: identity.organizationId,
        itemId,
        status: body.status,
        resolutionNote: body.resolutionNote ?? '',
        reasonCode: body.reasonCode ?? '',
        idempotencyKey: body.idempotencyKey ?? '',
        correlationId: body.correlationId ?? '',
        actorId: identity.workloadId,
        actorType: 'WORKLOAD',
      });
      return presentReconciliationItem(item);
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

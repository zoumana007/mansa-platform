import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AccessRequest } from '@mansa/contracts/access-mobility';

import { InternalServiceGuard } from '../internal-service.guard';
import { AccessService } from './access.service';

function requireString(name: string, value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${name} is required`);
  }
  return value;
}

function optionalLimit(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new BadRequestException('limit must be an integer between 1 and 100');
  }
  return parsed;
}

@UseGuards(InternalServiceGuard)
@Controller({ path: 'internal/access', version: '1' })
export class AccessController {
  public constructor(private readonly service: AccessService) {}

  @Get('credentials/:credentialId')
  public async getCredential(
    @Param('credentialId') credentialId: string,
    @Query('organizationId') organizationIdValue: string | undefined,
  ) {
    const organizationId = requireString('organizationId', organizationIdValue);
    const credential = await this.service.getCredential(organizationId, credentialId);
    if (!credential) throw new NotFoundException('credential not found');
    return credential;
  }

  @Get('credentials')
  public async listCredentials(
    @Query('organizationId') organizationIdValue: string | undefined,
    @Query('subjectId') subjectId?: string,
    @Query('status') status?: string,
    @Query('credentialType') credentialType?: string,
    @Query('limit') limitValue?: string,
  ) {
    const organizationId = requireString('organizationId', organizationIdValue);
    return this.service.listCredentials(organizationId, {
      ...(subjectId ? { subjectId } : {}),
      ...(status ? { status } : {}),
      ...(credentialType ? { credentialType } : {}),
      ...(optionalLimit(limitValue) === undefined ? {} : { limit: optionalLimit(limitValue) }),
    });
  }

  @Get('entitlements/:entitlementId')
  public async getEntitlement(
    @Param('entitlementId') entitlementId: string,
    @Query('organizationId') organizationIdValue: string | undefined,
  ) {
    const organizationId = requireString('organizationId', organizationIdValue);
    const entitlement = await this.service.getEntitlement(organizationId, entitlementId);
    if (!entitlement) throw new NotFoundException('entitlement not found');
    return entitlement;
  }

  @Get('entitlements')
  public async listEntitlements(
    @Query('organizationId') organizationIdValue: string | undefined,
    @Query('subjectId') subjectId?: string,
    @Query('useCase') useCase?: string,
    @Query('status') status?: string,
    @Query('limit') limitValue?: string,
  ) {
    const organizationId = requireString('organizationId', organizationIdValue);
    return this.service.listEntitlements(organizationId, {
      ...(subjectId ? { subjectId } : {}),
      ...(useCase ? { useCase } : {}),
      ...(status ? { status } : {}),
      ...(optionalLimit(limitValue) === undefined ? {} : { limit: optionalLimit(limitValue) }),
    });
  }

  @Post('evaluate')
  public async evaluate(@Body() body: Partial<AccessRequest>) {
    const request: AccessRequest = {
      requestId: requireString('requestId', body.requestId),
      organizationId: requireString('organizationId', body.organizationId),
      useCase: requireString('useCase', body.useCase) as AccessRequest['useCase'],
      credentialType: requireString('credentialType', body.credentialType) as AccessRequest['credentialType'],
      credentialReference: requireString('credentialReference', body.credentialReference),
      locationId: requireString('locationId', body.locationId),
      occurredAt: requireString('occurredAt', body.occurredAt),
      correlationId: requireString('correlationId', body.correlationId),
      ...(body.secondaryCredentialType ? { secondaryCredentialType: body.secondaryCredentialType } : {}),
      ...(body.secondaryCredentialReference ? { secondaryCredentialReference: body.secondaryCredentialReference } : {}),
      ...(body.observedLicensePlate ? { observedLicensePlate: body.observedLicensePlate } : {}),
      ...(body.plateRecognitionConfidence === undefined ? {} : { plateRecognitionConfidence: body.plateRecognitionConfidence }),
      ...(body.matchPolicy ? { matchPolicy: body.matchPolicy } : {}),
      ...(body.terminalId ? { terminalId: body.terminalId } : {}),
      ...(body.productCode ? { productCode: body.productCode } : {}),
      ...(body.paymentMethod ? { paymentMethod: body.paymentMethod } : {}),
      ...(body.requestedAmount ? { requestedAmount: body.requestedAmount } : {}),
    };

    try {
      return await this.service.evaluate(request);
    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('must be') ||
        error.message.includes('does not belong') ||
        error.message.includes('does not match')
      )) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}

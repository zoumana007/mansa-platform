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
import type {
  CreateAccessCredentialCommand,
  CreateAccessEntitlementCommand,
} from '@mansa/contracts/access-mobility-api';
import type { AccessCredential, AccessEntitlement, AccessRequest } from '@mansa/contracts/access-mobility';

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

function requireCredential(value: unknown): AccessCredential {
  if (!value || typeof value !== 'object') throw new BadRequestException('credential is required');
  const credential = value as Partial<AccessCredential>;
  requireString('credential.id', credential.id);
  requireString('credential.organizationId', credential.organizationId);
  requireString('credential.subjectId', credential.subjectId);
  requireString('credential.subjectType', credential.subjectType);
  requireString('credential.credentialType', credential.credentialType);
  requireString('credential.publicReference', credential.publicReference);
  requireString('credential.status', credential.status);
  return credential as AccessCredential;
}

function requireEntitlement(value: unknown): AccessEntitlement {
  if (!value || typeof value !== 'object') throw new BadRequestException('entitlement is required');
  const entitlement = value as Partial<AccessEntitlement>;
  requireString('entitlement.id', entitlement.id);
  requireString('entitlement.organizationId', entitlement.organizationId);
  requireString('entitlement.subjectId', entitlement.subjectId);
  requireString('entitlement.useCase', entitlement.useCase);
  requireString('entitlement.status', entitlement.status);
  requireString('entitlement.validFrom', entitlement.validFrom);
  return entitlement as AccessEntitlement;
}

@UseGuards(InternalServiceGuard)
@Controller({ path: 'internal/access', version: '1' })
export class AccessController {
  public constructor(private readonly service: AccessService) {}

  @Post('credentials')
  public async createCredential(@Body() body: Partial<CreateAccessCredentialCommand>) {
    const command: CreateAccessCredentialCommand = {
      credential: requireCredential(body.credential),
      idempotencyKey: requireString('idempotencyKey', body.idempotencyKey),
      correlationId: requireString('correlationId', body.correlationId),
    };
    try {
      return await this.service.createCredential(command);
    } catch (error) {
      if (error instanceof Error) throw new BadRequestException(error.message);
      throw error;
    }
  }

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

  @Post('entitlements')
  public async createEntitlement(@Body() body: Partial<CreateAccessEntitlementCommand>) {
    const command: CreateAccessEntitlementCommand = {
      entitlement: requireEntitlement(body.entitlement),
      idempotencyKey: requireString('idempotencyKey', body.idempotencyKey),
      correlationId: requireString('correlationId', body.correlationId),
    };
    try {
      return await this.service.createEntitlement(command);
    } catch (error) {
      if (error instanceof Error) throw new BadRequestException(error.message);
      throw error;
    }
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

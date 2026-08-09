import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { AccessRequest } from '@mansa/contracts/access-mobility';

import { InternalServiceGuard } from '../internal-service.guard';
import { AccessService } from './access.service';

function requireString(name: string, value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${name} is required`);
  }
  return value;
}

@UseGuards(InternalServiceGuard)
@Controller({ path: 'internal/access', version: '1' })
export class AccessController {
  public constructor(private readonly service: AccessService) {}

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

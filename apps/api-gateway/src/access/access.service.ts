import { Injectable } from '@nestjs/common';
import { processAccessRequest } from '@mansa/contracts/access-application-service';
import type {
  CreateAccessCredentialCommand,
  CreateAccessEntitlementCommand,
} from '@mansa/contracts/access-mobility-api';
import type { AccessCredential, AccessDecision, AccessEntitlement, AccessRequest } from '@mansa/contracts/access-mobility';

import { AccessManagementRepository } from './access-management.repository';
import { PrismaAccessRepository } from './access.repository';

@Injectable()
export class AccessService {
  public constructor(
    private readonly repository: PrismaAccessRepository,
    private readonly management: AccessManagementRepository,
  ) {}

  public async createCredential(command: CreateAccessCredentialCommand): Promise<AccessCredential> {
    return this.management.createCredential(command);
  }

  public async getCredential(organizationId: string, credentialId: string): Promise<AccessCredential | undefined> {
    return this.repository.getCredential(organizationId, credentialId);
  }

  public async listCredentials(
    organizationId: string,
    filters: { subjectId?: string; status?: string; credentialType?: string; limit?: number },
  ): Promise<readonly AccessCredential[]> {
    return this.repository.listCredentials(organizationId, filters);
  }

  public async createEntitlement(command: CreateAccessEntitlementCommand): Promise<AccessEntitlement> {
    return this.management.createEntitlement(command);
  }

  public async getEntitlement(organizationId: string, entitlementId: string): Promise<AccessEntitlement | undefined> {
    return this.repository.getEntitlement(organizationId, entitlementId);
  }

  public async listEntitlements(
    organizationId: string,
    filters: { subjectId?: string; useCase?: string; status?: string; limit?: number },
  ): Promise<readonly AccessEntitlement[]> {
    return this.repository.listEntitlements(organizationId, filters);
  }

  public async evaluate(request: AccessRequest): Promise<AccessDecision> {
    const replay = await this.repository.findRecordedDecision(request.organizationId, request.requestId);
    if (replay) return replay;

    const result = await processAccessRequest(request, {
      repository: this.repository,
      quota: this.repository,
      journal: this.repository,
    });
    return result.decision;
  }
}

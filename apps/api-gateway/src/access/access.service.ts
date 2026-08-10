import { Injectable } from '@nestjs/common';
import { processAccessRequest } from '@mansa/contracts/access-application-service';
import type {
  CreateAccessCredentialCommand,
  CreateAccessEntitlementCommand,
  ReplaceAccessCredentialCommand,
  ReplaceAccessCredentialResult,
  UpdateAccessCredentialStatusCommand,
  UpdateAccessEntitlementStatusCommand,
} from '@mansa/contracts/access-mobility-api';
import type { AccessCredential, AccessDecision, AccessEntitlement, AccessRequest } from '@mansa/contracts/access-mobility';

import { OperationIdempotencyRegistry } from '../idempotency/operation-idempotency.registry';
import { AccessManagementRepository } from './access-management.repository';
import { PrismaAccessRepository } from './access.repository';

@Injectable()
export class AccessService {
  public constructor(
    private readonly repository: PrismaAccessRepository,
    private readonly management: AccessManagementRepository,
    private readonly idempotency: OperationIdempotencyRegistry,
  ) {}

  public async createCredential(command: CreateAccessCredentialCommand): Promise<AccessCredential> {
    return this.management.createCredential(command);
  }

  public async updateCredentialStatus(command: UpdateAccessCredentialStatusCommand): Promise<AccessCredential> {
    return this.idempotency.execute({
      scope: 'ACCESS_CREDENTIAL_STATUS',
      organizationId: command.organizationId,
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      payload: {
        credentialId: command.credentialId,
        targetStatus: command.targetStatus,
        reason: command.reason,
      },
      operation: () => this.management.updateCredentialStatus(command),
      recover: async () => {
        const current = await this.repository.getCredential(command.organizationId, command.credentialId);
        return current?.status === command.targetStatus ? current : undefined;
      },
    });
  }

  public async replaceCredential(command: ReplaceAccessCredentialCommand): Promise<ReplaceAccessCredentialResult> {
    return this.idempotency.execute({
      scope: 'ACCESS_CREDENTIAL_REPLACEMENT',
      organizationId: command.organizationId,
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      payload: {
        credentialId: command.credentialId,
        replacement: command.replacement,
        reason: command.reason,
      },
      operation: () => this.management.replaceCredential(command),
      recover: async () => {
        const revokedCredential = await this.repository.getCredential(command.organizationId, command.credentialId);
        const replacementCredential = await this.repository.getCredential(
          command.organizationId,
          command.replacement.id,
        );
        if (revokedCredential?.status !== 'REVOKED' || replacementCredential === undefined) return undefined;
        return { revokedCredential, replacementCredential };
      },
    });
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

  public async updateEntitlementStatus(command: UpdateAccessEntitlementStatusCommand): Promise<AccessEntitlement> {
    return this.idempotency.execute({
      scope: 'ACCESS_ENTITLEMENT_STATUS',
      organizationId: command.organizationId,
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      payload: {
        entitlementId: command.entitlementId,
        targetStatus: command.targetStatus,
        reason: command.reason,
      },
      operation: () => this.management.updateEntitlementStatus(command),
      recover: async () => {
        const current = await this.repository.getEntitlement(command.organizationId, command.entitlementId);
        return current?.status === command.targetStatus ? current : undefined;
      },
    });
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

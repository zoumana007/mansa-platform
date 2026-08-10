import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  hasWorkloadScopes,
  type WorkloadIdentityScope,
} from '@mansa/contracts/workload-identity';

import type { WorkloadAuthenticatedRequest } from './workload-identity.guard.js';

export const WORKLOAD_SCOPES_METADATA = 'mansa:workload-scopes';

export const RequireWorkloadScopes = (...scopes: readonly WorkloadIdentityScope[]) =>
  SetMetadata(WORKLOAD_SCOPES_METADATA, scopes);

@Injectable()
export class WorkloadScopeGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<readonly WorkloadIdentityScope[]>(
      WORKLOAD_SCOPES_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      throw new ForbiddenException('Workload scope policy is required.');
    }

    const request = context.switchToHttp().getRequest<WorkloadAuthenticatedRequest>();
    const identity = request.workloadIdentity;
    if (!identity) {
      throw new ForbiddenException('Authenticated workload context is required.');
    }

    if (!hasWorkloadScopes(identity, required)) {
      throw new ForbiddenException('Insufficient workload scope.');
    }

    return true;
  }
}

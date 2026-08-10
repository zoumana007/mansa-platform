import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  toWorkloadIdentityContext,
  validateWorkloadIdentity,
  type WorkloadIdentityContext,
} from '@mansa/contracts/workload-identity';

import {
  WORKLOAD_IDENTITY_VERIFIER,
  type WorkloadIdentityVerifier,
} from './workload-identity.verifier.js';

const AUTHORIZATION_HEADER = 'authorization';
const BEARER_PREFIX = 'Bearer ';

export type WorkloadAuthenticatedRequest = {
  readonly headers: Record<string, string | readonly string[] | undefined>;
  workloadIdentity?: WorkloadIdentityContext;
};

@Injectable()
export class WorkloadIdentityGuard implements CanActivate {
  public constructor(
    @Inject(WORKLOAD_IDENTITY_VERIFIER)
    private readonly verifier: WorkloadIdentityVerifier,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<WorkloadAuthenticatedRequest>();
    const rawHeader = request.headers[AUTHORIZATION_HEADER];
    const authorization = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (typeof authorization !== 'string' || !authorization.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Workload identity is required.');
    }

    const credential = authorization.slice(BEARER_PREFIX.length).trim();
    if (credential.length === 0) {
      throw new UnauthorizedException('Workload identity is required.');
    }

    try {
      const identity = await this.verifier.verify(credential);
      const validationErrors = validateWorkloadIdentity(identity);
      if (validationErrors.length > 0) {
        throw new UnauthorizedException('Invalid workload identity.');
      }

      request.workloadIdentity = toWorkloadIdentityContext(identity);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid workload identity.');
    }
  }
}

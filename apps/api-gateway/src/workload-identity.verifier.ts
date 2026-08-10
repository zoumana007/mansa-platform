import type { WorkloadIdentity } from '@mansa/contracts/workload-identity';

/**
 * Raw credential verification boundary for service-to-service authentication.
 *
 * Implementations may use OIDC/JWKS, mTLS/SPIFFE or another approved workload
 * identity mechanism. The verifier must never log or persist the raw credential.
 */
export interface WorkloadIdentityVerifier {
  verify(credential: string): Promise<WorkloadIdentity>;
}

export const WORKLOAD_IDENTITY_VERIFIER = Symbol('WORKLOAD_IDENTITY_VERIFIER');

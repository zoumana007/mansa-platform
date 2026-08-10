export const WORKLOAD_IDENTITY_VERSION = 1 as const;

export const WORKLOAD_IDENTITY_SCOPES = [
  'ledger:read',
  'ledger:write',
  'reconciliation:read',
  'reconciliation:write',
  'reconciliation:metrics:read',
  'operations:read',
  'operations:write',
] as const;

export type WorkloadIdentityScope = (typeof WORKLOAD_IDENTITY_SCOPES)[number];

export interface WorkloadIdentity {
  readonly version: typeof WORKLOAD_IDENTITY_VERSION;
  readonly workloadId: string;
  readonly organizationId: string;
  readonly scopes: readonly WorkloadIdentityScope[];
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly tokenId: string;
}

export interface WorkloadIdentityContext {
  readonly workloadId: string;
  readonly organizationId: string;
  readonly scopes: ReadonlySet<WorkloadIdentityScope>;
  readonly tokenId: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORKLOAD_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]{2,127}$/;

export function isWorkloadIdentityScope(value: string): value is WorkloadIdentityScope {
  return (WORKLOAD_IDENTITY_SCOPES as readonly string[]).includes(value);
}

export function validateWorkloadIdentity(identity: WorkloadIdentity, now = new Date()): string[] {
  const errors: string[] = [];
  if (identity.version !== WORKLOAD_IDENTITY_VERSION) errors.push('unsupported workload identity version');
  if (!WORKLOAD_ID_PATTERN.test(identity.workloadId)) errors.push('invalid workloadId');
  if (!UUID_PATTERN.test(identity.organizationId)) errors.push('invalid organizationId');
  if (!UUID_PATTERN.test(identity.tokenId)) errors.push('invalid tokenId');
  if (identity.scopes.length === 0) errors.push('at least one scope is required');
  if (identity.scopes.some((scope) => !isWorkloadIdentityScope(scope))) errors.push('unsupported scope');
  if (new Set(identity.scopes).size !== identity.scopes.length) errors.push('duplicate scope');

  const issuedAt = Date.parse(identity.issuedAt);
  const expiresAt = Date.parse(identity.expiresAt);
  if (!Number.isFinite(issuedAt)) errors.push('invalid issuedAt');
  if (!Number.isFinite(expiresAt)) errors.push('invalid expiresAt');
  if (Number.isFinite(issuedAt) && issuedAt > now.getTime() + 60_000) errors.push('issuedAt is in the future');
  if (Number.isFinite(expiresAt) && expiresAt <= now.getTime()) errors.push('workload identity is expired');
  if (Number.isFinite(issuedAt) && Number.isFinite(expiresAt) && expiresAt - issuedAt > 15 * 60_000) {
    errors.push('workload identity lifetime exceeds 15 minutes');
  }
  return errors;
}

export function toWorkloadIdentityContext(identity: WorkloadIdentity): WorkloadIdentityContext {
  return {
    workloadId: identity.workloadId,
    organizationId: identity.organizationId,
    scopes: new Set(identity.scopes),
    tokenId: identity.tokenId,
  };
}

export function hasWorkloadScopes(
  context: WorkloadIdentityContext,
  required: readonly WorkloadIdentityScope[],
): boolean {
  return required.every((scope) => context.scopes.has(scope));
}

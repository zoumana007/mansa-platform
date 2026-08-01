export const ROLE_ASSIGNMENT_STATUSES = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'REVOKED',
] as const;

export const ROLE_SCOPE_TYPES = [
  'PLATFORM',
  'COUNTRY',
  'ORGANIZATION',
  'MERCHANT',
  'LOCATION',
  'PUBLIC_ORGANIZATION',
] as const;

export type RoleAssignmentStatus =
  (typeof ROLE_ASSIGNMENT_STATUSES)[number];
export type RoleScopeType = (typeof ROLE_SCOPE_TYPES)[number];

export interface RoleDefinition {
  readonly roleId: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly string[];
  readonly assignableByRoleCodes: readonly string[];
  readonly systemManaged: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RoleScope {
  readonly type: RoleScopeType;
  readonly id?: string;
  readonly countryCode?: string;
}

export interface RoleAssignment {
  readonly assignmentId: string;
  readonly actorId: string;
  readonly actorType: string;
  readonly roleId: string;
  readonly scope: RoleScope;
  readonly status: RoleAssignmentStatus;
  readonly validFrom: string;
  readonly validUntil?: string;
  readonly assignedByActorId: string;
  readonly reason?: string;
  readonly createdAt: string;
  readonly revokedAt?: string;
  readonly revokedByActorId?: string;
}

export interface AssignRoleCommand {
  readonly actorId: string;
  readonly actorType: string;
  readonly roleId: string;
  readonly scope: RoleScope;
  readonly validFrom?: string;
  readonly validUntil?: string;
  readonly reason?: string;
  readonly requestedByActorId: string;
}

export interface RevokeRoleAssignmentCommand {
  readonly assignmentId: string;
  readonly reason: string;
  readonly requestedByActorId: string;
}

export function isRoleAssignmentStatus(
  value: string,
): value is RoleAssignmentStatus {
  return ROLE_ASSIGNMENT_STATUSES.includes(value as RoleAssignmentStatus);
}

export function isRoleScopeType(value: string): value is RoleScopeType {
  return ROLE_SCOPE_TYPES.includes(value as RoleScopeType);
}

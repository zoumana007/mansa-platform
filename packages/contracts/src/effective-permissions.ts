import type { ActorType } from './authorization.js';
import {
  REFERENCE_ROLES,
  type Permission,
  type ReferenceRole,
} from './permission-catalog.js';
import type { RoleAssignment, RoleScopeType } from './role-assignment.js';
import {
  getReferenceRoleProfile,
  roleProfileAllowsActorType,
  roleProfileAllowsScope,
} from './role-profiles.js';

export interface EffectivePermissionScope {
  readonly type: RoleScopeType;
  readonly id?: string;
}

export interface EffectivePermissionGrant {
  readonly permission: Permission;
  readonly role: ReferenceRole;
  readonly assignmentId: string;
  readonly scope: EffectivePermissionScope;
}

export interface EffectivePermissionSet {
  readonly actorId: string;
  readonly actorType: ActorType;
  readonly grants: readonly EffectivePermissionGrant[];
  readonly permissions: readonly Permission[];
}

export function resolveEffectivePermissions(
  actorId: string,
  actorType: ActorType,
  assignments: readonly RoleAssignment[],
  now: Date = new Date(),
): EffectivePermissionSet {
  const grants: EffectivePermissionGrant[] = [];

  for (const assignment of assignments) {
    if (assignment.actorId !== actorId || assignment.status !== 'ACTIVE') continue;
    if (new Date(assignment.validFrom).getTime() > now.getTime()) continue;
    if (assignment.validUntil && new Date(assignment.validUntil).getTime() <= now.getTime()) continue;
    if (!isReferenceRole(assignment.roleId)) continue;
    if (!roleProfileAllowsActorType(assignment.roleId, actorType)) continue;
    if (!roleProfileAllowsScope(assignment.roleId, assignment.scope.type)) continue;

    for (const permission of getReferenceRoleProfile(assignment.roleId).permissions) {
      grants.push({
        permission,
        role: assignment.roleId,
        assignmentId: assignment.assignmentId,
        scope: assignment.scope,
      });
    }
  }

  const permissions = [...new Set(grants.map((grant) => grant.permission))].sort();
  return { actorId, actorType, grants, permissions };
}

export function hasEffectivePermission(
  permissionSet: EffectivePermissionSet,
  permission: Permission,
  scope?: EffectivePermissionScope,
): boolean {
  return permissionSet.grants.some((grant) => {
    if (grant.permission !== permission) return false;
    if (!scope) return true;
    if (grant.scope.type === 'PLATFORM') return true;
    return grant.scope.type === scope.type && grant.scope.id === scope.id;
  });
}

function isReferenceRole(value: string): value is ReferenceRole {
  return REFERENCE_ROLES.includes(value as ReferenceRole);
}

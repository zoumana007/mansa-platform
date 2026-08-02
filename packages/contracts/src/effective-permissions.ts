import type { ActorType } from './authorization.js';
import type { Permission, ReferenceRole } from './permission-catalog.js';
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
    if (assignment.expiresAt && assignment.expiresAt.getTime() <= now.getTime()) continue;
    if (!roleProfileAllowsActorType(assignment.role, actorType)) continue;
    if (!roleProfileAllowsScope(assignment.role, assignment.scope.type)) continue;

    for (const permission of getReferenceRoleProfile(assignment.role).permissions) {
      grants.push({
        permission,
        role: assignment.role,
        assignmentId: assignment.id,
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

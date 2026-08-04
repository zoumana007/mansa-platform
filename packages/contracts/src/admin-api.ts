import type { ApiErrorResponse, ApiSuccessResponse } from './api-response.js';
import type { AuthorizationDecision } from './authorization.js';

export const ADMIN_API_PREFIX = '/v1/admin' as const;

export const ADMIN_API_ROUTES = {
  evaluateAuthorization: `${ADMIN_API_PREFIX}/authorization/evaluate`,
  listEffectivePermissions: `${ADMIN_API_PREFIX}/actors/:actorId/effective-permissions`,
  assignRole: `${ADMIN_API_PREFIX}/actors/:actorId/roles`,
  revokeRole: `${ADMIN_API_PREFIX}/actors/:actorId/roles/:roleId`,
  listAuditEvents: `${ADMIN_API_PREFIX}/audit-events`,
  suspendActor: `${ADMIN_API_PREFIX}/actors/:actorId/suspension`,
  restoreActor: `${ADMIN_API_PREFIX}/actors/:actorId/restoration`,
} as const;

export const ADMIN_API_METHODS = {
  evaluateAuthorization: 'POST',
  listEffectivePermissions: 'GET',
  assignRole: 'POST',
  revokeRole: 'DELETE',
  listAuditEvents: 'GET',
  suspendActor: 'POST',
  restoreActor: 'POST',
} as const;

export interface EvaluateAuthorizationRequest {
  readonly actorId: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly authenticationLevel:
    | 'ANONYMOUS'
    | 'PRIMARY_FACTOR'
    | 'MULTI_FACTOR'
    | 'HARDWARE_BOUND';
  readonly correlationId: string;
  readonly amountMinor?: string;
  readonly currency?: string;
}

export type EvaluateAuthorizationResponse = ApiSuccessResponse<AuthorizationDecision>;

export interface EffectivePermissionItem {
  readonly permission: string;
  readonly sourceType: 'ROLE' | 'DIRECT' | 'POLICY';
  readonly sourceId: string;
  readonly scope?: string;
  readonly validUntil?: string;
}

export interface EffectivePermissionsData {
  readonly actorId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly EffectivePermissionItem[];
  readonly evaluatedAt: string;
}

export type EffectivePermissionsResponse = ApiSuccessResponse<EffectivePermissionsData>;

export interface AssignRoleRequest {
  readonly roleId: string;
  readonly scope?: string;
  readonly validUntil?: string;
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface RoleAssignmentData {
  readonly assignmentId: string;
  readonly actorId: string;
  readonly roleId: string;
  readonly scope?: string;
  readonly validUntil?: string;
  readonly status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export type AssignRoleResponse = ApiSuccessResponse<RoleAssignmentData>;

export interface RevokeRoleRequest {
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface AuditEventListItem {
  readonly eventId: string;
  readonly occurredAt: string;
  readonly actorId: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly outcome: 'SUCCEEDED' | 'DENIED' | 'FAILED';
  readonly correlationId: string;
}

export interface AuditEventListData {
  readonly items: readonly AuditEventListItem[];
  readonly nextCursor?: string;
}

export type AuditEventListResponse = ApiSuccessResponse<AuditEventListData>;

export interface ActorStatusCommandRequest {
  readonly reasonCode: string;
  readonly comment?: string;
  readonly idempotencyKey: string;
}

export interface ActorStatusData {
  readonly actorId: string;
  readonly status: 'ACTIVE' | 'SUSPENDED';
  readonly changedAt: string;
  readonly changedBy: string;
}

export type ActorStatusResponse = ApiSuccessResponse<ActorStatusData>;
export type AdminApiErrorResponse = ApiErrorResponse;

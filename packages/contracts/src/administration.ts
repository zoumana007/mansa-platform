export const ADMIN_ENVIRONMENTS = ['DEMO', 'STAGING', 'PRODUCTION'] as const;
export type AdminEnvironment = (typeof ADMIN_ENVIRONMENTS)[number];

export const ADMIN_SCOPES = [
  'GLOBAL',
  'COUNTRY',
  'ORGANIZATION',
  'PARTNER',
  'PRODUCT',
] as const;
export type AdminScope = (typeof ADMIN_SCOPES)[number];

export const APPROVAL_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'EXECUTED',
  'FAILED',
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const ADMIN_ACTION_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type AdminActionRiskLevel = (typeof ADMIN_ACTION_RISK_LEVELS)[number];

export type AdminPermission = `${string}.${string}`;

export interface AdminRole {
  id: string;
  code: string;
  name: string;
  permissions: readonly AdminPermission[];
  scope: AdminScope;
  countryCodes?: readonly string[];
  organizationIds?: readonly string[];
  environments: readonly AdminEnvironment[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminActor {
  userId: string;
  roleIds: readonly string[];
  countryCodes: readonly string[];
  organizationIds: readonly string[];
  environment: AdminEnvironment;
}

export interface ApprovalRequest<TPayload = unknown> {
  id: string;
  action: AdminPermission;
  resourceType: string;
  resourceId: string;
  payload: TPayload;
  justification: string;
  riskLevel: AdminActionRiskLevel;
  requesterUserId: string;
  approverUserId?: string;
  status: ApprovalStatus;
  expiresAt: string;
  createdAt: string;
  decidedAt?: string;
  executedAt?: string;
  failureReason?: string;
}

export interface CreateApprovalRequestCommand<TPayload = unknown> {
  action: AdminPermission;
  resourceType: string;
  resourceId: string;
  payload: TPayload;
  justification: string;
  riskLevel: AdminActionRiskLevel;
  expiresAt: string;
}

export interface DecideApprovalRequestCommand {
  approvalRequestId: string;
  decision: 'APPROVE' | 'REJECT';
  reason: string;
}

export interface FeatureFlagTargeting {
  countryCodes?: readonly string[];
  organizationIds?: readonly string[];
  userIds?: readonly string[];
  minimumAppVersion?: string;
  rolloutPercentage?: number;
}

export interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  environment: AdminEnvironment;
  targeting: FeatureFlagTargeting;
  ownerTeam: string;
  validFrom?: string;
  validUntil?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface UpdateFeatureFlagCommand {
  key: string;
  enabled: boolean;
  environment: AdminEnvironment;
  targeting: FeatureFlagTargeting;
  justification: string;
  approvalRequestId?: string;
}

export function isAdminEnvironment(value: string): value is AdminEnvironment {
  return ADMIN_ENVIRONMENTS.includes(value as AdminEnvironment);
}

export function isAdminScope(value: string): value is AdminScope {
  return ADMIN_SCOPES.includes(value as AdminScope);
}

export function isApprovalStatus(value: string): value is ApprovalStatus {
  return APPROVAL_STATUSES.includes(value as ApprovalStatus);
}

export function isAdminActionRiskLevel(value: string): value is AdminActionRiskLevel {
  return ADMIN_ACTION_RISK_LEVELS.includes(value as AdminActionRiskLevel);
}

export function isValidRolloutPercentage(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

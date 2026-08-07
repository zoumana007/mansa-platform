import type { PageRequest, PageResponse } from './pagination.js';
import type {
  AdminEnvironment,
  AdminRole,
  ApprovalRequest,
  ApprovalStatus,
  CreateApprovalRequestCommand,
  DecideApprovalRequestCommand,
  FeatureFlag,
  UpdateFeatureFlagCommand,
} from './administration.js';

export const ADMINISTRATION_API_ROUTES = {
  listRoles: '/v1/admin/roles',
  listFeatureFlags: '/v1/admin/feature-flags',
  getFeatureFlag: '/v1/admin/feature-flags/:featureFlagId',
  updateFeatureFlag: '/v1/admin/feature-flags/:featureFlagId',
  createApprovalRequest: '/v1/admin/approval-requests',
  listApprovalRequests: '/v1/admin/approval-requests',
  getApprovalRequest: '/v1/admin/approval-requests/:approvalRequestId',
  decideApprovalRequest: '/v1/admin/approval-requests/:approvalRequestId/decision',
} as const;

export const ADMINISTRATION_API_METHODS = {
  listRoles: 'GET',
  listFeatureFlags: 'GET',
  getFeatureFlag: 'GET',
  updateFeatureFlag: 'PATCH',
  createApprovalRequest: 'POST',
  listApprovalRequests: 'GET',
  getApprovalRequest: 'GET',
  decideApprovalRequest: 'POST',
} as const;

export type AdministrationApiRouteName = keyof typeof ADMINISTRATION_API_ROUTES;

export interface ListAdminRolesQuery extends PageRequest {
  readonly environment?: AdminEnvironment;
  readonly active?: boolean;
}

export interface ListFeatureFlagsQuery extends PageRequest {
  readonly environment?: AdminEnvironment;
  readonly enabled?: boolean;
  readonly search?: string;
}

export interface ListApprovalRequestsQuery extends PageRequest {
  readonly status?: ApprovalStatus;
  readonly requesterId?: string;
  readonly approverId?: string;
  readonly resourceType?: string;
  readonly createdFrom?: string;
  readonly createdTo?: string;
}

export interface AdministrationApiContract {
  readonly listRoles: {
    readonly method: typeof ADMINISTRATION_API_METHODS.listRoles;
    readonly path: typeof ADMINISTRATION_API_ROUTES.listRoles;
    readonly request: ListAdminRolesQuery;
    readonly response: PageResponse<AdminRole>;
  };
  readonly listFeatureFlags: {
    readonly method: typeof ADMINISTRATION_API_METHODS.listFeatureFlags;
    readonly path: typeof ADMINISTRATION_API_ROUTES.listFeatureFlags;
    readonly request: ListFeatureFlagsQuery;
    readonly response: PageResponse<FeatureFlag>;
  };
  readonly getFeatureFlag: {
    readonly method: typeof ADMINISTRATION_API_METHODS.getFeatureFlag;
    readonly path: typeof ADMINISTRATION_API_ROUTES.getFeatureFlag;
    readonly request: { readonly featureFlagId: string };
    readonly response: FeatureFlag;
  };
  readonly updateFeatureFlag: {
    readonly method: typeof ADMINISTRATION_API_METHODS.updateFeatureFlag;
    readonly path: typeof ADMINISTRATION_API_ROUTES.updateFeatureFlag;
    readonly request: UpdateFeatureFlagCommand & { readonly idempotencyKey: string };
    readonly response: FeatureFlag;
  };
  readonly createApprovalRequest: {
    readonly method: typeof ADMINISTRATION_API_METHODS.createApprovalRequest;
    readonly path: typeof ADMINISTRATION_API_ROUTES.createApprovalRequest;
    readonly request: CreateApprovalRequestCommand & { readonly idempotencyKey: string };
    readonly response: ApprovalRequest;
  };
  readonly listApprovalRequests: {
    readonly method: typeof ADMINISTRATION_API_METHODS.listApprovalRequests;
    readonly path: typeof ADMINISTRATION_API_ROUTES.listApprovalRequests;
    readonly request: ListApprovalRequestsQuery;
    readonly response: PageResponse<ApprovalRequest>;
  };
  readonly getApprovalRequest: {
    readonly method: typeof ADMINISTRATION_API_METHODS.getApprovalRequest;
    readonly path: typeof ADMINISTRATION_API_ROUTES.getApprovalRequest;
    readonly request: { readonly approvalRequestId: string };
    readonly response: ApprovalRequest;
  };
  readonly decideApprovalRequest: {
    readonly method: typeof ADMINISTRATION_API_METHODS.decideApprovalRequest;
    readonly path: typeof ADMINISTRATION_API_ROUTES.decideApprovalRequest;
    readonly request: DecideApprovalRequestCommand & { readonly idempotencyKey: string };
    readonly response: ApprovalRequest;
  };
}

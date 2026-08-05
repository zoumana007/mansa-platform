import type { PageRequest, PageResponse } from './pagination.js';
import type {
  CreateMerchantCommand,
  CreateMerchantLocationCommand,
  InviteMerchantMemberCommand,
  Merchant,
  MerchantDashboardSummary,
  MerchantLocation,
  MerchantMember,
  MerchantMemberRole,
  MerchantMemberStatus,
  MerchantStatus,
  Settlement,
  SettlementStatus,
} from './merchant.js';

export const MERCHANT_API_ROUTES = {
  createMerchant: '/v1/merchants',
  listMerchants: '/v1/merchants',
  getMerchant: '/v1/merchants/:merchantId',
  createLocation: '/v1/merchants/:merchantId/locations',
  listLocations: '/v1/merchants/:merchantId/locations',
  inviteMember: '/v1/merchants/:merchantId/members',
  listMembers: '/v1/merchants/:merchantId/members',
  listSettlements: '/v1/merchants/:merchantId/settlements',
  getDashboard: '/v1/merchants/:merchantId/dashboard',
} as const;

export const MERCHANT_API_METHODS = {
  createMerchant: 'POST',
  listMerchants: 'GET',
  getMerchant: 'GET',
  createLocation: 'POST',
  listLocations: 'GET',
  inviteMember: 'POST',
  listMembers: 'GET',
  listSettlements: 'GET',
  getDashboard: 'GET',
} as const;

export type MerchantApiRouteName = keyof typeof MERCHANT_API_ROUTES;

export interface ListMerchantsQuery extends PageRequest {
  readonly ownerUserId?: string;
  readonly countryCode?: string;
  readonly status?: MerchantStatus;
}

export interface ListMerchantLocationsQuery extends PageRequest {
  readonly merchantId: string;
  readonly isActive?: boolean;
}

export interface ListMerchantMembersQuery extends PageRequest {
  readonly merchantId: string;
  readonly role?: MerchantMemberRole;
  readonly status?: MerchantMemberStatus;
  readonly locationId?: string;
}

export interface ListSettlementsQuery extends PageRequest {
  readonly merchantId: string;
  readonly status?: SettlementStatus;
  readonly periodStart?: string;
  readonly periodEnd?: string;
}

export interface MerchantDashboardQuery {
  readonly merchantId: string;
  readonly locationId?: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

export interface MerchantApiContract {
  readonly createMerchant: {
    readonly method: typeof MERCHANT_API_METHODS.createMerchant;
    readonly path: typeof MERCHANT_API_ROUTES.createMerchant;
    readonly request: CreateMerchantCommand & { readonly idempotencyKey: string };
    readonly response: Merchant;
  };
  readonly listMerchants: {
    readonly method: typeof MERCHANT_API_METHODS.listMerchants;
    readonly path: typeof MERCHANT_API_ROUTES.listMerchants;
    readonly request: ListMerchantsQuery;
    readonly response: PageResponse<Merchant>;
  };
  readonly getMerchant: {
    readonly method: typeof MERCHANT_API_METHODS.getMerchant;
    readonly path: typeof MERCHANT_API_ROUTES.getMerchant;
    readonly request: { readonly merchantId: string };
    readonly response: Merchant;
  };
  readonly createLocation: {
    readonly method: typeof MERCHANT_API_METHODS.createLocation;
    readonly path: typeof MERCHANT_API_ROUTES.createLocation;
    readonly request: CreateMerchantLocationCommand & { readonly idempotencyKey: string };
    readonly response: MerchantLocation;
  };
  readonly listLocations: {
    readonly method: typeof MERCHANT_API_METHODS.listLocations;
    readonly path: typeof MERCHANT_API_ROUTES.listLocations;
    readonly request: ListMerchantLocationsQuery;
    readonly response: PageResponse<MerchantLocation>;
  };
  readonly inviteMember: {
    readonly method: typeof MERCHANT_API_METHODS.inviteMember;
    readonly path: typeof MERCHANT_API_ROUTES.inviteMember;
    readonly request: InviteMerchantMemberCommand & { readonly idempotencyKey: string };
    readonly response: MerchantMember;
  };
  readonly listMembers: {
    readonly method: typeof MERCHANT_API_METHODS.listMembers;
    readonly path: typeof MERCHANT_API_ROUTES.listMembers;
    readonly request: ListMerchantMembersQuery;
    readonly response: PageResponse<MerchantMember>;
  };
  readonly listSettlements: {
    readonly method: typeof MERCHANT_API_METHODS.listSettlements;
    readonly path: typeof MERCHANT_API_ROUTES.listSettlements;
    readonly request: ListSettlementsQuery;
    readonly response: PageResponse<Settlement>;
  };
  readonly getDashboard: {
    readonly method: typeof MERCHANT_API_METHODS.getDashboard;
    readonly path: typeof MERCHANT_API_ROUTES.getDashboard;
    readonly request: MerchantDashboardQuery;
    readonly response: MerchantDashboardSummary;
  };
}

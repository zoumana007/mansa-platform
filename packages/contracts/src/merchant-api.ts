import type {
  CreateMerchantCommand,
  CreateMerchantLocationCommand,
  InviteMerchantMemberCommand,
  Merchant,
  MerchantDashboardSummary,
  MerchantLocation,
  MerchantMember,
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
  getDashboard: '/v1/merchants/:merchantId/dashboard',
  listSettlements: '/v1/merchants/:merchantId/settlements',
} as const;

export type MerchantApiRouteName = keyof typeof MERCHANT_API_ROUTES;

export interface ListMerchantsQuery {
  readonly status?: MerchantStatus;
  readonly countryCode?: string;
}

export interface ListMerchantLocationsQuery {
  readonly isActive?: boolean;
}

export interface ListMerchantMembersQuery {
  readonly locationId?: string;
}

export interface MerchantDashboardQuery {
  readonly locationId?: string;
  readonly periodStart: string;
  readonly periodEnd: string;
}

export interface ListSettlementsQuery {
  readonly status?: SettlementStatus;
  readonly periodStart?: string;
  readonly periodEnd?: string;
}

export interface MerchantApiContract {
  readonly createMerchant: {
    readonly method: 'POST';
    readonly request: CreateMerchantCommand;
    readonly response: Merchant;
  };
  readonly listMerchants: {
    readonly method: 'GET';
    readonly request: ListMerchantsQuery;
    readonly response: readonly Merchant[];
  };
  readonly getMerchant: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: Merchant;
  };
  readonly createLocation: {
    readonly method: 'POST';
    readonly request: CreateMerchantLocationCommand;
    readonly response: MerchantLocation;
  };
  readonly listLocations: {
    readonly method: 'GET';
    readonly request: ListMerchantLocationsQuery;
    readonly response: readonly MerchantLocation[];
  };
  readonly inviteMember: {
    readonly method: 'POST';
    readonly request: InviteMerchantMemberCommand;
    readonly response: MerchantMember;
  };
  readonly listMembers: {
    readonly method: 'GET';
    readonly request: ListMerchantMembersQuery;
    readonly response: readonly MerchantMember[];
  };
  readonly getDashboard: {
    readonly method: 'GET';
    readonly request: MerchantDashboardQuery;
    readonly response: MerchantDashboardSummary;
  };
  readonly listSettlements: {
    readonly method: 'GET';
    readonly request: ListSettlementsQuery;
    readonly response: readonly Settlement[];
  };
}

export const MERCHANT_API_METHODS: Readonly<
  Record<MerchantApiRouteName, MerchantApiContract[MerchantApiRouteName]['method']>
> = {
  createMerchant: 'POST',
  listMerchants: 'GET',
  getMerchant: 'GET',
  createLocation: 'POST',
  listLocations: 'GET',
  inviteMember: 'POST',
  listMembers: 'GET',
  getDashboard: 'GET',
  listSettlements: 'GET',
};

import type {
  AccessCredential,
  AccessDecision,
  AccessEntitlement,
  AccessRequest,
  AccessServiceAvailability,
  AccessTerminalDisplayState,
  RecordAccessUsageCommand,
} from './access-mobility.js';

export const ACCESS_MOBILITY_API_ROUTES = {
  createCredential: '/v1/access/credentials',
  getCredential: '/v1/access/credentials/:credentialId',
  listCredentials: '/v1/access/credentials',
  createEntitlement: '/v1/access/entitlements',
  getEntitlement: '/v1/access/entitlements/:entitlementId',
  listEntitlements: '/v1/access/entitlements',
  evaluateAccess: '/v1/access/evaluate',
  recordUsage: '/v1/access/usages',
  getServiceAvailability: '/v1/access/locations/:locationId/availability',
  updateServiceAvailability: '/v1/access/locations/:locationId/availability',
  getTerminalDisplayState: '/v1/access/terminals/:terminalId/display-state',
} as const;

export const ACCESS_MOBILITY_API_METHODS = {
  createCredential: 'POST',
  getCredential: 'GET',
  listCredentials: 'GET',
  createEntitlement: 'POST',
  getEntitlement: 'GET',
  listEntitlements: 'GET',
  evaluateAccess: 'POST',
  recordUsage: 'POST',
  getServiceAvailability: 'GET',
  updateServiceAvailability: 'PUT',
  getTerminalDisplayState: 'GET',
} as const;

export type AccessMobilityApiRouteName = keyof typeof ACCESS_MOBILITY_API_ROUTES;

export interface ListAccessCredentialsQuery {
  readonly organizationId: string;
  readonly subjectId?: string;
  readonly status?: string;
  readonly credentialType?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface ListAccessEntitlementsQuery {
  readonly organizationId: string;
  readonly subjectId?: string;
  readonly useCase?: string;
  readonly status?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface CreateAccessCredentialCommand {
  readonly credential: AccessCredential;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface CreateAccessEntitlementCommand {
  readonly entitlement: AccessEntitlement;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface UpdateAccessServiceAvailabilityCommand {
  readonly availability: AccessServiceAvailability;
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface AccessMobilityApiContract {
  readonly createCredential: {
    readonly request: CreateAccessCredentialCommand;
    readonly response: AccessCredential;
  };
  readonly getCredential: {
    readonly response: AccessCredential;
  };
  readonly listCredentials: {
    readonly query: ListAccessCredentialsQuery;
    readonly response: readonly AccessCredential[];
  };
  readonly createEntitlement: {
    readonly request: CreateAccessEntitlementCommand;
    readonly response: AccessEntitlement;
  };
  readonly getEntitlement: {
    readonly response: AccessEntitlement;
  };
  readonly listEntitlements: {
    readonly query: ListAccessEntitlementsQuery;
    readonly response: readonly AccessEntitlement[];
  };
  readonly evaluateAccess: {
    readonly request: AccessRequest;
    readonly response: AccessDecision;
  };
  readonly recordUsage: {
    readonly request: RecordAccessUsageCommand;
    readonly response: { readonly recorded: true };
  };
  readonly getServiceAvailability: {
    readonly response: AccessServiceAvailability;
  };
  readonly updateServiceAvailability: {
    readonly request: UpdateAccessServiceAvailabilityCommand;
    readonly response: AccessServiceAvailability;
  };
  readonly getTerminalDisplayState: {
    readonly response: AccessTerminalDisplayState;
  };
}

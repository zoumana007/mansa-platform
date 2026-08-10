import type {
  AccessCashValidationEvent,
  AccessCredential,
  AccessCredentialStatus,
  AccessDecision,
  AccessEntitlement,
  AccessEntitlementStatus,
  AccessRequest,
  AccessServiceAvailability,
  AccessTerminalDisplayState,
  AccessTerminalProfile,
  RecordAccessUsageCommand,
} from './access-mobility.js';

export const ACCESS_MOBILITY_API_ROUTES = {
  createCredential: '/v1/internal/access/credentials',
  getCredential: '/v1/internal/access/credentials/:credentialId',
  listCredentials: '/v1/internal/access/credentials',
  updateCredentialStatus: '/v1/internal/access/credentials/:credentialId/status',
  createEntitlement: '/v1/internal/access/entitlements',
  getEntitlement: '/v1/internal/access/entitlements/:entitlementId',
  listEntitlements: '/v1/internal/access/entitlements',
  updateEntitlementStatus: '/v1/internal/access/entitlements/:entitlementId/status',
  evaluateAccess: '/v1/internal/access/evaluate',
  recordUsage: '/v1/internal/access/usages',
  getServiceAvailability: '/v1/internal/access/locations/:locationId/availability',
  updateServiceAvailability: '/v1/internal/access/locations/:locationId/availability',
  getTerminalProfile: '/v1/internal/access/terminals/:terminalId/profile',
  getTerminalDisplayState: '/v1/internal/access/terminals/:terminalId/display-state',
  recordCashValidation: '/v1/internal/access/terminals/:terminalId/cash-validations',
} as const;

export const ACCESS_MOBILITY_API_METHODS = {
  createCredential: 'POST',
  getCredential: 'GET',
  listCredentials: 'GET',
  updateCredentialStatus: 'PATCH',
  createEntitlement: 'POST',
  getEntitlement: 'GET',
  listEntitlements: 'GET',
  updateEntitlementStatus: 'PATCH',
  evaluateAccess: 'POST',
  recordUsage: 'POST',
  getServiceAvailability: 'GET',
  updateServiceAvailability: 'PUT',
  getTerminalProfile: 'GET',
  getTerminalDisplayState: 'GET',
  recordCashValidation: 'POST',
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

export interface UpdateAccessCredentialStatusCommand {
  readonly organizationId: string;
  readonly credentialId: string;
  readonly targetStatus: AccessCredentialStatus;
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface CreateAccessEntitlementCommand {
  readonly entitlement: AccessEntitlement;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface UpdateAccessEntitlementStatusCommand {
  readonly organizationId: string;
  readonly entitlementId: string;
  readonly targetStatus: AccessEntitlementStatus;
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface UpdateAccessServiceAvailabilityCommand {
  readonly availability: AccessServiceAvailability;
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface RecordAccessCashValidationCommand {
  readonly event: AccessCashValidationEvent;
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
  readonly updateCredentialStatus: {
    readonly request: UpdateAccessCredentialStatusCommand;
    readonly response: AccessCredential;
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
  readonly updateEntitlementStatus: {
    readonly request: UpdateAccessEntitlementStatusCommand;
    readonly response: AccessEntitlement;
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
  readonly getTerminalProfile: {
    readonly response: AccessTerminalProfile;
  };
  readonly getTerminalDisplayState: {
    readonly response: AccessTerminalDisplayState;
  };
  readonly recordCashValidation: {
    readonly request: RecordAccessCashValidationCommand;
    readonly response: { readonly recorded: true };
  };
}

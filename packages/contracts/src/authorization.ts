export const ACTOR_TYPES = [
  'USER',
  'MERCHANT_MEMBER',
  'PUBLIC_AGENT',
  'ADMIN',
  'SERVICE',
] as const;

export const AUTHENTICATION_LEVELS = [
  'ANONYMOUS',
  'PRIMARY_FACTOR',
  'MULTI_FACTOR',
  'HARDWARE_BOUND',
] as const;

export type ActorType = (typeof ACTOR_TYPES)[number];
export type AuthenticationLevel = (typeof AUTHENTICATION_LEVELS)[number];

export interface AuthorizationActor {
  readonly actorId: string;
  readonly actorType: ActorType;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly organizationId?: string;
  readonly merchantId?: string;
  readonly locationId?: string;
  readonly countryCode?: string;
}

export interface AuthorizationResource {
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly organizationId?: string;
  readonly merchantId?: string;
  readonly locationId?: string;
  readonly countryCode?: string;
  readonly environment?: 'DEMO' | 'STAGING' | 'PRODUCTION';
}

export interface AuthorizationContext {
  readonly actor: AuthorizationActor;
  readonly action: string;
  readonly resource: AuthorizationResource;
  readonly authenticationLevel: AuthenticationLevel;
  readonly correlationId: string;
  readonly amountMinor?: bigint;
  readonly currency?: string;
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly reasonCode: string;
  readonly obligations: readonly string[];
  readonly evaluatedPolicyIds: readonly string[];
}

export function isActorType(value: string): value is ActorType {
  return ACTOR_TYPES.includes(value as ActorType);
}

export function isAuthenticationLevel(
  value: string,
): value is AuthenticationLevel {
  return AUTHENTICATION_LEVELS.includes(value as AuthenticationLevel);
}

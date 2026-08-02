export const AUTHORIZATION_DECISION_REASON_CODES = [
  'ALLOWED_BY_POLICY',
  'ALLOWED_BY_ROLE',
  'DENIED_BY_POLICY',
  'DENIED_MISSING_PERMISSION',
  'DENIED_ACTOR_TYPE',
  'DENIED_SCOPE',
  'DENIED_AUTHENTICATION_LEVEL',
  'DENIED_RESOURCE_STATE',
  'DENIED_AMOUNT_LIMIT',
  'DENIED_ENVIRONMENT',
  'DENIED_POLICY_NOT_FOUND',
  'DENIED_POLICY_INACTIVE',
  'DENIED_DEFAULT',
] as const;

export const AUTHORIZATION_OBLIGATIONS = [
  'REQUIRE_MULTI_FACTOR',
  'REQUIRE_HARDWARE_BOUND_AUTHENTICATION',
  'REQUIRE_STEP_UP_AUTHENTICATION',
  'REQUIRE_DUAL_APPROVAL',
  'REQUIRE_FRESH_KYC',
  'REQUIRE_RISK_REVIEW',
  'REQUIRE_AUDIT_EVENT',
  'REDACT_SENSITIVE_FIELDS',
  'LIMIT_TO_OWN_RESOURCES',
  'LIMIT_TO_ASSIGNED_SCOPE',
  'BLOCK_EXPORT',
] as const;

export type AuthorizationDecisionReasonCode =
  (typeof AUTHORIZATION_DECISION_REASON_CODES)[number];

export type AuthorizationObligation =
  (typeof AUTHORIZATION_OBLIGATIONS)[number];

export interface TypedAuthorizationDecision {
  readonly allowed: boolean;
  readonly reasonCode: AuthorizationDecisionReasonCode;
  readonly obligations: readonly AuthorizationObligation[];
  readonly evaluatedPolicyIds: readonly string[];
}

export function isAuthorizationDecisionReasonCode(
  value: string,
): value is AuthorizationDecisionReasonCode {
  return AUTHORIZATION_DECISION_REASON_CODES.includes(
    value as AuthorizationDecisionReasonCode,
  );
}

export function isAuthorizationObligation(
  value: string,
): value is AuthorizationObligation {
  return AUTHORIZATION_OBLIGATIONS.includes(value as AuthorizationObligation);
}

export function createDeniedAuthorizationDecision(
  reasonCode: Exclude<AuthorizationDecisionReasonCode, 'ALLOWED_BY_POLICY' | 'ALLOWED_BY_ROLE'>,
  obligations: readonly AuthorizationObligation[] = ['REQUIRE_AUDIT_EVENT'],
  evaluatedPolicyIds: readonly string[] = [],
): TypedAuthorizationDecision {
  return {
    allowed: false,
    reasonCode,
    obligations,
    evaluatedPolicyIds,
  };
}

export function createAllowedAuthorizationDecision(
  reasonCode: 'ALLOWED_BY_POLICY' | 'ALLOWED_BY_ROLE',
  obligations: readonly AuthorizationObligation[] = ['REQUIRE_AUDIT_EVENT'],
  evaluatedPolicyIds: readonly string[] = [],
): TypedAuthorizationDecision {
  return {
    allowed: true,
    reasonCode,
    obligations,
    evaluatedPolicyIds,
  };
}

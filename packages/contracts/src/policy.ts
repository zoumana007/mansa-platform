import type {
  AuthenticationLevel,
  AuthorizationContext,
  AuthorizationDecision,
} from './authorization.js';

export const POLICY_EFFECTS = ['ALLOW', 'DENY'] as const;
export const POLICY_STATUSES = ['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED'] as const;
export const POLICY_CONDITION_OPERATORS = [
  'EQUALS',
  'NOT_EQUALS',
  'IN',
  'NOT_IN',
  'GREATER_THAN',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN',
  'LESS_THAN_OR_EQUAL',
  'EXISTS',
] as const;

export type PolicyEffect = (typeof POLICY_EFFECTS)[number];
export type PolicyStatus = (typeof POLICY_STATUSES)[number];
export type PolicyConditionOperator =
  (typeof POLICY_CONDITION_OPERATORS)[number];

export interface PolicyCondition {
  readonly attribute: string;
  readonly operator: PolicyConditionOperator;
  readonly value?: string | number | boolean | readonly string[];
}

export interface AuthorizationPolicy {
  readonly policyId: string;
  readonly code: string;
  readonly version: number;
  readonly description: string;
  readonly effect: PolicyEffect;
  readonly status: PolicyStatus;
  readonly actions: readonly string[];
  readonly resourceTypes: readonly string[];
  readonly requiredAuthenticationLevel?: AuthenticationLevel;
  readonly conditions: readonly PolicyCondition[];
  readonly obligations: readonly string[];
  readonly priority: number;
  readonly createdAt: string;
  readonly activatedAt?: string;
}

export interface EvaluateAuthorizationCommand {
  readonly context: AuthorizationContext;
  readonly policyVersion?: string;
}

export interface PolicyEvaluationTrace {
  readonly policyId: string;
  readonly matched: boolean;
  readonly effect?: PolicyEffect;
  readonly reasonCode: string;
}

export interface AuthorizationEvaluationResult {
  readonly decision: AuthorizationDecision;
  readonly evaluatedAt: string;
  readonly policyVersion: string;
  readonly trace: readonly PolicyEvaluationTrace[];
}

export function isPolicyEffect(value: string): value is PolicyEffect {
  return POLICY_EFFECTS.includes(value as PolicyEffect);
}

export function isPolicyStatus(value: string): value is PolicyStatus {
  return POLICY_STATUSES.includes(value as PolicyStatus);
}

export function isPolicyConditionOperator(
  value: string,
): value is PolicyConditionOperator {
  return POLICY_CONDITION_OPERATORS.includes(value as PolicyConditionOperator);
}

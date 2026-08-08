import type { Money } from './money.js';

export const ACCESS_CREDENTIAL_TYPES = [
  'NFC_CARD',
  'RFID_UHF_TAG',
  'QR_CODE',
  'LICENSE_PLATE',
  'DEVICE_TOKEN',
] as const;

export const ACCESS_SUBJECT_TYPES = [
  'PERSON',
  'VEHICLE',
  'ASSET',
  'ORGANIZATION_MEMBER',
] as const;

export const ACCESS_USE_CASES = [
  'TOLL',
  'PARKING',
  'PUBLIC_TRANSPORT',
  'CAMPUS',
  'EMPLOYEE_ACCESS',
  'FUEL_FLEET',
  'CANTEEN',
  'EVENT',
  'OTHER',
] as const;

export const ACCESS_CREDENTIAL_STATUSES = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'REVOKED',
  'EXPIRED',
] as const;

export const ACCESS_ENTITLEMENT_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'CANCELLED',
] as const;

export const ACCESS_DECISIONS = ['ALLOW', 'DENY', 'REVIEW'] as const;

export const ACCESS_DECISION_REASONS = [
  'ENTITLEMENT_VALID',
  'CREDENTIAL_UNKNOWN',
  'CREDENTIAL_INACTIVE',
  'ENTITLEMENT_MISSING',
  'ENTITLEMENT_INACTIVE',
  'OUTSIDE_VALIDITY_WINDOW',
  'USAGE_LIMIT_REACHED',
  'AMOUNT_LIMIT_EXCEEDED',
  'LOCATION_NOT_ALLOWED',
  'PRODUCT_NOT_ALLOWED',
  'MANUAL_REVIEW_REQUIRED',
] as const;

export type AccessCredentialType = (typeof ACCESS_CREDENTIAL_TYPES)[number];
export type AccessSubjectType = (typeof ACCESS_SUBJECT_TYPES)[number];
export type AccessUseCase = (typeof ACCESS_USE_CASES)[number];
export type AccessCredentialStatus = (typeof ACCESS_CREDENTIAL_STATUSES)[number];
export type AccessEntitlementStatus = (typeof ACCESS_ENTITLEMENT_STATUSES)[number];
export type AccessDecisionValue = (typeof ACCESS_DECISIONS)[number];
export type AccessDecisionReason = (typeof ACCESS_DECISION_REASONS)[number];

export interface AccessCredential {
  readonly id: string;
  readonly organizationId: string;
  readonly subjectType: AccessSubjectType;
  readonly subjectId: string;
  readonly credentialType: AccessCredentialType;
  readonly publicReference: string;
  readonly status: AccessCredentialStatus;
  readonly validFrom?: string;
  readonly validUntil?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface AccessEntitlement {
  readonly id: string;
  readonly organizationId: string;
  readonly subjectId: string;
  readonly useCase: AccessUseCase;
  readonly status: AccessEntitlementStatus;
  readonly validFrom: string;
  readonly validUntil?: string;
  readonly allowedLocationIds?: readonly string[];
  readonly allowedProductCodes?: readonly string[];
  readonly maxUsesPerPeriod?: number;
  readonly period?: 'DAY' | 'WEEK' | 'MONTH';
  readonly amountLimit?: Money;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface AccessRequest {
  readonly requestId: string;
  readonly organizationId: string;
  readonly useCase: AccessUseCase;
  readonly credentialType: AccessCredentialType;
  readonly credentialReference: string;
  readonly locationId: string;
  readonly terminalId?: string;
  readonly productCode?: string;
  readonly requestedAmount?: Money;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface AccessDecision {
  readonly requestId: string;
  readonly decision: AccessDecisionValue;
  readonly reason: AccessDecisionReason;
  readonly credentialId?: string;
  readonly subjectId?: string;
  readonly entitlementId?: string;
  readonly approvedAmount?: Money;
  readonly decidedAt: string;
  readonly correlationId: string;
}

export interface RecordAccessUsageCommand {
  readonly requestId: string;
  readonly decision: AccessDecisionValue;
  readonly credentialId?: string;
  readonly subjectId?: string;
  readonly entitlementId?: string;
  readonly locationId: string;
  readonly terminalId?: string;
  readonly chargedAmount?: Money;
  readonly externalReference?: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export function isAccessCredentialType(value: string): value is AccessCredentialType {
  return ACCESS_CREDENTIAL_TYPES.includes(value as AccessCredentialType);
}

export function isAccessUseCase(value: string): value is AccessUseCase {
  return ACCESS_USE_CASES.includes(value as AccessUseCase);
}

export function isAccessCredentialStatus(value: string): value is AccessCredentialStatus {
  return ACCESS_CREDENTIAL_STATUSES.includes(value as AccessCredentialStatus);
}

export function isAccessEntitlementStatus(value: string): value is AccessEntitlementStatus {
  return ACCESS_ENTITLEMENT_STATUSES.includes(value as AccessEntitlementStatus);
}

export function isAccessDecision(value: string): value is AccessDecisionValue {
  return ACCESS_DECISIONS.includes(value as AccessDecisionValue);
}

export function isAccessDecisionReason(value: string): value is AccessDecisionReason {
  return ACCESS_DECISION_REASONS.includes(value as AccessDecisionReason);
}

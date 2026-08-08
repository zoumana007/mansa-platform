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
  'TERMINATED',
] as const;

export const ACCESS_SERVICE_STATUSES = [
  'ACTIVE',
  'SUSPENDED',
  'MAINTENANCE',
  'DEGRADED',
  'CLOSED',
  'DISABLED',
] as const;

export const ACCESS_MATCH_POLICIES = [
  'CREDENTIAL_ONLY',
  'PLATE_ONLY',
  'CREDENTIAL_AND_PLATE_REQUIRED',
  'CREDENTIAL_AND_PLATE_PREFERRED',
  'CREDENTIAL_VALID_PLATE_UNREADABLE_ALLOW_WITH_RULES',
  'CREDENTIAL_VALID_PLATE_MISMATCH_DENY',
  'MANUAL_REVIEW',
] as const;

export const ACCESS_PAYMENT_METHODS = [
  'BANK_CARD',
  'MOBILE_MONEY',
  'CASH_BILLS',
  'CASH_COINS',
  'MANSA_QR',
  'PREPAID_BALANCE',
  'POSTPAID_ACCOUNT',
  'SUBSCRIPTION',
] as const;

export const ACCESS_EQUIPMENT_TYPES = [
  'RFID_READER',
  'ANPR_CAMERA',
  'CARD_TERMINAL',
  'MOBILE_MONEY_GATEWAY',
  'CASH_ACCEPTOR',
  'COIN_ACCEPTOR',
  'QR_SCANNER',
  'BARRIER',
  'LANE_CONTROLLER',
  'VEHICLE_SENSOR',
  'RECEIPT_PRINTER',
  'DISPLAY',
  'NETWORK',
] as const;

export const ACCESS_EQUIPMENT_STATUSES = [
  'ONLINE',
  'DEGRADED',
  'OFFLINE',
  'MAINTENANCE',
  'DISABLED',
] as const;

export const ACCESS_REFUND_POLICIES = [
  'NON_REFUNDABLE',
  'PRORATA_REFUND',
  'CREDIT',
  'EXTEND_VALIDITY',
  'MANUAL_DECISION',
] as const;

export const ACCESS_OUTAGE_COMPENSATION_POLICIES = [
  'SUBSCRIPTION_CLOCK_CONTINUES',
  'PAUSE_AND_EXTEND',
  'COMPENSATE_WITH_CREDIT',
  'MANUAL_COMPENSATION',
  'NO_COMPENSATION',
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
  'PLATE_MISMATCH',
  'PLATE_UNREADABLE',
  'SERVICE_SUSPENDED',
  'SERVICE_CLOSED',
  'EQUIPMENT_FAILURE',
  'PAYMENT_METHOD_UNAVAILABLE',
  'OFFLINE_POLICY_DENIED',
  'MANUAL_REVIEW_REQUIRED',
] as const;

export type AccessCredentialType = (typeof ACCESS_CREDENTIAL_TYPES)[number];
export type AccessSubjectType = (typeof ACCESS_SUBJECT_TYPES)[number];
export type AccessUseCase = (typeof ACCESS_USE_CASES)[number];
export type AccessCredentialStatus = (typeof ACCESS_CREDENTIAL_STATUSES)[number];
export type AccessEntitlementStatus = (typeof ACCESS_ENTITLEMENT_STATUSES)[number];
export type AccessServiceStatus = (typeof ACCESS_SERVICE_STATUSES)[number];
export type AccessMatchPolicy = (typeof ACCESS_MATCH_POLICIES)[number];
export type AccessPaymentMethod = (typeof ACCESS_PAYMENT_METHODS)[number];
export type AccessEquipmentType = (typeof ACCESS_EQUIPMENT_TYPES)[number];
export type AccessEquipmentStatus = (typeof ACCESS_EQUIPMENT_STATUSES)[number];
export type AccessRefundPolicy = (typeof ACCESS_REFUND_POLICIES)[number];
export type AccessOutageCompensationPolicy = (typeof ACCESS_OUTAGE_COMPENSATION_POLICIES)[number];
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
  readonly refundPolicy?: AccessRefundPolicy;
  readonly outageCompensationPolicy?: AccessOutageCompensationPolicy;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface AccessEquipmentHealth {
  readonly equipmentId: string;
  readonly equipmentType: AccessEquipmentType;
  readonly status: AccessEquipmentStatus;
  readonly lastSeenAt?: string;
  readonly failureCode?: string;
}

export interface AccessServiceAvailability {
  readonly organizationId: string;
  readonly locationId: string;
  readonly laneId?: string;
  readonly status: AccessServiceStatus;
  readonly matchPolicy?: AccessMatchPolicy;
  readonly availablePaymentMethods: readonly AccessPaymentMethod[];
  readonly equipment: readonly AccessEquipmentHealth[];
  readonly effectiveFrom: string;
  readonly expectedRecoveryAt?: string;
  readonly alternativeLocationId?: string;
  readonly publicMessageKey?: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
}

export interface AccessTerminalDisplayState {
  readonly terminalId: string;
  readonly serviceStatus: AccessServiceStatus;
  readonly headlineKey: string;
  readonly instructionKey?: string;
  readonly availablePaymentMethods: readonly AccessPaymentMethod[];
  readonly alternativeLocationId?: string;
  readonly expectedRecoveryAt?: string;
  readonly generatedAt: string;
}

export interface AccessRequest {
  readonly requestId: string;
  readonly organizationId: string;
  readonly useCase: AccessUseCase;
  readonly credentialType: AccessCredentialType;
  readonly credentialReference: string;
  readonly secondaryCredentialType?: AccessCredentialType;
  readonly secondaryCredentialReference?: string;
  readonly observedLicensePlate?: string;
  readonly plateRecognitionConfidence?: number;
  readonly matchPolicy?: AccessMatchPolicy;
  readonly locationId: string;
  readonly terminalId?: string;
  readonly productCode?: string;
  readonly paymentMethod?: AccessPaymentMethod;
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
  readonly fallbackPaymentMethods?: readonly AccessPaymentMethod[];
  readonly alternativeLocationId?: string;
  readonly publicMessageKey?: string;
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
  readonly paymentMethod?: AccessPaymentMethod;
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

export function isAccessServiceStatus(value: string): value is AccessServiceStatus {
  return ACCESS_SERVICE_STATUSES.includes(value as AccessServiceStatus);
}

export function isAccessMatchPolicy(value: string): value is AccessMatchPolicy {
  return ACCESS_MATCH_POLICIES.includes(value as AccessMatchPolicy);
}

export function isAccessPaymentMethod(value: string): value is AccessPaymentMethod {
  return ACCESS_PAYMENT_METHODS.includes(value as AccessPaymentMethod);
}

export function isAccessEquipmentType(value: string): value is AccessEquipmentType {
  return ACCESS_EQUIPMENT_TYPES.includes(value as AccessEquipmentType);
}

export function isAccessEquipmentStatus(value: string): value is AccessEquipmentStatus {
  return ACCESS_EQUIPMENT_STATUSES.includes(value as AccessEquipmentStatus);
}

export function isAccessRefundPolicy(value: string): value is AccessRefundPolicy {
  return ACCESS_REFUND_POLICIES.includes(value as AccessRefundPolicy);
}

export function isAccessOutageCompensationPolicy(value: string): value is AccessOutageCompensationPolicy {
  return ACCESS_OUTAGE_COMPENSATION_POLICIES.includes(value as AccessOutageCompensationPolicy);
}

export function isAccessDecision(value: string): value is AccessDecisionValue {
  return ACCESS_DECISIONS.includes(value as AccessDecisionValue);
}

export function isAccessDecisionReason(value: string): value is AccessDecisionReason {
  return ACCESS_DECISION_REASONS.includes(value as AccessDecisionReason);
}

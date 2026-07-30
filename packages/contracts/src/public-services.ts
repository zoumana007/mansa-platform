import type { IdempotencyKey } from './idempotency.js';
import type { Money } from './money.js';

export const PUBLIC_ORGANIZATION_TYPES = [
  'MINISTRY',
  'AGENCY',
  'MUNICIPALITY',
  'UNIVERSITY',
  'SCHOOL',
  'PUBLIC_COMPANY',
  'OTHER',
] as const;
export type PublicOrganizationType = (typeof PUBLIC_ORGANIZATION_TYPES)[number];

export const PUBLIC_AGENT_STATUSES = ['INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED'] as const;
export type PublicAgentStatus = (typeof PUBLIC_AGENT_STATUSES)[number];

export const PUBLIC_OBLIGATION_TYPES = [
  'FINE',
  'TAX',
  'FEE',
  'TUITION',
  'REGISTRATION',
  'LICENSE',
  'OTHER',
] as const;
export type PublicObligationType = (typeof PUBLIC_OBLIGATION_TYPES)[number];

export const PUBLIC_OBLIGATION_STATUSES = [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'DISPUTED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED',
] as const;
export type PublicObligationStatus = (typeof PUBLIC_OBLIGATION_STATUSES)[number];

export const SCHOLARSHIP_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'PAYMENT_PENDING',
  'PAID',
  'PAYMENT_FAILED',
  'CANCELLED',
] as const;
export type ScholarshipStatus = (typeof SCHOLARSHIP_STATUSES)[number];

export const STUDENT_CARD_STATUSES = [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'REVOKED',
  'REPLACED',
] as const;
export type StudentCardStatus = (typeof STUDENT_CARD_STATUSES)[number];

export interface PublicOrganization {
  id: string;
  code: string;
  legalName: string;
  type: PublicOrganizationType;
  countryCode: string;
  administrativeAreaCode?: string;
  enabledServiceCodes: readonly string[];
  settlementAccountIds: readonly string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAgent {
  id: string;
  userId: string;
  organizationId: string;
  employeeNumber: string;
  unitCode?: string;
  roleCodes: readonly string[];
  jurisdictionCodes: readonly string[];
  allowedDeviceIds: readonly string[];
  status: PublicAgentStatus;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicServiceCatalogEntry {
  id: string;
  organizationId: string;
  code: string;
  version: number;
  name: string;
  obligationType: PublicObligationType;
  currency: Money['currency'];
  fixedAmount?: Money;
  minimumAmount?: Money;
  maximumAmount?: Money;
  allowedPaymentChannels: readonly string[];
  partialPaymentAllowed: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  active: boolean;
}

export interface PublicObligationSubject {
  userId?: string;
  externalReference?: string;
  displayName?: string;
  maskedIdentityReference?: string;
}

export interface PublicObligation {
  id: string;
  reference: string;
  organizationId: string;
  serviceCatalogEntryId: string;
  serviceCode: string;
  serviceVersion: number;
  type: PublicObligationType;
  subject: PublicObligationSubject;
  amount: Money;
  paidAmount: Money;
  reason: string;
  status: PublicObligationStatus;
  issuedByAgentId?: string;
  issuedAt?: string;
  dueAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePublicObligationCommand {
  idempotencyKey: IdempotencyKey;
  organizationId: string;
  serviceCatalogEntryId: string;
  subject: PublicObligationSubject;
  amount?: Money;
  reason: string;
  externalReference?: string;
  dueAt?: string;
  expiresAt?: string;
}

export interface CollectPublicPaymentCommand {
  idempotencyKey: IdempotencyKey;
  obligationId: string;
  amount: Money;
  paymentChannel: string;
  payerUserId?: string;
  collectingAgentId?: string;
  terminalId?: string;
}

export interface PublicPaymentReceipt {
  id: string;
  obligationId: string;
  obligationReference: string;
  transactionId: string;
  amount: Money;
  organizationName: string;
  serviceName: string;
  verificationCode: string;
  paidAt: string;
}

export interface ScholarshipApplication {
  id: string;
  organizationId: string;
  programCode: string;
  academicYear: string;
  beneficiaryUserId: string;
  beneficiaryExternalReference?: string;
  approvedAmount?: Money;
  status: ScholarshipStatus;
  submittedAt?: string;
  decidedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecideScholarshipCommand {
  applicationId: string;
  decision: 'APPROVE' | 'REJECT';
  approvedAmount?: Money;
  reason: string;
  approvalRequestId?: string;
}

export interface StudentCard {
  id: string;
  organizationId: string;
  studentUserId?: string;
  studentExternalReference: string;
  academicYear: string;
  publicIdentifier: string;
  status: StudentCardStatus;
  validFrom: string;
  validUntil: string;
  entitlements: readonly string[];
  issuedAt?: string;
  replacedByCardId?: string;
  updatedAt: string;
}

export interface IssueStudentCardCommand {
  idempotencyKey: IdempotencyKey;
  organizationId: string;
  studentUserId?: string;
  studentExternalReference: string;
  academicYear: string;
  validFrom: string;
  validUntil: string;
  entitlements: readonly string[];
}

export function isPublicOrganizationType(value: string): value is PublicOrganizationType {
  return PUBLIC_ORGANIZATION_TYPES.includes(value as PublicOrganizationType);
}

export function isPublicAgentStatus(value: string): value is PublicAgentStatus {
  return PUBLIC_AGENT_STATUSES.includes(value as PublicAgentStatus);
}

export function isPublicObligationType(value: string): value is PublicObligationType {
  return PUBLIC_OBLIGATION_TYPES.includes(value as PublicObligationType);
}

export function isPublicObligationStatus(value: string): value is PublicObligationStatus {
  return PUBLIC_OBLIGATION_STATUSES.includes(value as PublicObligationStatus);
}

export function isScholarshipStatus(value: string): value is ScholarshipStatus {
  return SCHOLARSHIP_STATUSES.includes(value as ScholarshipStatus);
}

export function isStudentCardStatus(value: string): value is StudentCardStatus {
  return STUDENT_CARD_STATUSES.includes(value as StudentCardStatus);
}

export const KYC_LEVELS = [
  'UNVERIFIED',
  'BASIC',
  'STANDARD',
  'ENHANCED',
  'REJECTED',
  'SUSPENDED',
] as const;

export type KycLevel = (typeof KYC_LEVELS)[number];

export const KYC_CASE_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'ACTION_REQUIRED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;

export type KycCaseStatus = (typeof KYC_CASE_STATUSES)[number];

export const KYC_DOCUMENT_TYPES = [
  'NATIONAL_ID',
  'PASSPORT',
  'RESIDENCE_PERMIT',
  'DRIVING_LICENCE',
  'PROOF_OF_ADDRESS',
  'OTHER',
] as const;

export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

export const KYC_CASE_TRANSITIONS: Readonly<Record<KycCaseStatus, readonly KycCaseStatus[]>> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['ACTION_REQUIRED', 'APPROVED', 'REJECTED'],
  ACTION_REQUIRED: ['SUBMITTED', 'CANCELLED'],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
};

export interface KycDocumentReference {
  id: string;
  type: KycDocumentType;
  issuingCountry: string;
  documentNumberMasked?: string;
  expiresAt?: string;
  storageObjectId: string;
}

export interface KycProfileInput {
  legalFirstName: string;
  legalLastName: string;
  dateOfBirth: string;
  countryOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  postalCode?: string;
  occupation?: string;
  sourceOfFunds?: string;
}

export interface KycCase {
  id: string;
  userId: string;
  countryCode: string;
  programCode: string;
  version: number;
  status: KycCaseStatus;
  resultingLevel?: KycLevel;
  profile: KycProfileInput;
  documents: KycDocumentReference[];
  submittedAt?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKycDraftCommand {
  userId: string;
  countryCode: string;
  programCode: string;
  profile: KycProfileInput;
}

export interface SubmitKycCaseCommand {
  caseId: string;
  userId: string;
  idempotencyKey: string;
  expectedVersion: number;
  documentIds: string[];
}

export interface ReviewKycCaseCommand {
  caseId: string;
  reviewerId: string;
  decision: 'APPROVE' | 'REQUEST_ACTION' | 'REJECT';
  resultingLevel?: KycLevel;
  internalReasonCode: string;
  internalComment?: string;
  customerMessageCode?: string;
}

export function isKycLevel(value: string): value is KycLevel {
  return KYC_LEVELS.includes(value as KycLevel);
}

export function isKycCaseStatus(value: string): value is KycCaseStatus {
  return KYC_CASE_STATUSES.includes(value as KycCaseStatus);
}

export function isKycDocumentType(value: string): value is KycDocumentType {
  return KYC_DOCUMENT_TYPES.includes(value as KycDocumentType);
}

export function isFinalKycCaseStatus(status: KycCaseStatus): boolean {
  return KYC_CASE_TRANSITIONS[status].length === 0;
}

export function canTransitionKycCase(
  currentStatus: KycCaseStatus,
  nextStatus: KycCaseStatus,
): boolean {
  return KYC_CASE_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function assertKycCaseTransition(
  currentStatus: KycCaseStatus,
  nextStatus: KycCaseStatus,
): void {
  if (!canTransitionKycCase(currentStatus, nextStatus)) {
    throw new Error(`Invalid KYC case transition: ${currentStatus} -> ${nextStatus}`);
  }
}

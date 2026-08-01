export const BENEFICIARY_TYPES = [
  'MANSA_USER',
  'BANK_ACCOUNT',
  'MOBILE_MONEY',
  'MERCHANT',
  'PUBLIC_SERVICE',
] as const;

export const BENEFICIARY_STATUSES = [
  'PENDING_VERIFICATION',
  'ACTIVE',
  'BLOCKED',
  'ARCHIVED',
] as const;

export const BENEFICIARY_VERIFICATION_METHODS = [
  'OTP',
  'PIN',
  'BIOMETRIC',
  'STRONG_AUTHENTICATION',
  'MANUAL_REVIEW',
] as const;

export type BeneficiaryType = (typeof BENEFICIARY_TYPES)[number];
export type BeneficiaryStatus = (typeof BENEFICIARY_STATUSES)[number];
export type BeneficiaryVerificationMethod =
  (typeof BENEFICIARY_VERIFICATION_METHODS)[number];

export interface BeneficiaryDestination {
  readonly type: BeneficiaryType;
  readonly countryCode: string;
  readonly currency: string;
  readonly userId?: string;
  readonly walletId?: string;
  readonly merchantId?: string;
  readonly publicServiceId?: string;
  readonly bankCode?: string;
  readonly accountNumberMasked?: string;
  readonly mobileMoneyProvider?: string;
  readonly phoneNumberMasked?: string;
}

export interface Beneficiary {
  readonly beneficiaryId: string;
  readonly ownerUserId: string;
  readonly displayName: string;
  readonly nickname?: string;
  readonly status: BeneficiaryStatus;
  readonly destination: BeneficiaryDestination;
  readonly trusted: boolean;
  readonly favorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastUsedAt?: string;
}

export interface CreateBeneficiaryCommand {
  readonly ownerUserId: string;
  readonly displayName: string;
  readonly nickname?: string;
  readonly destination: BeneficiaryDestination;
  readonly idempotencyKey: string;
}

export interface VerifyBeneficiaryCommand {
  readonly beneficiaryId: string;
  readonly ownerUserId: string;
  readonly method: BeneficiaryVerificationMethod;
  readonly challengeId?: string;
  readonly verificationCode?: string;
}

export interface UpdateBeneficiaryCommand {
  readonly beneficiaryId: string;
  readonly ownerUserId: string;
  readonly displayName?: string;
  readonly nickname?: string;
  readonly favorite?: boolean;
}

export interface ChangeBeneficiaryStatusCommand {
  readonly beneficiaryId: string;
  readonly ownerUserId: string;
  readonly status: Extract<BeneficiaryStatus, 'BLOCKED' | 'ARCHIVED'>;
  readonly reason?: string;
}

export function isBeneficiaryType(value: string): value is BeneficiaryType {
  return BENEFICIARY_TYPES.includes(value as BeneficiaryType);
}

export function isBeneficiaryStatus(value: string): value is BeneficiaryStatus {
  return BENEFICIARY_STATUSES.includes(value as BeneficiaryStatus);
}

export function isBeneficiaryVerificationMethod(
  value: string,
): value is BeneficiaryVerificationMethod {
  return BENEFICIARY_VERIFICATION_METHODS.includes(
    value as BeneficiaryVerificationMethod,
  );
}

export const SETTLEMENT_DESTINATION_TYPES = [
  'BANK_ACCOUNT',
  'MOBILE_MONEY',
  'INTERNAL_WALLET',
] as const;

export const SETTLEMENT_DESTINATION_STATUSES = [
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'DISABLED',
] as const;

export type SettlementDestinationType = (typeof SETTLEMENT_DESTINATION_TYPES)[number];
export type SettlementDestinationStatus = (typeof SETTLEMENT_DESTINATION_STATUSES)[number];

export interface SettlementDestinationDetails {
  readonly bankAccountToken?: string;
  readonly mobileMoneyToken?: string;
  readonly walletId?: string;
  readonly providerCode?: string;
  readonly accountHolderName?: string;
  readonly maskedReference: string;
}

export interface SettlementDestination {
  readonly destinationId: string;
  readonly merchantId: string;
  readonly type: SettlementDestinationType;
  readonly currency: string;
  readonly countryCode: string;
  readonly details: SettlementDestinationDetails;
  readonly status: SettlementDestinationStatus;
  readonly isDefault: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly verifiedAt?: string;
}

export interface CreateSettlementDestinationCommand {
  readonly destinationId: string;
  readonly merchantId: string;
  readonly type: SettlementDestinationType;
  readonly currency: string;
  readonly countryCode: string;
  readonly details: SettlementDestinationDetails;
  readonly isDefault?: boolean;
  readonly createdAt: string;
}

export interface VerifySettlementDestinationCommand {
  readonly verifiedAt: string;
}

export interface ChangeSettlementDestinationStatusCommand {
  readonly status: Exclude<SettlementDestinationStatus, 'PENDING_VERIFICATION'>;
  readonly updatedAt: string;
}

export function isSettlementDestinationType(value: string): value is SettlementDestinationType {
  return SETTLEMENT_DESTINATION_TYPES.includes(value as SettlementDestinationType);
}

export function isSettlementDestinationStatus(value: string): value is SettlementDestinationStatus {
  return SETTLEMENT_DESTINATION_STATUSES.includes(value as SettlementDestinationStatus);
}

function normalizeCode(value: string, pattern: RegExp, name: string): string {
  const normalized = value.trim().toUpperCase();
  if (!pattern.test(normalized)) throw new Error(`${name} is invalid`);
  return normalized;
}

function validateDetails(type: SettlementDestinationType, details: SettlementDestinationDetails): void {
  if (!details.maskedReference.trim()) throw new Error('maskedReference is required');

  const tokens = [details.bankAccountToken, details.mobileMoneyToken, details.walletId].filter(Boolean);
  if (tokens.length !== 1) throw new Error('exactly one settlement destination reference is required');

  if (type === 'BANK_ACCOUNT' && !details.bankAccountToken) {
    throw new Error('bankAccountToken is required for bank accounts');
  }
  if (type === 'MOBILE_MONEY' && !details.mobileMoneyToken) {
    throw new Error('mobileMoneyToken is required for mobile money');
  }
  if (type === 'INTERNAL_WALLET' && !details.walletId) {
    throw new Error('walletId is required for internal wallets');
  }
}

export function createSettlementDestination(
  command: CreateSettlementDestinationCommand,
): SettlementDestination {
  if (!command.destinationId || !command.merchantId) {
    throw new Error('destinationId and merchantId are required');
  }
  validateDetails(command.type, command.details);

  return {
    ...command,
    currency: normalizeCode(command.currency, /^[A-Z]{3}$/, 'currency'),
    countryCode: normalizeCode(command.countryCode, /^[A-Z]{2}$/, 'countryCode'),
    details: {
      ...command.details,
      maskedReference: command.details.maskedReference.trim(),
      accountHolderName: command.details.accountHolderName?.trim(),
      providerCode: command.details.providerCode?.trim().toUpperCase(),
    },
    status: 'PENDING_VERIFICATION',
    isDefault: command.isDefault ?? false,
    updatedAt: command.createdAt,
  };
}

export function verifySettlementDestination(
  current: SettlementDestination,
  command: VerifySettlementDestinationCommand,
): SettlementDestination {
  if (current.status !== 'PENDING_VERIFICATION') {
    throw new Error('only pending settlement destinations can be verified');
  }
  return {
    ...current,
    status: 'ACTIVE',
    verifiedAt: command.verifiedAt,
    updatedAt: command.verifiedAt,
  };
}

export function changeSettlementDestinationStatus(
  current: SettlementDestination,
  command: ChangeSettlementDestinationStatusCommand,
): SettlementDestination {
  if (current.status === 'PENDING_VERIFICATION' && command.status === 'ACTIVE') {
    throw new Error('verification is required before activation');
  }
  return { ...current, status: command.status, updatedAt: command.updatedAt };
}

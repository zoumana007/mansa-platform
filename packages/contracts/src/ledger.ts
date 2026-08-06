import type { CurrencyCode, Money } from './money.js';

export const LEDGER_ACCOUNT_TYPES = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
] as const;

export const LEDGER_ENTRY_DIRECTIONS = ['DEBIT', 'CREDIT'] as const;

export const LEDGER_TRANSACTION_STATUSES = [
  'PENDING',
  'POSTED',
  'REVERSED',
  'REJECTED',
] as const;

export const LEDGER_VALIDATION_ERROR_CODES = [
  'INSUFFICIENT_ENTRIES',
  'NON_POSITIVE_AMOUNT',
  'MULTIPLE_CURRENCIES',
  'UNBALANCED_TOTALS',
] as const;

export type LedgerAccountType = (typeof LEDGER_ACCOUNT_TYPES)[number];
export type LedgerEntryDirection = (typeof LEDGER_ENTRY_DIRECTIONS)[number];
export type LedgerTransactionStatus =
  (typeof LEDGER_TRANSACTION_STATUSES)[number];
export type LedgerValidationErrorCode =
  (typeof LEDGER_VALIDATION_ERROR_CODES)[number];

export interface LedgerAccount {
  readonly id: string;
  readonly code: string;
  readonly ownerType: 'PLATFORM' | 'USER' | 'MERCHANT' | 'PARTNER' | 'PUBLIC_BODY';
  readonly ownerId?: string;
  readonly type: LedgerAccountType;
  readonly currency: CurrencyCode;
  readonly countryCode: string;
  readonly name: string;
  readonly isSystemAccount: boolean;
  readonly createdAt: string;
}

export interface LedgerEntryDraft {
  readonly accountId: string;
  readonly direction: LedgerEntryDirection;
  readonly amount: Money;
  readonly description?: string;
}

export interface LedgerEntry extends LedgerEntryDraft {
  readonly id: string;
  readonly transactionId: string;
  readonly sequence: number;
  readonly postedAt: string;
}

export interface PostLedgerTransactionCommand {
  readonly reference: string;
  readonly transactionType: string;
  readonly entries: readonly LedgerEntryDraft[];
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly countryCode: string;
  readonly occurredAt: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface ReverseLedgerTransactionCommand {
  readonly transactionId: string;
  readonly reasonCode: string;
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface LedgerTransaction {
  readonly id: string;
  readonly reference: string;
  readonly transactionType: string;
  readonly status: LedgerTransactionStatus;
  readonly entries: readonly LedgerEntry[];
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly countryCode: string;
  readonly occurredAt: string;
  readonly postedAt?: string;
  readonly reversedByTransactionId?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface LedgerBalance {
  readonly accountId: string;
  readonly available: Money;
  readonly pending: Money;
  readonly asOf: string;
}

export interface LedgerValidationError {
  readonly code: LedgerValidationErrorCode;
  readonly message: string;
  readonly entryIndex?: number;
  readonly accountId?: string;
}

export interface LedgerValidationResult {
  readonly valid: boolean;
  readonly currency?: CurrencyCode;
  readonly debitTotalMinor: bigint;
  readonly creditTotalMinor: bigint;
  readonly errors: readonly LedgerValidationError[];
}

export function validateLedgerEntries(
  entries: readonly LedgerEntryDraft[],
): LedgerValidationResult {
  const errors: LedgerValidationError[] = [];

  if (entries.length < 2) {
    errors.push({
      code: 'INSUFFICIENT_ENTRIES',
      message: 'A ledger transaction must contain at least two entries.',
    });
  }

  entries.forEach((entry, entryIndex) => {
    if (entry.amount.amountMinor <= 0n) {
      errors.push({
        code: 'NON_POSITIVE_AMOUNT',
        message: 'Ledger entry amounts must be strictly positive.',
        entryIndex,
        accountId: entry.accountId,
      });
    }
  });

  const currencies = [...new Set(entries.map((entry) => entry.amount.currency))];
  if (currencies.length > 1) {
    errors.push({
      code: 'MULTIPLE_CURRENCIES',
      message: 'All ledger entries in a transaction must use the same currency.',
    });
  }

  const debitTotalMinor = entries
    .filter((entry) => entry.direction === 'DEBIT')
    .reduce((sum, entry) => sum + entry.amount.amountMinor, 0n);

  const creditTotalMinor = entries
    .filter((entry) => entry.direction === 'CREDIT')
    .reduce((sum, entry) => sum + entry.amount.amountMinor, 0n);

  if (debitTotalMinor !== creditTotalMinor) {
    errors.push({
      code: 'UNBALANCED_TOTALS',
      message: 'Ledger debit and credit totals must be equal.',
    });
  }

  return {
    valid: errors.length === 0,
    currency: currencies.length === 1 ? currencies[0] : undefined,
    debitTotalMinor,
    creditTotalMinor,
    errors,
  };
}

export function isLedgerBalanced(entries: readonly LedgerEntryDraft[]): boolean {
  return validateLedgerEntries(entries).valid;
}

export function isLedgerAccountType(value: string): value is LedgerAccountType {
  return LEDGER_ACCOUNT_TYPES.includes(value as LedgerAccountType);
}

export function isLedgerEntryDirection(
  value: string,
): value is LedgerEntryDirection {
  return LEDGER_ENTRY_DIRECTIONS.includes(value as LedgerEntryDirection);
}

export function isLedgerTransactionStatus(
  value: string,
): value is LedgerTransactionStatus {
  return LEDGER_TRANSACTION_STATUSES.includes(value as LedgerTransactionStatus);
}

export function isLedgerValidationErrorCode(
  value: string,
): value is LedgerValidationErrorCode {
  return LEDGER_VALIDATION_ERROR_CODES.includes(
    value as LedgerValidationErrorCode,
  );
}

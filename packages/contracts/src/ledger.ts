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

export type LedgerAccountType = (typeof LEDGER_ACCOUNT_TYPES)[number];
export type LedgerEntryDirection = (typeof LEDGER_ENTRY_DIRECTIONS)[number];
export type LedgerTransactionStatus =
  (typeof LEDGER_TRANSACTION_STATUSES)[number];

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

export function isLedgerBalanced(entries: readonly LedgerEntryDraft[]): boolean {
  if (entries.length < 2) return false;

  const currencies = new Set(entries.map((entry) => entry.amount.currency));
  if (currencies.size !== 1) return false;

  const debitTotal = entries
    .filter((entry) => entry.direction === 'DEBIT')
    .reduce((sum, entry) => sum + entry.amount.amountMinor, 0n);

  const creditTotal = entries
    .filter((entry) => entry.direction === 'CREDIT')
    .reduce((sum, entry) => sum + entry.amount.amountMinor, 0n);

  return debitTotal > 0n && debitTotal === creditTotal;
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

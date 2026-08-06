import type { CurrencyCode, Money } from './money.js';

export type TransactionStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export type TransactionType =
  | 'TRANSFER'
  | 'PAYMENT'
  | 'CASH_IN'
  | 'CASH_OUT'
  | 'REFUND'
  | 'FEE'
  | 'REVERSAL';

export interface TransactionReference {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly type: TransactionType;
  readonly status: TransactionStatus;
  readonly amount: Money;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const FINAL_TRANSACTION_STATUSES = [
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REVERSED',
] as const satisfies readonly TransactionStatus[];

export function isFinalTransactionStatus(status: TransactionStatus): boolean {
  return FINAL_TRANSACTION_STATUSES.includes(
    status as (typeof FINAL_TRANSACTION_STATUSES)[number],
  );
}

export const LEDGER_ACCOUNT_TYPES = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
] as const;

export const LEDGER_ENTRY_SIDES = ['DEBIT', 'CREDIT'] as const;
export const LEDGER_JOURNAL_STATUSES = [
  'PENDING',
  'POSTED',
  'REVERSED',
  'REJECTED',
] as const;

export type LedgerAccountType = (typeof LEDGER_ACCOUNT_TYPES)[number];
export type LedgerEntrySide = (typeof LEDGER_ENTRY_SIDES)[number];
export type LedgerJournalStatus = (typeof LEDGER_JOURNAL_STATUSES)[number];

export interface LedgerAccountReference {
  readonly id: string;
  readonly code: string;
  readonly type: LedgerAccountType;
  readonly currency: CurrencyCode;
  readonly countryCode: string;
}

export interface LedgerEntry {
  readonly accountId: string;
  readonly side: LedgerEntrySide;
  readonly amount: Money;
  readonly description?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface LedgerJournal {
  readonly id: string;
  readonly referenceType: string;
  readonly referenceId: string;
  readonly idempotencyKey: string;
  readonly currency: CurrencyCode;
  readonly status: LedgerJournalStatus;
  readonly entries: readonly LedgerEntry[];
  readonly postedAt?: string;
  readonly reversedByJournalId?: string;
  readonly createdAt: string;
}

export interface PostLedgerJournalCommand {
  readonly referenceType: string;
  readonly referenceId: string;
  readonly currency: CurrencyCode;
  readonly entries: readonly LedgerEntry[];
  readonly idempotencyKey: string;
  readonly actorId?: string;
}

export interface ReverseLedgerJournalCommand {
  readonly journalId: string;
  readonly reasonCode: string;
  readonly idempotencyKey: string;
  readonly actorId: string;
}

export interface LedgerJournalValidation {
  readonly valid: boolean;
  readonly debitTotalMinor: bigint;
  readonly creditTotalMinor: bigint;
  readonly errors: readonly string[];
}

export function isLedgerAccountType(value: string): value is LedgerAccountType {
  return LEDGER_ACCOUNT_TYPES.includes(value as LedgerAccountType);
}

export function isLedgerEntrySide(value: string): value is LedgerEntrySide {
  return LEDGER_ENTRY_SIDES.includes(value as LedgerEntrySide);
}

export function isLedgerJournalStatus(value: string): value is LedgerJournalStatus {
  return LEDGER_JOURNAL_STATUSES.includes(value as LedgerJournalStatus);
}

export function validateLedgerJournal(
  command: PostLedgerJournalCommand,
): LedgerJournalValidation {
  const errors: string[] = [];

  if (command.entries.length < 2) {
    errors.push('A ledger journal must contain at least two entries.');
  }

  let debitTotalMinor = 0n;
  let creditTotalMinor = 0n;

  for (const entry of command.entries) {
    if (entry.amount.currency !== command.currency) {
      errors.push(`Entry ${entry.accountId} uses a different currency.`);
    }

    if (entry.amount.amountMinor <= 0n) {
      errors.push(`Entry ${entry.accountId} must have a strictly positive amount.`);
    }

    if (entry.side === 'DEBIT') {
      debitTotalMinor += entry.amount.amountMinor;
    } else {
      creditTotalMinor += entry.amount.amountMinor;
    }
  }

  if (debitTotalMinor !== creditTotalMinor) {
    errors.push('Debit and credit totals must be equal.');
  }

  return {
    valid: errors.length === 0,
    debitTotalMinor,
    creditTotalMinor,
    errors,
  };
}

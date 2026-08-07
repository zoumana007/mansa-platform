import type { LedgerEntry } from './ledger.js';
import type { LedgerEntryCursor } from './ledger-entry-cursor.js';

export const LEDGER_ENTRY_KEYSET_MATCH_ERROR_CODES = [
  'ACCOUNT_MISMATCH',
] as const;

export type LedgerEntryKeysetMatchErrorCode =
  (typeof LEDGER_ENTRY_KEYSET_MATCH_ERROR_CODES)[number];

export interface LedgerEntryKeysetMatchError {
  readonly code: LedgerEntryKeysetMatchErrorCode;
  readonly message: string;
}

export interface LedgerEntryKeysetMatchResult {
  readonly valid: boolean;
  readonly errors: readonly LedgerEntryKeysetMatchError[];
}

export interface LedgerEntryPosition {
  readonly postedAt: string;
  readonly entryId: string;
}

/**
 * Compares two deterministic ledger positions using the canonical keyset order:
 * postedAt ASC, then entryId ASC.
 */
export function compareLedgerEntryPositions(
  left: LedgerEntryPosition,
  right: LedgerEntryPosition,
): -1 | 0 | 1 {
  const leftTimestamp = Date.parse(left.postedAt);
  const rightTimestamp = Date.parse(right.postedAt);

  if (leftTimestamp < rightTimestamp) return -1;
  if (leftTimestamp > rightTimestamp) return 1;

  if (left.entryId < right.entryId) return -1;
  if (left.entryId > right.entryId) return 1;

  return 0;
}

/**
 * Returns true when an entry is strictly after the supplied cursor according to
 * the canonical ledger keyset order.
 */
export function isLedgerEntryAfterCursor(
  entry: Pick<LedgerEntry, 'id' | 'postedAt'>,
  cursor: LedgerEntryCursor,
): boolean {
  return (
    compareLedgerEntryPositions(
      { postedAt: entry.postedAt, entryId: entry.id },
      { postedAt: cursor.postedAt, entryId: cursor.entryId },
    ) === 1
  );
}

/**
 * Ensures a decoded cursor belongs to the account currently being queried.
 */
export function validateLedgerEntryCursorAccount(
  accountId: string,
  cursor: LedgerEntryCursor,
): LedgerEntryKeysetMatchResult {
  if (accountId.trim() !== cursor.accountId.trim()) {
    return {
      valid: false,
      errors: [
        {
          code: 'ACCOUNT_MISMATCH',
          message: 'Ledger entry cursor account does not match the query account.',
        },
      ],
    };
  }

  return { valid: true, errors: [] };
}

export function isLedgerEntryKeysetMatchErrorCode(
  value: string,
): value is LedgerEntryKeysetMatchErrorCode {
  return LEDGER_ENTRY_KEYSET_MATCH_ERROR_CODES.includes(
    value as LedgerEntryKeysetMatchErrorCode,
  );
}

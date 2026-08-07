import type { LedgerEntry } from './ledger.js';
import type { LedgerEntryCursor } from './ledger-entry-cursor.js';

export const LEDGER_ENTRY_NEXT_CURSOR_ERROR_CODES = [
  'EMPTY_PAGE',
] as const;

export type LedgerEntryNextCursorErrorCode =
  (typeof LEDGER_ENTRY_NEXT_CURSOR_ERROR_CODES)[number];

export interface LedgerEntryNextCursorError {
  readonly code: LedgerEntryNextCursorErrorCode;
  readonly message: string;
}

export interface LedgerEntryNextCursorResult {
  readonly cursor?: LedgerEntryCursor;
  readonly errors: readonly LedgerEntryNextCursorError[];
}

/**
 * Builds the stable cursor payload from the last entry actually returned.
 *
 * The payload is intentionally not serialized here. Opaque encoding, signing
 * and optional encryption belong to infrastructure so secrets never enter the
 * contracts package.
 */
export function createLedgerEntryCursorFromEntry(
  entry: Pick<LedgerEntry, 'id' | 'accountId' | 'postedAt'>,
): LedgerEntryCursor {
  return {
    version: 1,
    accountId: entry.accountId,
    postedAt: entry.postedAt,
    entryId: entry.id,
  };
}

/**
 * Creates the cursor payload for a following page from the last returned item.
 * Empty pages deliberately produce no cursor.
 */
export function createLedgerEntryNextCursor(
  items: readonly Pick<LedgerEntry, 'id' | 'accountId' | 'postedAt'>[],
): LedgerEntryNextCursorResult {
  const lastEntry = items.at(-1);

  if (lastEntry === undefined) {
    return {
      errors: [
        {
          code: 'EMPTY_PAGE',
          message: 'A next ledger cursor cannot be created from an empty page.',
        },
      ],
    };
  }

  return {
    cursor: createLedgerEntryCursorFromEntry(lastEntry),
    errors: [],
  };
}

export function isLedgerEntryNextCursorErrorCode(
  value: string,
): value is LedgerEntryNextCursorErrorCode {
  return LEDGER_ENTRY_NEXT_CURSOR_ERROR_CODES.includes(
    value as LedgerEntryNextCursorErrorCode,
  );
}

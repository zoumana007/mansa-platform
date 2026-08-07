import type { LedgerEntry } from './ledger.js';
import type { LedgerEntryCursor } from './ledger-entry-cursor.js';
import { createLedgerEntryCursorFromEntry } from './ledger-entry-next-cursor.js';

export const LEDGER_ENTRY_FETCH_WINDOW_ERROR_CODES = [
  'INVALID_LIMIT',
] as const;

export type LedgerEntryFetchWindowErrorCode =
  (typeof LEDGER_ENTRY_FETCH_WINDOW_ERROR_CODES)[number];

export interface LedgerEntryFetchWindowError {
  readonly code: LedgerEntryFetchWindowErrorCode;
  readonly message: string;
}

export interface LedgerEntryFetchWindowResult {
  readonly items: readonly LedgerEntry[];
  readonly hasNextPage: boolean;
  readonly nextCursor?: LedgerEntryCursor;
  readonly errors: readonly LedgerEntryFetchWindowError[];
}

/**
 * Reduces a storage fetch window of at most `limit + 1` entries to the public
 * page window. The extra row is used only to determine whether another page
 * exists and is never exposed nor used as the next-cursor position.
 */
export function createLedgerEntryFetchWindow(
  fetchedEntries: readonly LedgerEntry[],
  limit: number,
): LedgerEntryFetchWindowResult {
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    return {
      items: [],
      hasNextPage: false,
      errors: [
        {
          code: 'INVALID_LIMIT',
          message: 'Ledger entry page limit must be an integer between 1 and 200.',
        },
      ],
    };
  }

  const hasNextPage = fetchedEntries.length > limit;
  const items = fetchedEntries.slice(0, limit);
  const lastReturnedEntry = items.at(-1);

  return {
    items,
    hasNextPage,
    ...(hasNextPage && lastReturnedEntry !== undefined
      ? { nextCursor: createLedgerEntryCursorFromEntry(lastReturnedEntry) }
      : {}),
    errors: [],
  };
}

export function isLedgerEntryFetchWindowErrorCode(
  value: string,
): value is LedgerEntryFetchWindowErrorCode {
  return LEDGER_ENTRY_FETCH_WINDOW_ERROR_CODES.includes(
    value as LedgerEntryFetchWindowErrorCode,
  );
}

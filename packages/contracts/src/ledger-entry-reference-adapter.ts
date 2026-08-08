import type { LedgerEntry } from './ledger.js';
import type { LedgerEntryCursor } from './ledger-entry-cursor.js';
import { validateLedgerEntryCursor } from './ledger-entry-cursor.js';
import { createLedgerEntryFetchWindow } from './ledger-entry-fetch-window.js';
import {
  compareLedgerEntryPositions,
  isLedgerEntryAfterCursor,
  validateLedgerEntryCursorAccount,
} from './ledger-entry-keyset.js';
import { validateListLedgerEntriesQuery } from './ledger-entry-query.js';
import type { LedgerEntryPage, ListLedgerEntriesQuery } from './ledger-api.js';

export const LEDGER_ENTRY_REFERENCE_ADAPTER_ERROR_CODES = [
  'INVALID_QUERY',
  'INVALID_CURSOR',
  'CURSOR_ACCOUNT_MISMATCH',
] as const;

export type LedgerEntryReferenceAdapterErrorCode =
  (typeof LEDGER_ENTRY_REFERENCE_ADAPTER_ERROR_CODES)[number];

export interface LedgerEntryReferenceAdapterError {
  readonly code: LedgerEntryReferenceAdapterErrorCode;
  readonly message: string;
}

export interface LedgerEntryCursorCodec {
  readonly encode: (cursor: LedgerEntryCursor) => string;
  readonly decode: (value: string) => LedgerEntryCursor | undefined;
}

export interface LedgerEntryReferenceAdapterResult {
  readonly page?: LedgerEntryPage;
  readonly errors: readonly LedgerEntryReferenceAdapterError[];
}

/**
 * Reference in-memory implementation of the persistence-side listEntries flow.
 *
 * Production persistence adapters should preserve the same semantics while
 * pushing filtering and ordering down to the database:
 * accountId equality, optional inclusive date bounds, canonical keyset order
 * (postedAt ASC, entryId ASC), strict "after cursor" selection, and a
 * `limit + 1` storage window.
 */
export function listLedgerEntriesFromMemory(
  entries: readonly LedgerEntry[],
  query: ListLedgerEntriesQuery,
  cursorCodec: LedgerEntryCursorCodec,
): LedgerEntryReferenceAdapterResult {
  const queryValidation = validateListLedgerEntriesQuery(query);
  if (!queryValidation.valid) {
    return {
      errors: [
        {
          code: 'INVALID_QUERY',
          message: 'Ledger entry query is invalid.',
        },
      ],
    };
  }

  let cursor: LedgerEntryCursor | undefined;
  if (query.cursor !== undefined) {
    try {
      cursor = cursorCodec.decode(query.cursor);
    } catch {
      cursor = undefined;
    }

    if (cursor === undefined || !validateLedgerEntryCursor(cursor).valid) {
      return {
        errors: [
          {
            code: 'INVALID_CURSOR',
            message: 'Ledger entry cursor cannot be decoded or is invalid.',
          },
        ],
      };
    }

    if (!validateLedgerEntryCursorAccount(query.accountId, cursor).valid) {
      return {
        errors: [
          {
            code: 'CURSOR_ACCOUNT_MISMATCH',
            message: 'Ledger entry cursor does not belong to the queried account.',
          },
        ],
      };
    }
  }

  const limit = query.limit ?? 50;
  const fromTimestamp = query.from === undefined ? undefined : Date.parse(query.from);
  const toTimestamp = query.to === undefined ? undefined : Date.parse(query.to);

  const orderedEntries = entries
    .filter((entry) => entry.accountId === query.accountId)
    .filter((entry) => {
      const postedAt = Date.parse(entry.postedAt);
      return (
        (fromTimestamp === undefined || postedAt >= fromTimestamp) &&
        (toTimestamp === undefined || postedAt <= toTimestamp)
      );
    })
    .filter((entry) => cursor === undefined || isLedgerEntryAfterCursor(entry, cursor))
    .slice()
    .sort((left, right) =>
      compareLedgerEntryPositions(
        { postedAt: left.postedAt, entryId: left.id },
        { postedAt: right.postedAt, entryId: right.id },
      ),
    );

  const fetchWindow = createLedgerEntryFetchWindow(
    orderedEntries.slice(0, limit + 1),
    limit,
  );

  if (fetchWindow.errors.length > 0) {
    return {
      errors: [
        {
          code: 'INVALID_QUERY',
          message: fetchWindow.errors[0]?.message ?? 'Ledger entry fetch window is invalid.',
        },
      ],
    };
  }

  return {
    page: {
      items: fetchWindow.items,
      ...(fetchWindow.nextCursor === undefined
        ? {}
        : { nextCursor: cursorCodec.encode(fetchWindow.nextCursor) }),
    },
    errors: [],
  };
}

export function isLedgerEntryReferenceAdapterErrorCode(
  value: string,
): value is LedgerEntryReferenceAdapterErrorCode {
  return LEDGER_ENTRY_REFERENCE_ADAPTER_ERROR_CODES.includes(
    value as LedgerEntryReferenceAdapterErrorCode,
  );
}

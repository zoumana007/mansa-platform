import type { LedgerEntryPage, ListLedgerEntriesQuery } from './ledger-api.js';
import type { LedgerEntryCursor } from './ledger-entry-cursor.js';
import { validateLedgerEntryCursor } from './ledger-entry-cursor.js';
import { createLedgerEntryFetchWindow } from './ledger-entry-fetch-window.js';
import { validateLedgerEntryCursorAccount } from './ledger-entry-keyset.js';
import { validateListLedgerEntriesQuery } from './ledger-entry-query.js';
import type { LedgerEntryCursorCodec } from './ledger-entry-reference-adapter.js';
import type {
  LedgerEntryRepository,
  LedgerEntryRepositoryQuery,
} from './ledger-entry-repository.js';
import { validateLedgerEntryRepositoryQuery } from './ledger-entry-repository.js';

export const LEDGER_ENTRY_REPOSITORY_ADAPTER_ERROR_CODES = [
  'INVALID_QUERY',
  'INVALID_CURSOR',
  'CURSOR_ACCOUNT_MISMATCH',
  'INVALID_REPOSITORY_QUERY',
  'REPOSITORY_FAILURE',
  'INVALID_FETCH_WINDOW',
] as const;

export type LedgerEntryRepositoryAdapterErrorCode =
  (typeof LEDGER_ENTRY_REPOSITORY_ADAPTER_ERROR_CODES)[number];

export interface LedgerEntryRepositoryAdapterError {
  readonly code: LedgerEntryRepositoryAdapterErrorCode;
  readonly message: string;
}

export interface LedgerEntryRepositoryAdapterDependencies {
  readonly repository: LedgerEntryRepository;
  readonly cursorCodec: LedgerEntryCursorCodec;
}

export interface LedgerEntryRepositoryAdapterResult {
  readonly page?: LedgerEntryPage;
  readonly errors: readonly LedgerEntryRepositoryAdapterError[];
}

/**
 * Application-facing adapter for persisted ledger-entry pagination.
 *
 * The adapter keeps cursor decoding and public-query validation outside of the
 * persistence layer. The repository only receives a decoded keyset position and
 * a deterministic `take = limit + 1` window.
 */
export async function listLedgerEntriesFromRepository(
  query: ListLedgerEntriesQuery,
  dependencies: LedgerEntryRepositoryAdapterDependencies,
): Promise<LedgerEntryRepositoryAdapterResult> {
  const queryValidation = validateListLedgerEntriesQuery(query);
  if (!queryValidation.valid) {
    return {
      errors: [{ code: 'INVALID_QUERY', message: 'Ledger entry query is invalid.' }],
    };
  }

  let cursor: LedgerEntryCursor | undefined;
  if (query.cursor !== undefined) {
    try {
      cursor = dependencies.cursorCodec.decode(query.cursor);
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
  const repositoryQuery: LedgerEntryRepositoryQuery = {
    accountId: query.accountId,
    ...(query.from === undefined ? {} : { from: query.from }),
    ...(query.to === undefined ? {} : { to: query.to }),
    ...(cursor === undefined
      ? {}
      : {
          after: {
            postedAt: cursor.postedAt,
            entryId: cursor.entryId,
          },
        }),
    take: limit + 1,
  };

  const repositoryQueryValidation =
    validateLedgerEntryRepositoryQuery(repositoryQuery);
  if (!repositoryQueryValidation.valid) {
    return {
      errors: [
        {
          code: 'INVALID_REPOSITORY_QUERY',
          message: 'Ledger entry repository query is invalid.',
        },
      ],
    };
  }

  let rows;
  try {
    rows = await dependencies.repository.listEntries(repositoryQuery);
  } catch {
    return {
      errors: [
        {
          code: 'REPOSITORY_FAILURE',
          message: 'Ledger entry repository could not list entries.',
        },
      ],
    };
  }

  const fetchWindow = createLedgerEntryFetchWindow(rows, limit);
  if (fetchWindow.errors.length > 0) {
    return {
      errors: [
        {
          code: 'INVALID_FETCH_WINDOW',
          message:
            fetchWindow.errors[0]?.message ??
            'Ledger entry repository returned an invalid fetch window.',
        },
      ],
    };
  }

  return {
    page: {
      items: fetchWindow.items,
      ...(fetchWindow.nextCursor === undefined
        ? {}
        : { nextCursor: dependencies.cursorCodec.encode(fetchWindow.nextCursor) }),
    },
    errors: [],
  };
}

export function isLedgerEntryRepositoryAdapterErrorCode(
  value: string,
): value is LedgerEntryRepositoryAdapterErrorCode {
  return LEDGER_ENTRY_REPOSITORY_ADAPTER_ERROR_CODES.includes(
    value as LedgerEntryRepositoryAdapterErrorCode,
  );
}

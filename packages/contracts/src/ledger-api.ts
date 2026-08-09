import type {
  LedgerAccount,
  LedgerBalance,
  LedgerEntry,
  LedgerTransaction,
  PostLedgerTransactionCommand,
  ReverseLedgerTransactionCommand,
} from './ledger.js';

export const LEDGER_API_ROUTES = {
  postTransaction: '/v1/internal/ledger/transactions',
  getTransaction: '/v1/internal/ledger/transactions/:transactionId',
  reverseTransaction: '/v1/internal/ledger/transactions/:transactionId/reverse',
  getAccount: '/v1/internal/ledger/accounts/:accountId',
  getBalance: '/v1/internal/ledger/accounts/:accountId/balance',
  listEntries: '/v1/internal/ledger/accounts/:accountId/entries',
  listOutboxDeadLetters: '/v1/internal/ledger/outbox/dead-letters',
  requeueOutboxDeadLetter: '/v1/internal/ledger/outbox/dead-letters/:eventId/requeue',
} as const;

export type LedgerApiRouteName = keyof typeof LEDGER_API_ROUTES;

export interface ListLedgerEntriesQuery {
  readonly accountId: string;
  readonly from?: string;
  readonly to?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface LedgerEntryPage {
  readonly items: readonly LedgerEntry[];
  readonly nextCursor?: string;
}

export interface LedgerOutboxDeadLetter {
  readonly id: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly transactionId: string | null;
  readonly attempts: number;
  readonly availableAt: string;
  readonly lastError: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ListLedgerOutboxDeadLettersQuery {
  readonly limit?: number;
  readonly maxAttempts?: number;
}

export interface RequeueLedgerOutboxDeadLetterRequest {
  readonly eventId: string;
  readonly maxAttempts?: number;
}

export interface RequeueLedgerOutboxDeadLetterResponse {
  readonly eventId: string;
  readonly requeued: true;
}

export interface LedgerApiContract {
  readonly postTransaction: {
    readonly method: 'POST';
    readonly request: PostLedgerTransactionCommand;
    readonly response: LedgerTransaction;
  };
  readonly getTransaction: {
    readonly method: 'GET';
    readonly request: { readonly transactionId: string };
    readonly response: LedgerTransaction;
  };
  readonly reverseTransaction: {
    readonly method: 'POST';
    readonly request: ReverseLedgerTransactionCommand;
    readonly response: LedgerTransaction;
  };
  readonly getAccount: {
    readonly method: 'GET';
    readonly request: { readonly accountId: string };
    readonly response: LedgerAccount;
  };
  readonly getBalance: {
    readonly method: 'GET';
    readonly request: { readonly accountId: string };
    readonly response: LedgerBalance;
  };
  readonly listEntries: {
    readonly method: 'GET';
    readonly request: ListLedgerEntriesQuery;
    readonly response: LedgerEntryPage;
  };
  readonly listOutboxDeadLetters: {
    readonly method: 'GET';
    readonly request: ListLedgerOutboxDeadLettersQuery;
    readonly response: readonly LedgerOutboxDeadLetter[];
  };
  readonly requeueOutboxDeadLetter: {
    readonly method: 'POST';
    readonly request: RequeueLedgerOutboxDeadLetterRequest;
    readonly response: RequeueLedgerOutboxDeadLetterResponse;
  };
}

export const LEDGER_API_METHODS: Readonly<
  Record<LedgerApiRouteName, LedgerApiContract[LedgerApiRouteName]['method']>
> = {
  postTransaction: 'POST',
  getTransaction: 'GET',
  reverseTransaction: 'POST',
  getAccount: 'GET',
  getBalance: 'GET',
  listEntries: 'GET',
  listOutboxDeadLetters: 'GET',
  requeueOutboxDeadLetter: 'POST',
};

export {
  LEDGER_BALANCE_VALIDATION_ERROR_CODES,
  isLedgerBalanceValidationErrorCode,
  validateLedgerBalance,
  type LedgerBalanceValidationError,
  type LedgerBalanceValidationErrorCode,
  type LedgerBalanceValidationResult,
} from './ledger-balance.js';

export {
  LEDGER_ENTRY_QUERY_VALIDATION_ERROR_CODES,
  isLedgerEntryQueryValidationErrorCode,
  validateListLedgerEntriesQuery,
  type LedgerEntryQueryValidationError,
  type LedgerEntryQueryValidationErrorCode,
  type LedgerEntryQueryValidationResult,
} from './ledger-entry-query.js';

export {
  LEDGER_ENTRY_PAGE_VALIDATION_ERROR_CODES,
  isLedgerEntryPageValidationErrorCode,
  validateLedgerEntryPage,
  type LedgerEntryPageValidationError,
  type LedgerEntryPageValidationErrorCode,
  type LedgerEntryPageValidationResult,
} from './ledger-entry-page.js';

export {
  LEDGER_ENTRY_CURSOR_VALIDATION_ERROR_CODES,
  LEDGER_ENTRY_CURSOR_VERSIONS,
  isLedgerEntryCursorValidationErrorCode,
  validateLedgerEntryCursor,
  type LedgerEntryCursor,
  type LedgerEntryCursorValidationError,
  type LedgerEntryCursorValidationErrorCode,
  type LedgerEntryCursorValidationResult,
  type LedgerEntryCursorVersion,
} from './ledger-entry-cursor.js';

export {
  LEDGER_ENTRY_KEYSET_MATCH_ERROR_CODES,
  compareLedgerEntryPositions,
  isLedgerEntryAfterCursor,
  isLedgerEntryKeysetMatchErrorCode,
  validateLedgerEntryCursorAccount,
  type LedgerEntryKeysetMatchError,
  type LedgerEntryKeysetMatchErrorCode,
  type LedgerEntryKeysetMatchResult,
  type LedgerEntryPosition,
} from './ledger-entry-keyset.js';

export {
  LEDGER_ENTRY_PAGE_ORDER_ERROR_CODES,
  isLedgerEntryPageOrderErrorCode,
  validateLedgerEntryPageOrder,
  type LedgerEntryPageOrderError,
  type LedgerEntryPageOrderErrorCode,
  type LedgerEntryPageOrderValidationResult,
} from './ledger-entry-page-order.js';

export {
  LEDGER_ENTRY_NEXT_CURSOR_ERROR_CODES,
  createLedgerEntryCursorFromEntry,
  createLedgerEntryNextCursor,
  isLedgerEntryNextCursorErrorCode,
  type LedgerEntryNextCursorError,
  type LedgerEntryNextCursorErrorCode,
  type LedgerEntryNextCursorResult,
} from './ledger-entry-next-cursor.js';

export {
  LEDGER_ENTRY_FETCH_WINDOW_ERROR_CODES,
  createLedgerEntryFetchWindow,
  isLedgerEntryFetchWindowErrorCode,
  type LedgerEntryFetchWindowError,
  type LedgerEntryFetchWindowErrorCode,
  type LedgerEntryFetchWindowResult,
} from './ledger-entry-fetch-window.js';

export {
  LEDGER_ENTRY_REFERENCE_ADAPTER_ERROR_CODES,
  isLedgerEntryReferenceAdapterErrorCode,
  listLedgerEntriesFromMemory,
  type LedgerEntryCursorCodec,
  type LedgerEntryReferenceAdapterError,
  type LedgerEntryReferenceAdapterErrorCode,
  type LedgerEntryReferenceAdapterResult,
} from './ledger-entry-reference-adapter.js';

export {
  LEDGER_ENTRY_REPOSITORY_QUERY_ERROR_CODES,
  isLedgerEntryRepositoryQueryErrorCode,
  validateLedgerEntryRepositoryQuery,
  type LedgerEntryRepository,
  type LedgerEntryRepositoryQuery,
  type LedgerEntryRepositoryQueryError,
  type LedgerEntryRepositoryQueryErrorCode,
  type LedgerEntryRepositoryQueryValidationResult,
} from './ledger-entry-repository.js';

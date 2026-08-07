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

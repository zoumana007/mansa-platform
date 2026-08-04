import type {
  LedgerAccount,
  LedgerBalance,
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
  readonly items: readonly LedgerTransaction[];
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

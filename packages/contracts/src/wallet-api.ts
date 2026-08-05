import type { CurrencyCode } from './money.js';
import type { PageRequest, PageResponse } from './pagination.js';
import type { ListTransactionHistoryQuery, TransactionHistoryPage } from './transaction-history.js';
import type { Wallet, WalletBalance, WalletStatus } from './wallet.js';

export const WALLET_API_ROUTES = {
  listWallets: '/v1/wallets',
  getWallet: '/v1/wallets/:walletId',
  getWalletBalance: '/v1/wallets/:walletId/balance',
  listWalletTransactions: '/v1/wallets/:walletId/transactions',
  changeWalletStatus: '/v1/wallets/:walletId/status',
} as const;

export type WalletApiRouteName = keyof typeof WALLET_API_ROUTES;

export interface ListWalletsQuery extends PageRequest {
  readonly ownerId?: string;
  readonly countryCode?: string;
  readonly currency?: CurrencyCode;
  readonly status?: WalletStatus;
}

export interface ChangeWalletStatusCommand {
  readonly status: WalletStatus;
  readonly reason: string;
  readonly expectedCurrentStatus?: WalletStatus;
}

export interface WalletApiContract {
  readonly listWallets: {
    readonly method: 'GET';
    readonly request: ListWalletsQuery;
    readonly response: PageResponse<Wallet>;
  };
  readonly getWallet: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: Wallet;
  };
  readonly getWalletBalance: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: WalletBalance;
  };
  readonly listWalletTransactions: {
    readonly method: 'GET';
    readonly request: ListTransactionHistoryQuery;
    readonly response: TransactionHistoryPage;
  };
  readonly changeWalletStatus: {
    readonly method: 'PATCH';
    readonly request: ChangeWalletStatusCommand;
    readonly response: Wallet;
  };
}

export const WALLET_API_METHODS: Readonly<
  Record<WalletApiRouteName, WalletApiContract[WalletApiRouteName]['method']>
> = {
  listWallets: 'GET',
  getWallet: 'GET',
  getWalletBalance: 'GET',
  listWalletTransactions: 'GET',
  changeWalletStatus: 'PATCH',
};

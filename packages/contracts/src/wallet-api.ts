import type { ListTransactionHistoryQuery, TransactionHistoryPage } from './transaction-history.js';
import type { Wallet, WalletBalance } from './wallet.js';

export const WALLET_API_ROUTES = {
  listWallets: '/v1/wallets',
  getWallet: '/v1/wallets/:walletId',
  getWalletBalance: '/v1/wallets/:walletId/balance',
  listWalletTransactions: '/v1/wallets/:walletId/transactions',
} as const;

export type WalletApiRouteName = keyof typeof WALLET_API_ROUTES;

export interface WalletApiContract {
  readonly listWallets: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: readonly Wallet[];
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
}

export const WALLET_API_METHODS: Readonly<
  Record<WalletApiRouteName, WalletApiContract[WalletApiRouteName]['method']>
> = {
  listWallets: 'GET',
  getWallet: 'GET',
  getWalletBalance: 'GET',
  listWalletTransactions: 'GET',
};

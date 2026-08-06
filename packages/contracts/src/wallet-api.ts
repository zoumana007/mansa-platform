import type { CurrencyCode } from './money.js';
import type { PageRequest, PageResponse } from './pagination.js';
import type {
  ListTransactionHistoryQuery,
  TransactionHistoryPage,
} from './transaction-history.js';
import type {
  ChangeWalletStatusCommand,
  CreateWalletCommand,
  CreateWalletHoldCommand,
  ReleaseWalletHoldCommand,
  Wallet,
  WalletBalance,
  WalletHold,
  WalletStatus,
} from './wallet.js';

export const WALLET_API_ROUTES = {
  createWallet: '/v1/wallets',
  listWallets: '/v1/wallets',
  getWallet: '/v1/wallets/:walletId',
  getWalletBalance: '/v1/wallets/:walletId/balance',
  listWalletTransactions: '/v1/wallets/:walletId/transactions',
  listWalletHolds: '/v1/wallets/:walletId/holds',
  createWalletHold: '/v1/wallets/:walletId/holds',
  releaseWalletHold: '/v1/wallets/:walletId/holds/:holdId/release',
  changeWalletStatus: '/v1/admin/wallets/:walletId/status',
} as const;

export const WALLET_API_METHODS = {
  createWallet: 'POST',
  listWallets: 'GET',
  getWallet: 'GET',
  getWalletBalance: 'GET',
  listWalletTransactions: 'GET',
  listWalletHolds: 'GET',
  createWalletHold: 'POST',
  releaseWalletHold: 'POST',
  changeWalletStatus: 'POST',
} as const;

export type WalletApiRouteName = keyof typeof WALLET_API_ROUTES;

export interface ListWalletsQuery extends PageRequest {
  readonly ownerId?: string;
  readonly countryCode?: string;
  readonly currency?: CurrencyCode;
  readonly status?: WalletStatus;
}

export interface ListWalletHoldsQuery extends PageRequest {
  readonly walletId: string;
  readonly status?: WalletHold['status'];
  readonly referenceType?: string;
  readonly referenceId?: string;
}

export interface WalletApiContract {
  readonly createWallet: {
    readonly method: typeof WALLET_API_METHODS.createWallet;
    readonly path: typeof WALLET_API_ROUTES.createWallet;
    readonly request: CreateWalletCommand;
    readonly response: Wallet;
  };
  readonly listWallets: {
    readonly method: typeof WALLET_API_METHODS.listWallets;
    readonly path: typeof WALLET_API_ROUTES.listWallets;
    readonly request: ListWalletsQuery;
    readonly response: PageResponse<Wallet>;
  };
  readonly getWallet: {
    readonly method: typeof WALLET_API_METHODS.getWallet;
    readonly path: typeof WALLET_API_ROUTES.getWallet;
    readonly request: { readonly walletId: string; readonly requesterId: string };
    readonly response: Wallet;
  };
  readonly getWalletBalance: {
    readonly method: typeof WALLET_API_METHODS.getWalletBalance;
    readonly path: typeof WALLET_API_ROUTES.getWalletBalance;
    readonly request: { readonly walletId: string; readonly requesterId: string };
    readonly response: WalletBalance;
  };
  readonly listWalletTransactions: {
    readonly method: typeof WALLET_API_METHODS.listWalletTransactions;
    readonly path: typeof WALLET_API_ROUTES.listWalletTransactions;
    readonly request: ListTransactionHistoryQuery & { readonly walletId: string };
    readonly response: TransactionHistoryPage;
  };
  readonly listWalletHolds: {
    readonly method: typeof WALLET_API_METHODS.listWalletHolds;
    readonly path: typeof WALLET_API_ROUTES.listWalletHolds;
    readonly request: ListWalletHoldsQuery;
    readonly response: PageResponse<WalletHold>;
  };
  readonly createWalletHold: {
    readonly method: typeof WALLET_API_METHODS.createWalletHold;
    readonly path: typeof WALLET_API_ROUTES.createWalletHold;
    readonly request: CreateWalletHoldCommand;
    readonly response: WalletHold;
  };
  readonly releaseWalletHold: {
    readonly method: typeof WALLET_API_METHODS.releaseWalletHold;
    readonly path: typeof WALLET_API_ROUTES.releaseWalletHold;
    readonly request: ReleaseWalletHoldCommand;
    readonly response: WalletHold;
  };
  readonly changeWalletStatus: {
    readonly method: typeof WALLET_API_METHODS.changeWalletStatus;
    readonly path: typeof WALLET_API_ROUTES.changeWalletStatus;
    readonly request: ChangeWalletStatusCommand;
    readonly response: Wallet;
  };
}

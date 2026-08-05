import type { PageResponse } from './pagination.js';
import type {
  AuthorizeTransferCommand,
  CancelTransferCommand,
  CreateTransferCommand,
  QuoteTransferCommand,
  Transfer,
  TransferQuote,
  TransferReceipt,
  TransferStatus,
  TransferType,
} from './transfer.js';

export const TRANSFER_API_ROUTES = {
  listTransfers: '/v1/transfers',
  quoteTransfer: '/v1/transfers/quotes',
  createTransfer: '/v1/transfers',
  getTransfer: '/v1/transfers/:transferId',
  getTransferReceipt: '/v1/transfers/:transferId/receipt',
  authorizeTransfer: '/v1/transfers/:transferId/authorize',
  cancelTransfer: '/v1/transfers/:transferId/cancel',
} as const;

export type TransferApiRouteName = keyof typeof TRANSFER_API_ROUTES;

export interface ListTransfersQuery {
  readonly ownerUserId?: string;
  readonly sourceWalletId?: string;
  readonly beneficiaryId?: string;
  readonly type?: TransferType;
  readonly status?: TransferStatus;
  readonly clientReference?: string;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface TransferApiContract {
  readonly listTransfers: {
    readonly method: 'GET';
    readonly request: ListTransfersQuery;
    readonly response: PageResponse<Transfer>;
  };
  readonly quoteTransfer: {
    readonly method: 'POST';
    readonly request: QuoteTransferCommand;
    readonly response: TransferQuote;
  };
  readonly createTransfer: {
    readonly method: 'POST';
    readonly request: CreateTransferCommand;
    readonly response: Transfer;
  };
  readonly getTransfer: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: Transfer;
  };
  readonly getTransferReceipt: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: TransferReceipt;
  };
  readonly authorizeTransfer: {
    readonly method: 'POST';
    readonly request: AuthorizeTransferCommand;
    readonly response: Transfer;
  };
  readonly cancelTransfer: {
    readonly method: 'POST';
    readonly request: CancelTransferCommand;
    readonly response: Transfer;
  };
}

export const TRANSFER_API_METHODS: Readonly<
  Record<TransferApiRouteName, TransferApiContract[TransferApiRouteName]['method']>
> = {
  listTransfers: 'GET',
  quoteTransfer: 'POST',
  createTransfer: 'POST',
  getTransfer: 'GET',
  getTransferReceipt: 'GET',
  authorizeTransfer: 'POST',
  cancelTransfer: 'POST',
};

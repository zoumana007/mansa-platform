import type {
  AuthorizeTransferCommand,
  CancelTransferCommand,
  CreateTransferCommand,
  QuoteTransferCommand,
  Transfer,
  TransferQuote,
} from './transfer.js';

export const TRANSFER_API_ROUTES = {
  quoteTransfer: '/v1/transfers/quotes',
  createTransfer: '/v1/transfers',
  getTransfer: '/v1/transfers/:transferId',
  authorizeTransfer: '/v1/transfers/:transferId/authorize',
  cancelTransfer: '/v1/transfers/:transferId/cancel',
} as const;

export type TransferApiRouteName = keyof typeof TRANSFER_API_ROUTES;

export interface TransferApiContract {
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
  quoteTransfer: 'POST',
  createTransfer: 'POST',
  getTransfer: 'GET',
  authorizeTransfer: 'POST',
  cancelTransfer: 'POST',
};

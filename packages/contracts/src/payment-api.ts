import type { PageRequest, PageResponse } from './pagination.js';
import type {
  CreatePaymentCommand,
  Payment,
  PaymentChannel,
  PaymentStatus,
} from './payment.js';
import type {
  CreatePaymentRequestCommand,
  PaymentRequest,
  PaymentRequestStatus,
} from './payment-request.js';
import type { TransactionReceipt } from './transaction-history.js';

export const PAYMENT_API_ROUTES = {
  listPayments: '/v1/payments',
  createPayment: '/v1/payments',
  getPayment: '/v1/payments/:paymentId',
  cancelPayment: '/v1/payments/:paymentId/cancel',
  reversePayment: '/v1/payments/:paymentId/reverse',
  getPaymentReceipt: '/v1/payments/:paymentId/receipt',
  listPaymentRequests: '/v1/payment-requests',
  createPaymentRequest: '/v1/payment-requests',
  getPaymentRequest: '/v1/payment-requests/:paymentRequestId',
  cancelPaymentRequest: '/v1/payment-requests/:paymentRequestId/cancel',
  payPaymentRequest: '/v1/payment-requests/:paymentRequestId/pay',
} as const;

export type PaymentApiRouteName = keyof typeof PAYMENT_API_ROUTES;

export interface ListPaymentsQuery extends PageRequest {
  readonly payerWalletId?: string;
  readonly beneficiaryId?: string;
  readonly beneficiaryWalletId?: string;
  readonly status?: PaymentStatus;
  readonly channel?: PaymentChannel;
  readonly clientReference?: string;
  readonly createdFrom?: string;
  readonly createdTo?: string;
}

export interface CancelPaymentCommand {
  readonly reason: string;
}

export interface ReversePaymentCommand {
  readonly reason: string;
  readonly idempotencyKey: CreatePaymentCommand['idempotencyKey'];
}

export interface ListPaymentRequestsQuery extends PageRequest {
  readonly requesterWalletId?: string;
  readonly payerWalletId?: string;
  readonly status?: PaymentRequestStatus;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly expiresBefore?: string;
}

export interface CancelPaymentRequestCommand {
  readonly reason: string;
}

export interface PayPaymentRequestCommand {
  readonly payerWalletId: string;
  readonly idempotencyKey: CreatePaymentCommand['idempotencyKey'];
}

export interface PaymentApiContract {
  readonly listPayments: {
    readonly method: 'GET';
    readonly request: ListPaymentsQuery;
    readonly response: PageResponse<Payment>;
  };
  readonly createPayment: {
    readonly method: 'POST';
    readonly request: CreatePaymentCommand;
    readonly response: Payment;
  };
  readonly getPayment: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: Payment;
  };
  readonly cancelPayment: {
    readonly method: 'POST';
    readonly request: CancelPaymentCommand;
    readonly response: Payment;
  };
  readonly reversePayment: {
    readonly method: 'POST';
    readonly request: ReversePaymentCommand;
    readonly response: Payment;
  };
  readonly getPaymentReceipt: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: TransactionReceipt;
  };
  readonly listPaymentRequests: {
    readonly method: 'GET';
    readonly request: ListPaymentRequestsQuery;
    readonly response: PageResponse<PaymentRequest>;
  };
  readonly createPaymentRequest: {
    readonly method: 'POST';
    readonly request: CreatePaymentRequestCommand;
    readonly response: PaymentRequest;
  };
  readonly getPaymentRequest: {
    readonly method: 'GET';
    readonly request: undefined;
    readonly response: PaymentRequest;
  };
  readonly cancelPaymentRequest: {
    readonly method: 'POST';
    readonly request: CancelPaymentRequestCommand;
    readonly response: PaymentRequest;
  };
  readonly payPaymentRequest: {
    readonly method: 'POST';
    readonly request: PayPaymentRequestCommand;
    readonly response: Payment;
  };
}

export const PAYMENT_API_METHODS: Readonly<
  Record<PaymentApiRouteName, PaymentApiContract[PaymentApiRouteName]['method']>
> = {
  listPayments: 'GET',
  createPayment: 'POST',
  getPayment: 'GET',
  cancelPayment: 'POST',
  reversePayment: 'POST',
  getPaymentReceipt: 'GET',
  listPaymentRequests: 'GET',
  createPaymentRequest: 'POST',
  getPaymentRequest: 'GET',
  cancelPaymentRequest: 'POST',
  payPaymentRequest: 'POST',
};

import type { Payment, CreatePaymentCommand } from './payment.js';
import type { CreatePaymentRequestCommand, PaymentRequest } from './payment-request.js';

export const PAYMENT_API_ROUTES = {
  createPayment: '/v1/payments',
  getPayment: '/v1/payments/:paymentId',
  createPaymentRequest: '/v1/payment-requests',
  getPaymentRequest: '/v1/payment-requests/:paymentRequestId',
  payPaymentRequest: '/v1/payment-requests/:paymentRequestId/pay',
} as const;

export type PaymentApiRouteName = keyof typeof PAYMENT_API_ROUTES;

export interface PayPaymentRequestCommand {
  readonly payerWalletId: string;
  readonly idempotencyKey: CreatePaymentCommand['idempotencyKey'];
}

export interface PaymentApiContract {
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
  readonly payPaymentRequest: {
    readonly method: 'POST';
    readonly request: PayPaymentRequestCommand;
    readonly response: Payment;
  };
}

export const PAYMENT_API_METHODS: Readonly<
  Record<PaymentApiRouteName, PaymentApiContract[PaymentApiRouteName]['method']>
> = {
  createPayment: 'POST',
  getPayment: 'GET',
  createPaymentRequest: 'POST',
  getPaymentRequest: 'GET',
  payPaymentRequest: 'POST',
};

import type { PageResponse } from './pagination.js';
import type { CreateRefundCommand, Refund, RefundReason, RefundStatus, TransitionRefundCommand } from './refund.js';

export const REFUND_API_ROUTES = {
  refunds: '/v1/refunds',
  refundById: '/v1/refunds/:refundId',
  transitionRefund: '/v1/refunds/:refundId/status',
} as const;

export const REFUND_API_METHODS = {
  listRefunds: 'GET',
  getRefund: 'GET',
  createRefund: 'POST',
  transitionRefund: 'POST',
} as const;

export interface ListRefundsQuery {
  readonly paymentId?: string;
  readonly status?: RefundStatus;
  readonly reason?: RefundReason;
  readonly requestedBy?: string;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface CreateRefundRequest extends Omit<CreateRefundCommand, 'refundId' | 'createdAt'> {
  readonly correlationId: string;
}

export interface TransitionRefundRequest extends TransitionRefundCommand {
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface RefundApiContract {
  readonly listRefunds: {
    readonly method: typeof REFUND_API_METHODS.listRefunds;
    readonly route: typeof REFUND_API_ROUTES.refunds;
    readonly query: ListRefundsQuery;
    readonly response: PageResponse<Refund>;
  };
  readonly getRefund: {
    readonly method: typeof REFUND_API_METHODS.getRefund;
    readonly route: typeof REFUND_API_ROUTES.refundById;
    readonly response: Refund;
  };
  readonly createRefund: {
    readonly method: typeof REFUND_API_METHODS.createRefund;
    readonly route: typeof REFUND_API_ROUTES.refunds;
    readonly request: CreateRefundRequest;
    readonly response: Refund;
  };
  readonly transitionRefund: {
    readonly method: typeof REFUND_API_METHODS.transitionRefund;
    readonly route: typeof REFUND_API_ROUTES.transitionRefund;
    readonly request: TransitionRefundRequest;
    readonly response: Refund;
  };
}

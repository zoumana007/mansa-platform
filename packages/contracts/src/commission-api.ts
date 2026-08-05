import type {
  CommissionAccrual,
  CommissionPolicy,
  CommissionQuote,
} from './commission.js';
import type { Money } from './money.js';
import type { PageResponse } from './pagination.js';

export const COMMISSION_API_METHODS = ['GET', 'POST', 'PATCH'] as const;

export const COMMISSION_API_ROUTES = {
  listPolicies: '/v1/commission-policies',
  createPolicy: '/v1/commission-policies',
  getPolicy: '/v1/commission-policies/:policyId',
  updatePolicy: '/v1/commission-policies/:policyId',
  quoteCommission: '/v1/commission-policies/:policyId/quote',
  listAccruals: '/v1/commission-accruals',
  getAccrual: '/v1/commission-accruals/:accrualId',
  reverseAccrual: '/v1/commission-accruals/:accrualId/reverse',
  markAccrualPaid: '/v1/commission-accruals/:accrualId/mark-paid',
} as const;

export type CommissionApiRouteName = keyof typeof COMMISSION_API_ROUTES;

export interface ListCommissionPoliciesQuery {
  readonly operationType?: string;
  readonly channel?: string;
  readonly countryCode?: string;
  readonly currency?: string;
  readonly status?: CommissionPolicy['status'];
  readonly page?: number;
  readonly limit?: number;
}

export interface ListCommissionAccrualsQuery {
  readonly transactionId?: string;
  readonly beneficiaryType?: CommissionAccrual['beneficiaryType'];
  readonly beneficiaryId?: string;
  readonly status?: CommissionAccrual['status'];
  readonly from?: string;
  readonly to?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface QuoteCommissionCommand {
  readonly amount: Money;
  readonly operationType: string;
  readonly channel?: string;
  readonly countryCode: string;
  readonly occurredAt?: string;
}

export interface ReverseCommissionAccrualCommand {
  readonly reasonCode: string;
  readonly reason?: string;
}

export interface MarkCommissionAccrualPaidCommand {
  readonly payoutReference: string;
  readonly paidAt: string;
}

export interface CommissionApiContract {
  readonly listPolicies: {
    readonly method: 'GET';
    readonly path: typeof COMMISSION_API_ROUTES.listPolicies;
    readonly query: ListCommissionPoliciesQuery;
    readonly response: PageResponse<CommissionPolicy>;
  };
  readonly createPolicy: {
    readonly method: 'POST';
    readonly path: typeof COMMISSION_API_ROUTES.createPolicy;
    readonly body: CommissionPolicy;
    readonly response: CommissionPolicy;
  };
  readonly getPolicy: {
    readonly method: 'GET';
    readonly path: typeof COMMISSION_API_ROUTES.getPolicy;
    readonly response: CommissionPolicy;
  };
  readonly updatePolicy: {
    readonly method: 'PATCH';
    readonly path: typeof COMMISSION_API_ROUTES.updatePolicy;
    readonly body: Partial<CommissionPolicy>;
    readonly response: CommissionPolicy;
  };
  readonly quoteCommission: {
    readonly method: 'POST';
    readonly path: typeof COMMISSION_API_ROUTES.quoteCommission;
    readonly body: QuoteCommissionCommand;
    readonly response: CommissionQuote;
  };
  readonly listAccruals: {
    readonly method: 'GET';
    readonly path: typeof COMMISSION_API_ROUTES.listAccruals;
    readonly query: ListCommissionAccrualsQuery;
    readonly response: PageResponse<CommissionAccrual>;
  };
  readonly getAccrual: {
    readonly method: 'GET';
    readonly path: typeof COMMISSION_API_ROUTES.getAccrual;
    readonly response: CommissionAccrual;
  };
  readonly reverseAccrual: {
    readonly method: 'POST';
    readonly path: typeof COMMISSION_API_ROUTES.reverseAccrual;
    readonly body: ReverseCommissionAccrualCommand;
    readonly response: CommissionAccrual;
  };
  readonly markAccrualPaid: {
    readonly method: 'POST';
    readonly path: typeof COMMISSION_API_ROUTES.markAccrualPaid;
    readonly body: MarkCommissionAccrualPaidCommand;
    readonly response: CommissionAccrual;
  };
}

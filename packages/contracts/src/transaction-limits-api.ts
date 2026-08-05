import type { Money } from './money.js';
import type { PageResponse } from './pagination.js';
import type {
  TransactionLimit,
  TransactionLimitConsumption,
  TransactionLimitEvaluation,
} from './transaction-limits.js';

export const TRANSACTION_LIMIT_API_METHODS = ['GET', 'POST', 'PATCH'] as const;

export const TRANSACTION_LIMIT_API_ROUTES = {
  listLimits: '/v1/transaction-limits',
  createLimit: '/v1/transaction-limits',
  getLimit: '/v1/transaction-limits/:limitId',
  updateLimit: '/v1/transaction-limits/:limitId',
  evaluateLimit: '/v1/transaction-limits/:limitId/evaluate',
  getConsumption: '/v1/transaction-limits/:limitId/consumption',
  suspendLimit: '/v1/transaction-limits/:limitId/suspend',
  activateLimit: '/v1/transaction-limits/:limitId/activate',
} as const;

export type TransactionLimitApiRouteName = keyof typeof TRANSACTION_LIMIT_API_ROUTES;

export interface ListTransactionLimitsQuery {
  readonly scope?: TransactionLimit['scope'];
  readonly scopeId?: string;
  readonly period?: TransactionLimit['period'];
  readonly status?: TransactionLimit['status'];
  readonly currency?: string;
  readonly effectiveAt?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface CreateTransactionLimitCommand {
  readonly scope: TransactionLimit['scope'];
  readonly scopeId: string;
  readonly period: TransactionLimit['period'];
  readonly amount: Money;
  readonly effectiveFrom: string;
  readonly effectiveUntil?: string;
}

export interface UpdateTransactionLimitCommand {
  readonly amount?: Money;
  readonly effectiveFrom?: string;
  readonly effectiveUntil?: string;
}

export interface EvaluateTransactionLimitCommand {
  readonly requestedAmount: Money;
  readonly evaluatedAt?: string;
}

export interface ChangeTransactionLimitStatusCommand {
  readonly reasonCode: string;
  readonly reason?: string;
}

export interface TransactionLimitApiContract {
  readonly listLimits: {
    readonly method: 'GET';
    readonly path: typeof TRANSACTION_LIMIT_API_ROUTES.listLimits;
    readonly query: ListTransactionLimitsQuery;
    readonly response: PageResponse<TransactionLimit>;
  };
  readonly createLimit: {
    readonly method: 'POST';
    readonly path: typeof TRANSACTION_LIMIT_API_ROUTES.createLimit;
    readonly body: CreateTransactionLimitCommand;
    readonly response: TransactionLimit;
  };
  readonly getLimit: {
    readonly method: 'GET';
    readonly path: typeof TRANSACTION_LIMIT_API_ROUTES.getLimit;
    readonly response: TransactionLimit;
  };
  readonly updateLimit: {
    readonly method: 'PATCH';
    readonly path: typeof TRANSACTION_LIMIT_API_ROUTES.updateLimit;
    readonly body: UpdateTransactionLimitCommand;
    readonly response: TransactionLimit;
  };
  readonly evaluateLimit: {
    readonly method: 'POST';
    readonly path: typeof TRANSACTION_LIMIT_API_ROUTES.evaluateLimit;
    readonly body: EvaluateTransactionLimitCommand;
    readonly response: TransactionLimitEvaluation;
  };
  readonly getConsumption: {
    readonly method: 'GET';
    readonly path: typeof TRANSACTION_LIMIT_API_ROUTES.getConsumption;
    readonly response: TransactionLimitConsumption;
  };
  readonly suspendLimit: {
    readonly method: 'POST';
    readonly path: typeof TRANSACTION_LIMIT_API_ROUTES.suspendLimit;
    readonly body: ChangeTransactionLimitStatusCommand;
    readonly response: TransactionLimit;
  };
  readonly activateLimit: {
    readonly method: 'POST';
    readonly path: typeof TRANSACTION_LIMIT_API_ROUTES.activateLimit;
    readonly body: ChangeTransactionLimitStatusCommand;
    readonly response: TransactionLimit;
  };
}

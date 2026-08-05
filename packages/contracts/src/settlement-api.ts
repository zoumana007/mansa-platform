import type { PageResponse } from './pagination.js';
import type {
  SettlementBatch,
  SettlementBatchStatus,
  TransitionSettlementBatchCommand,
} from './settlement.js';

export const SETTLEMENT_API_ROUTES = {
  settlements: '/v1/settlements',
  settlementById: '/v1/settlements/:settlementId',
  transitionSettlement: '/v1/settlements/:settlementId/status',
} as const;

export const SETTLEMENT_API_METHODS = {
  listSettlements: 'GET',
  getSettlement: 'GET',
  createSettlement: 'POST',
  transitionSettlement: 'POST',
} as const;

export interface ListSettlementsQuery {
  readonly merchantId?: string;
  readonly status?: SettlementBatchStatus;
  readonly periodStartFrom?: string;
  readonly periodEndTo?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface CreateSettlementRequest {
  readonly merchantId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly grossAmountMinor: number;
  readonly feeAmountMinor: number;
  readonly adjustmentAmountMinor?: number;
  readonly currency: string;
  readonly destination: SettlementBatch['destination'];
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface TransitionSettlementRequest
  extends TransitionSettlementBatchCommand {
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface SettlementApiContract {
  readonly listSettlements: {
    readonly method: typeof SETTLEMENT_API_METHODS.listSettlements;
    readonly route: typeof SETTLEMENT_API_ROUTES.settlements;
    readonly query: ListSettlementsQuery;
    readonly response: PageResponse<SettlementBatch>;
  };
  readonly getSettlement: {
    readonly method: typeof SETTLEMENT_API_METHODS.getSettlement;
    readonly route: typeof SETTLEMENT_API_ROUTES.settlementById;
    readonly response: SettlementBatch;
  };
  readonly createSettlement: {
    readonly method: typeof SETTLEMENT_API_METHODS.createSettlement;
    readonly route: typeof SETTLEMENT_API_ROUTES.settlements;
    readonly request: CreateSettlementRequest;
    readonly response: SettlementBatch;
  };
  readonly transitionSettlement: {
    readonly method: typeof SETTLEMENT_API_METHODS.transitionSettlement;
    readonly route: typeof SETTLEMENT_API_ROUTES.transitionSettlement;
    readonly request: TransitionSettlementRequest;
    readonly response: SettlementBatch;
  };
}

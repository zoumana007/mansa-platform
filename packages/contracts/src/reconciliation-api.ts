import type { PageResponse } from './pagination.js';
import type {
  ReconciliationItem,
  ReconciliationMismatchReason,
  ReconciliationStatus,
  ResolveReconciliationItemCommand,
} from './reconciliation.js';

export const RECONCILIATION_API_ROUTES = {
  batches: '/v1/reconciliation/batches',
  batchById: '/v1/reconciliation/batches/:batchId',
  items: '/v1/reconciliation/items',
  itemById: '/v1/reconciliation/items/:itemId',
  resolveItem: '/v1/reconciliation/items/:itemId/resolve',
} as const;

export const RECONCILIATION_API_METHODS = {
  listBatches: 'GET',
  getBatch: 'GET',
  listItems: 'GET',
  getItem: 'GET',
  resolveItem: 'POST',
} as const;

export type ReconciliationApiRouteName = keyof typeof RECONCILIATION_API_ROUTES;

export interface ReconciliationBatchSummary {
  readonly batchId: string;
  readonly providerId: string;
  readonly sourceFileReference?: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly totalItems: number;
  readonly matchedItems: number;
  readonly mismatchedItems: number;
  readonly resolvedItems: number;
  readonly ignoredItems: number;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface ListReconciliationBatchesQuery {
  readonly providerId?: string;
  readonly periodStartFrom?: string;
  readonly periodEndTo?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface ListReconciliationItemsQuery {
  readonly batchId?: string;
  readonly providerId?: string;
  readonly status?: ReconciliationStatus;
  readonly mismatchReason?: ReconciliationMismatchReason;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface ResolveReconciliationItemRequest
  extends ResolveReconciliationItemCommand {
  readonly idempotencyKey: string;
  readonly correlationId: string;
}

export interface ReconciliationApiContract {
  readonly listBatches: {
    readonly method: typeof RECONCILIATION_API_METHODS.listBatches;
    readonly route: typeof RECONCILIATION_API_ROUTES.batches;
    readonly query: ListReconciliationBatchesQuery;
    readonly response: PageResponse<ReconciliationBatchSummary>;
  };
  readonly getBatch: {
    readonly method: typeof RECONCILIATION_API_METHODS.getBatch;
    readonly route: typeof RECONCILIATION_API_ROUTES.batchById;
    readonly response: ReconciliationBatchSummary;
  };
  readonly listItems: {
    readonly method: typeof RECONCILIATION_API_METHODS.listItems;
    readonly route: typeof RECONCILIATION_API_ROUTES.items;
    readonly query: ListReconciliationItemsQuery;
    readonly response: PageResponse<ReconciliationItem>;
  };
  readonly getItem: {
    readonly method: typeof RECONCILIATION_API_METHODS.getItem;
    readonly route: typeof RECONCILIATION_API_ROUTES.itemById;
    readonly response: ReconciliationItem;
  };
  readonly resolveItem: {
    readonly method: typeof RECONCILIATION_API_METHODS.resolveItem;
    readonly route: typeof RECONCILIATION_API_ROUTES.resolveItem;
    readonly request: ResolveReconciliationItemRequest;
    readonly response: ReconciliationItem;
  };
}

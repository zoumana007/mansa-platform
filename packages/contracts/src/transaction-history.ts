import type { Money } from './money.js';
import type { PageRequest, PageResponse } from './pagination.js';
import type { TransactionStatus, TransactionType } from './transaction.js';

export const TRANSACTION_DIRECTIONS = ['INCOMING', 'OUTGOING', 'NEUTRAL'] as const;
export type TransactionDirection = (typeof TRANSACTION_DIRECTIONS)[number];

export const TRANSACTION_HISTORY_SORT_FIELDS = ['CREATED_AT', 'AMOUNT'] as const;
export type TransactionHistorySortField =
  (typeof TRANSACTION_HISTORY_SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['ASC', 'DESC'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface TransactionCounterparty {
  readonly id?: string;
  readonly displayName: string;
  readonly accountHint?: string;
  readonly institutionName?: string;
}

export interface TransactionHistoryItem {
  readonly id: string;
  readonly reference: string;
  readonly walletId: string;
  readonly type: TransactionType;
  readonly status: TransactionStatus;
  readonly direction: TransactionDirection;
  readonly amount: Money;
  readonly fee?: Money;
  readonly description?: string;
  readonly counterparty?: TransactionCounterparty;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface TransactionHistoryFilter {
  readonly walletIds?: readonly string[];
  readonly types?: readonly TransactionType[];
  readonly statuses?: readonly TransactionStatus[];
  readonly directions?: readonly TransactionDirection[];
  readonly currency?: string;
  readonly minimumAmountMinor?: string;
  readonly maximumAmountMinor?: string;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly search?: string;
}

export interface ListTransactionHistoryQuery {
  readonly filter?: TransactionHistoryFilter;
  readonly pagination?: PageRequest;
  readonly sortField?: TransactionHistorySortField;
  readonly sortDirection?: SortDirection;
}

export type TransactionHistoryPage = PageResponse<TransactionHistoryItem>;

export interface TransactionReceipt {
  readonly transaction: TransactionHistoryItem;
  readonly issuedAt: string;
  readonly locale: string;
  readonly receiptNumber: string;
  readonly merchantName?: string;
  readonly paymentMethodLabel?: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export function isTransactionDirection(value: string): value is TransactionDirection {
  return TRANSACTION_DIRECTIONS.includes(value as TransactionDirection);
}

export function isTransactionHistorySortField(
  value: string,
): value is TransactionHistorySortField {
  return TRANSACTION_HISTORY_SORT_FIELDS.includes(
    value as TransactionHistorySortField,
  );
}

export function isSortDirection(value: string): value is SortDirection {
  return SORT_DIRECTIONS.includes(value as SortDirection);
}

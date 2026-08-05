import type { PageRequest, PageResponse } from './pagination.js';
import type {
  BudgetConsumption,
  BudgetPeriod,
  BudgetScope,
  BudgetStatus,
  CreateSpendingBudgetCommand,
  SpendingBudget,
  UpdateSpendingBudgetCommand,
} from './budget.js';

export const BUDGET_API_METHODS = ['GET', 'POST', 'PATCH'] as const;

export const BUDGET_API_ROUTES = {
  list: '/v1/budgets',
  create: '/v1/budgets',
  get: '/v1/budgets/:budgetId',
  update: '/v1/budgets/:budgetId',
  listConsumptions: '/v1/budgets/:budgetId/consumptions',
} as const;

export type BudgetApiRouteName = keyof typeof BUDGET_API_ROUTES;

export interface ListBudgetsQuery extends PageRequest {
  ownerId?: string;
  walletId?: string;
  status?: BudgetStatus;
  period?: BudgetPeriod;
  scope?: BudgetScope;
}

export interface ListBudgetConsumptionsQuery extends PageRequest {
  budgetId: string;
  from?: string;
  to?: string;
}

export interface BudgetApiContract {
  list(query: ListBudgetsQuery): Promise<PageResponse<SpendingBudget>>;
  create(command: CreateSpendingBudgetCommand): Promise<SpendingBudget>;
  get(budgetId: string): Promise<SpendingBudget>;
  update(command: UpdateSpendingBudgetCommand): Promise<SpendingBudget>;
  listConsumptions(
    query: ListBudgetConsumptionsQuery,
  ): Promise<PageResponse<BudgetConsumption>>;
}

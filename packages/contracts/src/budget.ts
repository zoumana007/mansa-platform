import type { Money } from './money.js';

export const BUDGET_PERIODS = ['WEEKLY', 'MONTHLY', 'CUSTOM'] as const;
export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];

export const BUDGET_STATUSES = ['ACTIVE', 'PAUSED', 'ARCHIVED'] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export const BUDGET_SCOPES = ['TOTAL', 'CATEGORY', 'MERCHANT'] as const;
export type BudgetScope = (typeof BUDGET_SCOPES)[number];

export interface SpendingBudget {
  id: string;
  ownerId: string;
  walletId: string;
  name: string;
  scope: BudgetScope;
  categoryCode?: string;
  merchantId?: string;
  limit: Money;
  spent: Money;
  period: BudgetPeriod;
  periodStart: string;
  periodEnd: string;
  warningThresholdPercentage: number;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpendingBudgetCommand {
  ownerId: string;
  walletId: string;
  name: string;
  scope: BudgetScope;
  categoryCode?: string;
  merchantId?: string;
  limit: Money;
  period: BudgetPeriod;
  periodStart?: string;
  periodEnd?: string;
  warningThresholdPercentage?: number;
}

export interface UpdateSpendingBudgetCommand {
  budgetId: string;
  name?: string;
  limit?: Money;
  warningThresholdPercentage?: number;
  status?: BudgetStatus;
}

export interface BudgetConsumption {
  budgetId: string;
  amount: Money;
  transactionId: string;
  occurredAt: string;
}

export interface BudgetEvaluation {
  budgetId: string;
  projectedSpent: Money;
  remaining: Money;
  warningThresholdReached: boolean;
  exceeded: boolean;
}

export function isBudgetPeriod(value: string): value is BudgetPeriod {
  return BUDGET_PERIODS.includes(value as BudgetPeriod);
}

export function isBudgetStatus(value: string): value is BudgetStatus {
  return BUDGET_STATUSES.includes(value as BudgetStatus);
}

export function isBudgetScope(value: string): value is BudgetScope {
  return BUDGET_SCOPES.includes(value as BudgetScope);
}

export function isValidBudgetWarningThreshold(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 100;
}

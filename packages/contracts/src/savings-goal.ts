import type { IdempotencyKey } from './idempotency.js';
import type { Money } from './money.js';

export const SAVINGS_GOAL_STATUSES = [
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type SavingsGoalStatus = (typeof SAVINGS_GOAL_STATUSES)[number];

export const SAVINGS_CONTRIBUTION_SOURCES = [
  'MANUAL',
  'SCHEDULED',
  'ROUND_UP',
  'CASHBACK',
] as const;

export type SavingsContributionSource =
  (typeof SAVINGS_CONTRIBUTION_SOURCES)[number];

export interface SavingsGoal {
  id: string;
  ownerId: string;
  walletId: string;
  name: string;
  targetAmount: Money;
  savedAmount: Money;
  status: SavingsGoalStatus;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateSavingsGoalCommand {
  ownerId: string;
  walletId: string;
  name: string;
  targetAmount: Money;
  targetDate?: string;
  idempotencyKey: IdempotencyKey;
}

export interface UpdateSavingsGoalCommand {
  goalId: string;
  name?: string;
  targetAmount?: Money;
  targetDate?: string | null;
  status?: Extract<SavingsGoalStatus, 'ACTIVE' | 'PAUSED' | 'CANCELLED'>;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: Money;
  source: SavingsContributionSource;
  transactionId: string;
  createdAt: string;
}

export interface ContributeToSavingsGoalCommand {
  goalId: string;
  sourceWalletId: string;
  amount: Money;
  source: SavingsContributionSource;
  idempotencyKey: IdempotencyKey;
}

export function isSavingsGoalStatus(value: string): value is SavingsGoalStatus {
  return SAVINGS_GOAL_STATUSES.includes(value as SavingsGoalStatus);
}

export function isSavingsContributionSource(
  value: string,
): value is SavingsContributionSource {
  return SAVINGS_CONTRIBUTION_SOURCES.includes(
    value as SavingsContributionSource,
  );
}

export function isFinalSavingsGoalStatus(
  status: SavingsGoalStatus,
): status is Extract<SavingsGoalStatus, 'COMPLETED' | 'CANCELLED'> {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

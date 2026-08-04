import type { IdempotencyKey } from './idempotency.js';
import type { Money } from './money.js';

export const SAVINGS_GOAL_STATUSES = ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const;
export type SavingsGoalStatus = (typeof SAVINGS_GOAL_STATUSES)[number];

export const SAVINGS_FUNDING_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export type SavingsFundingFrequency = (typeof SAVINGS_FUNDING_FREQUENCIES)[number];

export interface SavingsGoal {
  readonly id: string;
  readonly walletId: string;
  readonly name: string;
  readonly targetAmount: Money;
  readonly savedAmount: Money;
  readonly status: SavingsGoalStatus;
  readonly targetDate?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SavingsFundingRule {
  readonly id: string;
  readonly goalId: string;
  readonly amount: Money;
  readonly frequency: SavingsFundingFrequency;
  readonly nextExecutionAt: string;
  readonly enabled: boolean;
}

export interface CreateSavingsGoalCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly walletId: string;
  readonly name: string;
  readonly targetAmount: Money;
  readonly targetDate?: string;
}

export interface FundSavingsGoalCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly goalId: string;
  readonly sourceWalletId: string;
  readonly amount: Money;
}

export interface WithdrawSavingsGoalCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly goalId: string;
  readonly destinationWalletId: string;
  readonly amount: Money;
  readonly reason?: string;
}

export interface ConfigureSavingsFundingRuleCommand {
  readonly idempotencyKey: IdempotencyKey;
  readonly goalId: string;
  readonly amount: Money;
  readonly frequency: SavingsFundingFrequency;
  readonly firstExecutionAt: string;
}

export function isSavingsGoalStatus(value: string): value is SavingsGoalStatus {
  return SAVINGS_GOAL_STATUSES.includes(value as SavingsGoalStatus);
}

export function isSavingsFundingFrequency(value: string): value is SavingsFundingFrequency {
  return SAVINGS_FUNDING_FREQUENCIES.includes(value as SavingsFundingFrequency);
}

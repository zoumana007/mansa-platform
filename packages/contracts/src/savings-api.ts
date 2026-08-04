import type { PageRequest, PageResponse } from './pagination.js';
import type {
  ConfigureSavingsFundingRuleCommand,
  CreateSavingsGoalCommand,
  FundSavingsGoalCommand,
  SavingsFundingRule,
  SavingsGoal,
  WithdrawSavingsGoalCommand,
} from './savings.js';

export const SAVINGS_API_ROUTES = {
  createGoal: '/v1/savings/goals',
  listGoals: '/v1/savings/goals',
  getGoal: '/v1/savings/goals/:goalId',
  fundGoal: '/v1/savings/goals/:goalId/fund',
  withdrawGoal: '/v1/savings/goals/:goalId/withdraw',
  configureFundingRule: '/v1/savings/goals/:goalId/funding-rule',
} as const;

export const SAVINGS_API_METHODS = {
  createGoal: 'POST',
  listGoals: 'GET',
  getGoal: 'GET',
  fundGoal: 'POST',
  withdrawGoal: 'POST',
  configureFundingRule: 'PUT',
} as const;

export type SavingsApiRouteName = keyof typeof SAVINGS_API_ROUTES;

export interface ListSavingsGoalsQuery extends PageRequest {
  readonly walletId?: string;
  readonly status?: SavingsGoal['status'];
}

export interface SavingsApiContract {
  readonly createGoal: {
    readonly request: CreateSavingsGoalCommand;
    readonly response: SavingsGoal;
  };
  readonly listGoals: {
    readonly request: ListSavingsGoalsQuery;
    readonly response: PageResponse<SavingsGoal>;
  };
  readonly getGoal: {
    readonly request: { readonly goalId: string };
    readonly response: SavingsGoal;
  };
  readonly fundGoal: {
    readonly request: FundSavingsGoalCommand;
    readonly response: SavingsGoal;
  };
  readonly withdrawGoal: {
    readonly request: WithdrawSavingsGoalCommand;
    readonly response: SavingsGoal;
  };
  readonly configureFundingRule: {
    readonly request: ConfigureSavingsFundingRuleCommand;
    readonly response: SavingsFundingRule;
  };
}

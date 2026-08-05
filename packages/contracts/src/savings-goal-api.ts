import type { PageRequest, PageResponse } from './pagination.js';
import type {
  ContributeToSavingsGoalCommand,
  CreateSavingsGoalCommand,
  SavingsContribution,
  SavingsGoal,
  SavingsGoalStatus,
  UpdateSavingsGoalCommand,
} from './savings-goal.js';

export const SAVINGS_GOAL_API_ROUTES = {
  listGoals: '/v1/savings-goals',
  createGoal: '/v1/savings-goals',
  getGoal: '/v1/savings-goals/:goalId',
  updateGoal: '/v1/savings-goals/:goalId',
  contribute: '/v1/savings-goals/:goalId/contributions',
  listContributions: '/v1/savings-goals/:goalId/contributions',
} as const;

export const SAVINGS_GOAL_API_METHODS = {
  listGoals: 'GET',
  createGoal: 'POST',
  getGoal: 'GET',
  updateGoal: 'PATCH',
  contribute: 'POST',
  listContributions: 'GET',
} as const;

export type SavingsGoalApiRouteName = keyof typeof SAVINGS_GOAL_API_ROUTES;

export interface ListSavingsGoalsQuery extends PageRequest {
  ownerId: string;
  walletId?: string;
  status?: SavingsGoalStatus;
}

export interface ListSavingsContributionsQuery extends PageRequest {
  goalId: string;
}

export interface SavingsGoalApiContract {
  listGoals(query: ListSavingsGoalsQuery): Promise<PageResponse<SavingsGoal>>;
  createGoal(command: CreateSavingsGoalCommand): Promise<SavingsGoal>;
  getGoal(goalId: string): Promise<SavingsGoal>;
  updateGoal(command: UpdateSavingsGoalCommand): Promise<SavingsGoal>;
  contribute(
    command: ContributeToSavingsGoalCommand,
  ): Promise<SavingsContribution>;
  listContributions(
    query: ListSavingsContributionsQuery,
  ): Promise<PageResponse<SavingsContribution>>;
}

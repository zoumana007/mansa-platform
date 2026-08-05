import type { PageRequest, PageResponse } from './pagination.js';
import type {
  CreateLoyaltyProgramCommand,
  EarnLoyaltyPointsCommand,
  EnrollLoyaltyAccountCommand,
  LoyaltyAccount,
  LoyaltyProgram,
  LoyaltyProgramStatus,
  LoyaltyTransaction,
  RedeemRewardCommand,
  Reward,
  RewardRedemption,
  RewardStatus,
  RewardType,
  UpdateLoyaltyProgramCommand,
} from './loyalty.js';

export const LOYALTY_API_METHODS = ['GET', 'POST', 'PATCH'] as const;

export const LOYALTY_API_ROUTES = {
  listPrograms: '/v1/loyalty/programs',
  createProgram: '/v1/loyalty/programs',
  getProgram: '/v1/loyalty/programs/:programId',
  updateProgram: '/v1/loyalty/programs/:programId',
  enrollAccount: '/v1/loyalty/accounts',
  getAccount: '/v1/loyalty/accounts/:accountId',
  listTransactions: '/v1/loyalty/accounts/:accountId/transactions',
  earnPoints: '/v1/loyalty/accounts/:accountId/earn',
  listRewards: '/v1/loyalty/programs/:programId/rewards',
  redeemReward: '/v1/loyalty/rewards/:rewardId/redemptions',
  getRedemption: '/v1/loyalty/redemptions/:redemptionId',
} as const;

export type LoyaltyApiRouteName = keyof typeof LOYALTY_API_ROUTES;

export interface ListLoyaltyProgramsQuery extends PageRequest {
  merchantId?: string;
  status?: LoyaltyProgramStatus;
}

export interface ListLoyaltyTransactionsQuery extends PageRequest {
  accountId: string;
  from?: string;
  to?: string;
}

export interface ListRewardsQuery extends PageRequest {
  programId: string;
  status?: RewardStatus;
  type?: RewardType;
}

export interface LoyaltyApiContract {
  listPrograms(query: ListLoyaltyProgramsQuery): Promise<PageResponse<LoyaltyProgram>>;
  createProgram(command: CreateLoyaltyProgramCommand): Promise<LoyaltyProgram>;
  getProgram(programId: string): Promise<LoyaltyProgram>;
  updateProgram(command: UpdateLoyaltyProgramCommand): Promise<LoyaltyProgram>;
  enrollAccount(command: EnrollLoyaltyAccountCommand): Promise<LoyaltyAccount>;
  getAccount(accountId: string): Promise<LoyaltyAccount>;
  listTransactions(
    query: ListLoyaltyTransactionsQuery,
  ): Promise<PageResponse<LoyaltyTransaction>>;
  earnPoints(command: EarnLoyaltyPointsCommand): Promise<LoyaltyTransaction>;
  listRewards(query: ListRewardsQuery): Promise<PageResponse<Reward>>;
  redeemReward(command: RedeemRewardCommand): Promise<RewardRedemption>;
  getRedemption(redemptionId: string): Promise<RewardRedemption>;
}

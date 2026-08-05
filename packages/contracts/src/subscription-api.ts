import type { PageRequest, PageResponse } from './pagination.js';
import type {
  CreateManualSubscriptionCommand,
  RecurringSubscription,
  SubscriptionCharge,
  SubscriptionFrequency,
  SubscriptionSource,
  SubscriptionStatus,
  UpdateSubscriptionCommand,
} from './subscription.js';

export const SUBSCRIPTION_API_METHODS = ['GET', 'POST', 'PATCH'] as const;

export const SUBSCRIPTION_API_ROUTES = {
  list: '/v1/subscriptions',
  create: '/v1/subscriptions',
  get: '/v1/subscriptions/:subscriptionId',
  update: '/v1/subscriptions/:subscriptionId',
  listCharges: '/v1/subscriptions/:subscriptionId/charges',
} as const;

export type SubscriptionApiRouteName = keyof typeof SUBSCRIPTION_API_ROUTES;

export interface ListSubscriptionsQuery extends PageRequest {
  ownerId?: string;
  walletId?: string;
  status?: SubscriptionStatus;
  frequency?: SubscriptionFrequency;
  source?: SubscriptionSource;
}

export interface ListSubscriptionChargesQuery extends PageRequest {
  subscriptionId: string;
  from?: string;
  to?: string;
}

export interface SubscriptionApiContract {
  list(
    query: ListSubscriptionsQuery,
  ): Promise<PageResponse<RecurringSubscription>>;
  create(
    command: CreateManualSubscriptionCommand,
  ): Promise<RecurringSubscription>;
  get(subscriptionId: string): Promise<RecurringSubscription>;
  update(command: UpdateSubscriptionCommand): Promise<RecurringSubscription>;
  listCharges(
    query: ListSubscriptionChargesQuery,
  ): Promise<PageResponse<SubscriptionCharge>>;
}

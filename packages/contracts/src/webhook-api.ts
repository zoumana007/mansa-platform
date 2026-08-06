import type { IdempotencyKey } from './idempotency.js';
import type {
  CreateWebhookSubscriptionCommand,
  RetryWebhookDeliveryCommand,
  UpdateWebhookSubscriptionCommand,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookSubscription,
  WebhookSubscriptionStatus,
} from './webhook.js';

export const WEBHOOK_API_ROUTES = {
  subscriptions: '/v1/webhooks/subscriptions',
  subscriptionById: '/v1/webhooks/subscriptions/:subscriptionId',
  deliveries: '/v1/webhooks/deliveries',
  deliveryById: '/v1/webhooks/deliveries/:deliveryId',
  retryDelivery: '/v1/webhooks/deliveries/:deliveryId/retry',
} as const;

export const WEBHOOK_API_METHODS = {
  createSubscription: 'POST',
  listSubscriptions: 'GET',
  getSubscription: 'GET',
  updateSubscription: 'PATCH',
  listDeliveries: 'GET',
  getDelivery: 'GET',
  retryDelivery: 'POST',
} as const;

export type WebhookApiRouteName = keyof typeof WEBHOOK_API_ROUTES;

export interface ListWebhookSubscriptionsQuery {
  readonly ownerId?: string;
  readonly status?: WebhookSubscriptionStatus;
  readonly eventType?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface ListWebhookDeliveriesQuery {
  readonly subscriptionId?: string;
  readonly eventId?: string;
  readonly status?: WebhookDeliveryStatus;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface WebhookApiContract {
  readonly createSubscription: {
    readonly method: typeof WEBHOOK_API_METHODS.createSubscription;
    readonly route: typeof WEBHOOK_API_ROUTES.subscriptions;
    readonly request: CreateWebhookSubscriptionCommand;
    readonly response: WebhookSubscription;
  };
  readonly listSubscriptions: {
    readonly method: typeof WEBHOOK_API_METHODS.listSubscriptions;
    readonly route: typeof WEBHOOK_API_ROUTES.subscriptions;
    readonly query: ListWebhookSubscriptionsQuery;
    readonly response: readonly WebhookSubscription[];
  };
  readonly getSubscription: {
    readonly method: typeof WEBHOOK_API_METHODS.getSubscription;
    readonly route: typeof WEBHOOK_API_ROUTES.subscriptionById;
    readonly response: WebhookSubscription;
  };
  readonly updateSubscription: {
    readonly method: typeof WEBHOOK_API_METHODS.updateSubscription;
    readonly route: typeof WEBHOOK_API_ROUTES.subscriptionById;
    readonly request: UpdateWebhookSubscriptionCommand;
    readonly response: WebhookSubscription;
  };
  readonly listDeliveries: {
    readonly method: typeof WEBHOOK_API_METHODS.listDeliveries;
    readonly route: typeof WEBHOOK_API_ROUTES.deliveries;
    readonly query: ListWebhookDeliveriesQuery;
    readonly response: readonly WebhookDelivery[];
  };
  readonly getDelivery: {
    readonly method: typeof WEBHOOK_API_METHODS.getDelivery;
    readonly route: typeof WEBHOOK_API_ROUTES.deliveryById;
    readonly response: WebhookDelivery;
  };
  readonly retryDelivery: {
    readonly method: typeof WEBHOOK_API_METHODS.retryDelivery;
    readonly route: typeof WEBHOOK_API_ROUTES.retryDelivery;
    readonly request: RetryWebhookDeliveryCommand & {
      readonly idempotencyKey: IdempotencyKey;
    };
    readonly response: WebhookDelivery;
  };
}

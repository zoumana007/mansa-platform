import type { IdempotencyKey } from './idempotency.js';

export const WEBHOOK_DELIVERY_STATUSES = [
  'PENDING',
  'DELIVERING',
  'DELIVERED',
  'RETRY_SCHEDULED',
  'FAILED',
  'CANCELLED',
] as const;

export type WebhookDeliveryStatus = (typeof WEBHOOK_DELIVERY_STATUSES)[number];

export const WEBHOOK_SUBSCRIPTION_STATUSES = ['ACTIVE', 'PAUSED', 'DISABLED'] as const;
export type WebhookSubscriptionStatus = (typeof WEBHOOK_SUBSCRIPTION_STATUSES)[number];

export interface WebhookSubscription {
  readonly id: string;
  readonly ownerId: string;
  readonly endpointUrl: string;
  readonly eventTypes: readonly string[];
  readonly status: WebhookSubscriptionStatus;
  readonly signingKeyReference: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WebhookEvent<TPayload = Readonly<Record<string, unknown>>> {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly aggregateId?: string;
  readonly correlationId: string;
  readonly schemaVersion: number;
  readonly payload: TPayload;
}

export interface WebhookDelivery {
  readonly id: string;
  readonly subscriptionId: string;
  readonly eventId: string;
  readonly status: WebhookDeliveryStatus;
  readonly attemptCount: number;
  readonly nextAttemptAt?: string;
  readonly deliveredAt?: string;
  readonly lastHttpStatus?: number;
  readonly lastErrorCode?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateWebhookSubscriptionCommand {
  readonly ownerId: string;
  readonly endpointUrl: string;
  readonly eventTypes: readonly string[];
  readonly idempotencyKey: IdempotencyKey;
}

export interface UpdateWebhookSubscriptionCommand {
  readonly subscriptionId: string;
  readonly endpointUrl?: string;
  readonly eventTypes?: readonly string[];
  readonly status?: WebhookSubscriptionStatus;
}

export interface RetryWebhookDeliveryCommand {
  readonly deliveryId: string;
  readonly reason: string;
  readonly idempotencyKey: IdempotencyKey;
}

export function isWebhookDeliveryStatus(value: string): value is WebhookDeliveryStatus {
  return WEBHOOK_DELIVERY_STATUSES.includes(value as WebhookDeliveryStatus);
}

export function isWebhookSubscriptionStatus(value: string): value is WebhookSubscriptionStatus {
  return WEBHOOK_SUBSCRIPTION_STATUSES.includes(value as WebhookSubscriptionStatus);
}

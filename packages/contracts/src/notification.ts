import type { PageRequest, PageResponse } from './pagination.js';

export const NOTIFICATION_CHANNELS = [
  'IN_APP',
  'PUSH',
  'SMS',
  'EMAIL',
  'WHATSAPP',
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_STATUSES = [
  'PENDING',
  'QUEUED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export interface NotificationRecipient {
  readonly userId?: string;
  readonly phoneNumber?: string;
  readonly email?: string;
  readonly deviceId?: string;
  readonly locale?: string;
}

export interface SendNotificationCommand {
  readonly idempotencyKey: string;
  readonly templateKey: string;
  readonly channels: readonly NotificationChannel[];
  readonly recipient: NotificationRecipient;
  readonly variables: Readonly<Record<string, string | number | boolean>>;
  readonly correlationId?: string;
  readonly scheduledAt?: string;
}

export interface NotificationDelivery {
  readonly id: string;
  readonly templateKey: string;
  readonly channel: NotificationChannel;
  readonly status: NotificationStatus;
  readonly recipientMasked: string;
  readonly providerReference?: string;
  readonly failureCode?: string;
  readonly correlationId?: string;
  readonly scheduledAt?: string;
  readonly sentAt?: string;
  readonly deliveredAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const NOTIFICATION_API_ROUTES = {
  send: '/v1/notifications',
  listDeliveries: '/v1/notifications/deliveries',
  getDelivery: '/v1/notifications/deliveries/:deliveryId',
  cancelDelivery: '/v1/notifications/deliveries/:deliveryId/cancel',
} as const;

export const NOTIFICATION_API_METHODS = {
  send: 'POST',
  listDeliveries: 'GET',
  getDelivery: 'GET',
  cancelDelivery: 'POST',
} as const;

export type NotificationApiRouteName = keyof typeof NOTIFICATION_API_ROUTES;

export interface ListNotificationDeliveriesQuery extends PageRequest {
  readonly userId?: string;
  readonly channel?: NotificationChannel;
  readonly status?: NotificationStatus;
  readonly correlationId?: string;
  readonly createdFrom?: string;
  readonly createdTo?: string;
}

export interface CancelNotificationDeliveryCommand {
  readonly deliveryId: string;
  readonly reason: string;
}

export interface NotificationApiContract {
  readonly send: {
    readonly request: SendNotificationCommand;
    readonly response: readonly NotificationDelivery[];
  };
  readonly listDeliveries: {
    readonly request: ListNotificationDeliveriesQuery;
    readonly response: PageResponse<NotificationDelivery>;
  };
  readonly getDelivery: {
    readonly request: { readonly deliveryId: string };
    readonly response: NotificationDelivery;
  };
  readonly cancelDelivery: {
    readonly request: CancelNotificationDeliveryCommand;
    readonly response: NotificationDelivery;
  };
}

export function isNotificationChannel(value: string): value is NotificationChannel {
  return (NOTIFICATION_CHANNELS as readonly string[]).includes(value);
}

export function isNotificationStatus(value: string): value is NotificationStatus {
  return (NOTIFICATION_STATUSES as readonly string[]).includes(value);
}

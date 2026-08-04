import type { PageRequest, PageResponse } from './pagination.js';
import type {
  NotificationChannel,
  NotificationDelivery,
  NotificationStatus,
  SendNotificationCommand,
} from './notification.js';

export const NOTIFICATION_API_ROUTES = {
  send: '/v1/notifications',
  listDeliveries: '/v1/notifications/deliveries',
  getDelivery: '/v1/notifications/deliveries/:deliveryId',
  cancelDelivery: '/v1/notifications/deliveries/:deliveryId/cancel',
  retryDelivery: '/v1/notifications/deliveries/:deliveryId/retry',
} as const;

export const NOTIFICATION_API_METHODS = {
  send: 'POST',
  listDeliveries: 'GET',
  getDelivery: 'GET',
  cancelDelivery: 'POST',
  retryDelivery: 'POST',
} as const;

export type NotificationApiRouteName = keyof typeof NOTIFICATION_API_ROUTES;

export interface ListNotificationDeliveriesQuery extends PageRequest {
  userId?: string;
  templateKey?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  correlationId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface NotificationDeliveryActionCommand {
  readonly deliveryId: string;
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface SendNotificationResult {
  readonly deliveries: readonly NotificationDelivery[];
}

export interface NotificationApiContract {
  send: {
    method: typeof NOTIFICATION_API_METHODS.send;
    path: typeof NOTIFICATION_API_ROUTES.send;
    request: SendNotificationCommand;
    response: SendNotificationResult;
  };
  listDeliveries: {
    method: typeof NOTIFICATION_API_METHODS.listDeliveries;
    path: typeof NOTIFICATION_API_ROUTES.listDeliveries;
    request: ListNotificationDeliveriesQuery;
    response: PageResponse<NotificationDelivery>;
  };
  getDelivery: {
    method: typeof NOTIFICATION_API_METHODS.getDelivery;
    path: typeof NOTIFICATION_API_ROUTES.getDelivery;
    request: { deliveryId: string };
    response: NotificationDelivery;
  };
  cancelDelivery: {
    method: typeof NOTIFICATION_API_METHODS.cancelDelivery;
    path: typeof NOTIFICATION_API_ROUTES.cancelDelivery;
    request: NotificationDeliveryActionCommand;
    response: NotificationDelivery;
  };
  retryDelivery: {
    method: typeof NOTIFICATION_API_METHODS.retryDelivery;
    path: typeof NOTIFICATION_API_ROUTES.retryDelivery;
    request: NotificationDeliveryActionCommand;
    response: NotificationDelivery;
  };
}

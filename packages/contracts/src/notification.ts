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
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function isNotificationChannel(value: string): value is NotificationChannel {
  return (NOTIFICATION_CHANNELS as readonly string[]).includes(value);
}

export function isNotificationStatus(value: string): value is NotificationStatus {
  return (NOTIFICATION_STATUSES as readonly string[]).includes(value);
}

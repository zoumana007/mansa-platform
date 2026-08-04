import type { ApiErrorResponse, ApiSuccessResponse } from './api-response.js';

export const INTEGRATION_API_PREFIX = '/v1/integrations' as const;

export const INTEGRATION_API_ROUTES = {
  listPartners: `${INTEGRATION_API_PREFIX}/partners`,
  getPartner: `${INTEGRATION_API_PREFIX}/partners/:partnerId`,
  registerPartner: `${INTEGRATION_API_PREFIX}/partners`,
  updatePartnerStatus: `${INTEGRATION_API_PREFIX}/partners/:partnerId/status`,
  rotateCredentials: `${INTEGRATION_API_PREFIX}/partners/:partnerId/credentials/rotation`,
  receiveWebhook: `${INTEGRATION_API_PREFIX}/webhooks/:partnerId/:eventType`,
  replayWebhook: `${INTEGRATION_API_PREFIX}/webhook-deliveries/:deliveryId/replay`,
  getWebhookDelivery: `${INTEGRATION_API_PREFIX}/webhook-deliveries/:deliveryId`,
} as const;

export const INTEGRATION_API_METHODS = {
  listPartners: 'GET',
  getPartner: 'GET',
  registerPartner: 'POST',
  updatePartnerStatus: 'POST',
  rotateCredentials: 'POST',
  receiveWebhook: 'POST',
  replayWebhook: 'POST',
  getWebhookDelivery: 'GET',
} as const;

export type IntegrationPartnerType =
  | 'BANK'
  | 'MOBILE_MONEY'
  | 'CARD_PROCESSOR'
  | 'PUBLIC_SERVICE'
  | 'IDENTITY_PROVIDER'
  | 'NOTIFICATION_PROVIDER'
  | 'OTHER';

export type IntegrationPartnerStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'DEGRADED'
  | 'SUSPENDED'
  | 'DISABLED';

export interface IntegrationPartnerData {
  readonly partnerId: string;
  readonly code: string;
  readonly displayName: string;
  readonly type: IntegrationPartnerType;
  readonly status: IntegrationPartnerStatus;
  readonly countryCodes: readonly string[];
  readonly capabilities: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ListIntegrationPartnersData {
  readonly items: readonly IntegrationPartnerData[];
  readonly nextCursor?: string;
}

export type ListIntegrationPartnersResponse =
  ApiSuccessResponse<ListIntegrationPartnersData>;
export type GetIntegrationPartnerResponse = ApiSuccessResponse<IntegrationPartnerData>;

export interface RegisterIntegrationPartnerRequest {
  readonly code: string;
  readonly displayName: string;
  readonly type: IntegrationPartnerType;
  readonly countryCodes: readonly string[];
  readonly capabilities: readonly string[];
  readonly idempotencyKey: string;
}

export type RegisterIntegrationPartnerResponse =
  ApiSuccessResponse<IntegrationPartnerData>;

export interface UpdateIntegrationPartnerStatusRequest {
  readonly status: Exclude<IntegrationPartnerStatus, 'DRAFT'>;
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface RotateIntegrationCredentialsRequest {
  readonly credentialType: 'API_KEY' | 'OAUTH_CLIENT' | 'SIGNING_KEY' | 'MTLS_CERTIFICATE';
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface CredentialRotationData {
  readonly rotationId: string;
  readonly partnerId: string;
  readonly credentialType: RotateIntegrationCredentialsRequest['credentialType'];
  readonly status: 'SCHEDULED' | 'COMPLETED' | 'FAILED';
  readonly effectiveAt?: string;
}

export type RotateIntegrationCredentialsResponse =
  ApiSuccessResponse<CredentialRotationData>;

export interface PartnerWebhookEnvelope<TPayload = Readonly<Record<string, unknown>>> {
  readonly deliveryId: string;
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly payload: TPayload;
}

export interface WebhookReceiptData {
  readonly deliveryId: string;
  readonly status: 'ACCEPTED' | 'DUPLICATE' | 'REJECTED';
  readonly receivedAt: string;
}

export type ReceivePartnerWebhookResponse = ApiSuccessResponse<WebhookReceiptData>;

export interface ReplayWebhookRequest {
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface WebhookDeliveryData {
  readonly deliveryId: string;
  readonly partnerId: string;
  readonly eventType: string;
  readonly status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'DEAD_LETTER';
  readonly attemptCount: number;
  readonly lastAttemptAt?: string;
  readonly nextAttemptAt?: string;
  readonly correlationId: string;
}

export type ReplayWebhookResponse = ApiSuccessResponse<WebhookDeliveryData>;
export type GetWebhookDeliveryResponse = ApiSuccessResponse<WebhookDeliveryData>;
export type IntegrationApiErrorResponse = ApiErrorResponse;

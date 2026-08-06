export const VOICE_CALL_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type VoiceCallDirection = (typeof VOICE_CALL_DIRECTIONS)[number];

export const VOICE_CALL_STATUSES = [
  'QUEUED',
  'RINGING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;
export type VoiceCallStatus = (typeof VOICE_CALL_STATUSES)[number];

export const VOICE_ACTOR_TYPES = [
  'CUSTOMER',
  'MERCHANT',
  'EMPLOYEE',
  'PUBLIC_AGENT',
  'UNKNOWN',
] as const;
export type VoiceActorType = (typeof VOICE_ACTOR_TYPES)[number];

export const VOICE_INTENT_TYPES = [
  'GENERAL_INFORMATION',
  'ORDER_CREATE',
  'ORDER_UPDATE',
  'ORDER_CANCEL',
  'APPOINTMENT_CREATE',
  'APPOINTMENT_UPDATE',
  'APPOINTMENT_CANCEL',
  'PAYMENT_INFORMATION',
  'SUPPORT_REQUEST',
  'HUMAN_HANDOFF',
] as const;
export type VoiceIntentType = (typeof VOICE_INTENT_TYPES)[number];

export const VOICE_RETENTION_POLICIES = [
  'EPHEMERAL',
  'SHORT_TERM',
  'ORGANIZATION_MANAGED',
] as const;
export type VoiceRetentionPolicy = (typeof VOICE_RETENTION_POLICIES)[number];

export const VOICE_EXPORT_STATUSES = [
  'REQUESTED',
  'PREPARING',
  'READY',
  'EXPIRED',
  'FAILED',
] as const;
export type VoiceExportStatus = (typeof VOICE_EXPORT_STATUSES)[number];

export interface VoiceCallParticipant {
  readonly actorType: VoiceActorType;
  readonly actorId?: string;
  readonly phoneNumberMasked?: string;
  readonly displayName?: string;
}

export interface VoiceCall {
  readonly id: string;
  readonly organizationId: string;
  readonly merchantId?: string;
  readonly direction: VoiceCallDirection;
  readonly status: VoiceCallStatus;
  readonly caller: VoiceCallParticipant;
  readonly recipient: VoiceCallParticipant;
  readonly locale: string;
  readonly correlationId?: string;
  readonly startedAt?: string;
  readonly endedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface VoiceIntent {
  readonly id: string;
  readonly callId: string;
  readonly type: VoiceIntentType;
  readonly confidenceBasisPoints: number;
  readonly requiresHumanConfirmation: boolean;
  readonly payload: Readonly<Record<string, string | number | boolean | null>>;
  readonly createdAt: string;
}

export interface CreateVoiceCallCommand {
  readonly idempotencyKey: string;
  readonly organizationId: string;
  readonly merchantId?: string;
  readonly direction: VoiceCallDirection;
  readonly caller: VoiceCallParticipant;
  readonly recipient: VoiceCallParticipant;
  readonly locale: string;
  readonly correlationId?: string;
}

export interface ConfirmVoiceIntentCommand {
  readonly callId: string;
  readonly intentId: string;
  readonly confirmedByActorId: string;
  readonly idempotencyKey: string;
}

export interface VoiceRetentionConfiguration {
  readonly organizationId: string;
  readonly policy: VoiceRetentionPolicy;
  readonly transcriptRetentionHours: number;
  readonly recordingRetentionHours: number;
  readonly retainStructuredBusinessData: boolean;
  readonly allowOrganizationExport: boolean;
}

export interface VoiceDataExport {
  readonly id: string;
  readonly organizationId: string;
  readonly requestedByActorId: string;
  readonly status: VoiceExportStatus;
  readonly encryptedObjectReference?: string;
  readonly expiresAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function isVoiceCallDirection(value: string): value is VoiceCallDirection {
  return (VOICE_CALL_DIRECTIONS as readonly string[]).includes(value);
}

export function isVoiceCallStatus(value: string): value is VoiceCallStatus {
  return (VOICE_CALL_STATUSES as readonly string[]).includes(value);
}

export function isVoiceActorType(value: string): value is VoiceActorType {
  return (VOICE_ACTOR_TYPES as readonly string[]).includes(value);
}

export function isVoiceIntentType(value: string): value is VoiceIntentType {
  return (VOICE_INTENT_TYPES as readonly string[]).includes(value);
}

export function isVoiceRetentionPolicy(value: string): value is VoiceRetentionPolicy {
  return (VOICE_RETENTION_POLICIES as readonly string[]).includes(value);
}

export function isVoiceExportStatus(value: string): value is VoiceExportStatus {
  return (VOICE_EXPORT_STATUSES as readonly string[]).includes(value);
}

export function isValidVoiceConfidenceBasisPoints(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 10_000;
}

export function isValidVoiceRetentionHours(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 24 * 365;
}

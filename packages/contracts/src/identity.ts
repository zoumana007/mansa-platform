export const USER_STATUSES = [
  'PENDING_VERIFICATION',
  'ACTIVE',
  'LOCKED',
  'SUSPENDED',
  'CLOSED',
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  'UNVERIFIED',
  'PENDING',
  'VERIFIED',
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const SESSION_STATUSES = ['ACTIVE', 'REVOKED', 'EXPIRED'] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export interface UserIdentity {
  readonly userId: string;
  readonly countryCode: string;
  readonly phoneNumber: string;
  readonly phoneVerificationStatus: VerificationStatus;
  readonly emailAddress?: string;
  readonly emailVerificationStatus?: VerificationStatus;
  readonly preferredLocale: string;
  readonly status: UserStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DeviceSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly deviceLabel?: string;
  readonly status: SessionStatus;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  readonly expiresAt: string;
  readonly revokedAt?: string;
  readonly revocationReason?: string;
}

export interface AuthenticationTokens {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: string;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: string;
}

export interface AuthenticatedSession {
  readonly identity: UserIdentity;
  readonly session: DeviceSession;
  readonly tokens: AuthenticationTokens;
}

export function isUserStatus(value: string): value is UserStatus {
  return USER_STATUSES.includes(value as UserStatus);
}

export function isVerificationStatus(
  value: string,
): value is VerificationStatus {
  return VERIFICATION_STATUSES.includes(value as VerificationStatus);
}

export function isSessionStatus(value: string): value is SessionStatus {
  return SESSION_STATUSES.includes(value as SessionStatus);
}

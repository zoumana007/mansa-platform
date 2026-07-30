import type { AuthenticatedSession } from './identity.js';

export const OTP_PURPOSES = [
  'SIGN_UP',
  'SIGN_IN',
  'RECOVER_ACCOUNT',
  'CHANGE_PHONE',
  'STEP_UP',
] as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export interface RequestOtpCommand {
  readonly phoneNumber: string;
  readonly countryCode: string;
  readonly purpose: OtpPurpose;
  readonly idempotencyKey: string;
}

export interface OtpChallenge {
  readonly challengeId: string;
  readonly purpose: OtpPurpose;
  readonly expiresAt: string;
  readonly resendAvailableAt: string;
  readonly attemptsRemaining: number;
}

export interface VerifyOtpCommand {
  readonly challengeId: string;
  readonly code: string;
  readonly deviceId: string;
  readonly deviceLabel?: string;
}

export interface RegisterUserCommand {
  readonly challengeId: string;
  readonly countryCode: string;
  readonly preferredLocale: string;
  readonly password: string;
  readonly deviceId: string;
  readonly deviceLabel?: string;
  readonly acceptedTermsVersion: string;
  readonly idempotencyKey: string;
}

export interface PasswordSignInCommand {
  readonly phoneNumber: string;
  readonly countryCode: string;
  readonly password: string;
  readonly deviceId: string;
  readonly deviceLabel?: string;
}

export interface RefreshSessionCommand {
  readonly sessionId: string;
  readonly refreshToken: string;
  readonly deviceId: string;
}

export interface RevokeSessionCommand {
  readonly sessionId: string;
  readonly reason?: string;
}

export interface AuthenticationResult extends AuthenticatedSession {
  readonly requiresStepUp: boolean;
}

export function isOtpPurpose(value: string): value is OtpPurpose {
  return OTP_PURPOSES.includes(value as OtpPurpose);
}

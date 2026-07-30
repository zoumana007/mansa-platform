export const API_ERROR_CODES = [
  'AUTHENTICATION_REQUIRED',
  'FORBIDDEN',
  'VALIDATION_FAILED',
  'RESOURCE_NOT_FOUND',
  'CONFLICT',
  'IDEMPOTENCY_CONFLICT',
  'RATE_LIMITED',
  'PARTNER_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorDetails {
  readonly field?: string;
  readonly reason: string;
}

export interface ApiErrorResponse {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly requestId: string;
  readonly timestamp: string;
  readonly details?: readonly ApiErrorDetails[];
}

export function isApiErrorCode(value: string): value is ApiErrorCode {
  return (API_ERROR_CODES as readonly string[]).includes(value);
}

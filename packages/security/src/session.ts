import type { Environment } from "./index.js";

export const SESSION_CHANNELS = [
  "MOBILE_CLIENT",
  "MOBILE_MERCHANT",
  "TPE_ANDROID",
  "ADMIN_LITE",
  "ADMIN_WEB",
  "BUSINESS_WEB",
  "PUBLIC_WEB",
] as const;

export type SessionChannel = (typeof SESSION_CHANNELS)[number];
export type AssuranceLevel = "BASIC" | "STRONG" | "HARDWARE_BOUND";
export type SessionStatus = "ACTIVE" | "REVOKED";
export type SessionRevocationReason =
  | "USER_LOGOUT"
  | "EXPIRED"
  | "CREDENTIAL_RESET"
  | "DEVICE_LOST"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_CLOSED"
  | "TOKEN_REUSE_DETECTED"
  | "SECURITY_DECISION"
  | "GLOBAL_ROTATION";

export interface SecuritySession {
  readonly sessionId: string;
  readonly actorId: string;
  readonly channel: SessionChannel;
  readonly environment: Environment;
  readonly assuranceLevel: AssuranceLevel;
  readonly status: SessionStatus;
  readonly createdAt: string;
  readonly lastActivityAt: string;
  readonly absoluteExpiresAt: string;
  readonly revokedAt?: string;
  readonly revocationReason?: SessionRevocationReason;
  readonly deviceFingerprint?: string;
}

export interface SessionEvaluationRequest {
  readonly session: SecuritySession;
  readonly environment: Environment;
  readonly evaluatedAt: string;
  readonly inactivityTimeoutSeconds: number;
  readonly minimumAssuranceLevel?: AssuranceLevel;
  readonly requiredDeviceFingerprint?: string;
}

export type SessionDenialReason =
  | "SESSION_REVOKED"
  | "SESSION_EXPIRED"
  | "SESSION_INACTIVE"
  | "ENVIRONMENT_MISMATCH"
  | "INSUFFICIENT_ASSURANCE"
  | "DEVICE_MISMATCH";

export type SessionDecision =
  | { readonly allowed: true; readonly reason: "SESSION_VALID" }
  | { readonly allowed: false; readonly reason: SessionDenialReason };

const ASSURANCE_RANK: Readonly<Record<AssuranceLevel, number>> = {
  BASIC: 0,
  STRONG: 1,
  HARDWARE_BOUND: 2,
};

function parseTimestamp(value: string, field: string): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(`${field} must be a valid ISO 8601 date`);
  }
  return timestamp;
}

export function evaluateSession(
  request: SessionEvaluationRequest,
): SessionDecision {
  const { session } = request;

  if (session.status === "REVOKED") {
    return { allowed: false, reason: "SESSION_REVOKED" };
  }

  if (session.environment !== request.environment) {
    return { allowed: false, reason: "ENVIRONMENT_MISMATCH" };
  }

  const evaluatedAt = parseTimestamp(request.evaluatedAt, "evaluatedAt");
  const absoluteExpiresAt = parseTimestamp(
    session.absoluteExpiresAt,
    "absoluteExpiresAt",
  );

  if (evaluatedAt >= absoluteExpiresAt) {
    return { allowed: false, reason: "SESSION_EXPIRED" };
  }

  if (
    !Number.isInteger(request.inactivityTimeoutSeconds) ||
    request.inactivityTimeoutSeconds < 0
  ) {
    throw new Error("inactivityTimeoutSeconds must be a non-negative integer");
  }

  const lastActivityAt = parseTimestamp(
    session.lastActivityAt,
    "lastActivityAt",
  );
  const inactivityMilliseconds = request.inactivityTimeoutSeconds * 1_000;

  if (evaluatedAt - lastActivityAt >= inactivityMilliseconds) {
    return { allowed: false, reason: "SESSION_INACTIVE" };
  }

  if (
    request.minimumAssuranceLevel !== undefined &&
    ASSURANCE_RANK[session.assuranceLevel] <
      ASSURANCE_RANK[request.minimumAssuranceLevel]
  ) {
    return { allowed: false, reason: "INSUFFICIENT_ASSURANCE" };
  }

  if (
    request.requiredDeviceFingerprint !== undefined &&
    session.deviceFingerprint !== request.requiredDeviceFingerprint
  ) {
    return { allowed: false, reason: "DEVICE_MISMATCH" };
  }

  return { allowed: true, reason: "SESSION_VALID" };
}

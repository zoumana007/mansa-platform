import type {
  AuthorizationDecision,
  AuthorizationRequest,
  AuthorizationScope,
  Environment,
  Permission,
  RiskLevel,
  Role,
} from "./index.js";

export type AuditActorType = "USER" | "SERVICE_ACCOUNT" | "SYSTEM";
export type AuditDecision = "ALLOW" | "DENY";

export interface AuthorizationAuditMetadata {
  readonly eventId: string;
  readonly correlationId: string;
  readonly occurredAt: string;
  readonly actorType: AuditActorType;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly currency?: string;
  readonly channel?: string;
}

export interface AuthorizationAuditEvent {
  readonly eventId: string;
  readonly correlationId: string;
  readonly occurredAt: string;
  readonly actorId: string;
  readonly actorType: AuditActorType;
  readonly roles: readonly Role[];
  readonly permission: Permission;
  readonly environment: Environment;
  readonly decision: AuditDecision;
  readonly reason: AuthorizationDecision["reason"];
  readonly scope: AuthorizationScope;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly resourceOwnerId?: string;
  readonly riskLevel?: RiskLevel;
  readonly amountMinor?: string;
  readonly currency?: string;
  readonly requiresDualApproval: boolean;
  readonly approverActorId?: string;
  readonly channel?: string;
}

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${field} must not be empty`);
  }
  return normalized;
}

function normalizeOccurredAt(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error("occurredAt must be a valid ISO 8601 date");
  }
  return new Date(timestamp).toISOString();
}

export function createAuthorizationAuditEvent(
  request: AuthorizationRequest,
  decision: AuthorizationDecision,
  metadata: AuthorizationAuditMetadata,
): AuthorizationAuditEvent {
  return {
    eventId: requireNonEmpty(metadata.eventId, "eventId"),
    correlationId: requireNonEmpty(metadata.correlationId, "correlationId"),
    occurredAt: normalizeOccurredAt(metadata.occurredAt),
    actorId: request.actor.actorId,
    actorType: metadata.actorType,
    roles: [...request.actor.roles],
    permission: request.permission,
    environment: request.environment,
    decision: decision.allowed ? "ALLOW" : "DENY",
    reason: decision.reason,
    scope: { ...(request.resourceScope ?? request.actor.scope) },
    ...(metadata.resourceType === undefined
      ? {}
      : { resourceType: metadata.resourceType }),
    ...(metadata.resourceId === undefined
      ? {}
      : { resourceId: metadata.resourceId }),
    ...(request.resourceOwnerId === undefined
      ? {}
      : { resourceOwnerId: request.resourceOwnerId }),
    ...(request.riskLevel === undefined
      ? {}
      : { riskLevel: request.riskLevel }),
    ...(request.amountMinor === undefined
      ? {}
      : { amountMinor: request.amountMinor.toString() }),
    ...(metadata.currency === undefined ? {} : { currency: metadata.currency }),
    requiresDualApproval: request.requiresDualApproval === true,
    ...(request.approverActorId === undefined
      ? {}
      : { approverActorId: request.approverActorId }),
    ...(metadata.channel === undefined ? {} : { channel: metadata.channel }),
  };
}

export const AUDIT_OUTCOMES = ['SUCCESS', 'FAILURE', 'DENIED'] as const;
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export type AuditActorType = 'USER' | 'ADMIN' | 'SERVICE' | 'PARTNER';

export interface AuditActor {
  readonly id: string;
  readonly type: AuditActorType;
  readonly role?: string;
  readonly organizationId?: string;
}

export interface AuditContext {
  readonly correlationId: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly deviceId?: string;
  readonly countryCode?: string;
}

export interface AuditEvent {
  readonly id: string;
  readonly occurredAt: string;
  readonly actor: AuditActor;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId?: string;
  readonly outcome: AuditOutcome;
  readonly reason?: string;
  readonly context: AuditContext;
  readonly metadata?: Readonly<Record<string, string | number | boolean | null>>;
}

export function isAuditOutcome(value: string): value is AuditOutcome {
  return AUDIT_OUTCOMES.some((outcome) => outcome === value);
}

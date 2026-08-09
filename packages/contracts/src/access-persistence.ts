import type { AccessEntitlement } from './access-mobility.js';

export type AccessUsagePeriod = NonNullable<AccessEntitlement['period']>;

export interface AccessQuotaWindow {
  readonly period: AccessUsagePeriod;
  readonly startInclusive: string;
  readonly endExclusive: string;
}

export interface AccessPersistenceIdentity {
  readonly decisionKey: string;
  readonly usageKey: string;
  readonly quotaReservationKey: string;
}

function parseOccurrence(occurredAt: string): Date {
  const parsed = new Date(occurredAt);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('occurredAt must be a valid ISO-8601 timestamp');
  }
  return parsed;
}

function iso(date: Date): string {
  return date.toISOString();
}

export function calculateAccessQuotaWindow(
  occurredAt: string,
  period: AccessUsagePeriod,
): AccessQuotaWindow {
  const occurrence = parseOccurrence(occurredAt);
  const start = new Date(occurrence.getTime());
  const end = new Date(occurrence.getTime());

  if (period === 'DAY') {
    start.setUTCHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setUTCDate(end.getUTCDate() + 1);
  } else if (period === 'WEEK') {
    start.setUTCHours(0, 0, 0, 0);
    const day = start.getUTCDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    start.setUTCDate(start.getUTCDate() - daysSinceMonday);
    end.setTime(start.getTime());
    end.setUTCDate(end.getUTCDate() + 7);
  } else {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setUTCMonth(end.getUTCMonth() + 1);
  }

  return {
    period,
    startInclusive: iso(start),
    endExclusive: iso(end),
  };
}

function assertKeyPart(name: string, value: string): void {
  if (value.trim().length === 0) throw new Error(`${name} must not be empty`);
  if (value.includes(':')) throw new Error(`${name} must not contain ':'`);
}

export function createAccessPersistenceIdentity(input: {
  readonly organizationId: string;
  readonly requestId: string;
  readonly entitlementId: string;
  readonly quotaWindow: AccessQuotaWindow;
}): AccessPersistenceIdentity {
  assertKeyPart('organizationId', input.organizationId);
  assertKeyPart('requestId', input.requestId);
  assertKeyPart('entitlementId', input.entitlementId);

  const requestScope = `${input.organizationId}:${input.requestId}`;
  const quotaScope = `${input.organizationId}:${input.entitlementId}:${input.quotaWindow.startInclusive}:${input.requestId}`;

  return {
    decisionKey: `access-decision:${requestScope}`,
    usageKey: `access-usage:${requestScope}`,
    quotaReservationKey: `access-quota:${quotaScope}`,
  };
}

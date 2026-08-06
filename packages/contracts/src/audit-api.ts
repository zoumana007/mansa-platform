import type { AuditActorType, AuditEvent, AuditOutcome } from './audit.js';
import type { PageRequest, PageResponse } from './pagination.js';

export const AUDIT_API_ROUTES = {
  listEvents: '/v1/audit/events',
  getEvent: '/v1/audit/events/:eventId',
  exportEvents: '/v1/audit/exports',
  getExport: '/v1/audit/exports/:exportId',
} as const;

export const AUDIT_API_METHODS = {
  listEvents: 'GET',
  getEvent: 'GET',
  exportEvents: 'POST',
  getExport: 'GET',
} as const;

export const AUDIT_EXPORT_FORMATS = ['CSV', 'JSONL'] as const;
export type AuditExportFormat = (typeof AUDIT_EXPORT_FORMATS)[number];

export const AUDIT_EXPORT_STATUSES = ['PENDING', 'PROCESSING', 'READY', 'FAILED', 'EXPIRED'] as const;
export type AuditExportStatus = (typeof AUDIT_EXPORT_STATUSES)[number];

export type AuditApiRouteName = keyof typeof AUDIT_API_ROUTES;

export interface ListAuditEventsQuery extends PageRequest {
  actorId?: string;
  actorType?: AuditActorType;
  organizationId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: AuditOutcome;
  correlationId?: string;
  countryCode?: string;
  occurredFrom?: string;
  occurredTo?: string;
}

export interface CreateAuditExportCommand {
  readonly format: AuditExportFormat;
  readonly filters: Omit<ListAuditEventsQuery, 'cursor' | 'limit'>;
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface AuditExport {
  readonly id: string;
  readonly status: AuditExportStatus;
  readonly format: AuditExportFormat;
  readonly requestedAt: string;
  readonly requestedBy: string;
  readonly reason: string;
  readonly expiresAt?: string;
  readonly objectReference?: string;
  readonly failureReason?: string;
}

export interface AuditApiContract {
  listEvents: {
    method: typeof AUDIT_API_METHODS.listEvents;
    path: typeof AUDIT_API_ROUTES.listEvents;
    request: ListAuditEventsQuery;
    response: PageResponse<AuditEvent>;
  };
  getEvent: {
    method: typeof AUDIT_API_METHODS.getEvent;
    path: typeof AUDIT_API_ROUTES.getEvent;
    request: { eventId: string };
    response: AuditEvent;
  };
  exportEvents: {
    method: typeof AUDIT_API_METHODS.exportEvents;
    path: typeof AUDIT_API_ROUTES.exportEvents;
    request: CreateAuditExportCommand;
    response: AuditExport;
  };
  getExport: {
    method: typeof AUDIT_API_METHODS.getExport;
    path: typeof AUDIT_API_ROUTES.getExport;
    request: { exportId: string };
    response: AuditExport;
  };
}

export function isAuditExportFormat(value: string): value is AuditExportFormat {
  return AUDIT_EXPORT_FORMATS.some((format) => format === value);
}

export function isAuditExportStatus(value: string): value is AuditExportStatus {
  return AUDIT_EXPORT_STATUSES.some((status) => status === value);
}

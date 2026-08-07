export const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const SERVICE_HEALTH_STATUSES = ['HEALTHY', 'DEGRADED', 'UNHEALTHY'] as const;
export type ServiceHealthStatus = (typeof SERVICE_HEALTH_STATUSES)[number];

export const INCIDENT_SEVERITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export interface CorrelationContext {
  readonly correlationId: string;
  readonly requestId?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly actorId?: string;
  readonly sessionId?: string;
  readonly countryCode?: string;
}

export interface StructuredLogEvent {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly service: string;
  readonly event: string;
  readonly message: string;
  readonly correlation: CorrelationContext;
  readonly attributes?: Readonly<Record<string, unknown>>;
  readonly errorCode?: string;
}

export interface ServiceHealthSnapshot {
  readonly service: string;
  readonly status: ServiceHealthStatus;
  readonly checkedAt: string;
  readonly latencyMs?: number;
  readonly dependencies?: readonly DependencyHealth[];
}

export interface DependencyHealth {
  readonly name: string;
  readonly status: ServiceHealthStatus;
  readonly latencyMs?: number;
  readonly detailCode?: string;
}

export interface IncidentRecord {
  readonly id: string;
  readonly severity: IncidentSeverity;
  readonly title: string;
  readonly startedAt: string;
  readonly detectedAt: string;
  readonly resolvedAt?: string;
  readonly affectedServices: readonly string[];
  readonly correlationIds?: readonly string[];
  readonly summary?: string;
}

export interface MetricDefinition {
  readonly name: string;
  readonly description: string;
  readonly unit: 'COUNT' | 'MILLISECONDS' | 'BYTES' | 'RATIO' | 'AMOUNT_MINOR';
  readonly allowedLabels: readonly string[];
}

const SENSITIVE_KEY_FRAGMENTS = [
  'authorization',
  'password',
  'passwd',
  'secret',
  'token',
  'otp',
  'pin',
  'cvv',
  'cvc',
  'pan',
  'cardnumber',
  'privatekey',
] as const;

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function isSensitiveLogKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function redactLogAttributes(
  attributes: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [key, isSensitiveLogKey(key) ? '[REDACTED]' : value]),
  );
}

export function isValidCorrelationContext(context: CorrelationContext): boolean {
  return context.correlationId.trim().length > 0;
}

export function isValidStructuredLogEvent(event: StructuredLogEvent): boolean {
  return (
    Number.isFinite(Date.parse(event.timestamp)) &&
    event.service.trim().length > 0 &&
    event.event.trim().length > 0 &&
    event.message.trim().length > 0 &&
    isValidCorrelationContext(event.correlation)
  );
}

export function classifyHealth(
  healthyDependencies: number,
  totalDependencies: number,
): ServiceHealthStatus {
  if (totalDependencies <= 0) return 'HEALTHY';
  if (healthyDependencies >= totalDependencies) return 'HEALTHY';
  if (healthyDependencies <= 0) return 'UNHEALTHY';
  return 'DEGRADED';
}

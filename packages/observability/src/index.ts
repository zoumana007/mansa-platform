export const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const SERVICE_HEALTH_STATUSES = ['HEALTHY', 'DEGRADED', 'UNHEALTHY'] as const;
export type ServiceHealthStatus = (typeof SERVICE_HEALTH_STATUSES)[number];

export const INCIDENT_SEVERITIES = ['P1', 'P2', 'P3', 'P4'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const METRIC_UNITS = ['COUNT', 'MILLISECONDS', 'BYTES', 'RATIO', 'AMOUNT_MINOR'] as const;
export type MetricUnit = (typeof METRIC_UNITS)[number];

export const SPAN_KINDS = ['INTERNAL', 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER'] as const;
export type SpanKind = (typeof SPAN_KINDS)[number];

export const SPAN_STATUSES = ['UNSET', 'OK', 'ERROR'] as const;
export type SpanStatus = (typeof SPAN_STATUSES)[number];

export interface CorrelationContext {
  readonly correlationId: string;
  readonly requestId?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly actorId?: string;
  readonly sessionId?: string;
  readonly countryCode?: string;
}

export interface TraceContext {
  readonly traceId: string;
  readonly spanId: string;
  readonly traceFlags?: string;
  readonly traceState?: string;
}

export interface SpanRecord {
  readonly name: string;
  readonly service: string;
  readonly kind: SpanKind;
  readonly status: SpanStatus;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly trace: TraceContext;
  readonly parentSpanId?: string;
  readonly attributes?: Readonly<Record<string, string | number | boolean>>;
  readonly errorCode?: string;
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
  readonly unit: MetricUnit;
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

const FORBIDDEN_METRIC_LABELS = new Set([
  'userid',
  'transactionid',
  'requestid',
  'correlationid',
  'sessionid',
  'traceid',
  'spanid',
  'phonenumber',
  'email',
  'emailaddress',
  'cardnumber',
  'pan',
]);

const HEX_32 = /^[0-9a-f]{32}$/i;
const HEX_16 = /^[0-9a-f]{16}$/i;
const HEX_2 = /^[0-9a-f]{2}$/i;

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}

function redactLogValue(value: unknown, activePath: WeakSet<object>): unknown {
  if (Array.isArray(value)) {
    if (activePath.has(value)) return '[CIRCULAR]';
    activePath.add(value);
    const redacted = value.map((item) => redactLogValue(item, activePath));
    activePath.delete(value);
    return redacted;
  }

  if (!isPlainRecord(value)) return value;
  if (activePath.has(value)) return '[CIRCULAR]';

  activePath.add(value);
  const redacted = Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      isSensitiveLogKey(key) ? '[REDACTED]' : redactLogValue(nestedValue, activePath),
    ]),
  );
  activePath.delete(value);
  return redacted;
}

export function isSensitiveLogKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function redactLogAttributes(
  attributes: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return redactLogValue(attributes, new WeakSet<object>()) as Readonly<Record<string, unknown>>;
}

export function sanitizeStructuredLogEvent(event: StructuredLogEvent): StructuredLogEvent {
  if (!event.attributes) return event;
  return {
    ...event,
    attributes: redactLogAttributes(event.attributes),
  };
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

export function isValidTraceId(traceId: string): boolean {
  return HEX_32.test(traceId) && !/^0{32}$/i.test(traceId);
}

export function isValidSpanId(spanId: string): boolean {
  return HEX_16.test(spanId) && !/^0{16}$/i.test(spanId);
}

export function isValidTraceContext(context: TraceContext): boolean {
  return (
    isValidTraceId(context.traceId) &&
    isValidSpanId(context.spanId) &&
    (context.traceFlags === undefined || HEX_2.test(context.traceFlags))
  );
}

export function isValidSpanRecord(span: SpanRecord): boolean {
  if (span.name.trim().length === 0 || span.service.trim().length === 0) return false;
  if (!SPAN_KINDS.includes(span.kind) || !SPAN_STATUSES.includes(span.status)) return false;
  if (!Number.isFinite(Date.parse(span.startedAt))) return false;
  if (span.endedAt !== undefined) {
    if (!Number.isFinite(Date.parse(span.endedAt))) return false;
    if (Date.parse(span.endedAt) < Date.parse(span.startedAt)) return false;
  }
  if (!isValidTraceContext(span.trace)) return false;
  if (span.parentSpanId !== undefined && !isValidSpanId(span.parentSpanId)) return false;
  return true;
}

export function buildTraceParent(context: TraceContext): string {
  if (!isValidTraceContext(context)) {
    throw new Error('Invalid trace context');
  }
  return `00-${context.traceId.toLowerCase()}-${context.spanId.toLowerCase()}-${(context.traceFlags ?? '00').toLowerCase()}`;
}

export function parseTraceParent(value: string): TraceContext | undefined {
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i.exec(value.trim());
  if (!match) return undefined;
  const context: TraceContext = {
    traceId: match[1].toLowerCase(),
    spanId: match[2].toLowerCase(),
    traceFlags: match[3].toLowerCase(),
  };
  return isValidTraceContext(context) ? context : undefined;
}

export function isAllowedMetricLabel(label: string): boolean {
  const normalized = normalizeKey(label);
  return normalized.length > 0 && !FORBIDDEN_METRIC_LABELS.has(normalized);
}

export function isValidMetricDefinition(definition: MetricDefinition): boolean {
  if (definition.name.trim().length === 0 || definition.description.trim().length === 0) {
    return false;
  }

  if (!METRIC_UNITS.includes(definition.unit)) return false;

  const normalizedLabels = definition.allowedLabels.map(normalizeKey);
  if (normalizedLabels.some((label) => label.length === 0)) return false;
  if (new Set(normalizedLabels).size !== normalizedLabels.length) return false;

  return definition.allowedLabels.every(isAllowedMetricLabel);
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

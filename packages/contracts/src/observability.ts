export const SERVICE_HEALTH_STATUSES = ['UP', 'DEGRADED', 'DOWN'] as const;
export type ServiceHealthStatus = (typeof SERVICE_HEALTH_STATUSES)[number];

export const DEPENDENCY_TYPES = [
  'DATABASE',
  'CACHE',
  'MESSAGE_BROKER',
  'OBJECT_STORAGE',
  'PAYMENT_PROVIDER',
  'MOBILE_MONEY_PROVIDER',
  'CARD_PROCESSOR',
  'IDENTITY_PROVIDER',
  'NOTIFICATION_PROVIDER',
  'AI_PROVIDER',
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

export const INCIDENT_SEVERITIES = ['SEV1', 'SEV2', 'SEV3', 'SEV4'] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export interface DependencyHealth {
  readonly name: string;
  readonly type: DependencyType;
  readonly status: ServiceHealthStatus;
  readonly latencyMs?: number;
  readonly checkedAt: string;
  readonly reasonCode?: string;
}

export interface ServiceHealthReport {
  readonly service: string;
  readonly version: string;
  readonly environment: string;
  readonly status: ServiceHealthStatus;
  readonly startedAt: string;
  readonly checkedAt: string;
  readonly correlationId: string;
  readonly dependencies: readonly DependencyHealth[];
}

export interface TelemetryContext {
  readonly correlationId: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly actorId?: string;
  readonly actorType?: string;
  readonly countryCode?: string;
  readonly environment: string;
  readonly service: string;
  readonly operation: string;
}

export interface ServiceLevelObjective {
  readonly id: string;
  readonly service: string;
  readonly indicator: 'AVAILABILITY' | 'LATENCY' | 'ERROR_RATE' | 'PROCESSING_DELAY';
  readonly target: number;
  readonly windowDays: number;
  readonly warningThreshold: number;
  readonly criticalThreshold: number;
}

export interface IncidentReference {
  readonly id: string;
  readonly severity: IncidentSeverity;
  readonly title: string;
  readonly status: 'OPEN' | 'MITIGATED' | 'RESOLVED';
  readonly startedAt: string;
  readonly resolvedAt?: string;
  readonly affectedServices: readonly string[];
  readonly correlationIds: readonly string[];
}

export function isServiceHealthStatus(value: string): value is ServiceHealthStatus {
  return SERVICE_HEALTH_STATUSES.includes(value as ServiceHealthStatus);
}

export function isIncidentSeverity(value: string): value is IncidentSeverity {
  return INCIDENT_SEVERITIES.includes(value as IncidentSeverity);
}

export function deriveServiceHealthStatus(
  dependencies: readonly DependencyHealth[],
): ServiceHealthStatus {
  if (dependencies.some((dependency) => dependency.status === 'DOWN')) {
    return 'DOWN';
  }

  if (dependencies.some((dependency) => dependency.status === 'DEGRADED')) {
    return 'DEGRADED';
  }

  return 'UP';
}

export const SERVICE_HEALTH_STATUSES = [
  'healthy',
  'degraded',
  'unhealthy',
] as const;

export type ServiceHealthStatus = (typeof SERVICE_HEALTH_STATUSES)[number];

export const INCIDENT_SEVERITIES = ['P1', 'P2', 'P3', 'P4'] as const;

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export interface DependencyHealth {
  readonly name: string;
  readonly status: ServiceHealthStatus;
  readonly latencyMs?: number;
  readonly checkedAt: string;
  readonly detailCode?: string;
}

export interface ServiceHealthReport {
  readonly service: string;
  readonly environment: string;
  readonly version: string;
  readonly status: ServiceHealthStatus;
  readonly checkedAt: string;
  readonly dependencies: readonly DependencyHealth[];
}

export interface IncidentReference {
  readonly incidentId: string;
  readonly severity: IncidentSeverity;
  readonly title: string;
  readonly startedAt: string;
  readonly resolvedAt?: string;
  readonly affectedServices: readonly string[];
  readonly correlationIds: readonly string[];
}

export interface DeploymentReference {
  readonly deploymentId: string;
  readonly environment: string;
  readonly commitSha: string;
  readonly artifactDigest: string;
  readonly deployedAt: string;
  readonly approvedBy?: string;
  readonly rollbackOfDeploymentId?: string;
}

export function isServiceHealthStatus(
  value: string,
): value is ServiceHealthStatus {
  return SERVICE_HEALTH_STATUSES.some((status) => status === value);
}

export function isIncidentSeverity(value: string): value is IncidentSeverity {
  return INCIDENT_SEVERITIES.some((severity) => severity === value);
}

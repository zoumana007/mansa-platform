export const REPORT_FORMATS = ['CSV', 'XLSX', 'PDF', 'JSON'] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export const REPORT_STATUSES = ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const FINAL_REPORT_STATUSES = ['COMPLETED', 'FAILED', 'EXPIRED'] as const satisfies readonly ReportStatus[];

export const METRIC_PERIODS = ['HOUR', 'DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'] as const;
export type MetricPeriod = (typeof METRIC_PERIODS)[number];

export const METRIC_UNITS = ['COUNT', 'AMOUNT_MINOR', 'PERCENTAGE', 'DURATION_MS'] as const;
export type MetricUnit = (typeof METRIC_UNITS)[number];

export interface AnalyticsDateRange {
  readonly from: string;
  readonly to: string;
  readonly timezone: string;
}

export interface MetricPoint {
  readonly timestamp: string;
  readonly value: string;
  readonly dimensions?: Readonly<Record<string, string>>;
}

export interface MetricSeries {
  readonly metricKey: string;
  readonly unit: MetricUnit;
  readonly currency?: string;
  readonly points: readonly MetricPoint[];
}

export interface DashboardQuery {
  readonly dateRange: AnalyticsDateRange;
  readonly metricKeys: readonly string[];
  readonly period: MetricPeriod;
  readonly countryCodes?: readonly string[];
  readonly merchantIds?: readonly string[];
  readonly channels?: readonly string[];
}

export interface DashboardSnapshot {
  readonly generatedAt: string;
  readonly dateRange: AnalyticsDateRange;
  readonly series: readonly MetricSeries[];
}

export interface CreateReportCommand {
  readonly reportType: string;
  readonly format: ReportFormat;
  readonly dateRange: AnalyticsDateRange;
  readonly filters?: Readonly<Record<string, string | readonly string[]>>;
  readonly requestedBy: string;
  readonly idempotencyKey: string;
}

export interface GeneratedReport {
  readonly id: string;
  readonly reportType: string;
  readonly format: ReportFormat;
  readonly status: ReportStatus;
  readonly requestedBy: string;
  readonly createdAt: string;
  readonly completedAt?: string;
  readonly expiresAt?: string;
  readonly downloadReference?: string;
  readonly failureCode?: string;
}

export function isReportFormat(value: string): value is ReportFormat {
  return (REPORT_FORMATS as readonly string[]).includes(value);
}

export function isReportStatus(value: string): value is ReportStatus {
  return (REPORT_STATUSES as readonly string[]).includes(value);
}

export function isFinalReportStatus(value: ReportStatus): boolean {
  return (FINAL_REPORT_STATUSES as readonly ReportStatus[]).includes(value);
}

export function isMetricPeriod(value: string): value is MetricPeriod {
  return (METRIC_PERIODS as readonly string[]).includes(value);
}

export function isMetricUnit(value: string): value is MetricUnit {
  return (METRIC_UNITS as readonly string[]).includes(value);
}

export function isValidAnalyticsDateRange(range: AnalyticsDateRange): boolean {
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);

  return range.timezone.trim().length > 0 && Number.isFinite(from) && Number.isFinite(to) && from <= to;
}

export function validateDashboardQuery(query: DashboardQuery): readonly string[] {
  const errors: string[] = [];

  if (!isValidAnalyticsDateRange(query.dateRange)) errors.push('INVALID_DATE_RANGE');
  if (query.metricKeys.length === 0) errors.push('METRIC_KEYS_REQUIRED');
  if (!isMetricPeriod(query.period)) errors.push('INVALID_METRIC_PERIOD');

  return errors;
}

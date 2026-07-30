export const REPORT_FORMATS = ['CSV', 'XLSX', 'PDF', 'JSON'] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export const REPORT_STATUSES = ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const METRIC_PERIODS = ['HOUR', 'DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'] as const;
export type MetricPeriod = (typeof METRIC_PERIODS)[number];

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
  readonly unit: 'COUNT' | 'AMOUNT_MINOR' | 'PERCENTAGE' | 'DURATION_MS';
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

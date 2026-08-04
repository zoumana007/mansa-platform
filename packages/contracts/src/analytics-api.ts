import type {
  CreateReportCommand,
  DashboardQuery,
  DashboardSnapshot,
  GeneratedReport,
} from './analytics.js';
import type { PageRequest, PageResponse } from './pagination.js';

export const ANALYTICS_API_METHODS = ['GET', 'POST'] as const;
export type AnalyticsApiMethod = (typeof ANALYTICS_API_METHODS)[number];

export const ANALYTICS_API_ROUTES = {
  dashboardSnapshot: '/v1/analytics/dashboard',
  createReport: '/v1/analytics/reports',
  getReport: '/v1/analytics/reports/:reportId',
  listReports: '/v1/analytics/reports',
  getReportDownload: '/v1/analytics/reports/:reportId/download',
} as const;

export type AnalyticsApiRouteName = keyof typeof ANALYTICS_API_ROUTES;

export interface ListReportsQuery extends PageRequest {
  readonly status?: GeneratedReport['status'];
  readonly reportType?: string;
  readonly requestedBy?: string;
  readonly createdFrom?: string;
  readonly createdTo?: string;
}

export interface ReportDownloadReference {
  readonly reportId: string;
  readonly downloadReference: string;
  readonly expiresAt: string;
}

export interface AnalyticsApiContract {
  readonly dashboardSnapshot: {
    readonly method: 'POST';
    readonly path: typeof ANALYTICS_API_ROUTES.dashboardSnapshot;
    readonly request: DashboardQuery;
    readonly response: DashboardSnapshot;
  };
  readonly createReport: {
    readonly method: 'POST';
    readonly path: typeof ANALYTICS_API_ROUTES.createReport;
    readonly request: CreateReportCommand;
    readonly response: GeneratedReport;
  };
  readonly getReport: {
    readonly method: 'GET';
    readonly path: typeof ANALYTICS_API_ROUTES.getReport;
    readonly response: GeneratedReport;
  };
  readonly listReports: {
    readonly method: 'GET';
    readonly path: typeof ANALYTICS_API_ROUTES.listReports;
    readonly query: ListReportsQuery;
    readonly response: PageResponse<GeneratedReport>;
  };
  readonly getReportDownload: {
    readonly method: 'GET';
    readonly path: typeof ANALYTICS_API_ROUTES.getReportDownload;
    readonly response: ReportDownloadReference;
  };
}

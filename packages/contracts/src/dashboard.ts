import type { CurrencyCode, Money } from './money.js';

export const DASHBOARD_WIDGET_TYPES = [
  'BALANCE',
  'ACCOUNTS',
  'CARDS',
  'QUICK_ACTIONS',
  'ACTIVITY',
  'BUDGET',
  'SAVINGS_GOALS',
  'LOYALTY',
  'PROMOTIONS',
  'JINI',
  'PUBLIC_SERVICES',
  'DIRECTORY',
  'EXCHANGE_RATES',
  'BILLS',
  'DOCUMENTS',
] as const;

export const DASHBOARD_WIDGET_SIZES = ['COMPACT', 'STANDARD', 'LARGE'] as const;

export const DASHBOARD_ALERT_SEVERITIES = [
  'INFO',
  'WARNING',
  'CRITICAL',
] as const;

export const QUICK_ACTION_TYPES = [
  'SEND',
  'RECEIVE',
  'SCAN_QR',
  'NFC_PAY',
  'REQUEST_MONEY',
  'TOP_UP',
  'WITHDRAW',
  'PAY_BILL',
  'CREATE_VIRTUAL_CARD',
  'ADD_BENEFICIARY',
  'SHARE_QR',
  'OPEN_MESSAGES',
] as const;

export type DashboardWidgetType = (typeof DASHBOARD_WIDGET_TYPES)[number];
export type DashboardWidgetSize = (typeof DASHBOARD_WIDGET_SIZES)[number];
export type DashboardAlertSeverity =
  (typeof DASHBOARD_ALERT_SEVERITIES)[number];
export type QuickActionType = (typeof QUICK_ACTION_TYPES)[number];

export interface DashboardAccountSummary {
  readonly accountId: string;
  readonly name: string;
  readonly currency: CurrencyCode;
  readonly availableBalance: Money;
  readonly blockedBalance: Money;
  readonly hidden: boolean;
  readonly pinned: boolean;
}

export interface DashboardCardSummary {
  readonly cardId: string;
  readonly displayName: string;
  readonly lastFour: string;
  readonly status: string;
  readonly type: string;
  readonly network: string;
  readonly contactlessEnabled: boolean;
}

export interface DashboardActivityItem {
  readonly activityId: string;
  readonly transactionId?: string;
  readonly title: string;
  readonly category: string;
  readonly amount?: Money;
  readonly status: string;
  readonly occurredAt: string;
  readonly receiptAvailable: boolean;
}

export interface DashboardAlert {
  readonly alertId: string;
  readonly severity: DashboardAlertSeverity;
  readonly title: string;
  readonly message: string;
  readonly actionLabel?: string;
  readonly actionUri?: string;
  readonly dismissible: boolean;
  readonly createdAt: string;
  readonly expiresAt?: string;
}

export interface QuickAction {
  readonly actionId: string;
  readonly type: QuickActionType;
  readonly label: string;
  readonly iconKey: string;
  readonly enabled: boolean;
  readonly position: number;
}

export interface DashboardWidget {
  readonly widgetId: string;
  readonly type: DashboardWidgetType;
  readonly title: string;
  readonly size: DashboardWidgetSize;
  readonly position: number;
  readonly enabled: boolean;
  readonly mandatory: boolean;
  readonly countryCodes?: readonly string[];
  readonly configuration?: Readonly<Record<string, unknown>>;
}

export interface DashboardLayout {
  readonly userId: string;
  readonly version: number;
  readonly widgets: readonly DashboardWidget[];
  readonly quickActions: readonly QuickAction[];
  readonly updatedAt: string;
}

export interface DashboardSnapshot {
  readonly userId: string;
  readonly displayName: string;
  readonly username: string;
  readonly primaryCurrency: CurrencyCode;
  readonly totalBalance: Money;
  readonly balanceHidden: boolean;
  readonly accounts: readonly DashboardAccountSummary[];
  readonly cards: readonly DashboardCardSummary[];
  readonly activity: readonly DashboardActivityItem[];
  readonly alerts: readonly DashboardAlert[];
  readonly layout: DashboardLayout;
  readonly generatedAt: string;
}

export interface UpdateDashboardLayoutCommand {
  readonly userId: string;
  readonly expectedVersion: number;
  readonly widgets: readonly Pick<
    DashboardWidget,
    'widgetId' | 'position' | 'size' | 'enabled'
  >[];
  readonly quickActions: readonly Pick<
    QuickAction,
    'actionId' | 'position' | 'enabled'
  >[];
}

export function isDashboardWidgetType(
  value: string,
): value is DashboardWidgetType {
  return DASHBOARD_WIDGET_TYPES.includes(value as DashboardWidgetType);
}

export function isDashboardWidgetSize(
  value: string,
): value is DashboardWidgetSize {
  return DASHBOARD_WIDGET_SIZES.includes(value as DashboardWidgetSize);
}

export function isDashboardAlertSeverity(
  value: string,
): value is DashboardAlertSeverity {
  return DASHBOARD_ALERT_SEVERITIES.includes(
    value as DashboardAlertSeverity,
  );
}

export function isQuickActionType(value: string): value is QuickActionType {
  return QUICK_ACTION_TYPES.includes(value as QuickActionType);
}

import type { CurrencyCode, Money } from './money.js';

export const TERMINAL_ENVIRONMENTS = ['DEMO', 'SANDBOX', 'PRODUCTION'] as const;
export type TerminalEnvironment = (typeof TERMINAL_ENVIRONMENTS)[number];

export const TERMINAL_STATUSES = [
  'PENDING_ACTIVATION',
  'ACTIVE',
  'SUSPENDED',
  'REVOKED',
  'RETIRED',
] as const;
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

export const TERMINAL_TYPES = ['ANDROID_POS', 'SOFTPOS', 'WEB_POS'] as const;
export type TerminalType = (typeof TERMINAL_TYPES)[number];

export const TERMINAL_PAYMENT_METHODS = [
  'CARD_CONTACT',
  'CARD_CONTACTLESS',
  'CARD_MAGSTRIPE',
  'QR_MERCHANT',
  'QR_CUSTOMER',
  'MOBILE_MONEY',
  'CASH',
] as const;
export type TerminalPaymentMethod = (typeof TERMINAL_PAYMENT_METHODS)[number];

export interface PaymentTerminal {
  id: string;
  merchantId: string;
  locationId: string;
  serialNumber: string;
  label: string;
  type: TerminalType;
  environment: TerminalEnvironment;
  status: TerminalStatus;
  currency: CurrencyCode;
  enabledPaymentMethods: TerminalPaymentMethod[];
  appVersion?: string;
  minimumAppVersion?: string;
  lastSeenAt?: string;
  activatedAt?: string;
  suspendedAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterTerminalCommand {
  merchantId: string;
  locationId: string;
  serialNumber: string;
  label: string;
  type: TerminalType;
  environment: TerminalEnvironment;
  currency: CurrencyCode;
}

export interface ActivateTerminalCommand {
  activationCode: string;
  serialNumber: string;
  devicePublicKey: string;
  appVersion: string;
}

export interface UpdateTerminalConfigurationCommand {
  terminalId: string;
  enabledPaymentMethods: TerminalPaymentMethod[];
  minimumAppVersion?: string;
  allowTips: boolean;
  allowRefunds: boolean;
  allowOfflineCapture: boolean;
  offlineLimit?: Money;
}

export interface TerminalHealthReport {
  terminalId: string;
  appVersion: string;
  operatingSystemVersion: string;
  batteryLevel?: number;
  networkType?: string;
  isRooted: boolean;
  isDebuggable: boolean;
  configurationVersion: string;
  reportedAt: string;
}

export interface TerminalSaleCommand {
  terminalId: string;
  operatorUserId: string;
  idempotencyKey: string;
  amount: Money;
  tipAmount?: Money;
  paymentMethod: TerminalPaymentMethod;
  merchantReference?: string;
  basketId?: string;
}

export function isTerminalEnvironment(value: string): value is TerminalEnvironment {
  return TERMINAL_ENVIRONMENTS.includes(value as TerminalEnvironment);
}

export function isTerminalStatus(value: string): value is TerminalStatus {
  return TERMINAL_STATUSES.includes(value as TerminalStatus);
}

export function isTerminalType(value: string): value is TerminalType {
  return TERMINAL_TYPES.includes(value as TerminalType);
}

export function isTerminalPaymentMethod(value: string): value is TerminalPaymentMethod {
  return TERMINAL_PAYMENT_METHODS.includes(value as TerminalPaymentMethod);
}

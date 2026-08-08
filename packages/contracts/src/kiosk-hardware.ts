export const KIOSK_HARDWARE_PROTOCOLS = [
  'HTTP_REST',
  'WEBHOOK',
  'VENDOR_SDK',
  'TCP_IP',
  'USB',
  'RS232',
  'RS485',
  'MDB',
  'PULSE',
  'GPIO',
  'DRY_CONTACT',
  'OTHER_DOCUMENTED',
] as const;

export const KIOSK_CAPABILITIES = [
  'CARD_EMV',
  'CARD_NFC',
  'QR_SCANNER',
  'QR_DISPLAY',
  'MOBILE_MONEY',
  'CASH_BILL_ACCEPT',
  'CASH_COIN_ACCEPT',
  'CASH_BILL_CHANGE',
  'CASH_COIN_CHANGE',
  'RECEIPT_PRINTER',
  'INTERCOM',
  'RFID_UHF',
  'ANPR',
  'BARRIER_CONTROL',
  'VEHICLE_SENSORS',
  'OFFLINE_MODE',
] as const;

export const KIOSK_CHANGE_POLICIES = [
  'EXACT_CHANGE_REQUIRED',
  'CHANGE_COINS_ONLY',
  'CHANGE_BILLS_ONLY',
  'CHANGE_MIXED',
  'EXACT_PAYMENT_ONLY_FALLBACK',
  'DISABLE_CASH_IF_CHANGE_UNAVAILABLE',
] as const;

export const KIOSK_INTEGRATION_RESULTS = [
  'NATIVE_INTEGRATION',
  'EXISTING_SOFTWARE_ADAPTER',
  'HARDWARE_GATEWAY_REQUIRED',
  'PERIPHERAL_REPLACEMENT_REQUIRED',
  'UNSUPPORTED',
] as const;

export const KIOSK_COMPONENT_STATUSES = [
  'ONLINE',
  'DEGRADED',
  'OFFLINE',
  'MAINTENANCE',
  'DISABLED',
  'FULL',
  'EMPTY',
  'JAMMED',
] as const;

export type KioskHardwareProtocol = (typeof KIOSK_HARDWARE_PROTOCOLS)[number];
export type KioskCapability = (typeof KIOSK_CAPABILITIES)[number];
export type KioskChangePolicy = (typeof KIOSK_CHANGE_POLICIES)[number];
export type KioskIntegrationResult = (typeof KIOSK_INTEGRATION_RESULTS)[number];
export type KioskComponentStatus = (typeof KIOSK_COMPONENT_STATUSES)[number];

export interface KioskComponentHealth {
  readonly componentId: string;
  readonly componentType: string;
  readonly status: KioskComponentStatus;
  readonly failureCode?: string;
  readonly lastSeenAt?: string;
}

export interface CashDenominationInventory {
  readonly currency: string;
  readonly denominationMinor: number;
  readonly instrument: 'BILL' | 'COIN';
  readonly availableCount: number;
  readonly capacityCount?: number;
  readonly lowThresholdCount?: number;
}

export interface KioskHardwareProfile {
  readonly kioskId: string;
  readonly organizationId: string;
  readonly locationId: string;
  readonly laneId?: string;
  readonly manufacturer?: string;
  readonly model?: string;
  readonly firmwareVersion?: string;
  readonly controllerVersion?: string;
  readonly protocols: readonly KioskHardwareProtocol[];
  readonly capabilities: readonly KioskCapability[];
  readonly supportedCurrencies: readonly string[];
  readonly cashValidatedCurrencies?: readonly string[];
  readonly changePolicy?: KioskChangePolicy;
  readonly componentHealth: readonly KioskComponentHealth[];
  readonly updatedAt: string;
}

export interface KioskCompatibilityAssessment {
  readonly kioskId: string;
  readonly integrationResult: KioskIntegrationResult;
  readonly protocolsDetected: readonly KioskHardwareProtocol[];
  readonly capabilitiesDetected: readonly KioskCapability[];
  readonly requiredActions: readonly string[];
  readonly assessedAt: string;
  readonly assessedBy: string;
}

export interface ChangeFeasibilityRequest {
  readonly currency: string;
  readonly amountDueMinor: number;
  readonly amountTenderedMinor: number;
  readonly policy: KioskChangePolicy;
  readonly inventory: readonly CashDenominationInventory[];
}

export interface ChangeFeasibilityResult {
  readonly canAcceptCash: boolean;
  readonly changeDueMinor: number;
  readonly reason:
    | 'NO_CHANGE_REQUIRED'
    | 'CHANGE_AVAILABLE'
    | 'INSUFFICIENT_CHANGE'
    | 'POLICY_DISALLOWS_CHANGE'
    | 'INVALID_AMOUNT';
}

function inventoryAmount(
  inventory: readonly CashDenominationInventory[],
  currency: string,
  instrument?: 'BILL' | 'COIN',
): number {
  return inventory
    .filter((entry) => entry.currency === currency && (!instrument || entry.instrument === instrument))
    .reduce((total, entry) => total + entry.denominationMinor * entry.availableCount, 0);
}

export function evaluateChangeFeasibility(request: ChangeFeasibilityRequest): ChangeFeasibilityResult {
  if (
    !Number.isInteger(request.amountDueMinor) ||
    !Number.isInteger(request.amountTenderedMinor) ||
    request.amountDueMinor < 0 ||
    request.amountTenderedMinor < 0 ||
    request.amountTenderedMinor < request.amountDueMinor
  ) {
    return { canAcceptCash: false, changeDueMinor: 0, reason: 'INVALID_AMOUNT' };
  }

  const changeDueMinor = request.amountTenderedMinor - request.amountDueMinor;
  if (changeDueMinor === 0) {
    return { canAcceptCash: true, changeDueMinor, reason: 'NO_CHANGE_REQUIRED' };
  }

  if (request.policy === 'EXACT_CHANGE_REQUIRED') {
    return { canAcceptCash: false, changeDueMinor, reason: 'POLICY_DISALLOWS_CHANGE' };
  }

  if (request.policy === 'EXACT_PAYMENT_ONLY_FALLBACK') {
    return { canAcceptCash: false, changeDueMinor, reason: 'POLICY_DISALLOWS_CHANGE' };
  }

  const requiredInstrument =
    request.policy === 'CHANGE_COINS_ONLY'
      ? 'COIN'
      : request.policy === 'CHANGE_BILLS_ONLY'
        ? 'BILL'
        : undefined;

  const availableAmount = inventoryAmount(request.inventory, request.currency, requiredInstrument);
  if (availableAmount < changeDueMinor) {
    return { canAcceptCash: false, changeDueMinor, reason: 'INSUFFICIENT_CHANGE' };
  }

  return { canAcceptCash: true, changeDueMinor, reason: 'CHANGE_AVAILABLE' };
}

export function isKioskHardwareProtocol(value: string): value is KioskHardwareProtocol {
  return KIOSK_HARDWARE_PROTOCOLS.includes(value as KioskHardwareProtocol);
}

export function isKioskCapability(value: string): value is KioskCapability {
  return KIOSK_CAPABILITIES.includes(value as KioskCapability);
}

export function isKioskChangePolicy(value: string): value is KioskChangePolicy {
  return KIOSK_CHANGE_POLICIES.includes(value as KioskChangePolicy);
}

export function isKioskIntegrationResult(value: string): value is KioskIntegrationResult {
  return KIOSK_INTEGRATION_RESULTS.includes(value as KioskIntegrationResult);
}

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACCESS_CASH_VALIDATION_RESULTS,
  ACCESS_CREDENTIAL_STATUSES,
  ACCESS_CREDENTIAL_TYPES,
  ACCESS_DECISIONS,
  ACCESS_ENTITLEMENT_STATUSES,
  ACCESS_EQUIPMENT_STATUSES,
  ACCESS_EQUIPMENT_TYPES,
  ACCESS_MATCH_POLICIES,
  ACCESS_OUTAGE_COMPENSATION_POLICIES,
  ACCESS_PAYMENT_METHODS,
  ACCESS_QR_MODES,
  ACCESS_REFUND_POLICIES,
  ACCESS_SERVICE_STATUSES,
  ACCESS_TERMINAL_HEIGHT_PROFILES,
  ACCESS_USE_CASES,
  isAccessCashValidationResult,
  isAccessCredentialStatus,
  isAccessCredentialType,
  isAccessDecision,
  isAccessDecisionReason,
  isAccessEntitlementStatus,
  isAccessEquipmentStatus,
  isAccessEquipmentType,
  isAccessMatchPolicy,
  isAccessOutageCompensationPolicy,
  isAccessPaymentMethod,
  isAccessQrMode,
  isAccessRefundPolicy,
  isAccessServiceStatus,
  isAccessTerminalHeightProfile,
  isAccessUseCase,
} from '../dist/access-mobility.js';
import {
  ACCESS_MOBILITY_API_METHODS,
  ACCESS_MOBILITY_API_ROUTES,
} from '../dist/access-mobility-api.js';

test('recognizes supported access credential technologies', () => {
  assert.equal(isAccessCredentialType('NFC_CARD'), true);
  assert.equal(isAccessCredentialType('RFID_UHF_TAG'), true);
  assert.equal(isAccessCredentialType('MAGSTRIPE'), false);
});

test('recognizes reusable access and mobility use cases', () => {
  assert.equal(isAccessUseCase('TOLL'), true);
  assert.equal(isAccessUseCase('FUEL_FLEET'), true);
  assert.equal(isAccessUseCase('PUBLIC_TRANSPORT'), true);
  assert.equal(isAccessUseCase('UNSUPPORTED'), false);
});

test('recognizes credential, entitlement and decision states', () => {
  assert.equal(isAccessCredentialStatus('ACTIVE'), true);
  assert.equal(isAccessEntitlementStatus('SUSPENDED'), true);
  assert.equal(isAccessEntitlementStatus('TERMINATED'), true);
  assert.equal(isAccessDecision('ALLOW'), true);
  assert.equal(isAccessDecisionReason('PLATE_MISMATCH'), true);
  assert.equal(isAccessDecisionReason('SERVICE_SUSPENDED'), true);
  assert.equal(isAccessDecisionReason('UNKNOWN'), false);
});

test('recognizes service continuity and equipment states', () => {
  assert.equal(isAccessServiceStatus('DEGRADED'), true);
  assert.equal(isAccessServiceStatus('MAINTENANCE'), true);
  assert.equal(isAccessEquipmentType('ANPR_CAMERA'), true);
  assert.equal(isAccessEquipmentType('CASH_ACCEPTOR'), true);
  assert.equal(isAccessEquipmentType('CASH_RECYCLER'), true);
  assert.equal(isAccessEquipmentType('INTERCOM'), true);
  assert.equal(isAccessEquipmentStatus('OFFLINE'), true);
  assert.equal(isAccessEquipmentStatus('BROKEN'), false);
});

test('recognizes vehicle matching and payment policies', () => {
  assert.equal(isAccessMatchPolicy('CREDENTIAL_AND_PLATE_REQUIRED'), true);
  assert.equal(isAccessPaymentMethod('BANK_CARD'), true);
  assert.equal(isAccessPaymentMethod('MOBILE_MONEY'), true);
  assert.equal(isAccessPaymentMethod('CASH_BILLS'), true);
  assert.equal(isAccessPaymentMethod('CASH_COINS'), true);
  assert.equal(isAccessPaymentMethod('MANSA_QR'), true);
  assert.equal(isAccessPaymentMethod('CRYPTO'), false);
});

test('recognizes toll kiosk QR, height and cash validation capabilities', () => {
  assert.equal(isAccessQrMode('TERMINAL_SCANS_CUSTOMER_QR'), true);
  assert.equal(isAccessQrMode('CUSTOMER_SCANS_DYNAMIC_TERMINAL_QR'), true);
  assert.equal(isAccessQrMode('STATIC_PUBLIC_QR'), false);
  assert.equal(isAccessTerminalHeightProfile('DUAL_HEIGHT'), true);
  assert.equal(isAccessTerminalHeightProfile('TRIPLE_HEIGHT'), false);
  assert.equal(isAccessCashValidationResult('ACCEPTED'), true);
  assert.equal(isAccessCashValidationResult('REJECTED_SUSPECT'), true);
  assert.equal(isAccessCashValidationResult('COUNTERFEIT_CONFIRMED'), false);
});

test('recognizes refund and outage compensation policies', () => {
  assert.equal(isAccessRefundPolicy('NON_REFUNDABLE'), true);
  assert.equal(isAccessRefundPolicy('PRORATA_REFUND'), true);
  assert.equal(isAccessOutageCompensationPolicy('PAUSE_AND_EXTEND'), true);
  assert.equal(isAccessOutageCompensationPolicy('NO_COMPENSATION'), true);
  assert.equal(isAccessOutageCompensationPolicy('UNDEFINED'), false);
});

test('all published enum values remain accepted by their runtime guards', () => {
  const cases = [
    [ACCESS_CREDENTIAL_TYPES, isAccessCredentialType],
    [ACCESS_USE_CASES, isAccessUseCase],
    [ACCESS_CREDENTIAL_STATUSES, isAccessCredentialStatus],
    [ACCESS_ENTITLEMENT_STATUSES, isAccessEntitlementStatus],
    [ACCESS_SERVICE_STATUSES, isAccessServiceStatus],
    [ACCESS_MATCH_POLICIES, isAccessMatchPolicy],
    [ACCESS_PAYMENT_METHODS, isAccessPaymentMethod],
    [ACCESS_QR_MODES, isAccessQrMode],
    [ACCESS_TERMINAL_HEIGHT_PROFILES, isAccessTerminalHeightProfile],
    [ACCESS_CASH_VALIDATION_RESULTS, isAccessCashValidationResult],
    [ACCESS_EQUIPMENT_TYPES, isAccessEquipmentType],
    [ACCESS_EQUIPMENT_STATUSES, isAccessEquipmentStatus],
    [ACCESS_REFUND_POLICIES, isAccessRefundPolicy],
    [ACCESS_OUTAGE_COMPENSATION_POLICIES, isAccessOutageCompensationPolicy],
    [ACCESS_DECISIONS, isAccessDecision],
  ];

  for (const [values, guard] of cases) {
    for (const value of values) assert.equal(guard(value), true, value);
    assert.equal(guard('__INVALID__'), false);
  }
});

test('access-mobility route names and HTTP methods remain aligned', () => {
  const routes = Object.keys(ACCESS_MOBILITY_API_ROUTES).sort();
  const methods = Object.keys(ACCESS_MOBILITY_API_METHODS).sort();
  assert.deepEqual(routes, methods);

  for (const [name, route] of Object.entries(ACCESS_MOBILITY_API_ROUTES)) {
    assert.match(route, /^\/v1\/access\//, `${name} must stay under /v1/access`);
    assert.match(ACCESS_MOBILITY_API_METHODS[name], /^(GET|POST|PUT|PATCH|DELETE)$/);
  }
});

test('critical toll-kiosk capabilities stay represented in the shared contract', () => {
  assert.ok(ACCESS_USE_CASES.includes('TOLL'));
  assert.ok(ACCESS_CREDENTIAL_TYPES.includes('RFID_UHF_TAG'));
  assert.ok(ACCESS_CREDENTIAL_TYPES.includes('LICENSE_PLATE'));
  assert.ok(ACCESS_PAYMENT_METHODS.includes('BANK_CARD'));
  assert.ok(ACCESS_PAYMENT_METHODS.includes('MANSA_QR'));
  assert.ok(ACCESS_PAYMENT_METHODS.includes('CASH_BILLS'));
  assert.ok(ACCESS_PAYMENT_METHODS.includes('CASH_COINS'));
  assert.ok(ACCESS_TERMINAL_HEIGHT_PROFILES.includes('DUAL_HEIGHT'));
  assert.ok(ACCESS_EQUIPMENT_TYPES.includes('ANPR_CAMERA'));
  assert.ok(ACCESS_EQUIPMENT_TYPES.includes('CASH_RECYCLER'));
  assert.ok(ACCESS_EQUIPMENT_TYPES.includes('COIN_RECYCLER'));
  assert.ok(ACCESS_EQUIPMENT_TYPES.includes('RECEIPT_PRINTER'));
  assert.ok(ACCESS_EQUIPMENT_TYPES.includes('INTERCOM'));
});

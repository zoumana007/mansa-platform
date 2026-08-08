import assert from 'node:assert/strict';
import test from 'node:test';

import {
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

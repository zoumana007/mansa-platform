import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateChangeFeasibility,
  isKioskCapability,
  isKioskChangePolicy,
  isKioskHardwareProtocol,
  isKioskIntegrationResult,
} from '../dist/kiosk-hardware.js';

test('recognizes supported kiosk enums', () => {
  assert.equal(isKioskHardwareProtocol('MDB'), true);
  assert.equal(isKioskHardwareProtocol('PROPRIETARY_MAGIC'), false);
  assert.equal(isKioskCapability('CASH_BILL_CHANGE'), true);
  assert.equal(isKioskChangePolicy('CHANGE_MIXED'), true);
  assert.equal(isKioskIntegrationResult('HARDWARE_GATEWAY_REQUIRED'), true);
});

test('accepts exact cash without needing change inventory', () => {
  const result = evaluateChangeFeasibility({
    currency: 'XOF',
    amountDueMinor: 1000,
    amountTenderedMinor: 1000,
    policy: 'EXACT_CHANGE_REQUIRED',
    inventory: [],
  });

  assert.deepEqual(result, {
    canAcceptCash: true,
    changeDueMinor: 0,
    reason: 'NO_CHANGE_REQUIRED',
  });
});

test('rejects overpayment when exact payment is required', () => {
  const result = evaluateChangeFeasibility({
    currency: 'XOF',
    amountDueMinor: 1000,
    amountTenderedMinor: 2000,
    policy: 'EXACT_CHANGE_REQUIRED',
    inventory: [{
      currency: 'XOF',
      denominationMinor: 500,
      instrument: 'COIN',
      availableCount: 10,
    }],
  });

  assert.equal(result.canAcceptCash, false);
  assert.equal(result.changeDueMinor, 1000);
  assert.equal(result.reason, 'POLICY_DISALLOWS_CHANGE');
});

test('accepts change when sufficient matching inventory exists', () => {
  const result = evaluateChangeFeasibility({
    currency: 'XOF',
    amountDueMinor: 1500,
    amountTenderedMinor: 2000,
    policy: 'CHANGE_COINS_ONLY',
    inventory: [{
      currency: 'XOF',
      denominationMinor: 100,
      instrument: 'COIN',
      availableCount: 8,
    }],
  });

  assert.equal(result.canAcceptCash, true);
  assert.equal(result.changeDueMinor, 500);
  assert.equal(result.reason, 'CHANGE_AVAILABLE');
});

test('rejects change when inventory is insufficient', () => {
  const result = evaluateChangeFeasibility({
    currency: 'XOF',
    amountDueMinor: 1500,
    amountTenderedMinor: 5000,
    policy: 'CHANGE_MIXED',
    inventory: [{
      currency: 'XOF',
      denominationMinor: 500,
      instrument: 'BILL',
      availableCount: 2,
    }],
  });

  assert.equal(result.canAcceptCash, false);
  assert.equal(result.changeDueMinor, 3500);
  assert.equal(result.reason, 'INSUFFICIENT_CHANGE');
});

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
    dispensePlan: [],
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
  assert.deepEqual(result.dispensePlan, []);
});

test('builds an exact bounded dispense plan when matching inventory exists', () => {
  const result = evaluateChangeFeasibility({
    currency: 'XOF',
    amountDueMinor: 1250,
    amountTenderedMinor: 2000,
    policy: 'CHANGE_MIXED',
    inventory: [
      {
        currency: 'XOF',
        denominationMinor: 500,
        instrument: 'BILL',
        availableCount: 1,
      },
      {
        currency: 'XOF',
        denominationMinor: 250,
        instrument: 'COIN',
        availableCount: 2,
      },
    ],
  });

  assert.equal(result.canAcceptCash, true);
  assert.equal(result.changeDueMinor, 750);
  assert.equal(result.reason, 'CHANGE_AVAILABLE');
  assert.deepEqual(result.dispensePlan, [
    {
      currency: 'XOF',
      denominationMinor: 500,
      instrument: 'BILL',
      count: 1,
    },
    {
      currency: 'XOF',
      denominationMinor: 250,
      instrument: 'COIN',
      count: 1,
    },
  ]);
});

test('respects coins-only policy when bills are also available', () => {
  const result = evaluateChangeFeasibility({
    currency: 'XOF',
    amountDueMinor: 1500,
    amountTenderedMinor: 2000,
    policy: 'CHANGE_COINS_ONLY',
    inventory: [
      {
        currency: 'XOF',
        denominationMinor: 500,
        instrument: 'BILL',
        availableCount: 10,
      },
      {
        currency: 'XOF',
        denominationMinor: 100,
        instrument: 'COIN',
        availableCount: 8,
      },
    ],
  });

  assert.equal(result.canAcceptCash, true);
  assert.equal(result.changeDueMinor, 500);
  assert.equal(result.reason, 'CHANGE_AVAILABLE');
  assert.deepEqual(result.dispensePlan, [
    {
      currency: 'XOF',
      denominationMinor: 100,
      instrument: 'COIN',
      count: 5,
    },
  ]);
});

test('rejects change when total inventory is insufficient', () => {
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
  assert.deepEqual(result.dispensePlan, []);
});

test('rejects cash when inventory value is sufficient but exact change cannot be composed', () => {
  const result = evaluateChangeFeasibility({
    currency: 'XOF',
    amountDueMinor: 1300,
    amountTenderedMinor: 2000,
    policy: 'CHANGE_MIXED',
    inventory: [
      {
        currency: 'XOF',
        denominationMinor: 500,
        instrument: 'BILL',
        availableCount: 2,
      },
      {
        currency: 'XOF',
        denominationMinor: 300,
        instrument: 'COIN',
        availableCount: 2,
      },
    ],
  });

  assert.equal(result.canAcceptCash, false);
  assert.equal(result.changeDueMinor, 700);
  assert.equal(result.reason, 'UNMAKEABLE_EXACT_CHANGE');
  assert.deepEqual(result.dispensePlan, []);
});

test('rejects malformed inventory deterministically', () => {
  const result = evaluateChangeFeasibility({
    currency: 'XOF',
    amountDueMinor: 1000,
    amountTenderedMinor: 1500,
    policy: 'CHANGE_MIXED',
    inventory: [{
      currency: 'XOF',
      denominationMinor: 0,
      instrument: 'COIN',
      availableCount: 10,
    }],
  });

  assert.equal(result.canAcceptCash, false);
  assert.equal(result.reason, 'INVALID_INVENTORY');
  assert.deepEqual(result.dispensePlan, []);
});

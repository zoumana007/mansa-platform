import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLedgerBalanceValidationErrorCode,
  validateLedgerBalance,
} from '../dist/ledger-balance.js';

const money = (amountMinor, currency = 'XOF') => ({ amountMinor, currency });

const validBalance = {
  accountId: 'account-0001',
  available: money(125_000n),
  pending: money(25_000n),
  asOf: '2026-08-07T15:00:00.000Z',
};

test('accepts a structurally valid ledger balance', () => {
  const result = validateLedgerBalance(validBalance);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('allows a negative available balance for products that permit overdraft', () => {
  const result = validateLedgerBalance({
    ...validBalance,
    available: money(-10_000n),
  });

  assert.equal(result.valid, true);
});

test('rejects invalid projection invariants', () => {
  const result = validateLedgerBalance({
    ...validBalance,
    accountId: ' ',
    available: money(125_000n, 'XOF'),
    pending: money(-1n, 'EUR'),
    asOf: 'not-a-date',
  });

  assert.equal(result.valid, false);
  for (const code of [
    'INVALID_ACCOUNT_ID',
    'CURRENCY_MISMATCH',
    'NEGATIVE_PENDING_AMOUNT',
    'INVALID_AS_OF',
  ]) {
    assert.ok(result.errors.some((error) => error.code === code));
    assert.equal(isLedgerBalanceValidationErrorCode(code), true);
  }
});

test('rejects unknown balance validation error codes', () => {
  assert.equal(isLedgerBalanceValidationErrorCode('UNKNOWN_CODE'), false);
});

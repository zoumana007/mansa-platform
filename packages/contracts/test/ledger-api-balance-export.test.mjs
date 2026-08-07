import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_BALANCE_VALIDATION_ERROR_CODES,
  LEDGER_API_METHODS,
  LEDGER_API_ROUTES,
  isLedgerBalanceValidationErrorCode,
  validateLedgerBalance,
} from '../dist/ledger-api.js';

test('exposes the stable ledger API routes and methods', () => {
  assert.equal(LEDGER_API_ROUTES.getBalance, '/v1/internal/ledger/accounts/:accountId/balance');
  assert.equal(LEDGER_API_METHODS.getBalance, 'GET');
});

test('re-exports ledger balance validation through the public ledger-api subpath', () => {
  const result = validateLedgerBalance({
    accountId: 'account-0001',
    available: { amountMinor: 100_000n, currency: 'XOF' },
    pending: { amountMinor: 5_000n, currency: 'XOF' },
    asOf: '2026-08-07T16:00:00.000Z',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.ok(LEDGER_BALANCE_VALIDATION_ERROR_CODES.includes('INVALID_ACCOUNT_ID'));
  assert.equal(isLedgerBalanceValidationErrorCode('INVALID_AS_OF'), true);
});

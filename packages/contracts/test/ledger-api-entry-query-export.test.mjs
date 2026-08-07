import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_API_METHODS,
  LEDGER_API_ROUTES,
  LEDGER_ENTRY_QUERY_VALIDATION_ERROR_CODES,
  validateListLedgerEntriesQuery,
} from '../dist/ledger-api.js';

test('keeps the listEntries route and method stable', () => {
  assert.equal(
    LEDGER_API_ROUTES.listEntries,
    '/v1/internal/ledger/accounts/:accountId/entries',
  );
  assert.equal(LEDGER_API_METHODS.listEntries, 'GET');
});

test('exports ledger entry query validation through ledger-api', () => {
  assert.ok(LEDGER_ENTRY_QUERY_VALIDATION_ERROR_CODES.includes('INVALID_LIMIT'));

  const result = validateListLedgerEntriesQuery({
    accountId: 'account-0001',
    limit: 50,
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_ENTRY_PAGE_VALIDATION_ERROR_CODES,
  validateLedgerEntryPage,
} from '../dist/ledger-api.js';

const entry = {
  id: 'entry-0001',
  transactionId: 'transaction-0001',
  accountId: 'account-0001',
  direction: 'CREDIT',
  amount: { amountMinor: 500n, currency: 'XOF' },
  sequence: 1,
  postedAt: '2026-08-07T12:00:00.000Z',
};

test('exports ledger entry page validation through ledger-api', () => {
  assert.ok(LEDGER_ENTRY_PAGE_VALIDATION_ERROR_CODES.includes('PAGE_TOO_LARGE'));

  const result = validateLedgerEntryPage({ items: [entry] });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

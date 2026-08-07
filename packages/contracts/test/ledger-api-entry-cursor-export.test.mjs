import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_ENTRY_CURSOR_VERSIONS,
  validateLedgerEntryCursor,
} from '../dist/ledger-api.js';

test('exports ledger entry cursor validation through ledger-api', () => {
  assert.deepEqual(LEDGER_ENTRY_CURSOR_VERSIONS, [1]);

  const result = validateLedgerEntryCursor({
    version: 1,
    accountId: 'account-0001',
    postedAt: '2026-08-07T18:00:00.000Z',
    entryId: 'entry-0001',
  });

  assert.equal(result.valid, true);
});

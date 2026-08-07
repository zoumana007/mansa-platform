import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_ENTRY_KEYSET_MATCH_ERROR_CODES,
  compareLedgerEntryPositions,
  isLedgerEntryAfterCursor,
  isLedgerEntryKeysetMatchErrorCode,
  validateLedgerEntryCursorAccount,
} from '../dist/ledger-api.js';

test('exports keyset pagination helpers through the public ledger API entrypoint', () => {
  assert.deepEqual(LEDGER_ENTRY_KEYSET_MATCH_ERROR_CODES, ['ACCOUNT_MISMATCH']);
  assert.equal(typeof compareLedgerEntryPositions, 'function');
  assert.equal(typeof isLedgerEntryAfterCursor, 'function');
  assert.equal(typeof validateLedgerEntryCursorAccount, 'function');
  assert.equal(isLedgerEntryKeysetMatchErrorCode('ACCOUNT_MISMATCH'), true);
});

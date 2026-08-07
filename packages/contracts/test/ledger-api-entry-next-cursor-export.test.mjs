import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_ENTRY_NEXT_CURSOR_ERROR_CODES,
  createLedgerEntryCursorFromEntry,
  createLedgerEntryNextCursor,
  isLedgerEntryNextCursorErrorCode,
} from '../dist/ledger-api.js';

test('exports next-cursor helpers from ledger-api', () => {
  assert.deepEqual(LEDGER_ENTRY_NEXT_CURSOR_ERROR_CODES, ['EMPTY_PAGE']);
  assert.equal(typeof createLedgerEntryCursorFromEntry, 'function');
  assert.equal(typeof createLedgerEntryNextCursor, 'function');
  assert.equal(typeof isLedgerEntryNextCursorErrorCode, 'function');
});

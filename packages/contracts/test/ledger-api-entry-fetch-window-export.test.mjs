import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_ENTRY_FETCH_WINDOW_ERROR_CODES,
  createLedgerEntryFetchWindow,
  isLedgerEntryFetchWindowErrorCode,
} from '../dist/ledger-api.js';

test('exports fetch-window helpers from ledger-api', () => {
  assert.deepEqual(LEDGER_ENTRY_FETCH_WINDOW_ERROR_CODES, ['INVALID_LIMIT']);
  assert.equal(typeof createLedgerEntryFetchWindow, 'function');
  assert.equal(typeof isLedgerEntryFetchWindowErrorCode, 'function');
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_ENTRY_PAGE_ORDER_ERROR_CODES,
  isLedgerEntryPageOrderErrorCode,
  validateLedgerEntryPageOrder,
} from '../dist/ledger-api.js';

test('exports ledger page order helpers from ledger-api', () => {
  assert.deepEqual(LEDGER_ENTRY_PAGE_ORDER_ERROR_CODES, ['OUT_OF_ORDER']);
  assert.equal(typeof validateLedgerEntryPageOrder, 'function');
  assert.equal(isLedgerEntryPageOrderErrorCode('OUT_OF_ORDER'), true);
});

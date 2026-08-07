import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compareLedgerEntryPositions,
  isLedgerEntryAfterCursor,
  isLedgerEntryKeysetMatchErrorCode,
  validateLedgerEntryCursorAccount,
} from '../dist/ledger-entry-keyset.js';

const cursor = {
  version: 1,
  accountId: 'account-0001',
  postedAt: '2026-08-07T18:00:00.000Z',
  entryId: 'entry-0002',
};

test('orders ledger positions by postedAt then entryId', () => {
  assert.equal(
    compareLedgerEntryPositions(
      { postedAt: '2026-08-07T17:59:59.000Z', entryId: 'entry-9999' },
      { postedAt: cursor.postedAt, entryId: cursor.entryId },
    ),
    -1,
  );

  assert.equal(
    compareLedgerEntryPositions(
      { postedAt: cursor.postedAt, entryId: 'entry-0003' },
      { postedAt: cursor.postedAt, entryId: cursor.entryId },
    ),
    1,
  );

  assert.equal(
    compareLedgerEntryPositions(
      { postedAt: cursor.postedAt, entryId: cursor.entryId },
      { postedAt: cursor.postedAt, entryId: cursor.entryId },
    ),
    0,
  );
});

test('recognizes entries strictly after a cursor', () => {
  assert.equal(
    isLedgerEntryAfterCursor(
      { id: 'entry-0003', postedAt: cursor.postedAt },
      cursor,
    ),
    true,
  );
  assert.equal(
    isLedgerEntryAfterCursor(
      { id: cursor.entryId, postedAt: cursor.postedAt },
      cursor,
    ),
    false,
  );
});

test('rejects a cursor belonging to another ledger account', () => {
  const result = validateLedgerEntryCursorAccount('account-0002', cursor);

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.code, 'ACCOUNT_MISMATCH');
});

test('accepts a cursor bound to the requested account', () => {
  assert.deepEqual(validateLedgerEntryCursorAccount('account-0001', cursor), {
    valid: true,
    errors: [],
  });
  assert.equal(isLedgerEntryKeysetMatchErrorCode('ACCOUNT_MISMATCH'), true);
  assert.equal(isLedgerEntryKeysetMatchErrorCode('UNKNOWN'), false);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLedgerEntryCursorFromEntry,
  createLedgerEntryNextCursor,
  isLedgerEntryNextCursorErrorCode,
} from '../dist/ledger-entry-next-cursor.js';

function entry(id, postedAt, accountId = 'account-0001') {
  return { id, postedAt, accountId };
}

test('creates a stable cursor payload from one ledger entry', () => {
  const cursor = createLedgerEntryCursorFromEntry(
    entry('entry-0007', '2026-08-07T22:00:00.000Z'),
  );

  assert.deepEqual(cursor, {
    version: 1,
    accountId: 'account-0001',
    postedAt: '2026-08-07T22:00:00.000Z',
    entryId: 'entry-0007',
  });
});

test('uses the last actually returned entry for the next cursor', () => {
  const result = createLedgerEntryNextCursor([
    entry('entry-0001', '2026-08-07T21:59:58.000Z'),
    entry('entry-0002', '2026-08-07T21:59:59.000Z'),
    entry('entry-0003', '2026-08-07T22:00:00.000Z'),
  ]);

  assert.deepEqual(result, {
    cursor: {
      version: 1,
      accountId: 'account-0001',
      postedAt: '2026-08-07T22:00:00.000Z',
      entryId: 'entry-0003',
    },
    errors: [],
  });
});

test('does not invent a next cursor for an empty page', () => {
  const result = createLedgerEntryNextCursor([]);

  assert.equal(result.cursor, undefined);
  assert.equal(result.errors[0]?.code, 'EMPTY_PAGE');
});

test('recognizes next-cursor error codes', () => {
  assert.equal(isLedgerEntryNextCursorErrorCode('EMPTY_PAGE'), true);
  assert.equal(isLedgerEntryNextCursorErrorCode('UNKNOWN'), false);
});

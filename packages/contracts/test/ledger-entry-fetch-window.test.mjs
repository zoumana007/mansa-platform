import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLedgerEntryFetchWindow,
  isLedgerEntryFetchWindowErrorCode,
} from '../dist/ledger-entry-fetch-window.js';

function entry(id, postedAt, accountId = 'account-0001') {
  return {
    id,
    transactionId: `transaction-${id}`,
    accountId,
    sequence: 1,
    direction: 'CREDIT',
    amount: { amountMinor: 100n, currency: 'XOF' },
    postedAt,
  };
}

test('keeps only limit entries and detects a following page', () => {
  const result = createLedgerEntryFetchWindow(
    [
      entry('entry-0001', '2026-08-07T22:00:00.000Z'),
      entry('entry-0002', '2026-08-07T22:00:01.000Z'),
      entry('entry-0003', '2026-08-07T22:00:02.000Z'),
    ],
    2,
  );

  assert.equal(result.items.length, 2);
  assert.equal(result.items[1]?.id, 'entry-0002');
  assert.equal(result.hasNextPage, true);
  assert.deepEqual(result.nextCursor, {
    version: 1,
    accountId: 'account-0001',
    postedAt: '2026-08-07T22:00:01.000Z',
    entryId: 'entry-0002',
  });
  assert.deepEqual(result.errors, []);
});

test('does not expose a next cursor when no extra row exists', () => {
  const result = createLedgerEntryFetchWindow(
    [
      entry('entry-0001', '2026-08-07T22:00:00.000Z'),
      entry('entry-0002', '2026-08-07T22:00:01.000Z'),
    ],
    2,
  );

  assert.equal(result.items.length, 2);
  assert.equal(result.hasNextPage, false);
  assert.equal(result.nextCursor, undefined);
});

test('keeps an empty terminal page valid', () => {
  const result = createLedgerEntryFetchWindow([], 25);

  assert.deepEqual(result.items, []);
  assert.equal(result.hasNextPage, false);
  assert.equal(result.nextCursor, undefined);
  assert.deepEqual(result.errors, []);
});

test('rejects limits outside the public ledger bounds', () => {
  for (const limit of [0, 201, 1.5]) {
    const result = createLedgerEntryFetchWindow([], limit);
    assert.equal(result.errors[0]?.code, 'INVALID_LIMIT');
  }
});

test('recognizes fetch-window error codes', () => {
  assert.equal(isLedgerEntryFetchWindowErrorCode('INVALID_LIMIT'), true);
  assert.equal(isLedgerEntryFetchWindowErrorCode('UNKNOWN'), false);
});

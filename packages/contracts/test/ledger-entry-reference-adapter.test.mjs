import assert from 'node:assert/strict';
import test from 'node:test';

import { listLedgerEntriesFromMemory } from '../dist/ledger-api.js';

const cursorCodec = {
  encode: (cursor) => Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url'),
  decode: (value) => {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    } catch {
      return undefined;
    }
  },
};

const money = { amountMinor: 1000n, currency: 'XOF' };

const entry = (id, accountId, postedAt, sequence) => ({
  id,
  transactionId: `tx-${id}`,
  accountId,
  direction: sequence % 2 === 0 ? 'DEBIT' : 'CREDIT',
  amount: money,
  sequence,
  postedAt,
});

test('paginates deterministically without duplicates or omissions when postedAt values collide', () => {
  const sameTime = '2026-08-08T00:00:00.000Z';
  const laterTime = '2026-08-08T00:01:00.000Z';
  const entries = [
    entry('entry-3', 'account-1', sameTime, 3),
    entry('ignored', 'account-2', sameTime, 1),
    entry('entry-1', 'account-1', sameTime, 1),
    entry('entry-4', 'account-1', laterTime, 4),
    entry('entry-2', 'account-1', sameTime, 2),
  ];

  const first = listLedgerEntriesFromMemory(
    entries,
    { accountId: 'account-1', limit: 2 },
    cursorCodec,
  );

  assert.deepEqual(first.errors, []);
  assert.deepEqual(first.page?.items.map(({ id }) => id), ['entry-1', 'entry-2']);
  assert.equal(typeof first.page?.nextCursor, 'string');

  const second = listLedgerEntriesFromMemory(
    entries,
    {
      accountId: 'account-1',
      limit: 2,
      cursor: first.page.nextCursor,
    },
    cursorCodec,
  );

  assert.deepEqual(second.errors, []);
  assert.deepEqual(second.page?.items.map(({ id }) => id), ['entry-3', 'entry-4']);
  assert.equal(second.page?.nextCursor, undefined);

  const allIds = [...first.page.items, ...second.page.items].map(({ id }) => id);
  assert.deepEqual(allIds, ['entry-1', 'entry-2', 'entry-3', 'entry-4']);
  assert.equal(new Set(allIds).size, allIds.length);
});

test('rejects a cursor that belongs to another account', () => {
  const foreignCursor = cursorCodec.encode({
    version: 1,
    accountId: 'account-2',
    postedAt: '2026-08-08T00:00:00.000Z',
    entryId: 'entry-9',
  });

  const result = listLedgerEntriesFromMemory(
    [],
    { accountId: 'account-1', cursor: foreignCursor, limit: 10 },
    cursorCodec,
  );

  assert.equal(result.page, undefined);
  assert.deepEqual(result.errors.map(({ code }) => code), [
    'CURSOR_ACCOUNT_MISMATCH',
  ]);
});

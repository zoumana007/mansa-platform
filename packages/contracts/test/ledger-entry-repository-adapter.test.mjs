import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLedgerEntryRepositoryAdapterErrorCode,
  listLedgerEntriesFromRepository,
} from '../dist/ledger-entry-repository-adapter.js';

const createEntry = (id, postedAt) => ({
  id,
  transactionId: `tx-${id}`,
  sequence: 1,
  accountId: 'account-1',
  direction: 'DEBIT',
  amount: { currency: 'XOF', minor: 1000n },
  postedAt,
});

const cursorCodec = {
  encode: (cursor) => JSON.stringify(cursor),
  decode: (value) => JSON.parse(value),
};

test('maps the public query to a decoded repository keyset and limit plus one', async () => {
  let capturedQuery;
  const repository = {
    listEntries: async (query) => {
      capturedQuery = query;
      return [
        createEntry('entry-2', '2026-08-08T02:00:00.000Z'),
        createEntry('entry-3', '2026-08-08T03:00:00.000Z'),
      ];
    },
  };

  const cursor = cursorCodec.encode({
    version: 1,
    accountId: 'account-1',
    postedAt: '2026-08-08T01:00:00.000Z',
    entryId: 'entry-1',
  });

  const result = await listLedgerEntriesFromRepository(
    {
      accountId: 'account-1',
      from: '2026-08-01T00:00:00.000Z',
      to: '2026-08-31T23:59:59.999Z',
      cursor,
      limit: 1,
    },
    { repository, cursorCodec },
  );

  assert.deepEqual(capturedQuery, {
    accountId: 'account-1',
    from: '2026-08-01T00:00:00.000Z',
    to: '2026-08-31T23:59:59.999Z',
    after: {
      postedAt: '2026-08-08T01:00:00.000Z',
      entryId: 'entry-1',
    },
    take: 2,
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.page.items.length, 1);
  assert.equal(result.page.items[0].id, 'entry-2');
  assert.deepEqual(JSON.parse(result.page.nextCursor), {
    version: 1,
    accountId: 'account-1',
    postedAt: '2026-08-08T02:00:00.000Z',
    entryId: 'entry-2',
  });
});

test('rejects a cursor for another account before accessing persistence', async () => {
  let calls = 0;
  const repository = {
    listEntries: async () => {
      calls += 1;
      return [];
    },
  };

  const cursor = cursorCodec.encode({
    version: 1,
    accountId: 'account-2',
    postedAt: '2026-08-08T01:00:00.000Z',
    entryId: 'entry-1',
  });

  const result = await listLedgerEntriesFromRepository(
    { accountId: 'account-1', cursor, limit: 50 },
    { repository, cursorCodec },
  );

  assert.equal(calls, 0);
  assert.deepEqual(result.errors.map(({ code }) => code), [
    'CURSOR_ACCOUNT_MISMATCH',
  ]);
});

test('maps repository failures to a stable adapter error', async () => {
  const repository = {
    listEntries: async () => {
      throw new Error('database unavailable');
    },
  };

  const result = await listLedgerEntriesFromRepository(
    { accountId: 'account-1', limit: 50 },
    { repository, cursorCodec },
  );

  assert.deepEqual(result.errors.map(({ code }) => code), ['REPOSITORY_FAILURE']);
  assert.equal(isLedgerEntryRepositoryAdapterErrorCode('REPOSITORY_FAILURE'), true);
  assert.equal(isLedgerEntryRepositoryAdapterErrorCode('UNKNOWN'), false);
});

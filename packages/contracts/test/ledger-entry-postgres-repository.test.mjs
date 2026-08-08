import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PostgresLedgerEntryRepository,
  buildLedgerEntryPostgresStatement,
} from '../dist/ledger-entry-postgres-repository.js';

test('builds a parameterized keyset query without interpolating user values', () => {
  const statement = buildLedgerEntryPostgresStatement({
    accountId: "account-1' OR 1=1 --",
    from: '2026-08-01T00:00:00.000Z',
    to: '2026-08-31T23:59:59.999Z',
    after: {
      postedAt: '2026-08-08T03:00:00.000Z',
      entryId: 'entry-100',
    },
    take: 51,
  });

  assert.match(statement.text, /account_id = \$1/);
  assert.match(statement.text, /posted_at >= \$2/);
  assert.match(statement.text, /posted_at <= \$3/);
  assert.match(
    statement.text,
    /posted_at > \$4 OR \(posted_at = \$4 AND id > \$5\)/,
  );
  assert.match(statement.text, /ORDER BY posted_at ASC, id ASC/);
  assert.match(statement.text, /LIMIT \$6/);
  assert.equal(statement.text.includes("account-1' OR 1=1 --"), false);
  assert.deepEqual(statement.values, [
    "account-1' OR 1=1 --",
    '2026-08-01T00:00:00.000Z',
    '2026-08-31T23:59:59.999Z',
    '2026-08-08T03:00:00.000Z',
    'entry-100',
    51,
  ]);
});

test('maps PostgreSQL rows to storage-agnostic ledger entries', async () => {
  let captured;
  const client = {
    query: async (text, values) => {
      captured = { text, values };
      return {
        rows: [
          {
            id: 'entry-1',
            transaction_id: 'tx-1',
            sequence: 1,
            account_id: 'account-1',
            direction: 'DEBIT',
            amount_minor: '125000',
            currency: 'XOF',
            description: 'Paiement marchand',
            posted_at: new Date('2026-08-08T03:30:00.000Z'),
          },
        ],
      };
    },
  };

  const repository = new PostgresLedgerEntryRepository(client);
  const entries = await repository.listEntries({
    accountId: 'account-1',
    take: 10,
  });

  assert.equal(captured.values[0], 'account-1');
  assert.equal(captured.values[1], 10);
  assert.deepEqual(entries, [
    {
      id: 'entry-1',
      transactionId: 'tx-1',
      sequence: 1,
      accountId: 'account-1',
      direction: 'DEBIT',
      amount: { currency: 'XOF', amountMinor: 125000n },
      description: 'Paiement marchand',
      postedAt: '2026-08-08T03:30:00.000Z',
    },
  ]);
});

test('rejects malformed infrastructure rows instead of leaking invalid domain data', async () => {
  const client = {
    query: async () => ({
      rows: [
        {
          id: 'entry-1',
          transaction_id: 'tx-1',
          sequence: 1,
          account_id: 'account-1',
          direction: 'UNKNOWN',
          amount_minor: '125000',
          currency: 'XOF',
          description: null,
          posted_at: '2026-08-08T03:30:00.000Z',
        },
      ],
    }),
  };

  const repository = new PostgresLedgerEntryRepository(client);

  await assert.rejects(
    repository.listEntries({ accountId: 'account-1', take: 10 }),
    /invalid direction/,
  );
});

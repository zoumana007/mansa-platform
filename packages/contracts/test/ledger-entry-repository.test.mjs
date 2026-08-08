import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLedgerEntryRepositoryQueryErrorCode,
  validateLedgerEntryRepositoryQuery,
} from '../dist/ledger-api.js';

test('accepts a valid storage query using the limit plus one window', () => {
  const result = validateLedgerEntryRepositoryQuery({
    accountId: 'account-1',
    from: '2026-08-01T00:00:00.000Z',
    to: '2026-08-31T23:59:59.999Z',
    after: {
      postedAt: '2026-08-08T00:00:00.000Z',
      entryId: 'entry-42',
    },
    take: 201,
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('rejects invalid keyset and take values', () => {
  const result = validateLedgerEntryRepositoryQuery({
    accountId: 'account-1',
    after: {
      postedAt: 'not-a-date',
      entryId: '',
    },
    take: 202,
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors.map(({ code }) => code), [
    'INVALID_AFTER',
    'INVALID_TAKE',
  ]);
});

test('rejects an inverted date range and exposes stable error codes', () => {
  const result = validateLedgerEntryRepositoryQuery({
    accountId: 'account-1',
    from: '2026-08-09T00:00:00.000Z',
    to: '2026-08-08T00:00:00.000Z',
    take: 51,
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors.map(({ code }) => code), ['INVALID_DATE_RANGE']);
  assert.equal(isLedgerEntryRepositoryQueryErrorCode('INVALID_DATE_RANGE'), true);
  assert.equal(isLedgerEntryRepositoryQueryErrorCode('UNKNOWN'), false);
});

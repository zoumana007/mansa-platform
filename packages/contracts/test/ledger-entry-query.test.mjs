import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLedgerEntryQueryValidationErrorCode,
  validateListLedgerEntriesQuery,
} from '../dist/ledger-entry-query.js';

const validQuery = {
  accountId: 'account-0001',
  from: '2026-08-01T00:00:00.000Z',
  to: '2026-08-07T23:59:59.999Z',
  cursor: 'cursor-0001',
  limit: 100,
};

test('accepts a valid ledger entry query', () => {
  const result = validateListLedgerEntriesQuery(validQuery);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('accepts an account-only query', () => {
  const result = validateListLedgerEntriesQuery({ accountId: 'account-0001' });

  assert.equal(result.valid, true);
});

test('accepts inclusive date boundaries and supported limits', () => {
  const at = '2026-08-07T12:00:00.000Z';

  assert.equal(
    validateListLedgerEntriesQuery({ accountId: 'account-0001', from: at, to: at, limit: 1 }).valid,
    true,
  );
  assert.equal(
    validateListLedgerEntriesQuery({ accountId: 'account-0001', limit: 200 }).valid,
    true,
  );
});

test('rejects invalid filters and pagination parameters', () => {
  const result = validateListLedgerEntriesQuery({
    ...validQuery,
    accountId: ' ',
    from: '2026-08-08T00:00:00.000Z',
    to: '2026-08-07T00:00:00.000Z',
    cursor: ' ',
    limit: 201,
  });

  assert.equal(result.valid, false);
  for (const code of [
    'INVALID_ACCOUNT_ID',
    'INVALID_DATE_RANGE',
    'INVALID_CURSOR',
    'INVALID_LIMIT',
  ]) {
    assert.ok(result.errors.some((error) => error.code === code));
    assert.equal(isLedgerEntryQueryValidationErrorCode(code), true);
  }
});

test('rejects malformed date-times and non-integer limits', () => {
  const result = validateListLedgerEntriesQuery({
    accountId: 'account-0001',
    from: 'not-a-date',
    to: '',
    limit: 10.5,
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === 'INVALID_FROM'));
  assert.ok(result.errors.some((error) => error.code === 'INVALID_TO'));
  assert.ok(result.errors.some((error) => error.code === 'INVALID_LIMIT'));
});

test('rejects unknown ledger entry query validation error codes', () => {
  assert.equal(isLedgerEntryQueryValidationErrorCode('UNKNOWN_CODE'), false);
});

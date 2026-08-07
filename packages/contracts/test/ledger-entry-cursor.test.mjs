import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_ENTRY_CURSOR_VALIDATION_ERROR_CODES,
  LEDGER_ENTRY_CURSOR_VERSIONS,
  isLedgerEntryCursorValidationErrorCode,
  validateLedgerEntryCursor,
} from '../dist/ledger-entry-cursor.js';

const createCursor = (overrides = {}) => ({
  version: 1,
  accountId: 'account-0001',
  postedAt: '2026-08-07T18:00:00.000Z',
  entryId: 'entry-0001',
  ...overrides,
});

test('accepts a valid deterministic ledger entry cursor payload', () => {
  const result = validateLedgerEntryCursor(createCursor());

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('rejects an unsupported cursor version', () => {
  const result = validateLedgerEntryCursor(createCursor({ version: 2 }));

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.code, 'UNSUPPORTED_VERSION');
});

test('rejects missing stable cursor fields', () => {
  const result = validateLedgerEntryCursor(
    createCursor({ accountId: ' ', postedAt: 'not-a-date', entryId: '' }),
  );

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.errors.map(({ code }) => code),
    ['INVALID_ACCOUNT_ID', 'INVALID_POSTED_AT', 'INVALID_ENTRY_ID'],
  );
});

test('keeps cursor versions and error-code guards stable', () => {
  assert.deepEqual(LEDGER_ENTRY_CURSOR_VERSIONS, [1]);
  assert.ok(
    LEDGER_ENTRY_CURSOR_VALIDATION_ERROR_CODES.includes('UNSUPPORTED_VERSION'),
  );
  assert.equal(isLedgerEntryCursorValidationErrorCode('INVALID_ENTRY_ID'), true);
  assert.equal(isLedgerEntryCursorValidationErrorCode('UNKNOWN'), false);
});

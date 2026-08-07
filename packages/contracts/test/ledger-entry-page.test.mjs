import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEDGER_ENTRY_PAGE_VALIDATION_ERROR_CODES,
  isLedgerEntryPageValidationErrorCode,
  validateLedgerEntryPage,
} from '../dist/ledger-entry-page.js';

const createEntry = (overrides = {}) => ({
  id: 'entry-0001',
  transactionId: 'transaction-0001',
  accountId: 'account-0001',
  direction: 'DEBIT',
  amount: { amountMinor: 1000n, currency: 'XOF' },
  description: 'Test entry',
  sequence: 1,
  postedAt: '2026-08-07T12:00:00.000Z',
  ...overrides,
});

test('accepts a valid ledger entry page', () => {
  const result = validateLedgerEntryPage({
    items: [createEntry()],
    nextCursor: 'opaque-cursor',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('rejects an empty next cursor', () => {
  const result = validateLedgerEntryPage({
    items: [createEntry()],
    nextCursor: '   ',
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.code, 'EMPTY_NEXT_CURSOR');
});

test('rejects duplicate entry ids', () => {
  const result = validateLedgerEntryPage({
    items: [createEntry(), createEntry({ transactionId: 'transaction-0002' })],
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(({ code }) => code === 'DUPLICATE_ENTRY_ID'));
});

test('rejects invalid stable identity fields', () => {
  const result = validateLedgerEntryPage({
    items: [
      createEntry({
        id: '',
        transactionId: '',
        accountId: '',
        sequence: 0,
        postedAt: 'not-a-date',
      }),
    ],
  });

  assert.equal(result.valid, false);
  assert.deepEqual(
    result.errors.map(({ code }) => code),
    [
      'INVALID_ENTRY_ID',
      'INVALID_TRANSACTION_ID',
      'INVALID_ACCOUNT_ID',
      'INVALID_SEQUENCE',
      'INVALID_POSTED_AT',
    ],
  );
});

test('rejects pages larger than the contract maximum', () => {
  const items = Array.from({ length: 201 }, (_, index) =>
    createEntry({ id: `entry-${index}`, sequence: index + 1 }),
  );

  const result = validateLedgerEntryPage({ items });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(({ code }) => code === 'PAGE_TOO_LARGE'));
});

test('keeps validation error code guards stable', () => {
  assert.ok(LEDGER_ENTRY_PAGE_VALIDATION_ERROR_CODES.includes('PAGE_TOO_LARGE'));
  assert.equal(isLedgerEntryPageValidationErrorCode('INVALID_SEQUENCE'), true);
  assert.equal(isLedgerEntryPageValidationErrorCode('UNKNOWN'), false);
});

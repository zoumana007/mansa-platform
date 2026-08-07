import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLedgerBalanced,
  validateLedgerEntries,
  validatePostLedgerTransactionCommand,
} from '../dist/ledger.js';

const money = (amountMinor, currency = 'XOF') => ({ amountMinor, currency });

const balancedEntries = [
  { accountId: 'wallet:user', direction: 'DEBIT', amount: money(10_000n) },
  { accountId: 'cash:platform', direction: 'CREDIT', amount: money(10_000n) },
];

const validCommand = {
  reference: 'PAY-2026-0001',
  transactionType: 'PAYMENT',
  entries: balancedEntries,
  idempotencyKey: 'idem-00000001',
  correlationId: 'corr-0001',
  countryCode: 'ML',
  occurredAt: '2026-08-07T12:00:00.000Z',
};

test('accepts a balanced double-entry transaction', () => {
  const result = validateLedgerEntries(balancedEntries);

  assert.equal(result.valid, true);
  assert.equal(result.currency, 'XOF');
  assert.equal(result.debitTotalMinor, 10_000n);
  assert.equal(result.creditTotalMinor, 10_000n);
  assert.deepEqual(result.errors, []);
  assert.equal(isLedgerBalanced(balancedEntries), true);
});

test('rejects a transaction with fewer than two entries', () => {
  const result = validateLedgerEntries([balancedEntries[0]]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === 'INSUFFICIENT_ENTRIES'));
});

test('rejects zero and negative amounts', () => {
  const result = validateLedgerEntries([
    { accountId: 'wallet:user', direction: 'DEBIT', amount: money(0n) },
    { accountId: 'cash:platform', direction: 'CREDIT', amount: money(-1n) },
  ]);

  assert.equal(result.valid, false);
  assert.equal(
    result.errors.filter((error) => error.code === 'NON_POSITIVE_AMOUNT').length,
    2,
  );
});

test('rejects mixed currencies', () => {
  const result = validateLedgerEntries([
    { accountId: 'wallet:user', direction: 'DEBIT', amount: money(10_000n, 'XOF') },
    { accountId: 'cash:platform', direction: 'CREDIT', amount: money(10_000n, 'EUR') },
  ]);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === 'MULTIPLE_CURRENCIES'));
  assert.equal(result.currency, undefined);
});

test('rejects unbalanced debit and credit totals', () => {
  const result = validateLedgerEntries([
    { accountId: 'wallet:user', direction: 'DEBIT', amount: money(10_000n) },
    { accountId: 'cash:platform', direction: 'CREDIT', amount: money(9_500n) },
  ]);

  assert.equal(result.valid, false);
  assert.equal(result.debitTotalMinor, 10_000n);
  assert.equal(result.creditTotalMinor, 9_500n);
  assert.ok(result.errors.some((error) => error.code === 'UNBALANCED_TOTALS'));
  assert.equal(isLedgerBalanced([
    { accountId: 'wallet:user', direction: 'DEBIT', amount: money(10_000n) },
    { accountId: 'cash:platform', direction: 'CREDIT', amount: money(9_500n) },
  ]), false);
});

test('accepts a complete posting command', () => {
  const result = validatePostLedgerTransactionCommand(validCommand);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.entries.valid, true);
});

test('rejects malformed posting command fields', () => {
  const result = validatePostLedgerTransactionCommand({
    ...validCommand,
    reference: ' ',
    transactionType: '',
    idempotencyKey: 'short',
    correlationId: '',
    countryCode: 'ml',
    occurredAt: 'not-a-date',
  });

  assert.equal(result.valid, false);
  for (const code of [
    'INVALID_REFERENCE',
    'INVALID_TRANSACTION_TYPE',
    'INVALID_IDEMPOTENCY_KEY',
    'INVALID_CORRELATION_ID',
    'INVALID_COUNTRY_CODE',
    'INVALID_OCCURRED_AT',
  ]) {
    assert.ok(result.errors.some((error) => error.code === code));
  }
});

test('propagates invalid financial entries to command validation', () => {
  const result = validatePostLedgerTransactionCommand({
    ...validCommand,
    entries: [
      { accountId: 'wallet:user', direction: 'DEBIT', amount: money(10_000n) },
      { accountId: 'cash:platform', direction: 'CREDIT', amount: money(9_000n) },
    ],
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === 'INVALID_ENTRIES'));
  assert.ok(result.entries.errors.some((error) => error.code === 'UNBALANCED_TOTALS'));
});

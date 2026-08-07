import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLedgerBalanced,
  validateLedgerEntries,
} from '../dist/ledger.js';

const money = (amountMinor, currency = 'XOF') => ({ amountMinor, currency });

const balancedEntries = [
  { accountId: 'wallet:user', direction: 'DEBIT', amount: money(10_000n) },
  { accountId: 'cash:platform', direction: 'CREDIT', amount: money(10_000n) },
];

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

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTransactionLimitAmount,
  evaluateTransactionLimit,
} from '../dist/transaction-limits.js';

const activeLimit = {
  limitId: 'limit-daily-user',
  scope: 'USER',
  scopeId: 'user-1',
  period: 'DAILY',
  amount: { amountMinor: 100_000n, currency: 'XOF' },
  status: 'ACTIVE',
  effectiveFrom: '2026-01-01T00:00:00.000Z',
};

const consumption = {
  limitId: activeLimit.limitId,
  consumedAmountMinor: 40_000n,
  operationCount: 2,
  periodStartedAt: '2026-08-02T00:00:00.000Z',
  periodEndsAt: '2026-08-03T00:00:00.000Z',
};

test('autorise une opération qui reste dans la limite', () => {
  const result = evaluateTransactionLimit(
    activeLimit,
    consumption,
    { amountMinor: 50_000n, currency: 'XOF' },
    new Date('2026-08-02T08:00:00.000Z'),
  );

  assert.deepEqual(result, {
    allowed: true,
    reason: 'WITHIN_LIMIT',
    remainingAmountMinor: 60_000n,
  });
});

test('refuse une opération qui dépasse le montant restant', () => {
  const result = evaluateTransactionLimit(
    activeLimit,
    consumption,
    { amountMinor: 70_000n, currency: 'XOF' },
    new Date('2026-08-02T08:00:00.000Z'),
  );

  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'LIMIT_EXCEEDED');
  assert.equal(result.remainingAmountMinor, 60_000n);
});

test('refuse une devise différente et une limite inactive', () => {
  assert.equal(
    evaluateTransactionLimit(
      activeLimit,
      consumption,
      { amountMinor: 1_000n, currency: 'EUR' },
      new Date('2026-08-02T08:00:00.000Z'),
    ).reason,
    'CURRENCY_MISMATCH',
  );

  assert.equal(
    evaluateTransactionLimit(
      { ...activeLimit, status: 'SUSPENDED' },
      consumption,
      { amountMinor: 1_000n, currency: 'XOF' },
      new Date('2026-08-02T08:00:00.000Z'),
    ).reason,
    'LIMIT_INACTIVE',
  );
});

test('rejette la création d’une limite négative', () => {
  assert.throws(() => createTransactionLimitAmount(-1n, 'XOF'));
  assert.deepEqual(createTransactionLimitAmount(10_000n, 'XOF'), {
    amountMinor: 10_000n,
    currency: 'XOF',
  });
});

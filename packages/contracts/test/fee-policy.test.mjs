import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateFeeQuote } from '../dist/fee-policy.js';

const basePolicy = {
  policyId: 'fee-card-xof',
  operationType: 'CARD_PAYMENT',
  countryCode: 'ML',
  currency: 'XOF',
  method: 'FIXED_PLUS_PERCENTAGE',
  fixedAmountMinor: 100n,
  percentageBasisPoints: 150,
  minimumFeeMinor: 200n,
  maximumFeeMinor: 2_000n,
  payer: 'CUSTOMER',
  status: 'ACTIVE',
  effectiveFrom: '2026-01-01T00:00:00.000Z',
};

test('calcule des frais fixes et proportionnels en unités mineures', () => {
  const quote = calculateFeeQuote(basePolicy, { amountMinor: 100_000n, currency: 'XOF' });

  assert.deepEqual(quote.feeAmount, { amountMinor: 1_600n, currency: 'XOF' });
  assert.deepEqual(quote.totalDebitedAmount, { amountMinor: 101_600n, currency: 'XOF' });
  assert.deepEqual(quote.netCreditedAmount, { amountMinor: 100_000n, currency: 'XOF' });
});

test('applique les frais minimum et maximum', () => {
  assert.equal(
    calculateFeeQuote(basePolicy, { amountMinor: 1_000n, currency: 'XOF' }).feeAmount.amountMinor,
    200n,
  );
  assert.equal(
    calculateFeeQuote(basePolicy, { amountMinor: 1_000_000n, currency: 'XOF' }).feeAmount.amountMinor,
    2_000n,
  );
});

test('répartit les frais partagés sans perdre une unité mineure', () => {
  const quote = calculateFeeQuote(
    { ...basePolicy, method: 'FIXED', fixedAmountMinor: 101n, minimumFeeMinor: undefined, maximumFeeMinor: undefined, payer: 'SHARED' },
    { amountMinor: 10_000n, currency: 'XOF' },
  );

  assert.equal(quote.totalDebitedAmount.amountMinor, 10_050n);
  assert.equal(quote.netCreditedAmount.amountMinor, 9_949n);
});

test('refuse une politique inactive, une devise différente et une configuration invalide', () => {
  assert.throws(() => calculateFeeQuote({ ...basePolicy, status: 'SUSPENDED' }, { amountMinor: 10_000n, currency: 'XOF' }));
  assert.throws(() => calculateFeeQuote(basePolicy, { amountMinor: 10_000n, currency: 'EUR' }));
  assert.throws(() => calculateFeeQuote({ ...basePolicy, fixedAmountMinor: -1n }, { amountMinor: 10_000n, currency: 'XOF' }));
});

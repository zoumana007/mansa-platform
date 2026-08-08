import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLedgerWriteRequest } from '../dist/ledger-write.validation.js';

const validRequest = () => ({
  reference: 'PAYMENT:demo:001',
  transactionType: 'PAYMENT_CAPTURE',
  idempotencyKey: 'idem-demo-001',
  correlationId: 'corr-demo-001',
  countryCode: 'ML',
  occurredAt: '2026-08-08T09:00:00.000Z',
  metadata: { source: 'test' },
  entries: [
    {
      accountId: '11111111-1111-4111-8111-111111111111',
      direction: 'DEBIT',
      amountMinor: '1000',
      currency: 'XOF',
    },
    {
      accountId: '22222222-2222-4222-8222-222222222222',
      direction: 'CREDIT',
      amountMinor: '1000',
      currency: 'XOF',
    },
  ],
});

test('accepts a balanced JSON-safe ledger write request', () => {
  const result = validateLedgerWriteRequest(validRequest());

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.value?.entries[0]?.amountMinor, 1000n);
  assert.equal(result.value?.occurredAt.toISOString(), '2026-08-08T09:00:00.000Z');
});

test('rejects unbalanced totals', () => {
  const request = validRequest();
  request.entries[1].amountMinor = '999';

  const result = validateLedgerWriteRequest(request);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('ledger debit and credit totals must be equal.'));
});

test('rejects mixed currencies', () => {
  const request = validRequest();
  request.entries[1].currency = 'EUR';

  const result = validateLedgerWriteRequest(request);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('all entries must use the same currency.'));
});

test('rejects numeric amountMinor because HTTP amounts must be strings', () => {
  const request = validRequest();
  request.entries[0].amountMinor = 1000;

  const result = validateLedgerWriteRequest(request);

  assert.equal(result.valid, false);
  assert.ok(
    result.errors.includes('entries.0.amountMinor must be a positive integer string.'),
  );
});

test('rejects malformed account identifiers and metadata values', () => {
  const request = validRequest();
  request.entries[0].accountId = 'not-a-uuid';
  request.metadata = { source: 123 };

  const result = validateLedgerWriteRequest(request);

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('entries.0.accountId must be a UUID v4.'));
  assert.ok(result.errors.includes('metadata.source must be a string.'));
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLedgerReversalRequest } from '../dist/ledger-reversal.validation.js';

test('normalizes a valid ledger reversal request', () => {
  const result = validateLedgerReversalRequest({
    reasonCode: ' CUSTOMER_REFUND ',
    reason: ' Customer requested a refund ',
    idempotencyKey: ' reversal-001 ',
    correlationId: ' payment-001 ',
  });

  assert.deepEqual(result, {
    valid: true,
    errors: [],
    value: {
      reasonCode: 'CUSTOMER_REFUND',
      reason: 'Customer requested a refund',
      idempotencyKey: 'reversal-001',
      correlationId: 'payment-001',
    },
  });
});

test('rejects incomplete ledger reversal requests', () => {
  const result = validateLedgerReversalRequest({ reasonCode: '' });

  assert.equal(result.valid, false);
  assert.equal(result.value, undefined);
  assert.deepEqual(result.errors, [
    'reasonCode must be a non-empty string of at most 64 characters.',
    'reason must be a non-empty string of at most 256 characters.',
    'idempotencyKey must be a non-empty string of at most 128 characters.',
    'correlationId must be a non-empty string of at most 128 characters.',
  ]);
});

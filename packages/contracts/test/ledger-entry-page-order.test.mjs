import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLedgerEntryPageOrderErrorCode,
  validateLedgerEntryPageOrder,
} from '../dist/ledger-entry-page-order.js';

const baseEntry = {
  transactionId: 'txn-0001',
  accountId: 'account-0001',
  sequence: 1,
  postedAt: '2026-08-07T18:00:00.000Z',
};

function entry(id, postedAt = baseEntry.postedAt) {
  return {
    ...baseEntry,
    id,
    postedAt,
  };
}

test('accepts pages ordered by postedAt then entry id', () => {
  const result = validateLedgerEntryPageOrder({
    items: [
      entry('entry-0001', '2026-08-07T17:59:59.000Z'),
      entry('entry-0002'),
      entry('entry-0003'),
      entry('entry-0004', '2026-08-07T18:00:01.000Z'),
    ],
  });

  assert.deepEqual(result, { valid: true, errors: [] });
});

test('rejects an item with an earlier postedAt than its predecessor', () => {
  const result = validateLedgerEntryPageOrder({
    items: [
      entry('entry-0002', '2026-08-07T18:00:00.000Z'),
      entry('entry-0001', '2026-08-07T17:59:59.000Z'),
    ],
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.code, 'OUT_OF_ORDER');
  assert.equal(result.errors[0]?.entryIndex, 1);
});

test('rejects a non-increasing entry id when timestamps are equal', () => {
  const result = validateLedgerEntryPageOrder({
    items: [entry('entry-0002'), entry('entry-0001')],
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors[0]?.code, 'OUT_OF_ORDER');
  assert.equal(result.errors[0]?.entryIndex, 1);
});

test('recognizes page order error codes', () => {
  assert.equal(isLedgerEntryPageOrderErrorCode('OUT_OF_ORDER'), true);
  assert.equal(isLedgerEntryPageOrderErrorCode('UNKNOWN'), false);
});

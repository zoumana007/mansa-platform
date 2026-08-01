import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TRANSFER_FAILURE_CODES,
  TRANSFER_STATUSES,
  TRANSFER_TYPES,
  isTransferFailureCode,
  isTransferStatus,
  isTransferType,
} from '../dist/transfer.js';

test('reconnaît les types de transfert', () => {
  for (const type of TRANSFER_TYPES) {
    assert.equal(isTransferType(type), true);
  }

  assert.equal(isTransferType('CRYPTO'), false);
});

test('reconnaît les statuts de transfert', () => {
  for (const status of TRANSFER_STATUSES) {
    assert.equal(isTransferStatus(status), true);
  }

  assert.equal(isTransferStatus('DELETED'), false);
});

test('reconnaît les codes d’échec de transfert', () => {
  for (const code of TRANSFER_FAILURE_CODES) {
    assert.equal(isTransferFailureCode(code), true);
  }

  assert.equal(isTransferFailureCode('UNKNOWN'), false);
});

test('les catalogues de transfert restent sans doublon', () => {
  assert.equal(new Set(TRANSFER_TYPES).size, TRANSFER_TYPES.length);
  assert.equal(new Set(TRANSFER_STATUSES).size, TRANSFER_STATUSES.length);
  assert.equal(
    new Set(TRANSFER_FAILURE_CODES).size,
    TRANSFER_FAILURE_CODES.length,
  );
});

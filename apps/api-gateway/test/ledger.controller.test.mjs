import assert from 'node:assert/strict';
import test from 'node:test';

import { NotFoundException } from '@nestjs/common';

import { LedgerController } from '../dist/ledger.controller.js';

const transactionId = '11111111-1111-4111-8111-111111111111';

const makeController = ({ transaction = null } = {}) => {
  const calls = [];
  const readService = {
    async getTransaction(id) {
      calls.push(id);
      return transaction;
    },
  };
  const writeService = {};

  return {
    controller: new LedgerController(readService, writeService),
    calls,
  };
};

test('returns a ledger transaction by identifier', async () => {
  const expected = {
    id: transactionId,
    reference: 'PAYMENT-2026-0001',
    status: 'POSTED',
  };
  const { controller, calls } = makeController({ transaction: expected });

  const result = await controller.getTransaction(transactionId);

  assert.deepEqual(result, expected);
  assert.deepEqual(calls, [transactionId]);
});

test('returns 404 semantics when a ledger transaction does not exist', async () => {
  const { controller, calls } = makeController();

  await assert.rejects(
    () => controller.getTransaction(transactionId),
    (error) =>
      error instanceof NotFoundException &&
      error.message === 'Ledger transaction not found.',
  );

  assert.deepEqual(calls, [transactionId]);
});

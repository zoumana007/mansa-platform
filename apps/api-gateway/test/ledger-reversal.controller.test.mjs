import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { LedgerController } from '../dist/ledger.controller.js';

const transactionId = '11111111-1111-4111-8111-111111111111';

const makeController = () => {
  const calls = [];
  const writeService = {
    async reverse(id, request) {
      calls.push({ id, request });
      return { id: '22222222-2222-4222-8222-222222222222', replayed: false };
    },
  };

  return {
    controller: new LedgerController({}, writeService),
    calls,
  };
};

test('forwards a normalized reversal command to the write service', async () => {
  const { controller, calls } = makeController();
  const result = await controller.reverseTransaction(transactionId, {
    reasonCode: ' CUSTOMER_REFUND ',
    reason: ' Customer requested a refund ',
    idempotencyKey: ' reversal-001 ',
    correlationId: ' payment-001 ',
  });

  assert.equal(result.replayed, false);
  assert.deepEqual(calls, [
    {
      id: transactionId,
      request: {
        reasonCode: 'CUSTOMER_REFUND',
        reason: 'Customer requested a refund',
        idempotencyKey: 'reversal-001',
        correlationId: 'payment-001',
      },
    },
  ]);
});

test('rejects an invalid reversal command before calling the write service', async () => {
  const { controller, calls } = makeController();

  await assert.rejects(
    () => controller.reverseTransaction(transactionId, { reasonCode: 'CUSTOMER_REFUND' }),
    (error) => error instanceof BadRequestException,
  );
  assert.deepEqual(calls, []);
});

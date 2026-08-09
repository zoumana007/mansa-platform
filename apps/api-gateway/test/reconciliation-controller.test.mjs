import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { ReconciliationController } from '../dist/reconciliation/reconciliation.controller.js';

function createRepository(overrides = {}) {
  return {
    listBatches: async (limit, cursor) => ({ data: [], hasNextPage: false, limit, cursor }),
    getBatch: async () => ({ id: '00000000-0000-4000-8000-000000000001' }),
    listItems: async (batchId, limit, cursor) => ({ data: [], hasNextPage: false, batchId, limit, cursor }),
    getItem: async () => ({ id: '00000000-0000-4000-8000-000000000002' }),
    resolveItem: async (input) => ({ id: input.itemId, status: input.status }),
    ...overrides,
  };
}

test('listBatches applies defaults and forwards cursor', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      listBatches: async (limit, cursor) => {
        calls.push({ limit, cursor });
        return { data: [], hasNextPage: false };
      },
    }),
  );

  await controller.listBatches(undefined, 'cursor-1');
  assert.deepEqual(calls, [{ limit: 50, cursor: 'cursor-1' }]);
});

test('listBatches rejects invalid limits and invalid cursors', async () => {
  const controller = new ReconciliationController(
    createRepository({
      listBatches: async () => {
        throw new Error('invalid reconciliation cursor');
      },
    }),
  );

  await assert.rejects(() => controller.listBatches('0'), BadRequestException);
  await assert.rejects(() => controller.listBatches('101'), BadRequestException);
  await assert.rejects(() => controller.listBatches('abc'), BadRequestException);
  await assert.rejects(() => controller.listBatches('10', 'broken'), BadRequestException);
});

test('batch and item reads return 404 when resources do not exist', async () => {
  const controller = new ReconciliationController(
    createRepository({ getBatch: async () => null, getItem: async () => null }),
  );

  await assert.rejects(
    () => controller.getBatch('00000000-0000-4000-8000-000000000001'),
    NotFoundException,
  );
  await assert.rejects(
    () => controller.getItem('00000000-0000-4000-8000-000000000002'),
    NotFoundException,
  );
});

test('listItems checks batch existence, bounds limits and forwards cursor', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      listItems: async (batchId, limit, cursor) => {
        calls.push({ batchId, limit, cursor });
        return { data: [], hasNextPage: false };
      },
    }),
  );
  const batchId = '00000000-0000-4000-8000-000000000001';

  await controller.listItems(batchId, undefined, 'cursor-2');
  assert.deepEqual(calls, [{ batchId, limit: 100, cursor: 'cursor-2' }]);
  await assert.rejects(() => controller.listItems(batchId, '501'), BadRequestException);

  const missing = new ReconciliationController(createRepository({ getBatch: async () => null }));
  await assert.rejects(() => missing.listItems(batchId), NotFoundException);
});

test('resolveItem validates status and maps repository domain failures to HTTP errors', async () => {
  const itemId = '00000000-0000-4000-8000-000000000002';
  const validBody = {
    status: 'RESOLVED',
    resolutionNote: 'Écart vérifié.',
    reasonCode: 'PROVIDER_CONFIRMED',
    idempotencyKey: 'resolve-1',
    correlationId: 'corr-1',
    actorId: 'operator-1',
    actorType: 'SERVICE_ACCOUNT',
  };

  const invalidStatus = new ReconciliationController(createRepository());
  await assert.rejects(
    () => invalidStatus.resolveItem(itemId, { ...validBody, status: 'UNKNOWN' }),
    BadRequestException,
  );

  const missing = new ReconciliationController(
    createRepository({ resolveItem: async () => { throw new Error('reconciliation item not found'); } }),
  );
  await assert.rejects(() => missing.resolveItem(itemId, validBody), NotFoundException);

  const badRequest = new ReconciliationController(
    createRepository({ resolveItem: async () => { throw new Error('resolutionNote, reasonCode, idempotencyKey, correlationId, actorId and actorType are required'); } }),
  );
  await assert.rejects(() => badRequest.resolveItem(itemId, validBody), BadRequestException);
});

test('resolveItem forwards the complete auditable command', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      resolveItem: async (input) => {
        calls.push(input);
        return { id: input.itemId, status: input.status };
      },
    }),
  );
  const itemId = '00000000-0000-4000-8000-000000000002';
  const body = {
    status: 'IGNORED',
    resolutionNote: 'Faux positif confirmé.',
    reasonCode: 'FALSE_POSITIVE',
    idempotencyKey: 'ignore-1',
    correlationId: 'corr-ignore-1',
    actorId: 'operator-2',
    actorType: 'SERVICE_ACCOUNT',
  };

  const result = await controller.resolveItem(itemId, body);
  assert.equal(result.status, 'IGNORED');
  assert.deepEqual(calls, [{ itemId, ...body }]);
});

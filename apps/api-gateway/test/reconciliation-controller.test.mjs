import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { ReconciliationController } from '../dist/reconciliation/reconciliation.controller.js';

const organizationId = 'org-test';

function createRepository(overrides = {}) {
  return {
    listBatches: async (scope, limit, cursor) => ({ data: [], page: { hasNextPage: false }, scope, limit, cursor }),
    getBatch: async () => ({ id: '00000000-0000-4000-8000-000000000001' }),
    listItems: async (scope, batchId, limit, cursor) => ({ data: [], page: { hasNextPage: false }, scope, batchId, limit, cursor }),
    getItem: async () => ({ id: '00000000-0000-4000-8000-000000000002' }),
    resolveItem: async (input) => ({ id: input.itemId, status: input.status }),
    ...overrides,
  };
}

test('listBatches requires organization scope and forwards defaults and cursor', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      listBatches: async (scope, limit, cursor) => {
        calls.push({ scope, limit, cursor });
        return { data: [], page: { hasNextPage: false } };
      },
    }),
  );

  await assert.rejects(() => controller.listBatches(undefined), BadRequestException);
  await controller.listBatches(organizationId, undefined, 'cursor-1');
  assert.deepEqual(calls, [{ scope: organizationId, limit: 50, cursor: 'cursor-1' }]);
});

test('listBatches rejects invalid limits and invalid cursors', async () => {
  const controller = new ReconciliationController(
    createRepository({
      listBatches: async () => {
        throw new Error('invalid reconciliation cursor');
      },
    }),
  );

  await assert.rejects(() => controller.listBatches(organizationId, '0'), BadRequestException);
  await assert.rejects(() => controller.listBatches(organizationId, '101'), BadRequestException);
  await assert.rejects(() => controller.listBatches(organizationId, 'abc'), BadRequestException);
  await assert.rejects(
    () => controller.listBatches(organizationId, '10', 'broken'),
    BadRequestException,
  );
});

test('batch and item reads are scoped and return 404 when resources do not exist', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      getBatch: async (scope, id) => {
        calls.push({ kind: 'batch', scope, id });
        return null;
      },
      getItem: async (scope, id) => {
        calls.push({ kind: 'item', scope, id });
        return null;
      },
    }),
  );

  await assert.rejects(
    () => controller.getBatch('00000000-0000-4000-8000-000000000001', organizationId),
    NotFoundException,
  );
  await assert.rejects(
    () => controller.getItem('00000000-0000-4000-8000-000000000002', organizationId),
    NotFoundException,
  );
  assert.equal(calls.every((call) => call.scope === organizationId), true);
});

test('listItems checks scoped batch existence, bounds limits and forwards cursor', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      listItems: async (scope, batchId, limit, cursor) => {
        calls.push({ scope, batchId, limit, cursor });
        return { data: [], page: { hasNextPage: false } };
      },
    }),
  );
  const batchId = '00000000-0000-4000-8000-000000000001';

  await controller.listItems(batchId, organizationId, undefined, 'cursor-2');
  assert.deepEqual(calls, [{ scope: organizationId, batchId, limit: 100, cursor: 'cursor-2' }]);
  await assert.rejects(
    () => controller.listItems(batchId, organizationId, '501'),
    BadRequestException,
  );

  const missing = new ReconciliationController(createRepository({ getBatch: async () => null }));
  await assert.rejects(
    () => missing.listItems(batchId, organizationId),
    NotFoundException,
  );
});

test('resolveItem validates organization and status and maps repository domain failures', async () => {
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
    () => invalidStatus.resolveItem(itemId, organizationId, { ...validBody, status: 'UNKNOWN' }),
    BadRequestException,
  );
  await assert.rejects(
    () => invalidStatus.resolveItem(itemId, undefined, validBody),
    BadRequestException,
  );

  const missing = new ReconciliationController(
    createRepository({ resolveItem: async () => { throw new Error('reconciliation item not found'); } }),
  );
  await assert.rejects(
    () => missing.resolveItem(itemId, organizationId, validBody),
    NotFoundException,
  );

  const badRequest = new ReconciliationController(
    createRepository({ resolveItem: async () => { throw new Error('resolutionNote, reasonCode, idempotencyKey, correlationId, actorId and actorType are required'); } }),
  );
  await assert.rejects(
    () => badRequest.resolveItem(itemId, organizationId, validBody),
    BadRequestException,
  );
});

test('resolveItem forwards the complete auditable scoped command', async () => {
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

  const result = await controller.resolveItem(itemId, organizationId, body);
  assert.equal(result.status, 'IGNORED');
  assert.deepEqual(calls, [{ organizationId, itemId, ...body }]);
});

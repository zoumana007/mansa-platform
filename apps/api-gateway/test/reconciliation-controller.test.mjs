import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { ReconciliationController } from '../dist/reconciliation/reconciliation.controller.js';

const organizationId = 'org-test';
const batchId = '00000000-0000-4000-8000-000000000001';
const itemId = '00000000-0000-4000-8000-000000000002';

function batchRow(overrides = {}) {
  return {
    id: batchId,
    organizationId,
    providerId: 'provider-a',
    sourceFileReference: 'settlement.csv',
    sourceFingerprint: 'private-fingerprint',
    periodStart: new Date('2026-08-01T00:00:00.000Z'),
    periodEnd: new Date('2026-08-01T23:59:59.000Z'),
    status: 'COMPLETED_WITH_MISMATCHES',
    totalItems: 4,
    matchedItems: 3,
    mismatchedItems: 1,
    resolvedItems: 0,
    ignoredItems: 0,
    metadata: { internal: 'must-not-leak' },
    createdAt: new Date('2026-08-02T00:00:00.000Z'),
    startedAt: new Date('2026-08-02T00:00:01.000Z'),
    completedAt: new Date('2026-08-02T00:00:02.000Z'),
    failureReason: null,
    ...overrides,
  };
}

function itemRow(overrides = {}) {
  return {
    id: itemId,
    organizationId,
    batchId,
    internalReference: 'txn-1',
    providerReference: 'provider-txn-1',
    internalAmountMinor: 1000n,
    providerAmountMinor: 900n,
    currency: 'XOF',
    internalStatus: 'SETTLED',
    providerStatus: 'SETTLED',
    providerOccurrenceCount: 1,
    status: 'MISMATCHED',
    mismatchReason: 'AMOUNT_MISMATCH',
    rawLineFingerprint: 'private-line-fingerprint',
    resolutionNote: null,
    resolutionReasonCode: null,
    resolvedBy: null,
    resolutionCorrelationId: null,
    resolutionIdempotencyKey: null,
    createdAt: new Date('2026-08-02T00:00:03.000Z'),
    updatedAt: new Date('2026-08-02T00:00:03.000Z'),
    ...overrides,
  };
}

function createRepository(overrides = {}) {
  return {
    listBatches: async () => ({ data: [batchRow()], page: { hasNextPage: false } }),
    getBatch: async () => batchRow(),
    listItems: async () => ({ data: [itemRow()], page: { hasNextPage: false } }),
    getItem: async () => itemRow(),
    resolveItem: async (input) => itemRow({ status: input.status, resolutionNote: input.resolutionNote }),
    ...overrides,
  };
}

test('listBatches requires organization scope and forwards defaults and cursor', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      listBatches: async (scope, limit, cursor, filters) => {
        calls.push({ scope, limit, cursor, filters });
        return { data: [], page: { hasNextPage: false } };
      },
    }),
  );

  await assert.rejects(() => controller.listBatches(undefined), BadRequestException);
  await controller.listBatches(organizationId, undefined, 'cursor-1');
  assert.deepEqual(calls, [{ scope: organizationId, limit: 50, cursor: 'cursor-1', filters: {} }]);
});

test('listBatches validates and forwards contract filters', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      listBatches: async (...args) => {
        calls.push(args);
        return { data: [], page: { hasNextPage: false } };
      },
    }),
  );
  await controller.listBatches(
    organizationId,
    '25',
    undefined,
    ' provider-a ',
    'COMPLETED',
    '2026-08-01T00:00:00Z',
    '2026-08-31T23:59:59Z',
  );
  const filters = calls[0][3];
  assert.equal(filters.providerId, 'provider-a');
  assert.equal(filters.status, 'COMPLETED');
  assert.equal(filters.periodStartFrom.toISOString(), '2026-08-01T00:00:00.000Z');
  assert.equal(filters.periodEndTo.toISOString(), '2026-08-31T23:59:59.000Z');

  await assert.rejects(
    () => controller.listBatches(organizationId, undefined, undefined, undefined, 'UNKNOWN'),
    BadRequestException,
  );
  await assert.rejects(
    () => controller.listBatches(organizationId, undefined, undefined, undefined, undefined, 'bad-date'),
    BadRequestException,
  );
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

  await assert.rejects(() => controller.getBatch(batchId, organizationId), NotFoundException);
  await assert.rejects(() => controller.getItem(itemId, organizationId), NotFoundException);
  assert.equal(calls.every((call) => call.scope === organizationId), true);
});

test('listItems validates and forwards contract filters', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      listItems: async (scope, id, limit, cursor, filters) => {
        calls.push({ scope, id, limit, cursor, filters });
        return { data: [], page: { hasNextPage: false } };
      },
    }),
  );

  await controller.listItems(
    batchId,
    organizationId,
    '40',
    'cursor-2',
    'provider-a',
    'MISMATCHED',
    'AMOUNT_MISMATCH',
    'txn-1',
    'provider-txn-1',
    '2026-08-01T00:00:00Z',
    '2026-08-31T23:59:59Z',
  );
  const [{ filters }] = calls;
  assert.equal(filters.providerId, 'provider-a');
  assert.equal(filters.status, 'MISMATCHED');
  assert.equal(filters.mismatchReason, 'AMOUNT_MISMATCH');
  assert.equal(filters.internalReference, 'txn-1');
  assert.equal(filters.providerReference, 'provider-txn-1');
  assert.equal(filters.createdFrom.toISOString(), '2026-08-01T00:00:00.000Z');
  assert.equal(filters.createdTo.toISOString(), '2026-08-31T23:59:59.000Z');

  await assert.rejects(
    () => controller.listItems(batchId, organizationId, undefined, undefined, undefined, 'UNKNOWN'),
    BadRequestException,
  );
  await assert.rejects(
    () => controller.listItems(batchId, organizationId, undefined, undefined, undefined, undefined, 'UNKNOWN'),
    BadRequestException,
  );
});

test('listItems checks scoped batch existence and bounds limits', async () => {
  const controller = new ReconciliationController(createRepository());
  await controller.listItems(batchId, organizationId, undefined, 'cursor-2');
  await assert.rejects(
    () => controller.listItems(batchId, organizationId, '501'),
    BadRequestException,
  );

  const missing = new ReconciliationController(createRepository({ getBatch: async () => null }));
  await assert.rejects(() => missing.listItems(batchId, organizationId), NotFoundException);
});

test('HTTP presenters expose only public contract fields and serialize bigint/date values', async () => {
  const controller = new ReconciliationController(createRepository());
  const batch = await controller.getBatch(batchId, organizationId);
  assert.equal(batch.batchId, batchId);
  assert.equal(batch.organizationId, undefined);
  assert.equal(batch.sourceFingerprint, undefined);
  assert.equal(batch.metadata, undefined);
  assert.equal(batch.createdAt, '2026-08-02T00:00:00.000Z');

  const item = await controller.getItem(itemId, organizationId);
  assert.equal(item.itemId, itemId);
  assert.equal(item.internalAmountMinor, 1000);
  assert.equal(item.providerAmountMinor, 900);
  assert.equal(item.organizationId, undefined);
  assert.equal(item.rawLineFingerprint, undefined);
  assert.equal(item.resolutionIdempotencyKey, undefined);
  assert.equal(item.createdAt, '2026-08-02T00:00:03.000Z');
});

test('resolveItem validates organization and status and maps repository domain failures', async () => {
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

test('resolveItem forwards the complete auditable scoped command and serializes response', async () => {
  const calls = [];
  const controller = new ReconciliationController(
    createRepository({
      resolveItem: async (input) => {
        calls.push(input);
        return itemRow({ status: input.status, resolutionNote: input.resolutionNote });
      },
    }),
  );
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
  assert.equal(result.itemId, itemId);
  assert.deepEqual(calls, [{ organizationId, itemId, ...body }]);
});

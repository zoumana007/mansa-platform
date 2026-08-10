import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ReconciliationController } from '../dist/reconciliation/reconciliation.controller.js';

const organizationId = '00000000-0000-4000-8000-000000000010';
const batchId = '00000000-0000-4000-8000-000000000001';
const itemId = '00000000-0000-4000-8000-000000000002';

function workloadRequest(scopes = ['reconciliation:read']) {
  return {
    headers: {},
    workloadIdentity: {
      workloadId: 'reconciliation-worker',
      organizationId,
      scopes: new Set(scopes),
      tokenId: '00000000-0000-4000-8000-000000000099',
    },
  };
}

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

test('listBatches derives tenant scope from authenticated workload context', async () => {
  const calls = [];
  const controller = new ReconciliationController(createRepository({
    listBatches: async (scope, limit, cursor, filters) => {
      calls.push({ scope, limit, cursor, filters });
      return { data: [], page: { hasNextPage: false } };
    },
  }));

  await controller.listBatches(workloadRequest(), undefined, 'cursor-1');
  assert.deepEqual(calls, [{ scope: organizationId, limit: 50, cursor: 'cursor-1', filters: {} }]);
  await assert.rejects(() => controller.listBatches({ headers: {} }), BadRequestException);
});

test('listBatches validates strict filters', async () => {
  const calls = [];
  const controller = new ReconciliationController(createRepository({
    listBatches: async (...args) => {
      calls.push(args);
      return { data: [], page: { hasNextPage: false } };
    },
  }));

  await controller.listBatches(
    workloadRequest(),
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

  await assert.rejects(() => controller.listBatches(workloadRequest(), '0'), BadRequestException);
  await assert.rejects(
    () => controller.listBatches(workloadRequest(), undefined, undefined, undefined, 'UNKNOWN'),
    BadRequestException,
  );
});

test('batch and item reads stay scoped and present only public fields', async () => {
  const scopes = [];
  const controller = new ReconciliationController(createRepository({
    getBatch: async (scope) => { scopes.push(scope); return batchRow(); },
    getItem: async (scope) => { scopes.push(scope); return itemRow(); },
  }));

  const batch = await controller.getBatch(workloadRequest(), batchId);
  const item = await controller.getItem(workloadRequest(), itemId);
  assert.deepEqual(scopes, [organizationId, organizationId]);
  assert.equal(batch.organizationId, undefined);
  assert.equal(batch.sourceFingerprint, undefined);
  assert.equal(item.organizationId, undefined);
  assert.equal(item.rawLineFingerprint, undefined);
  assert.equal(item.internalAmountMinor, 1000);
});

test('missing scoped resources return 404', async () => {
  const controller = new ReconciliationController(createRepository({
    getBatch: async () => null,
    getItem: async () => null,
  }));
  await assert.rejects(() => controller.getBatch(workloadRequest(), batchId), NotFoundException);
  await assert.rejects(() => controller.getItem(workloadRequest(), itemId), NotFoundException);
});

test('listItems derives scope and forwards filters', async () => {
  const calls = [];
  const controller = new ReconciliationController(createRepository({
    listItems: async (scope, id, limit, cursor, filters) => {
      calls.push({ scope, id, limit, cursor, filters });
      return { data: [], page: { hasNextPage: false } };
    },
  }));

  await controller.listItems(
    workloadRequest(),
    batchId,
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
  assert.equal(calls[0].scope, organizationId);
  assert.equal(calls[0].filters.providerId, 'provider-a');
  assert.equal(calls[0].filters.status, 'MISMATCHED');
  assert.equal(calls[0].filters.mismatchReason, 'AMOUNT_MISMATCH');
});

test('resolveItem derives tenant and audit actor from workload identity', async () => {
  const calls = [];
  const controller = new ReconciliationController(createRepository({
    resolveItem: async (input) => {
      calls.push(input);
      return itemRow({ status: input.status, resolutionNote: input.resolutionNote });
    },
  }));
  const body = {
    status: 'IGNORED',
    resolutionNote: 'Faux positif confirmé.',
    reasonCode: 'FALSE_POSITIVE',
    idempotencyKey: 'ignore-1',
    correlationId: 'corr-ignore-1',
  };

  const result = await controller.resolveItem(workloadRequest(['reconciliation:write']), itemId, body);
  assert.equal(result.status, 'IGNORED');
  assert.deepEqual(calls, [{
    organizationId,
    itemId,
    ...body,
    actorId: 'reconciliation-worker',
    actorType: 'WORKLOAD',
  }]);
});

test('resolveItem maps validation and repository failures', async () => {
  const controller = new ReconciliationController(createRepository());
  await assert.rejects(
    () => controller.resolveItem(workloadRequest(['reconciliation:write']), itemId, { status: 'UNKNOWN' }),
    BadRequestException,
  );

  const missing = new ReconciliationController(createRepository({
    resolveItem: async () => { throw new Error('reconciliation item not found'); },
  }));
  await assert.rejects(
    () => missing.resolveItem(workloadRequest(['reconciliation:write']), itemId, {
      status: 'RESOLVED',
      resolutionNote: 'ok',
      reasonCode: 'OK',
      idempotencyKey: 'key',
      correlationId: 'corr',
    }),
    NotFoundException,
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { LedgerOutboxService } from '../dist/ledger-outbox.service.js';

const now = new Date('2026-08-08T15:00:00.000Z');

const candidate = {
  id: '11111111-1111-4111-8111-111111111111',
  aggregateType: 'LEDGER_TRANSACTION',
  aggregateId: '22222222-2222-4222-8222-222222222222',
  eventType: 'ledger.transaction.posted.v1',
  payload: { transactionId: '22222222-2222-4222-8222-222222222222' },
  transactionId: '22222222-2222-4222-8222-222222222222',
  status: 'PENDING',
  attempts: 0,
  availableAt: new Date('2026-08-08T14:59:00.000Z'),
  lastError: null,
  createdAt: new Date('2026-08-08T14:58:00.000Z'),
  updatedAt: new Date('2026-08-08T14:59:30.000Z'),
};

const makeService = ({ claimCount = 1, findManyResult = [candidate] } = {}) => {
  const calls = [];
  const prisma = {
    outboxEvent: {
      async findMany(args) {
        calls.push({ method: 'findMany', args });
        return findManyResult;
      },
      async updateMany(args) {
        calls.push({ method: 'updateMany', args });
        return { count: claimCount };
      },
    },
  };

  return { service: new LedgerOutboxService(prisma), calls };
};

test('claims due events with an optimistic lease and increments attempts', async () => {
  const { service, calls } = makeService();
  const claimed = await service.claimBatch({ now, leaseMs: 20_000, limit: 25, maxAttempts: 5 });

  assert.equal(claimed.length, 1);
  assert.equal(claimed[0].attempts, 1);
  assert.equal(claimed[0].availableAt.toISOString(), '2026-08-08T15:00:20.000Z');

  assert.deepEqual(calls[0].args.where, {
    status: { in: ['PENDING', 'FAILED'] },
    availableAt: { lte: now },
    attempts: { lt: 5 },
  });
  assert.deepEqual(calls[1].args.data, {
    attempts: { increment: 1 },
    availableAt: new Date('2026-08-08T15:00:20.000Z'),
  });
});

test('skips an event when another worker wins the optimistic claim', async () => {
  const { service } = makeService({ claimCount: 0 });
  const claimed = await service.claimBatch({ now });
  assert.deepEqual(claimed, []);
});

test('lists exhausted failed events as operational dead letters without exposing payloads', async () => {
  const deadLetter = {
    ...candidate,
    status: 'FAILED',
    attempts: 10,
    lastError: 'Error: broker unavailable',
  };
  const { service, calls } = makeService({ findManyResult: [deadLetter] });
  const result = await service.listDeadLetters({ limit: 25, maxAttempts: 10 });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, deadLetter.id);
  assert.equal(result[0].lastError, 'Error: broker unavailable');
  assert.equal('payload' in result[0], true);
  assert.deepEqual(calls[0].args.where, {
    status: 'FAILED',
    attempts: { gte: 10 },
  });
  assert.equal(calls[0].args.take, 25);
  assert.equal(calls[0].args.select.payload, undefined);
});

test('requeues only exhausted failed events and clears failure state', async () => {
  const { service, calls } = makeService();
  const requeued = await service.requeueDeadLetter(candidate.id, { maxAttempts: 10, now });

  assert.equal(requeued, true);
  const update = calls.at(-1).args;
  assert.deepEqual(update.where, {
    id: candidate.id,
    status: 'FAILED',
    attempts: { gte: 10 },
  });
  assert.deepEqual(update.data, {
    status: 'PENDING',
    attempts: 0,
    availableAt: now,
    publishedAt: null,
    lastError: null,
  });
});

test('marks delivery success as published', async () => {
  const { service, calls } = makeService();
  const published = await service.markPublished(candidate.id, now);

  assert.equal(published, true);
  const update = calls.at(-1).args;
  assert.equal(update.data.status, 'PUBLISHED');
  assert.equal(update.data.publishedAt, now);
  assert.equal(update.data.lastError, null);
});

test('marks delivery failure and schedules a retry without throwing secrets or huge errors', async () => {
  const { service, calls } = makeService();
  const failed = await service.markFailed(candidate.id, new Error('broker unavailable'), 5_000, now);

  assert.equal(failed, true);
  const update = calls.at(-1).args;
  assert.equal(update.data.status, 'FAILED');
  assert.equal(update.data.availableAt.toISOString(), '2026-08-08T15:00:05.000Z');
  assert.equal(update.data.lastError, 'Error: broker unavailable');
});

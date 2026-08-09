import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { LedgerOutboxOperationsController } from '../dist/ledger-outbox-operations.controller.js';

const buildController = (overrides = {}) => {
  const calls = [];
  const outbox = {
    async listDeadLetters(options) {
      calls.push(['list', options]);
      return overrides.deadLetters ?? [];
    },
  };
  const audit = {
    async requeueDeadLetterWithAudit(input) {
      calls.push(['requeue-with-audit', input]);
      return overrides.requeueResult ?? true;
    },
  };
  return { controller: new LedgerOutboxOperationsController(outbox, audit), calls };
};

test('lists dead letters with bounded defaults', async () => {
  const { controller, calls } = buildController({ deadLetters: [{ id: 'evt-1' }] });
  const result = await controller.listDeadLetters();

  assert.deepEqual(result, [{ id: 'evt-1' }]);
  assert.deepEqual(calls, [['list', { limit: 50, maxAttempts: 10 }]]);
});

test('accepts explicit dead-letter operational bounds', async () => {
  const { controller, calls } = buildController();
  await controller.listDeadLetters('25', '20');

  assert.deepEqual(calls, [['list', { limit: 25, maxAttempts: 20 }]]);
});

test('rejects invalid dead-letter query parameters', async () => {
  const { controller } = buildController();

  await assert.rejects(() => controller.listDeadLetters('0'), BadRequestException);
  await assert.rejects(() => controller.listDeadLetters('101'), BadRequestException);
  await assert.rejects(() => controller.listDeadLetters('abc'), BadRequestException);
  await assert.rejects(() => controller.listDeadLetters(undefined, '1001'), BadRequestException);
});

test('requeues an eligible dead letter and writes audit atomically', async () => {
  const eventId = '70c3bf7f-9596-4f25-82e4-5ff1f6f2d5e0';
  const { controller, calls } = buildController();
  const request = { correlationId: 'corr-123' };

  const result = await controller.requeueDeadLetter(
    eventId,
    'ops-service',
    'manual recovery after broker incident',
    request,
    '15',
  );

  assert.deepEqual(result, { eventId, requeued: true });
  assert.deepEqual(calls, [
    [
      'requeue-with-audit',
      {
        eventId,
        maxAttempts: 15,
        audit: {
          correlationId: 'corr-123',
          actorId: 'ops-service',
          actorType: 'SERVICE_ACCOUNT',
          action: 'LEDGER_OUTBOX_DEAD_LETTER_REQUEUED',
          resourceType: 'OUTBOX_EVENT',
          resourceId: eventId,
          reason: 'manual recovery after broker incident',
          metadata: { maxAttempts: 15 },
        },
      },
    ],
  ]);
});

test('requires actor and reason before a dead-letter requeue', async () => {
  const { controller } = buildController();
  const eventId = '70c3bf7f-9596-4f25-82e4-5ff1f6f2d5e0';

  await assert.rejects(
    () => controller.requeueDeadLetter(eventId, undefined, 'reason', {}, '10'),
    BadRequestException,
  );
  await assert.rejects(
    () => controller.requeueDeadLetter(eventId, 'ops-service', undefined, {}, '10'),
    BadRequestException,
  );
});

test('returns not found when the dead letter is no longer eligible', async () => {
  const { controller, calls } = buildController({ requeueResult: false });

  await assert.rejects(
    () =>
      controller.requeueDeadLetter(
        '70c3bf7f-9596-4f25-82e4-5ff1f6f2d5e0',
        'ops-service',
        'incident recovery',
        { correlationId: 'corr-404' },
      ),
    NotFoundException,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'requeue-with-audit');
});

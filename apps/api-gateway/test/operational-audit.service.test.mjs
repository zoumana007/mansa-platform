import assert from 'node:assert/strict';
import test from 'node:test';

import { OperationalAuditService } from '../dist/operational-audit.service.js';

const buildPrisma = ({ updateCount = 1, auditError } = {}) => {
  const calls = [];
  const transaction = {
    outboxEvent: {
      async updateMany(input) {
        calls.push(['outbox-update', input]);
        return { count: updateCount };
      },
    },
    operationalAuditLog: {
      async create(input) {
        calls.push(['audit-create', input]);
        if (auditError) throw auditError;
        return { id: 'audit-1' };
      },
    },
  };

  return {
    calls,
    prisma: {
      operationalAuditLog: transaction.operationalAuditLog,
      async $transaction(callback) {
        calls.push(['transaction-start']);
        try {
          const result = await callback(transaction);
          calls.push(['transaction-commit']);
          return result;
        } catch (error) {
          calls.push(['transaction-rollback']);
          throw error;
        }
      },
    },
  };
};

const audit = {
  correlationId: 'corr-123',
  actorId: 'ops-service',
  actorType: 'SERVICE_ACCOUNT',
  action: 'LEDGER_OUTBOX_DEAD_LETTER_REQUEUED',
  resourceType: 'OUTBOX_EVENT',
  resourceId: '70c3bf7f-9596-4f25-82e4-5ff1f6f2d5e0',
  reason: 'manual recovery',
  metadata: { maxAttempts: 10 },
};

test('requeues a dead letter and writes its audit in the same transaction', async () => {
  const { prisma, calls } = buildPrisma();
  const service = new OperationalAuditService(prisma);
  const now = new Date('2026-08-09T05:00:00.000Z');

  const result = await service.requeueDeadLetterWithAudit({
    eventId: audit.resourceId,
    maxAttempts: 10,
    now,
    audit,
  });

  assert.equal(result, true);
  assert.equal(calls[0][0], 'transaction-start');
  assert.equal(calls[1][0], 'outbox-update');
  assert.equal(calls[2][0], 'audit-create');
  assert.equal(calls[3][0], 'transaction-commit');
  assert.equal(calls[1][1].data.status, 'PENDING');
  assert.equal(calls[2][1].data.correlationId, 'corr-123');
});

test('does not write an audit when the dead letter is not eligible', async () => {
  const { prisma, calls } = buildPrisma({ updateCount: 0 });
  const service = new OperationalAuditService(prisma);

  const result = await service.requeueDeadLetterWithAudit({
    eventId: audit.resourceId,
    maxAttempts: 10,
    audit,
  });

  assert.equal(result, false);
  assert.equal(calls.some(([kind]) => kind === 'audit-create'), false);
  assert.equal(calls.at(-1)[0], 'transaction-commit');
});

test('propagates audit persistence failure so the transaction rolls back', async () => {
  const failure = new Error('audit unavailable');
  const { prisma, calls } = buildPrisma({ auditError: failure });
  const service = new OperationalAuditService(prisma);

  await assert.rejects(
    () =>
      service.requeueDeadLetterWithAudit({
        eventId: audit.resourceId,
        maxAttempts: 10,
        audit,
      }),
    failure,
  );

  assert.equal(calls.at(-1)[0], 'transaction-rollback');
});

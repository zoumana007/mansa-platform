import assert from 'node:assert/strict';
import test from 'node:test';

import { LedgerOutboxDispatcherService } from '../dist/ledger-outbox-dispatcher.service.js';

const event = {
  id: '11111111-1111-4111-8111-111111111111',
  aggregateType: 'LEDGER_TRANSACTION',
  aggregateId: '22222222-2222-4222-8222-222222222222',
  eventType: 'ledger.transaction.posted.v1',
  payload: { transactionId: '22222222-2222-4222-8222-222222222222' },
  transactionId: '22222222-2222-4222-8222-222222222222',
  attempts: 3,
  availableAt: new Date('2026-08-08T18:00:30.000Z'),
  createdAt: new Date('2026-08-08T17:59:00.000Z'),
};

const makeOutbox = () => {
  const calls = [];
  return {
    calls,
    service: {
      async claimBatch(options) {
        calls.push({ method: 'claimBatch', options });
        return [event];
      },
      async markPublished(eventId) {
        calls.push({ method: 'markPublished', eventId });
        return true;
      },
      async markFailed(eventId, error, retryDelayMs) {
        calls.push({ method: 'markFailed', eventId, error, retryDelayMs });
        return true;
      },
    },
  };
};

test('publishes a claimed batch and marks successful events', async () => {
  const outbox = makeOutbox();
  const published = [];
  const dispatcher = new LedgerOutboxDispatcherService(outbox.service);

  const result = await dispatcher.dispatchBatch({
    async publish(claimedEvent) {
      published.push(claimedEvent.id);
    },
  });

  assert.deepEqual(result, { claimed: 1, published: 1, failed: 0 });
  assert.deepEqual(published, [event.id]);
  assert.equal(outbox.calls.at(-1).method, 'markPublished');
});

test('marks a failed publication and applies exponential backoff without jitter', async () => {
  const outbox = makeOutbox();
  const dispatcher = new LedgerOutboxDispatcherService(outbox.service);

  const result = await dispatcher.dispatchBatch(
    {
      async publish() {
        throw new Error('broker unavailable');
      },
    },
    {
      baseRetryDelayMs: 1_000,
      maxRetryDelayMs: 60_000,
      jitterRatio: 0,
    },
  );

  assert.deepEqual(result, { claimed: 1, published: 0, failed: 1 });
  const failure = outbox.calls.at(-1);
  assert.equal(failure.method, 'markFailed');
  assert.equal(failure.retryDelayMs, 4_000);
  assert.match(failure.error.message, /broker unavailable/);
});

test('caps exponential backoff and supports deterministic jitter', () => {
  const outbox = makeOutbox();
  const dispatcher = new LedgerOutboxDispatcherService(outbox.service);

  assert.equal(
    dispatcher.computeRetryDelayMs(10, {
      baseRetryDelayMs: 1_000,
      maxRetryDelayMs: 10_000,
      jitterRatio: 0,
    }),
    10_000,
  );

  assert.equal(
    dispatcher.computeRetryDelayMs(2, {
      baseRetryDelayMs: 1_000,
      maxRetryDelayMs: 10_000,
      jitterRatio: 0.25,
      random: () => 1,
    }),
    2_500,
  );
});

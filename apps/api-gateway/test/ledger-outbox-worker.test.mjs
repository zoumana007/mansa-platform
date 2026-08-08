import assert from 'node:assert/strict';
import test from 'node:test';

import { LedgerOutboxWorker } from '../dist/ledger-outbox-worker.js';

const successfulResult = { claimed: 2, published: 2, failed: 0 };

const makeTimer = () => {
  const calls = [];
  let callback = null;
  return {
    calls,
    get callback() {
      return callback;
    },
    timer: {
      setInterval(nextCallback, intervalMs) {
        callback = nextCallback;
        const handle = { id: 'timer-1' };
        calls.push({ method: 'setInterval', intervalMs, handle });
        return handle;
      },
      clearInterval(handle) {
        calls.push({ method: 'clearInterval', handle });
      },
    },
  };
};

test('starts once with a bounded polling interval and stops cleanly', () => {
  const timer = makeTimer();
  const dispatcher = { async dispatchBatch() { return successfulResult; } };
  const worker = new LedgerOutboxWorker(dispatcher, { async publish() {} }, { intervalMs: 250 }, timer.timer);

  worker.start();
  worker.start();

  assert.equal(worker.isStarted(), true);
  assert.equal(timer.calls.length, 1);
  assert.equal(timer.calls[0].intervalMs, 250);

  worker.stop();
  worker.stop();

  assert.equal(worker.isStarted(), false);
  assert.equal(timer.calls.length, 2);
  assert.equal(timer.calls[1].method, 'clearInterval');
});

test('falls back to a safe interval when configuration is invalid', () => {
  const timer = makeTimer();
  const dispatcher = { async dispatchBatch() { return successfulResult; } };
  const worker = new LedgerOutboxWorker(dispatcher, { async publish() {} }, { intervalMs: 10 }, timer.timer);

  worker.start();
  assert.equal(timer.calls[0].intervalMs, 1_000);
});

test('runs a batch with dispatch options but never overlaps two executions', async () => {
  let release;
  let calls = 0;
  let receivedOptions;
  const dispatcher = {
    async dispatchBatch(_publisher, options) {
      calls += 1;
      receivedOptions = options;
      await new Promise((resolve) => { release = resolve; });
      return successfulResult;
    },
  };
  const worker = new LedgerOutboxWorker(
    dispatcher,
    { async publish() {} },
    { intervalMs: 500, limit: 25, maxAttempts: 8, leaseMs: 20_000 },
  );

  const first = worker.runOnce();
  const second = await worker.runOnce();

  assert.equal(worker.isRunning(), true);
  assert.equal(second, null);
  assert.equal(calls, 1);
  assert.deepEqual(receivedOptions, { limit: 25, maxAttempts: 8, leaseMs: 20_000 });

  release();
  assert.deepEqual(await first, successfulResult);
  assert.equal(worker.isRunning(), false);
});

test('releases the running lock after a dispatcher failure', async () => {
  let attempts = 0;
  const dispatcher = {
    async dispatchBatch() {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary database error');
      return successfulResult;
    },
  };
  const worker = new LedgerOutboxWorker(dispatcher, { async publish() {} });

  await assert.rejects(worker.runOnce(), /temporary database error/);
  assert.equal(worker.isRunning(), false);
  assert.deepEqual(await worker.runOnce(), successfulResult);
});

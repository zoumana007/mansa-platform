import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { LedgerOutboxLifecycleService } = require('../dist/ledger-outbox-lifecycle.service.js');

const withWorkerEnvironment = async (enabled, callback) => {
  const previous = process.env.LEDGER_OUTBOX_WORKER_ENABLED;
  process.env.LEDGER_OUTBOX_WORKER_ENABLED = enabled;
  try {
    await callback();
  } finally {
    if (previous === undefined) {
      delete process.env.LEDGER_OUTBOX_WORKER_ENABLED;
    } else {
      process.env.LEDGER_OUTBOX_WORKER_ENABLED = previous;
    }
  }
};

test('ne démarre pas le worker tant qu’il est désactivé', async () => {
  await withWorkerEnvironment('false', async () => {
    const service = new LedgerOutboxLifecycleService(
      { dispatchBatch: async () => ({ claimed: 0, published: 0, failed: 0 }) },
      {
        configured: false,
        name: 'unconfigured',
        publisher: { publish: async () => undefined },
      },
    );

    service.onModuleInit();
    assert.equal(service.isStarted(), false);
  });
});

test('refuse un worker activé sans publisher réel', async () => {
  await withWorkerEnvironment('true', async () => {
    const service = new LedgerOutboxLifecycleService(
      { dispatchBatch: async () => ({ claimed: 0, published: 0, failed: 0 }) },
      {
        configured: false,
        name: 'unconfigured',
        publisher: { publish: async () => undefined },
      },
    );

    assert.throws(
      () => service.onModuleInit(),
      /requires a configured ledger outbox publisher/,
    );
  });
});

test('démarre puis arrête proprement avec un publisher configuré', async () => {
  await withWorkerEnvironment('true', async () => {
    const service = new LedgerOutboxLifecycleService(
      { dispatchBatch: async () => ({ claimed: 0, published: 0, failed: 0 }) },
      {
        configured: true,
        name: 'test',
        publisher: { publish: async () => undefined },
      },
    );

    service.onModuleInit();
    assert.equal(service.isStarted(), true);
    service.onApplicationShutdown();
    assert.equal(service.isStarted(), false);
  });
});

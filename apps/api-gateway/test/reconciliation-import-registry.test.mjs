import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationImportService } from '../dist/reconciliation/reconciliation-import.service.js';
import { TestReconciliationProviderAdapter } from '../dist/reconciliation/reconciliation-provider.adapter.js';
import { ReconciliationProviderRegistry } from '../dist/reconciliation/reconciliation-provider-registry.js';

function buildHarness() {
  const imported = [];
  const events = [];
  const repository = {
    importBatch: async (input) => {
      imported.push(input);
      return { id: 'batch-1' };
    },
  };
  const registry = new ReconciliationProviderRegistry();
  registry.register(new TestReconciliationProviderAdapter());
  const monitor = {
    recordImportStarted: () => events.push('started'),
    recordImportSucceeded: () => events.push('succeeded'),
    recordImportFailed: () => events.push('failed'),
  };
  return {
    imported,
    events,
    service: new ReconciliationImportService(repository, registry, monitor),
  };
}

const source = {
  providerId: 'TEST-BANK',
  sourceFileReference: 'statement-001.csv',
  periodStart: new Date('2026-08-01T00:00:00.000Z'),
  periodEnd: new Date('2026-08-01T23:59:59.999Z'),
  rows: [
    {
      providerReference: 'provider-ref-1',
      amountMinor: 12500,
      currency: 'XOF',
      status: 'SETTLED',
    },
  ],
};

const internalRows = [
  {
    internalReference: 'internal-ref-1',
    providerReference: 'provider-ref-1',
    amountMinor: 12500,
    currency: 'XOF',
    status: 'SETTLED',
  },
];

test('provider-neutral import resolves adapter through registry and persists its id', async () => {
  const harness = buildHarness();

  const result = await harness.service.importProviderSource('org-1', source, internalRows);

  assert.deepEqual(result, { id: 'batch-1' });
  assert.equal(harness.imported.length, 1);
  assert.equal(harness.imported[0].providerId, 'TEST-BANK');
  assert.deepEqual(harness.imported[0].metadata, { adapter: 'test-normalized-v1' });
  assert.equal(harness.imported[0].items.length, 1);
  assert.deepEqual(harness.events, ['started', 'succeeded']);
});

test('legacy test-provider entrypoint delegates to provider-neutral import', async () => {
  const harness = buildHarness();

  await harness.service.importTestProviderSource('org-1', source, internalRows);

  assert.equal(harness.imported.length, 1);
  assert.deepEqual(harness.imported[0].metadata, { adapter: 'test-normalized-v1' });
});

test('unknown provider fails closed and records failed import', async () => {
  const harness = buildHarness();

  await assert.rejects(
    harness.service.importProviderSource('org-1', { ...source, providerId: 'REAL-BANK' }, internalRows),
    /no reconciliation adapter registered/,
  );

  assert.equal(harness.imported.length, 0);
  assert.deepEqual(harness.events, ['started', 'failed']);
});

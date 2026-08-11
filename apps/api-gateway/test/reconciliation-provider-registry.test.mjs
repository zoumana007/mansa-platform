import assert from 'node:assert/strict';
import test from 'node:test';

import { TestReconciliationProviderAdapter } from '../dist/reconciliation/reconciliation-provider.adapter.js';
import { ReconciliationProviderRegistry } from '../dist/reconciliation/reconciliation-provider-registry.js';

test('provider registry resolves the unique compatible adapter', () => {
  const registry = new ReconciliationProviderRegistry();
  const adapter = new TestReconciliationProviderAdapter();
  registry.register(adapter);

  assert.equal(registry.resolve('TEST-BANK').adapterId, 'test-normalized-v1');
  assert.deepEqual(registry.listAdapterIds(), ['test-normalized-v1']);
});

test('provider registry rejects unknown providers', () => {
  const registry = new ReconciliationProviderRegistry();
  registry.register(new TestReconciliationProviderAdapter());

  assert.throws(() => registry.resolve('REAL-BANK'), /no reconciliation adapter registered/);
});

test('provider registry rejects duplicate adapter identifiers', () => {
  const registry = new ReconciliationProviderRegistry();
  registry.register(new TestReconciliationProviderAdapter());

  assert.throws(
    () => registry.register(new TestReconciliationProviderAdapter()),
    /already registered/,
  );
});

test('provider registry fails closed when multiple adapters match a provider', () => {
  const registry = new ReconciliationProviderRegistry();
  registry.register(new TestReconciliationProviderAdapter());
  registry.register({
    adapterId: 'ambiguous-test-v1',
    supports: (providerId) => providerId.startsWith('TEST'),
    prepare: () => {
      throw new Error('not called');
    },
  });

  assert.throws(() => registry.resolve('TEST-BANK'), /multiple reconciliation adapters match/);
});

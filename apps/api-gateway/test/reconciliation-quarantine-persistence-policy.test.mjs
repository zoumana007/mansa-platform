import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationQuarantinePersistencePolicy } from '../dist/reconciliation/reconciliation-quarantine-persistence-policy.js';

test('quarantine persistence defaults to signals only', () => {
  const plan = new ReconciliationQuarantinePersistencePolicy().plan();

  assert.deepEqual(plan, {
    mode: 'SIGNALS_ONLY',
    persistRawSource: false,
    persistProviderPayload: false,
    manualReplayAllowed: false,
    durableMetadataAllowed: false,
  });
  assert.equal(Object.isFrozen(plan), true);
});

test('quarantine persistence refuses raw source mode before security policy approval', () => {
  assert.throws(
    () => new ReconciliationQuarantinePersistencePolicy('RAW_SOURCE'),
    /retention, encryption, access audit, deletion verification and replay controls first/,
  );
});

test('quarantine persistence exposes an explicit fail-closed guard for raw storage', () => {
  const policy = new ReconciliationQuarantinePersistencePolicy();

  assert.throws(
    () => policy.assertRawSourcePersistenceAllowed(),
    /disabled by policy/,
  );
});

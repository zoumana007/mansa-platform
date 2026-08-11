import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationQuarantineDecisionService } from '../dist/reconciliation/reconciliation-quarantine-decision.service.js';
import { ReconciliationQuarantinePersistencePolicy } from '../dist/reconciliation/reconciliation-quarantine-persistence-policy.js';
import { ReconciliationQuarantinePolicyRegistry } from '../dist/reconciliation/reconciliation-quarantine-policy-registry.js';

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

test('an injected persistence guard keeps an approved raw provider fail-closed', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  registry.register({
    providerId: 'provider-raw-approved',
    classification: 'CONFIDENTIAL',
    mode: 'RAW_SOURCE',
    retentionDays: 7,
    encryptionAtRestRequired: true,
    encryptionInTransitRequired: true,
    allowedRoles: ['RECONCILIATION_SECURITY_REVIEWER'],
    replayStatus: 'MANUAL_REVIEW',
    status: 'APPROVED',
  });

  const persistencePolicy = new ReconciliationQuarantinePersistencePolicy();
  const service = new ReconciliationQuarantineDecisionService(
    registry,
    persistencePolicy,
  );

  const decision = service.evaluate('provider-raw-approved');

  assert.deepEqual(decision, {
    providerId: 'provider-raw-approved',
    resolution: 'APPROVED',
    requestedMode: 'RAW_SOURCE',
    effectiveMode: 'SIGNALS_ONLY',
    rawSourcePersistenceAllowed: false,
    manualReplayAllowed: false,
    reason: 'APPROVED_RAW_SOURCE_NOT_TECHNICALLY_ENABLED',
  });
  assert.equal(Object.isFrozen(decision), true);
});

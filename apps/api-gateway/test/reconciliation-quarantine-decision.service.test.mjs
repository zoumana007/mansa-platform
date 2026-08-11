import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationQuarantineDecisionService } from '../dist/reconciliation/reconciliation-quarantine-decision.service.js';
import { ReconciliationQuarantinePolicyRegistry } from '../dist/reconciliation/reconciliation-quarantine-policy-registry.js';

function approvedPolicy(overrides = {}) {
  return {
    providerId: 'provider-test',
    classification: 'CONFIDENTIAL',
    mode: 'SIGNALS_ONLY',
    retentionDays: null,
    encryptionAtRestRequired: true,
    encryptionInTransitRequired: true,
    allowedRoles: [],
    replayStatus: 'DISABLED',
    status: 'APPROVED',
    ...overrides,
  };
}

test('quarantine decision falls back to signals only for unknown provider', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  const service = new ReconciliationQuarantineDecisionService(registry);

  const decision = service.evaluate(' unknown-provider ');

  assert.deepEqual(decision, {
    providerId: 'unknown-provider',
    resolution: 'FALLBACK',
    requestedMode: 'SIGNALS_ONLY',
    effectiveMode: 'SIGNALS_ONLY',
    rawSourcePersistenceAllowed: false,
    manualReplayAllowed: false,
    reason: 'NO_APPROVED_PROVIDER_POLICY',
  });
  assert.equal(Object.isFrozen(decision), true);
});

test('quarantine decision keeps approved signals-only policy closed', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  registry.register(approvedPolicy());
  const service = new ReconciliationQuarantineDecisionService(registry);

  const decision = service.evaluate('provider-test');

  assert.equal(decision.resolution, 'APPROVED');
  assert.equal(decision.requestedMode, 'SIGNALS_ONLY');
  assert.equal(decision.effectiveMode, 'SIGNALS_ONLY');
  assert.equal(decision.rawSourcePersistenceAllowed, false);
  assert.equal(decision.reason, 'APPROVED_SIGNALS_ONLY');
});

test('quarantine decision does not enable raw storage from registry approval alone', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  registry.register(
    approvedPolicy({
      providerId: 'raw-provider',
      mode: 'RAW_SOURCE',
      retentionDays: 14,
      allowedRoles: ['RECONCILIATION_SECURITY_REVIEWER'],
      replayStatus: 'MANUAL_REVIEW',
    }),
  );
  const service = new ReconciliationQuarantineDecisionService(registry);

  const decision = service.evaluate('raw-provider');

  assert.equal(decision.resolution, 'APPROVED');
  assert.equal(decision.requestedMode, 'RAW_SOURCE');
  assert.equal(decision.effectiveMode, 'SIGNALS_ONLY');
  assert.equal(decision.rawSourcePersistenceAllowed, false);
  assert.equal(decision.manualReplayAllowed, false);
  assert.equal(decision.reason, 'APPROVED_RAW_SOURCE_NOT_TECHNICALLY_ENABLED');
});

test('quarantine decision treats non-approved registered policy as fail-closed fallback', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  registry.register(approvedPolicy({ providerId: 'draft-provider', status: 'DRAFT' }));
  const service = new ReconciliationQuarantineDecisionService(registry);

  const decision = service.evaluate('draft-provider');

  assert.equal(decision.resolution, 'FALLBACK');
  assert.equal(decision.effectiveMode, 'SIGNALS_ONLY');
  assert.equal(decision.rawSourcePersistenceAllowed, false);
  assert.equal(decision.reason, 'NO_APPROVED_PROVIDER_POLICY');
});

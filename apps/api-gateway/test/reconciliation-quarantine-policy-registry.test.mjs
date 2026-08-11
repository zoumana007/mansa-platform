import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationQuarantinePolicyRegistry } from '../dist/reconciliation/reconciliation-quarantine-policy-registry.js';

const approvedSignalsPolicy = {
  providerId: 'provider-test',
  classification: 'CONFIDENTIAL',
  mode: 'SIGNALS_ONLY',
  retentionDays: null,
  encryptionAtRestRequired: true,
  encryptionInTransitRequired: true,
  allowedRoles: [],
  replayStatus: 'DISABLED',
  status: 'APPROVED',
};

test('quarantine policy registry resolves only explicitly approved provider policies', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  registry.register(approvedSignalsPolicy);

  const policy = registry.resolve(' provider-test ');

  assert.equal(policy.providerId, 'provider-test');
  assert.equal(policy.mode, 'SIGNALS_ONLY');
  assert.equal(Object.isFrozen(policy), true);
  assert.equal(Object.isFrozen(policy.allowedRoles), true);
});

test('quarantine policy registry is fail-closed for unknown provider', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();

  assert.equal(registry.has('unknown'), false);
  assert.throws(() => registry.resolve('unknown'), /no reconciliation quarantine policy registered/);
});

test('quarantine policy registry refuses draft policy at resolution time', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  registry.register({ ...approvedSignalsPolicy, providerId: 'draft-provider', status: 'DRAFT' });

  assert.throws(() => registry.resolve('draft-provider'), /policy is not approved/);
});

test('signals-only policy cannot define retention or replay', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();

  assert.throws(
    () => registry.register({ ...approvedSignalsPolicy, providerId: 'retained', retentionDays: 7 }),
    /must not define retentionDays/,
  );
  assert.throws(
    () => registry.register({ ...approvedSignalsPolicy, providerId: 'replay', replayStatus: 'MANUAL_REVIEW' }),
    /must keep replay disabled/,
  );
});

test('raw source policy requires approval retention encryption and roles', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  const rawBase = {
    ...approvedSignalsPolicy,
    providerId: 'raw-provider',
    mode: 'RAW_SOURCE',
    retentionDays: 14,
    allowedRoles: ['RECONCILIATION_SECURITY_REVIEWER'],
    replayStatus: 'MANUAL_REVIEW',
  };

  assert.throws(
    () => registry.register({ ...rawBase, providerId: 'raw-draft', status: 'DRAFT' }),
    /must be explicitly approved/,
  );
  assert.throws(
    () => registry.register({ ...rawBase, providerId: 'raw-no-retention', retentionDays: null }),
    /requires a positive retentionDays/,
  );
  assert.throws(
    () => registry.register({ ...rawBase, providerId: 'raw-no-encryption', encryptionAtRestRequired: false }),
    /requires encryption at rest and in transit/,
  );
  assert.throws(
    () => registry.register({ ...rawBase, providerId: 'raw-no-role', allowedRoles: [] }),
    /requires at least one allowed role/,
  );
});

test('quarantine policy registry refuses duplicate provider policy', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  registry.register(approvedSignalsPolicy);

  assert.throws(() => registry.register(approvedSignalsPolicy), /already registered/);
});

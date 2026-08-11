import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationQuarantinePolicyController } from '../dist/reconciliation/reconciliation-quarantine-policy.controller.js';
import { ReconciliationQuarantinePolicyRegistry } from '../dist/reconciliation/reconciliation-quarantine-policy-registry.js';

const policy = {
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

test('quarantine policy controller returns deterministic metadata-only inventory', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  registry.register({ ...policy, providerId: 'provider-zeta' });
  registry.register({ ...policy, providerId: 'provider-alpha', status: 'DRAFT' });
  const controller = new ReconciliationQuarantinePolicyController(registry);

  const response = controller.listPolicies();

  assert.deepEqual(
    response.data.map((entry) => entry.providerId),
    ['provider-alpha', 'provider-zeta'],
  );
  assert.equal(response.data[0].mode, 'SIGNALS_ONLY');
  assert.equal(Object.isFrozen(response.data), true);
  assert.equal('payload' in response.data[0], false);
  assert.equal('secret' in response.data[0], false);
});

test('quarantine policy controller returns an empty immutable inventory when no policy is configured', () => {
  const controller = new ReconciliationQuarantinePolicyController(
    new ReconciliationQuarantinePolicyRegistry(),
  );

  const response = controller.listPolicies();

  assert.deepEqual(response, { data: [] });
  assert.equal(Object.isFrozen(response.data), true);
});

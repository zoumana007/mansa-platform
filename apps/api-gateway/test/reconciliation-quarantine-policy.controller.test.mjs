import assert from 'node:assert/strict';
import test from 'node:test';

import { ReconciliationQuarantinePolicyController } from '../dist/reconciliation/reconciliation-quarantine-policy.controller.js';
import { ReconciliationQuarantinePolicyRegistry } from '../dist/reconciliation/reconciliation-quarantine-policy-registry.js';
import { WorkloadIdentityGuard } from '../dist/workload-identity.guard.js';
import {
  WORKLOAD_SCOPES_METADATA,
  WorkloadScopeGuard,
} from '../dist/workload-scope.guard.js';

const GUARDS_METADATA = '__guards__';

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

test('quarantine policy controller returns bounded aggregate summary without provider identifiers', () => {
  const registry = new ReconciliationQuarantinePolicyRegistry();
  registry.register({ ...policy, providerId: 'provider-approved' });
  registry.register({ ...policy, providerId: 'provider-draft', status: 'DRAFT' });
  registry.register({ ...policy, providerId: 'provider-suspended', status: 'SUSPENDED' });
  registry.register({
    ...policy,
    providerId: 'provider-raw',
    mode: 'RAW_SOURCE',
    retentionDays: 7,
    allowedRoles: ['reconciliation-reviewer'],
    replayStatus: 'MANUAL_REVIEW',
    status: 'APPROVED',
  });
  const controller = new ReconciliationQuarantinePolicyController(registry);

  const response = controller.summarizePolicies();

  assert.deepEqual(response, {
    data: {
      total: 4,
      byStatus: {
        DRAFT: 1,
        APPROVED: 2,
        SUSPENDED: 1,
      },
      byMode: {
        SIGNALS_ONLY: 3,
        RAW_SOURCE: 1,
      },
    },
  });
  assert.equal(Object.isFrozen(response.data), true);
  assert.equal(Object.isFrozen(response.data.byStatus), true);
  assert.equal(Object.isFrozen(response.data.byMode), true);
  assert.equal(JSON.stringify(response).includes('provider-approved'), false);
  assert.equal(JSON.stringify(response).includes('provider-raw'), false);
});

test('quarantine policy controller returns zeroed bounded summary when registry is empty', () => {
  const controller = new ReconciliationQuarantinePolicyController(
    new ReconciliationQuarantinePolicyRegistry(),
  );

  assert.deepEqual(controller.summarizePolicies(), {
    data: {
      total: 0,
      byStatus: {
        DRAFT: 0,
        APPROVED: 0,
        SUSPENDED: 0,
      },
      byMode: {
        SIGNALS_ONLY: 0,
        RAW_SOURCE: 0,
      },
    },
  });
});

test('quarantine policy controller keeps both internal workload guards at class level', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, ReconciliationQuarantinePolicyController);

  assert.deepEqual(guards, [WorkloadIdentityGuard, WorkloadScopeGuard]);
});

test('quarantine policy summary endpoint requires reconciliation read scope', () => {
  const requiredScopes = Reflect.getMetadata(
    WORKLOAD_SCOPES_METADATA,
    ReconciliationQuarantinePolicyController.prototype.summarizePolicies,
  );

  assert.deepEqual(requiredScopes, ['reconciliation:read']);
});

test('quarantine policy inventory endpoint requires reconciliation read scope', () => {
  const requiredScopes = Reflect.getMetadata(
    WORKLOAD_SCOPES_METADATA,
    ReconciliationQuarantinePolicyController.prototype.listPolicies,
  );

  assert.deepEqual(requiredScopes, ['reconciliation:read']);
});

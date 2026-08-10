import assert from 'node:assert/strict';
import test from 'node:test';

import { ForbiddenException } from '@nestjs/common';

import { WorkloadScopeGuard } from '../dist/workload-scope.guard.js';

const makeContext = (workloadIdentity) => ({
  switchToHttp() {
    return {
      getRequest() {
        return { headers: {}, workloadIdentity };
      },
    };
  },
  getHandler() {
    return function handler() {};
  },
  getClass() {
    return class Controller {};
  },
});

const identity = (scopes) => ({
  workloadId: 'reconciliation-worker.prod',
  organizationId: '11111111-1111-4111-8111-111111111111',
  scopes: new Set(scopes),
  tokenId: '22222222-2222-4222-8222-222222222222',
});

test('accepts a workload when every required scope is granted', () => {
  const reflector = {
    getAllAndOverride() {
      return ['reconciliation:read', 'operations:read'];
    },
  };
  const guard = new WorkloadScopeGuard(reflector);

  assert.equal(
    guard.canActivate(
      makeContext(identity(['reconciliation:read', 'operations:read', 'ledger:read'])),
    ),
    true,
  );
});

test('rejects a workload missing one required scope', () => {
  const reflector = {
    getAllAndOverride() {
      return ['reconciliation:read', 'reconciliation:write'];
    },
  };
  const guard = new WorkloadScopeGuard(reflector);

  assert.throws(
    () => guard.canActivate(makeContext(identity(['reconciliation:read']))),
    (error) => error instanceof ForbiddenException && error.message === 'Insufficient workload scope.',
  );
});

test('fails closed when no scope policy is declared', () => {
  const reflector = {
    getAllAndOverride() {
      return undefined;
    },
  };
  const guard = new WorkloadScopeGuard(reflector);

  assert.throws(
    () => guard.canActivate(makeContext(identity(['reconciliation:read']))),
    (error) =>
      error instanceof ForbiddenException &&
      error.message === 'Workload scope policy is required.',
  );
});

test('fails closed when authentication context has not been attached', () => {
  const reflector = {
    getAllAndOverride() {
      return ['reconciliation:read'];
    },
  };
  const guard = new WorkloadScopeGuard(reflector);

  assert.throws(
    () => guard.canActivate(makeContext(undefined)),
    (error) =>
      error instanceof ForbiddenException &&
      error.message === 'Authenticated workload context is required.',
  );
});

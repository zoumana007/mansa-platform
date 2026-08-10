import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hasWorkloadScopes,
  toWorkloadIdentityContext,
  validateWorkloadIdentity,
} from '../dist/workload-identity.js';

const now = new Date('2026-08-10T12:00:00.000Z');
const valid = {
  version: 1,
  workloadId: 'reconciliation-worker.prod',
  organizationId: '11111111-1111-4111-8111-111111111111',
  scopes: ['reconciliation:read', 'reconciliation:write'],
  issuedAt: '2026-08-10T11:55:00.000Z',
  expiresAt: '2026-08-10T12:05:00.000Z',
  tokenId: '22222222-2222-4222-8222-222222222222',
};

test('accepts a bounded workload identity', () => {
  assert.deepEqual(validateWorkloadIdentity(valid, now), []);
});

test('rejects expired, overlong and unsupported identities', () => {
  const errors = validateWorkloadIdentity(
    {
      ...valid,
      scopes: ['reconciliation:read', 'unsupported'],
      issuedAt: '2026-08-10T10:00:00.000Z',
      expiresAt: '2026-08-10T11:00:00.000Z',
    },
    now,
  );
  assert.ok(errors.includes('unsupported scope'));
  assert.ok(errors.includes('workload identity is expired'));
  assert.ok(errors.includes('workload identity lifetime exceeds 15 minutes'));
});

test('builds an immutable-style authorization context and checks scopes', () => {
  const context = toWorkloadIdentityContext(valid);
  assert.equal(context.organizationId, valid.organizationId);
  assert.equal(hasWorkloadScopes(context, ['reconciliation:read']), true);
  assert.equal(hasWorkloadScopes(context, ['ledger:write']), false);
});

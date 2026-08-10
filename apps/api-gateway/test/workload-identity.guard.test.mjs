import assert from 'node:assert/strict';
import test from 'node:test';

import { UnauthorizedException } from '@nestjs/common';

import { WorkloadIdentityGuard } from '../dist/workload-identity.guard.js';

const makeContext = (headers = {}) => {
  const request = { headers };
  return {
    request,
    context: {
      switchToHttp() {
        return {
          getRequest() {
            return request;
          },
        };
      },
    },
  };
};

const validIdentity = () => {
  const now = Date.now();
  return {
    version: 1,
    workloadId: 'reconciliation-worker.prod',
    organizationId: '11111111-1111-4111-8111-111111111111',
    scopes: ['reconciliation:read'],
    issuedAt: new Date(now - 30_000).toISOString(),
    expiresAt: new Date(now + 5 * 60_000).toISOString(),
    tokenId: '22222222-2222-4222-8222-222222222222',
  };
};

test('rejects a request without a bearer workload credential', async () => {
  const guard = new WorkloadIdentityGuard({
    async verify() {
      throw new Error('must not be called');
    },
  });
  const { context } = makeContext();

  await assert.rejects(() => guard.canActivate(context), UnauthorizedException);
});

test('attaches only the normalized workload context after verification', async () => {
  let receivedCredential;
  const guard = new WorkloadIdentityGuard({
    async verify(credential) {
      receivedCredential = credential;
      return validIdentity();
    },
  });
  const { context, request } = makeContext({ authorization: 'Bearer signed-example' });

  assert.equal(await guard.canActivate(context), true);
  assert.equal(receivedCredential, 'signed-example');
  assert.deepEqual(
    {
      workloadId: request.workloadIdentity.workloadId,
      organizationId: request.workloadIdentity.organizationId,
      scopes: [...request.workloadIdentity.scopes],
      tokenId: request.workloadIdentity.tokenId,
    },
    {
      workloadId: 'reconciliation-worker.prod',
      organizationId: '11111111-1111-4111-8111-111111111111',
      scopes: ['reconciliation:read'],
      tokenId: '22222222-2222-4222-8222-222222222222',
    },
  );
  assert.equal('credential' in request, false);
});

test('rejects a verifier failure without exposing its message', async () => {
  const guard = new WorkloadIdentityGuard({
    async verify() {
      throw new Error('provider internals and credential details');
    },
  });
  const { context } = makeContext({ authorization: 'Bearer invalid' });

  await assert.rejects(
    () => guard.canActivate(context),
    (error) =>
      error instanceof UnauthorizedException &&
      error.message === 'Invalid workload identity.',
  );
});

test('rejects an identity that fails shared contract validation', async () => {
  const guard = new WorkloadIdentityGuard({
    async verify() {
      return { ...validIdentity(), expiresAt: '2000-01-01T00:00:00.000Z' };
    },
  });
  const { context } = makeContext({ authorization: ['Bearer stale', 'ignored'] });

  await assert.rejects(() => guard.canActivate(context), UnauthorizedException);
});

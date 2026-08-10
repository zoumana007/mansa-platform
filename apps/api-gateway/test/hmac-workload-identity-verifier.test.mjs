import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { test } from 'node:test';

import { HmacWorkloadIdentityVerifier } from '../dist/hmac-workload-identity.verifier.js';

const secret = '0123456789abcdef0123456789abcdef';
const issuer = 'mansa-internal-test';
const audience = 'mansa-api-gateway';

function sign(payload, overrideHeader = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', ...overrideHeader })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function validPayload(overrides = {}) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 5 * 60_000);
  return {
    version: 1,
    workloadId: 'reconciliation-worker',
    organizationId: '00000000-0000-4000-8000-000000000010',
    scopes: ['reconciliation:read'],
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    tokenId: randomUUID(),
    iss: issuer,
    aud: audience,
    ...overrides,
  };
}

async function withEnv(fn) {
  const previous = {
    secret: process.env.WORKLOAD_IDENTITY_HMAC_SECRET,
    issuer: process.env.WORKLOAD_IDENTITY_ISSUER,
    audience: process.env.WORKLOAD_IDENTITY_AUDIENCE,
  };
  process.env.WORKLOAD_IDENTITY_HMAC_SECRET = secret;
  process.env.WORKLOAD_IDENTITY_ISSUER = issuer;
  process.env.WORKLOAD_IDENTITY_AUDIENCE = audience;
  try {
    await fn();
  } finally {
    if (previous.secret === undefined) delete process.env.WORKLOAD_IDENTITY_HMAC_SECRET;
    else process.env.WORKLOAD_IDENTITY_HMAC_SECRET = previous.secret;
    if (previous.issuer === undefined) delete process.env.WORKLOAD_IDENTITY_ISSUER;
    else process.env.WORKLOAD_IDENTITY_ISSUER = previous.issuer;
    if (previous.audience === undefined) delete process.env.WORKLOAD_IDENTITY_AUDIENCE;
    else process.env.WORKLOAD_IDENTITY_AUDIENCE = previous.audience;
  }
}

test('verifier accepts a valid signed workload identity', async () => {
  await withEnv(async () => {
    const verifier = new HmacWorkloadIdentityVerifier();
    const payload = validPayload();
    const identity = await verifier.verify(sign(payload));
    assert.equal(identity.workloadId, payload.workloadId);
    assert.equal(identity.organizationId, payload.organizationId);
    assert.deepEqual(identity.scopes, payload.scopes);
    assert.equal(identity.issuedAt, payload.issuedAt);
    assert.equal(identity.expiresAt, payload.expiresAt);
  });
});

test('verifier rejects tampering and unsupported algorithms', async () => {
  await withEnv(async () => {
    const verifier = new HmacWorkloadIdentityVerifier();
    const token = sign(validPayload());
    const [header, body, signature] = token.split('.');
    const tamperedBody = Buffer.from(JSON.stringify(validPayload({ workloadId: 'attacker-service' }))).toString('base64url');
    await assert.rejects(() => verifier.verify(`${header}.${tamperedBody}.${signature}`));
    await assert.rejects(() => verifier.verify(sign(validPayload(), { alg: 'none' })));
  });
});

test('verifier rejects unexpected issuer or audience and weak configuration', async () => {
  await withEnv(async () => {
    const verifier = new HmacWorkloadIdentityVerifier();
    await assert.rejects(() => verifier.verify(sign(validPayload({ iss: 'wrong' }))));
    await assert.rejects(() => verifier.verify(sign(validPayload({ aud: 'wrong' }))));

    process.env.WORKLOAD_IDENTITY_HMAC_SECRET = 'too-short';
    await assert.rejects(() => verifier.verify(sign(validPayload())));
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AccessController } from '../dist/access/access.controller.js';

function createController(overrides = {}) {
  const calls = [];
  const service = {
    async getCredential(organizationId, credentialId) {
      calls.push(['getCredential', organizationId, credentialId]);
      return overrides.getCredential?.(organizationId, credentialId);
    },
    async listCredentials(organizationId, filters) {
      calls.push(['listCredentials', organizationId, filters]);
      return overrides.listCredentials?.(organizationId, filters) ?? [];
    },
    async getEntitlement(organizationId, entitlementId) {
      calls.push(['getEntitlement', organizationId, entitlementId]);
      return overrides.getEntitlement?.(organizationId, entitlementId);
    },
    async listEntitlements(organizationId, filters) {
      calls.push(['listEntitlements', organizationId, filters]);
      return overrides.listEntitlements?.(organizationId, filters) ?? [];
    },
    async evaluate(request) {
      calls.push(['evaluate', request]);
      return overrides.evaluate?.(request);
    },
  };
  return { controller: new AccessController(service), calls };
}

test('credential reads require an organizationId before calling the service', async () => {
  const { controller, calls } = createController();
  await assert.rejects(() => controller.getCredential('cred-1', undefined), BadRequestException);
  assert.deepEqual(calls, []);
});

test('credential reads return 404 when the resource is absent from the requested tenant', async () => {
  const { controller } = createController({ getCredential: () => undefined });
  await assert.rejects(() => controller.getCredential('cred-1', 'org-a'), NotFoundException);
});

test('credential list forwards tenant and combinable filters with a bounded limit', async () => {
  const expected = [{ id: 'cred-1' }];
  const { controller, calls } = createController({ listCredentials: () => expected });
  const result = await controller.listCredentials('org-a', 'subject-1', 'ACTIVE', 'RFID_UHF_TAG', '25');
  assert.equal(result, expected);
  assert.deepEqual(calls, [
    ['listCredentials', 'org-a', { subjectId: 'subject-1', status: 'ACTIVE', credentialType: 'RFID_UHF_TAG', limit: 25 }],
  ]);
});

test('credential list rejects invalid limits without calling persistence', async () => {
  for (const limit of ['0', '101', '1.5', 'invalid']) {
    const { controller, calls } = createController();
    await assert.rejects(() => controller.listCredentials('org-a', undefined, undefined, undefined, limit), BadRequestException);
    assert.deepEqual(calls, []);
  }
});

test('entitlement reads require tenant isolation and map absence to 404', async () => {
  const { controller, calls } = createController({ getEntitlement: () => undefined });
  await assert.rejects(() => controller.getEntitlement('ent-1', '  '), BadRequestException);
  assert.deepEqual(calls, []);
  await assert.rejects(() => controller.getEntitlement('ent-1', 'org-a'), NotFoundException);
});

test('entitlement list forwards tenant and filters', async () => {
  const expected = [{ id: 'ent-1' }];
  const { controller, calls } = createController({ listEntitlements: () => expected });
  const result = await controller.listEntitlements('org-a', 'subject-1', 'TOLL', 'ACTIVE', '50');
  assert.equal(result, expected);
  assert.deepEqual(calls, [
    ['listEntitlements', 'org-a', { subjectId: 'subject-1', useCase: 'TOLL', status: 'ACTIVE', limit: 50 }],
  ]);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { PrismaClient } from '@prisma/client';

import { AccessManagementRepository } from '../dist/access/access-management.repository.js';

const integrationEnabled = process.env.RUN_POSTGRES_TESTS === '1';
const databaseUrl = process.env.DATABASE_URL;

if (!integrationEnabled || !databaseUrl) {
  test('access management PostgreSQL integration is opt-in', { skip: true }, () => {});
} else {
  const prisma = new PrismaClient();
  const management = new AccessManagementRepository(prisma);

  const cleanup = async () => {
    await prisma.operationalAuditLog.deleteMany({
      where: {
        action: { in: ['ACCESS_CREDENTIAL_CREATED', 'ACCESS_ENTITLEMENT_CREATED'] },
      },
    });
    await prisma.accessEntitlementRecord.deleteMany();
    await prisma.accessCredentialRecord.deleteMany();
  };

  test.beforeEach(cleanup);
  test.after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  test('credential creation persists the resource and its audit atomically', async () => {
    const credential = {
      id: '31111111-1111-4111-8111-111111111111',
      organizationId: 'org-create-credential',
      subjectType: 'VEHICLE',
      subjectId: 'vehicle-create-1',
      credentialType: 'RFID_UHF_TAG',
      publicReference: 'tag-create-1',
      status: 'ACTIVE',
      validFrom: '2026-08-10T00:00:00.000Z',
      metadata: { fleet: 'public' },
    };

    const result = await management.createCredential({
      credential,
      idempotencyKey: 'idem-credential-create-1',
      correlationId: 'corr-credential-create-1',
    });

    assert.deepEqual(result, credential);
    const persisted = await prisma.accessCredentialRecord.findUniqueOrThrow({
      where: { id: credential.id },
    });
    assert.equal(persisted.organizationId, credential.organizationId);
    assert.equal(persisted.publicReference, credential.publicReference);

    const audit = await prisma.operationalAuditLog.findFirstOrThrow({
      where: {
        action: 'ACCESS_CREDENTIAL_CREATED',
        resourceId: credential.id,
      },
    });
    assert.equal(audit.correlationId, 'corr-credential-create-1');
    assert.equal(audit.resourceType, 'AccessCredential');
    assert.deepEqual(audit.metadata, {
      organizationId: credential.organizationId,
      subjectId: credential.subjectId,
      idempotencyKey: 'idem-credential-create-1',
    });
  });

  test('credential replay returns the first row without duplicating resource or audit', async () => {
    const credential = {
      id: '31111111-1111-4111-8111-111111111112',
      organizationId: 'org-create-replay',
      subjectType: 'VEHICLE',
      subjectId: 'vehicle-replay',
      credentialType: 'RFID_UHF_TAG',
      publicReference: 'tag-replay',
      status: 'ACTIVE',
    };
    const command = {
      credential,
      idempotencyKey: 'idem-credential-replay',
      correlationId: 'corr-credential-replay',
    };

    const [first, second] = await Promise.all([
      management.createCredential(command),
      management.createCredential(command),
    ]);

    assert.equal(first.id, credential.id);
    assert.equal(second.id, credential.id);
    assert.equal(
      await prisma.accessCredentialRecord.count({ where: { id: credential.id } }),
      1,
    );
    assert.equal(
      await prisma.operationalAuditLog.count({
        where: { action: 'ACCESS_CREDENTIAL_CREATED', resourceId: credential.id },
      }),
      1,
    );
  });

  test('credential public references stay isolated by tenant and reject conflicting ids', async () => {
    await management.createCredential({
      credential: {
        id: '31111111-1111-4111-8111-111111111113',
        organizationId: 'org-reference-a',
        subjectType: 'VEHICLE',
        subjectId: 'vehicle-a',
        credentialType: 'RFID_UHF_TAG',
        publicReference: 'shared-tag',
        status: 'ACTIVE',
      },
      idempotencyKey: 'idem-reference-a',
      correlationId: 'corr-reference-a',
    });

    const tenantB = await management.createCredential({
      credential: {
        id: '31111111-1111-4111-8111-111111111114',
        organizationId: 'org-reference-b',
        subjectType: 'VEHICLE',
        subjectId: 'vehicle-b',
        credentialType: 'RFID_UHF_TAG',
        publicReference: 'shared-tag',
        status: 'ACTIVE',
      },
      idempotencyKey: 'idem-reference-b',
      correlationId: 'corr-reference-b',
    });

    assert.equal(tenantB.organizationId, 'org-reference-b');
    assert.equal(
      await prisma.accessCredentialRecord.count({
        where: { credentialType: 'RFID_UHF_TAG', publicReference: 'shared-tag' },
      }),
      2,
    );

    await assert.rejects(
      () => management.createCredential({
        credential: {
          id: '31111111-1111-4111-8111-111111111113',
          organizationId: 'org-reference-b',
          subjectType: 'VEHICLE',
          subjectId: 'vehicle-b',
          credentialType: 'RFID_UHF_TAG',
          publicReference: 'other-tag',
          status: 'ACTIVE',
        },
        idempotencyKey: 'idem-reference-conflict',
        correlationId: 'corr-reference-conflict',
      }),
      /another resource|another tenant/,
    );
  });

  test('entitlement creation persists structured limits and audit data', async () => {
    const entitlement = {
      id: '32222222-2222-4222-8222-222222222221',
      organizationId: 'org-create-entitlement',
      subjectId: 'vehicle-entitlement-1',
      useCase: 'TOLL',
      status: 'ACTIVE',
      validFrom: '2026-08-10T00:00:00.000Z',
      validUntil: '2026-09-10T00:00:00.000Z',
      allowedLocationIds: ['toll-a', 'toll-b'],
      allowedProductCodes: ['class-1'],
      maxUsesPerPeriod: 30,
      period: 'MONTH',
      amountLimit: { amountMinor: '150000', currency: 'XOF' },
      refundPolicy: 'CREDIT',
      outageCompensationPolicy: 'PAUSE_AND_EXTEND',
      metadata: { plan: 'monthly' },
    };

    const result = await management.createEntitlement({
      entitlement,
      idempotencyKey: 'idem-entitlement-create-1',
      correlationId: 'corr-entitlement-create-1',
    });

    assert.deepEqual(result, entitlement);
    const persisted = await prisma.accessEntitlementRecord.findUniqueOrThrow({
      where: { id: entitlement.id },
    });
    assert.equal(persisted.amountLimitMinor, 150000n);
    assert.equal(persisted.amountLimitCurrency, 'XOF');
    assert.deepEqual(persisted.allowedLocationIds, ['toll-a', 'toll-b']);

    const audit = await prisma.operationalAuditLog.findFirstOrThrow({
      where: {
        action: 'ACCESS_ENTITLEMENT_CREATED',
        resourceId: entitlement.id,
      },
    });
    assert.equal(audit.correlationId, 'corr-entitlement-create-1');
    assert.deepEqual(audit.metadata, {
      organizationId: entitlement.organizationId,
      subjectId: entitlement.subjectId,
      idempotencyKey: 'idem-entitlement-create-1',
    });
  });

  test('entitlement replay stays idempotent and tenant collisions are rejected', async () => {
    const entitlement = {
      id: '32222222-2222-4222-8222-222222222222',
      organizationId: 'org-entitlement-replay',
      subjectId: 'vehicle-entitlement-replay',
      useCase: 'TOLL',
      status: 'ACTIVE',
      validFrom: '2026-08-10T00:00:00.000Z',
    };
    const command = {
      entitlement,
      idempotencyKey: 'idem-entitlement-replay',
      correlationId: 'corr-entitlement-replay',
    };

    await management.createEntitlement(command);
    const replay = await management.createEntitlement(command);
    assert.equal(replay.id, entitlement.id);
    assert.equal(
      await prisma.operationalAuditLog.count({
        where: { action: 'ACCESS_ENTITLEMENT_CREATED', resourceId: entitlement.id },
      }),
      1,
    );

    await assert.rejects(
      () => management.createEntitlement({
        entitlement: { ...entitlement, organizationId: 'org-other-tenant' },
        idempotencyKey: 'idem-entitlement-conflict',
        correlationId: 'corr-entitlement-conflict',
      }),
      /another tenant/,
    );
  });
}

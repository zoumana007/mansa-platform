import assert from 'node:assert/strict';
import test from 'node:test';

import { PrismaClient } from '@prisma/client';

import { AccessManagementRepository } from '../dist/access/access-management.repository.js';
import { PrismaAccessRepository } from '../dist/access/access.repository.js';
import { AccessService } from '../dist/access/access.service.js';
import { OperationIdempotencyRegistry } from '../dist/idempotency/operation-idempotency.registry.js';

const integrationEnabled = process.env.RUN_POSTGRES_TESTS === '1';
const databaseUrl = process.env.DATABASE_URL;

if (!integrationEnabled || !databaseUrl) {
  test('persistent idempotency PostgreSQL integration is opt-in', { skip: true }, () => {});
} else {
  const prisma = new PrismaClient();
  const repository = new PrismaAccessRepository(prisma);
  const management = new AccessManagementRepository(prisma);
  const idempotency = new OperationIdempotencyRegistry(prisma);
  const service = new AccessService(repository, management, idempotency);

  const cleanup = async () => {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "OperationIdempotencyRecord" WHERE "organizationId" LIKE 'org-idem-%'`,
    );
    await prisma.operationalAuditLog.deleteMany({
      where: { resourceId: { in: ['43333333-3333-4333-8333-333333333331'] } },
    });
    await prisma.accessCredentialRecord.deleteMany({ where: { organizationId: { startsWith: 'org-idem-' } } });
  };

  test.beforeEach(cleanup);
  test.after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  test('same key and payload replay the original response without another mutation', async () => {
    const credential = await management.createCredential({
      credential: {
        id: '43333333-3333-4333-8333-333333333331',
        organizationId: 'org-idem-credential',
        subjectType: 'VEHICLE',
        subjectId: 'vehicle-idem-1',
        credentialType: 'RFID_UHF_TAG',
        publicReference: 'tag-idem-1',
        status: 'ACTIVE',
      },
      idempotencyKey: 'create-idem-credential',
      correlationId: 'corr-create-idem-credential',
    });

    const suspend = {
      organizationId: credential.organizationId,
      credentialId: credential.id,
      targetStatus: 'SUSPENDED',
      reason: 'SECURITY_REVIEW',
      idempotencyKey: 'idem-status-1',
      correlationId: 'corr-idem-status-1',
    };

    const first = await service.updateCredentialStatus(suspend);
    assert.equal(first.status, 'SUSPENDED');

    await service.updateCredentialStatus({
      ...suspend,
      targetStatus: 'ACTIVE',
      reason: 'REVIEW_CLEARED',
      idempotencyKey: 'idem-status-2',
      correlationId: 'corr-idem-status-2',
    });

    const replay = await service.updateCredentialStatus({ ...suspend, correlationId: 'corr-retry-later' });
    assert.equal(replay.status, 'SUSPENDED');

    const current = await repository.getCredential(credential.organizationId, credential.id);
    assert.equal(current?.status, 'ACTIVE');
    assert.equal(
      await prisma.operationalAuditLog.count({
        where: { action: 'ACCESS_CREDENTIAL_STATUS_CHANGED', resourceId: credential.id },
      }),
      2,
    );
  });

  test('same key with a different payload is rejected', async () => {
    const credential = await management.createCredential({
      credential: {
        id: '43333333-3333-4333-8333-333333333331',
        organizationId: 'org-idem-conflict',
        subjectType: 'VEHICLE',
        subjectId: 'vehicle-idem-conflict',
        credentialType: 'NFC_CARD',
        publicReference: 'card-idem-conflict',
        status: 'ACTIVE',
      },
      idempotencyKey: 'create-idem-conflict',
      correlationId: 'corr-create-idem-conflict',
    });

    await service.updateCredentialStatus({
      organizationId: credential.organizationId,
      credentialId: credential.id,
      targetStatus: 'SUSPENDED',
      reason: 'SECURITY_REVIEW',
      idempotencyKey: 'idem-conflict-1',
      correlationId: 'corr-idem-conflict-1',
    });

    await assert.rejects(
      () => service.updateCredentialStatus({
        organizationId: credential.organizationId,
        credentialId: credential.id,
        targetStatus: 'REVOKED',
        reason: 'LOST_CARD',
        idempotencyKey: 'idem-conflict-1',
        correlationId: 'corr-idem-conflict-2',
      }),
      /idempotency key already used with a different payload/,
    );
  });
}

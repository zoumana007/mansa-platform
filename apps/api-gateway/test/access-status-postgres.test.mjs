import assert from 'node:assert/strict';
import test from 'node:test';

import { PrismaClient } from '@prisma/client';

import { AccessManagementRepository } from '../dist/access/access-management.repository.js';

const integrationEnabled = process.env.RUN_POSTGRES_TESTS === '1';
const databaseUrl = process.env.DATABASE_URL;

if (!integrationEnabled || !databaseUrl) {
  test('access status PostgreSQL integration is opt-in', { skip: true }, () => {});
} else {
  const prisma = new PrismaClient();
  const management = new AccessManagementRepository(prisma);

  const cleanup = async () => {
    await prisma.operationalAuditLog.deleteMany({
      where: {
        action: { in: ['ACCESS_CREDENTIAL_CREATED', 'ACCESS_ENTITLEMENT_CREATED', 'ACCESS_CREDENTIAL_STATUS_CHANGED', 'ACCESS_ENTITLEMENT_STATUS_CHANGED'] },
      },
    });
    await prisma.accessEntitlementRecord.deleteMany({ where: { organizationId: { startsWith: 'org-status-' } } });
    await prisma.accessCredentialRecord.deleteMany({ where: { organizationId: { startsWith: 'org-status-' } } });
  };

  test.beforeEach(cleanup);
  test.after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  test('credential status transition is tenant-scoped, audited and replay-safe', async () => {
    const credential = await management.createCredential({
      credential: {
        id: '41111111-1111-4111-8111-111111111111',
        organizationId: 'org-status-credential',
        subjectType: 'VEHICLE',
        subjectId: 'vehicle-status-1',
        credentialType: 'RFID_UHF_TAG',
        publicReference: 'tag-status-1',
        status: 'ACTIVE',
      },
      idempotencyKey: 'create-status-credential',
      correlationId: 'corr-create-status-credential',
    });

    const command = {
      organizationId: credential.organizationId,
      credentialId: credential.id,
      targetStatus: 'SUSPENDED',
      reason: 'SECURITY_REVIEW',
      idempotencyKey: 'status-credential-1',
      correlationId: 'corr-status-credential-1',
    };
    const changed = await management.updateCredentialStatus(command);
    const replay = await management.updateCredentialStatus(command);

    assert.equal(changed.status, 'SUSPENDED');
    assert.equal(replay.status, 'SUSPENDED');
    assert.equal(await prisma.operationalAuditLog.count({ where: { action: 'ACCESS_CREDENTIAL_STATUS_CHANGED', resourceId: credential.id } }), 1);
    const audit = await prisma.operationalAuditLog.findFirstOrThrow({ where: { action: 'ACCESS_CREDENTIAL_STATUS_CHANGED', resourceId: credential.id } });
    assert.equal(audit.reason, 'SECURITY_REVIEW');
    assert.deepEqual(audit.metadata, {
      organizationId: credential.organizationId,
      previousStatus: 'ACTIVE',
      targetStatus: 'SUSPENDED',
      idempotencyKey: 'status-credential-1',
    });

    await assert.rejects(
      () => management.updateCredentialStatus({ ...command, organizationId: 'org-status-other', targetStatus: 'ACTIVE' }),
      /not found for tenant/,
    );
  });

  test('credential terminal states cannot be reactivated', async () => {
    const credential = await management.createCredential({
      credential: {
        id: '41111111-1111-4111-8111-111111111112',
        organizationId: 'org-status-terminal-credential',
        subjectType: 'PERSON',
        subjectId: 'person-status-1',
        credentialType: 'NFC_CARD',
        publicReference: 'card-status-1',
        status: 'ACTIVE',
      },
      idempotencyKey: 'create-terminal-credential',
      correlationId: 'corr-create-terminal-credential',
    });
    await management.updateCredentialStatus({
      organizationId: credential.organizationId,
      credentialId: credential.id,
      targetStatus: 'REVOKED',
      reason: 'LOST_CARD',
      idempotencyKey: 'revoke-card',
      correlationId: 'corr-revoke-card',
    });
    await assert.rejects(
      () => management.updateCredentialStatus({
        organizationId: credential.organizationId,
        credentialId: credential.id,
        targetStatus: 'ACTIVE',
        reason: 'INVALID_REACTIVATION',
        idempotencyKey: 'reactivate-card',
        correlationId: 'corr-reactivate-card',
      }),
      /REVOKED -> ACTIVE is not allowed/,
    );
  });

  test('entitlement suspension and reactivation are audited while terminal states stay closed', async () => {
    const entitlement = await management.createEntitlement({
      entitlement: {
        id: '42222222-2222-4222-8222-222222222221',
        organizationId: 'org-status-entitlement',
        subjectId: 'vehicle-entitlement-status',
        useCase: 'TOLL',
        status: 'ACTIVE',
        validFrom: '2026-08-10T00:00:00.000Z',
      },
      idempotencyKey: 'create-status-entitlement',
      correlationId: 'corr-create-status-entitlement',
    });

    const suspended = await management.updateEntitlementStatus({
      organizationId: entitlement.organizationId,
      entitlementId: entitlement.id,
      targetStatus: 'SUSPENDED',
      reason: 'PAYMENT_REVIEW',
      idempotencyKey: 'suspend-entitlement',
      correlationId: 'corr-suspend-entitlement',
    });
    assert.equal(suspended.status, 'SUSPENDED');

    const active = await management.updateEntitlementStatus({
      organizationId: entitlement.organizationId,
      entitlementId: entitlement.id,
      targetStatus: 'ACTIVE',
      reason: 'REVIEW_CLEARED',
      idempotencyKey: 'reactivate-entitlement',
      correlationId: 'corr-reactivate-entitlement',
    });
    assert.equal(active.status, 'ACTIVE');

    const terminated = await management.updateEntitlementStatus({
      organizationId: entitlement.organizationId,
      entitlementId: entitlement.id,
      targetStatus: 'TERMINATED',
      reason: 'CONTRACT_ENDED',
      idempotencyKey: 'terminate-entitlement',
      correlationId: 'corr-terminate-entitlement',
    });
    assert.equal(terminated.status, 'TERMINATED');
    assert.equal(await prisma.operationalAuditLog.count({ where: { action: 'ACCESS_ENTITLEMENT_STATUS_CHANGED', resourceId: entitlement.id } }), 3);

    await assert.rejects(
      () => management.updateEntitlementStatus({
        organizationId: entitlement.organizationId,
        entitlementId: entitlement.id,
        targetStatus: 'ACTIVE',
        reason: 'INVALID_REOPEN',
        idempotencyKey: 'reopen-entitlement',
        correlationId: 'corr-reopen-entitlement',
      }),
      /TERMINATED -> ACTIVE is not allowed/,
    );
  });
}

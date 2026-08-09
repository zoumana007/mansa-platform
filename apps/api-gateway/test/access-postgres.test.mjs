import assert from 'node:assert/strict';
import test from 'node:test';

import { PrismaClient } from '@prisma/client';

import { PrismaAccessRepository } from '../dist/access/access.repository.js';

const integrationEnabled = process.env.RUN_POSTGRES_TESTS === '1';
const databaseUrl = process.env.DATABASE_URL;

if (!integrationEnabled || !databaseUrl) {
  test('access PostgreSQL integration is opt-in', { skip: true }, () => {});
} else {
  const prisma = new PrismaClient();
  const repository = new PrismaAccessRepository(prisma);

  const cleanup = async () => {
    await prisma.accessQuotaReservationRecord.deleteMany();
    await prisma.accessQuotaCounter.deleteMany();
    await prisma.accessUsageRecord.deleteMany();
    await prisma.accessDecisionRecord.deleteMany();
  };

  test.beforeEach(cleanup);
  test.after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  test('two tenants may reuse the same requestId without collision', async () => {
    const decidedAt = new Date('2026-08-09T18:00:00.000Z').toISOString();
    const baseDecision = {
      requestId: 'shared-request',
      decision: 'DENY',
      reason: 'CREDENTIAL_NOT_FOUND',
      decidedAt,
      correlationId: 'corr-shared',
    };

    await repository.recordDecision(
      {
        requestId: 'shared-request',
        organizationId: 'org-a',
        useCase: 'TOLL',
        credentialType: 'RFID_UHF_TAG',
        credentialReference: 'tag-a',
        locationId: 'toll-a',
        occurredAt: decidedAt,
        correlationId: 'corr-a',
      },
      { ...baseDecision, correlationId: 'corr-a' },
    );
    await repository.recordDecision(
      {
        requestId: 'shared-request',
        organizationId: 'org-b',
        useCase: 'TOLL',
        credentialType: 'RFID_UHF_TAG',
        credentialReference: 'tag-b',
        locationId: 'toll-b',
        occurredAt: decidedAt,
        correlationId: 'corr-b',
      },
      { ...baseDecision, correlationId: 'corr-b' },
    );

    const [a, b, count] = await Promise.all([
      repository.findRecordedDecision('org-a', 'shared-request'),
      repository.findRecordedDecision('org-b', 'shared-request'),
      prisma.accessDecisionRecord.count({ where: { requestId: 'shared-request' } }),
    ]);

    assert.equal(count, 2);
    assert.equal(a?.correlationId, 'corr-a');
    assert.equal(b?.correlationId, 'corr-b');
  });

  test('recordDecision is idempotent and preserves the first persisted decision', async () => {
    const request = {
      requestId: 'idempotent-decision',
      organizationId: 'org-idem',
      useCase: 'TOLL',
      credentialType: 'RFID_UHF_TAG',
      credentialReference: 'tag-idem',
      locationId: 'toll-idem',
      occurredAt: '2026-08-09T18:10:00.000Z',
      correlationId: 'corr-idem',
    };

    await repository.recordDecision(request, {
      requestId: request.requestId,
      decision: 'ALLOW',
      reason: 'ENTITLEMENT_VALID',
      decidedAt: request.occurredAt,
      correlationId: 'corr-first',
    });
    await repository.recordDecision(request, {
      requestId: request.requestId,
      decision: 'DENY',
      reason: 'QUOTA_EXCEEDED',
      decidedAt: '2026-08-09T18:11:00.000Z',
      correlationId: 'corr-second',
    });

    const replay = await repository.findRecordedDecision('org-idem', request.requestId);
    assert.equal(replay?.decision, 'ALLOW');
    assert.equal(replay?.reason, 'ENTITLEMENT_VALID');
    assert.equal(replay?.correlationId, 'corr-first');
    assert.equal(
      await prisma.accessDecisionRecord.count({
        where: { organizationId: 'org-idem', requestId: request.requestId },
      }),
      1,
    );
  });

  test('concurrent requests cannot both consume the final quota unit', async () => {
    const common = {
      organizationId: 'org-quota',
      entitlementId: 'entitlement-quota',
      period: 'DAY',
      occurredAt: '2026-08-09T18:20:00.000Z',
      maxUsesPerPeriod: 1,
    };

    const results = await Promise.all([
      repository.reserve({ ...common, requestId: 'quota-a', correlationId: 'corr-quota-a' }),
      repository.reserve({ ...common, requestId: 'quota-b', correlationId: 'corr-quota-b' }),
    ]);

    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(results.filter((value) => !value).length, 1);

    const counter = await prisma.accessQuotaCounter.findFirstOrThrow({
      where: { organizationId: common.organizationId, entitlementId: common.entitlementId },
    });
    assert.equal(counter.used, 1);
    assert.equal(counter.limit, 1);
    assert.equal(
      await prisma.accessQuotaReservationRecord.count({
        where: { organizationId: common.organizationId, entitlementId: common.entitlementId },
      }),
      1,
    );
  });

  test('concurrent replay of the same quota reservation remains idempotent', async () => {
    const command = {
      organizationId: 'org-replay',
      entitlementId: 'entitlement-replay',
      period: 'DAY',
      occurredAt: '2026-08-09T18:30:00.000Z',
      maxUsesPerPeriod: 3,
      requestId: 'same-request',
      correlationId: 'same-correlation',
    };

    const results = await Promise.all([
      repository.reserve(command),
      repository.reserve(command),
    ]);

    assert.deepEqual(results, [true, true]);
    const counter = await prisma.accessQuotaCounter.findFirstOrThrow({
      where: { organizationId: command.organizationId, entitlementId: command.entitlementId },
    });
    assert.equal(counter.used, 1);
    assert.equal(
      await prisma.accessQuotaReservationRecord.count({
        where: {
          organizationId: command.organizationId,
          entitlementId: command.entitlementId,
          requestId: command.requestId,
        },
      }),
      1,
    );
  });

  test('a burst of concurrent requests never exceeds the configured quota', async () => {
    const common = {
      organizationId: 'org-burst',
      entitlementId: 'entitlement-burst',
      period: 'DAY',
      occurredAt: '2026-08-09T18:40:00.000Z',
      maxUsesPerPeriod: 3,
    };

    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        repository.reserve({
          ...common,
          requestId: `burst-${index}`,
          correlationId: `corr-burst-${index}`,
        }),
      ),
    );

    assert.equal(results.filter(Boolean).length, 3);
    assert.equal(results.filter((value) => !value).length, 9);

    const counter = await prisma.accessQuotaCounter.findFirstOrThrow({
      where: { organizationId: common.organizationId, entitlementId: common.entitlementId },
    });
    assert.equal(counter.used, 3);
    assert.equal(counter.limit, 3);
    assert.equal(
      await prisma.accessQuotaReservationRecord.count({
        where: { organizationId: common.organizationId, entitlementId: common.entitlementId },
      }),
      3,
    );
  });

  test('quota counters remain isolated when tenants reuse an entitlementId', async () => {
    const common = {
      entitlementId: 'shared-entitlement',
      period: 'DAY',
      occurredAt: '2026-08-09T18:50:00.000Z',
      maxUsesPerPeriod: 1,
    };

    const [tenantA, tenantB] = await Promise.all([
      repository.reserve({
        ...common,
        organizationId: 'org-quota-a',
        requestId: 'shared-request',
        correlationId: 'corr-quota-a',
      }),
      repository.reserve({
        ...common,
        organizationId: 'org-quota-b',
        requestId: 'shared-request',
        correlationId: 'corr-quota-b',
      }),
    ]);

    assert.equal(tenantA, true);
    assert.equal(tenantB, true);
    assert.equal(
      await prisma.accessQuotaCounter.count({
        where: { entitlementId: common.entitlementId, used: 1, limit: 1 },
      }),
      2,
    );
    assert.equal(
      await prisma.accessQuotaReservationRecord.count({
        where: { entitlementId: common.entitlementId, requestId: 'shared-request' },
      }),
      2,
    );
  });
}

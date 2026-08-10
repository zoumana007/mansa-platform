import assert from 'node:assert/strict';
import test from 'node:test';

import { PrismaClient } from '@prisma/client';

import { ReconciliationRepository } from '../dist/reconciliation/reconciliation.repository.js';

const integrationEnabled = process.env.RUN_POSTGRES_TESTS === '1';
const databaseUrl = process.env.DATABASE_URL;

if (!integrationEnabled || !databaseUrl) {
  test('reconciliation PostgreSQL integration is opt-in', { skip: true }, () => {});
} else {
  const prisma = new PrismaClient();
  const repository = new ReconciliationRepository(prisma);
  const organizationId = `org-reconciliation-${Date.now()}`;
  const secondOrganizationId = `${organizationId}-other`;
  const providerId = `integration-provider-${Date.now()}`;
  const sourceFingerprint = `integration-source-${Date.now()}`;
  const createdBatchIds = new Set();
  const auditedItemIds = new Set();
  let createdBatchId;

  test.after(async () => {
    if (auditedItemIds.size > 0) {
      await prisma.operationalAuditLog.deleteMany({
        where: { resourceType: 'ReconciliationItem', resourceId: { in: [...auditedItemIds] } },
      });
    }
    if (createdBatchIds.size > 0) {
      const ids = [...createdBatchIds];
      await prisma.reconciliationItem.deleteMany({ where: { batchId: { in: ids } } });
      await prisma.reconciliationBatch.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  test('reconciliation import persists tenant-scoped items and counters atomically', async () => {
    const result = await repository.importBatch({
      organizationId,
      providerId: ` ${providerId} `,
      sourceFileReference: ' settlement-test.csv ',
      sourceFingerprint: ` ${sourceFingerprint} `,
      periodStart: new Date('2026-08-01T00:00:00.000Z'),
      periodEnd: new Date('2026-08-01T23:59:59.000Z'),
      metadata: { source: 'postgres-integration-test' },
      items: [
        {
          internalReference: ' internal-1 ',
          providerReference: ' provider-1 ',
          internalAmountMinor: 1000n,
          providerAmountMinor: 1000n,
          currency: ' xof ',
          internalStatus: ' settled ',
          providerStatus: ' settled ',
          status: 'MATCHED',
        },
        {
          internalReference: 'internal-2',
          providerReference: 'provider-2',
          internalAmountMinor: 2000n,
          providerAmountMinor: 2500n,
          currency: 'xof',
          internalStatus: 'SETTLED',
          providerStatus: 'SETTLED',
          status: 'MISMATCHED',
          mismatchReason: 'AMOUNT_MISMATCH',
        },
      ],
    });

    createdBatchId = result.batchId;
    createdBatchIds.add(result.batchId);
    assert.equal(result.reused, false);
    assert.equal(result.status, 'COMPLETED_WITH_MISMATCHES');

    const batch = await repository.getBatch(organizationId, result.batchId);
    assert.ok(batch);
    assert.equal(batch.organizationId, organizationId);
    assert.equal(await repository.getBatch(secondOrganizationId, result.batchId), null);

    const itemsPage = await repository.listItems(organizationId, result.batchId, 50);
    assert.equal(itemsPage.data.length, 2);
    assert.equal(itemsPage.data.every((item) => item.organizationId === organizationId), true);
    assert.equal((await repository.listItems(secondOrganizationId, result.batchId, 50)).data.length, 0);
    assert.equal(await repository.getItem(secondOrganizationId, itemsPage.data[0].id), null);
  });

  test('same provider and fingerprint are idempotent per organization, not globally', async () => {
    assert.ok(createdBatchId);
    const reused = await repository.importBatch({
      organizationId,
      providerId,
      sourceFingerprint,
      periodStart: new Date('2026-08-01T00:00:00.000Z'),
      periodEnd: new Date('2026-08-01T23:59:59.000Z'),
      items: [],
    });
    assert.equal(reused.reused, true);
    assert.equal(reused.batchId, createdBatchId);

    const other = await repository.importBatch({
      organizationId: secondOrganizationId,
      providerId,
      sourceFingerprint,
      periodStart: new Date('2026-08-01T00:00:00.000Z'),
      periodEnd: new Date('2026-08-01T23:59:59.000Z'),
      items: [],
    });
    createdBatchIds.add(other.batchId);
    assert.notEqual(other.batchId, createdBatchId);
    assert.equal(other.reused, false);
  });

  test('concurrent imports converge within one organization', async () => {
    const concurrentProviderId = `${providerId}-concurrent`;
    const concurrentFingerprint = `${sourceFingerprint}-concurrent`;
    const input = {
      organizationId,
      providerId: concurrentProviderId,
      sourceFingerprint: concurrentFingerprint,
      periodStart: new Date('2026-08-02T00:00:00.000Z'),
      periodEnd: new Date('2026-08-02T23:59:59.000Z'),
      items: [{ internalReference: 'internal-concurrent', providerReference: 'provider-concurrent', internalAmountMinor: 5000n, providerAmountMinor: 5000n, currency: 'XOF', internalStatus: 'SETTLED', providerStatus: 'SETTLED', status: 'MATCHED' }],
    };
    const results = await Promise.all([repository.importBatch(input), repository.importBatch(input), repository.importBatch(input)]);
    const ids = new Set(results.map((result) => result.batchId));
    assert.equal(ids.size, 1);
    const [batchId] = ids;
    createdBatchIds.add(batchId);
  });

  test('tenant-scoped cursor pagination stays bounded', async () => {
    const first = await repository.listItems(organizationId, createdBatchId, 1);
    assert.equal(first.data.length, 1);
    assert.equal(first.page.hasNextPage, true);
    const second = await repository.listItems(organizationId, createdBatchId, 1, first.page.nextCursor);
    assert.equal(second.data.length, 1);
    assert.notEqual(second.data[0].id, first.data[0].id);
    const batches = await repository.listBatches(organizationId, 1000);
    assert.ok(batches.data.length <= 100);
    assert.equal(batches.data.every((batch) => batch.organizationId === organizationId), true);
  });

  test('cross-tenant resolution is invisible and audited resolution stays scoped', async () => {
    const page = await repository.listItems(organizationId, createdBatchId, 50);
    const mismatch = page.data.find((item) => item.status === 'MISMATCHED');
    assert.ok(mismatch);
    auditedItemIds.add(mismatch.id);

    const command = {
      organizationId,
      itemId: mismatch.id,
      status: 'RESOLVED',
      resolutionNote: 'Écart vérifié avec le relevé fournisseur.',
      reasonCode: 'PROVIDER_CONFIRMED',
      idempotencyKey: `resolve-${mismatch.id}`,
      correlationId: `corr-${mismatch.id}`,
      actorId: 'integration-operator',
      actorType: 'SERVICE_ACCOUNT',
    };

    await assert.rejects(
      () => repository.resolveItem({ ...command, organizationId: secondOrganizationId }),
      /reconciliation item not found/,
    );
    const resolved = await repository.resolveItem(command);
    assert.equal(resolved.status, 'RESOLVED');
    const replay = await repository.resolveItem(command);
    assert.equal(replay.id, resolved.id);

    const batch = await repository.getBatch(organizationId, createdBatchId);
    assert.equal(batch.resolvedItems, 1);
    const audits = await prisma.operationalAuditLog.findMany({
      where: { resourceType: 'ReconciliationItem', resourceId: mismatch.id },
    });
    assert.equal(audits.length, 1);
    assert.equal(audits[0].metadata.organizationId, organizationId);
  });
}

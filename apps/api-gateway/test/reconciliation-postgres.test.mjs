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

  test('reconciliation import persists items, counters and normalized values atomically', async () => {
    const result = await repository.importBatch({
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
    assert.equal(result.totalItems, 2);
    assert.equal(result.matchedItems, 1);
    assert.equal(result.mismatchedItems, 1);

    const batch = await repository.getBatch(result.batchId);
    assert.ok(batch);
    assert.equal(batch.providerId, providerId);
    assert.equal(batch.sourceFingerprint, sourceFingerprint);
    assert.equal(batch.totalItems, 2);
    assert.equal(batch.matchedItems, 1);
    assert.equal(batch.mismatchedItems, 1);
    assert.ok(batch.completedAt instanceof Date);

    const itemsPage = await repository.listItems(result.batchId, 50);
    assert.equal(itemsPage.data.length, 2);
    assert.equal(itemsPage.page.hasNextPage, false);
    assert.equal(itemsPage.page.nextCursor, undefined);
    assert.equal(itemsPage.data[0].currency, 'XOF');
    assert.equal(itemsPage.data[0].internalReference, 'internal-1');
    assert.equal(itemsPage.data[0].providerReference, 'provider-1');
  });

  test('reconciliation import is idempotent for the same provider and source fingerprint', async () => {
    assert.ok(createdBatchId, 'the persistence test must create the initial batch first');

    const reused = await repository.importBatch({
      providerId,
      sourceFingerprint,
      periodStart: new Date('2026-08-01T00:00:00.000Z'),
      periodEnd: new Date('2026-08-01T23:59:59.000Z'),
      items: [],
    });

    assert.equal(reused.reused, true);
    assert.equal(reused.batchId, createdBatchId);
    assert.equal(reused.totalItems, 2);
    assert.equal(reused.matchedItems, 1);
    assert.equal(reused.mismatchedItems, 1);

    const matchingBatches = await prisma.reconciliationBatch.count({
      where: { providerId, sourceFingerprint },
    });
    assert.equal(matchingBatches, 1);
  });

  test('concurrent reconciliation imports converge on one persisted batch', async () => {
    const concurrentProviderId = `${providerId}-concurrent`;
    const concurrentFingerprint = `${sourceFingerprint}-concurrent`;
    const input = {
      providerId: concurrentProviderId,
      sourceFingerprint: concurrentFingerprint,
      periodStart: new Date('2026-08-02T00:00:00.000Z'),
      periodEnd: new Date('2026-08-02T23:59:59.000Z'),
      items: [
        {
          internalReference: 'internal-concurrent',
          providerReference: 'provider-concurrent',
          internalAmountMinor: 5000n,
          providerAmountMinor: 5000n,
          currency: 'XOF',
          internalStatus: 'SETTLED',
          providerStatus: 'SETTLED',
          status: 'MATCHED',
        },
      ],
    };

    const results = await Promise.all([
      repository.importBatch(input),
      repository.importBatch(input),
      repository.importBatch(input),
    ]);

    const ids = new Set(results.map((result) => result.batchId));
    assert.equal(ids.size, 1);
    const [batchId] = ids;
    createdBatchIds.add(batchId);
    assert.equal(results.filter((result) => result.reused === false).length, 1);
    assert.equal(results.filter((result) => result.reused === true).length, 2);

    const matchingBatches = await prisma.reconciliationBatch.count({
      where: { providerId: concurrentProviderId, sourceFingerprint: concurrentFingerprint },
    });
    assert.equal(matchingBatches, 1);

    const persistedItems = await prisma.reconciliationItem.count({ where: { batchId } });
    assert.equal(persistedItems, 1);
  });

  test('reconciliation cursor pagination is stable, bounded and uses the shared page envelope', async () => {
    const first = await repository.listItems(createdBatchId, 1);
    assert.equal(first.data.length, 1);
    assert.equal(first.page.hasNextPage, true);
    assert.ok(first.page.nextCursor);

    const second = await repository.listItems(createdBatchId, 1, first.page.nextCursor);
    assert.equal(second.data.length, 1);
    assert.notEqual(second.data[0].id, first.data[0].id);
    assert.equal(second.page.hasNextPage, false);
    assert.equal(second.page.nextCursor, undefined);

    const batches = await repository.listBatches(1000);
    assert.ok(batches.data.length <= 100);
    assert.equal(typeof batches.page.hasNextPage, 'boolean');
  });

  test('manual mismatch resolution is atomic, audited and idempotent', async () => {
    const page = await repository.listItems(createdBatchId, 50);
    const mismatch = page.data.find((item) => item.status === 'MISMATCHED');
    assert.ok(mismatch);
    auditedItemIds.add(mismatch.id);

    const command = {
      itemId: mismatch.id,
      status: 'RESOLVED',
      resolutionNote: 'Écart vérifié avec le relevé fournisseur.',
      reasonCode: 'PROVIDER_CONFIRMED',
      idempotencyKey: `resolve-${mismatch.id}`,
      correlationId: `corr-${mismatch.id}`,
      actorId: 'integration-operator',
      actorType: 'SERVICE_ACCOUNT',
    };
    const resolved = await repository.resolveItem(command);
    assert.equal(resolved.status, 'RESOLVED');
    assert.equal(resolved.resolutionReasonCode, 'PROVIDER_CONFIRMED');

    const replay = await repository.resolveItem(command);
    assert.equal(replay.id, resolved.id);
    assert.equal(replay.status, 'RESOLVED');

    const batch = await repository.getBatch(createdBatchId);
    assert.equal(batch.resolvedItems, 1);
    const audits = await prisma.operationalAuditLog.findMany({
      where: { resourceType: 'ReconciliationItem', resourceId: mismatch.id },
    });
    assert.equal(audits.length, 1);
    assert.equal(audits[0].action, 'RECONCILIATION_ITEM_RESOLVED');
  });
}

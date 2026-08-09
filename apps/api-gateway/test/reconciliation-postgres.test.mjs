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
  let createdBatchId;

  test.after(async () => {
    if (createdBatchId) {
      await prisma.reconciliationItem.deleteMany({ where: { batchId: createdBatchId } });
      await prisma.reconciliationBatch.deleteMany({ where: { id: createdBatchId } });
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

    const items = await repository.listItems(result.batchId, 50);
    assert.equal(items.length, 2);
    assert.equal(items[0].currency, 'XOF');
    assert.equal(items[0].internalReference, 'internal-1');
    assert.equal(items[0].providerReference, 'provider-1');
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

  test('reconciliation list limits stay bounded against PostgreSQL', async () => {
    const batches = await repository.listBatches(1000);
    assert.ok(batches.length <= 100);

    const items = await repository.listItems(createdBatchId, 1000);
    assert.ok(items.length <= 500);
  });
}

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateAccessQuotaWindow,
  createAccessPersistenceIdentity,
} from '../dist/access-persistence.js';

test('calcule une fenêtre journalière UTC [début, fin)', () => {
  assert.deepEqual(calculateAccessQuotaWindow('2026-08-09T18:43:05+02:00', 'DAY'), {
    period: 'DAY',
    startInclusive: '2026-08-09T00:00:00.000Z',
    endExclusive: '2026-08-10T00:00:00.000Z',
  });
});

test('calcule une semaine UTC du lundi au lundi', () => {
  assert.deepEqual(calculateAccessQuotaWindow('2026-08-09T16:43:05Z', 'WEEK'), {
    period: 'WEEK',
    startInclusive: '2026-08-03T00:00:00.000Z',
    endExclusive: '2026-08-10T00:00:00.000Z',
  });
});

test('calcule une fenêtre mensuelle UTC', () => {
  assert.deepEqual(calculateAccessQuotaWindow('2026-12-31T23:59:59Z', 'MONTH'), {
    period: 'MONTH',
    startInclusive: '2026-12-01T00:00:00.000Z',
    endExclusive: '2027-01-01T00:00:00.000Z',
  });
});

test('produit des clés idempotentes séparées par responsabilité', () => {
  const quotaWindow = calculateAccessQuotaWindow('2026-08-09T16:43:05Z', 'DAY');
  assert.deepEqual(
    createAccessPersistenceIdentity({
      organizationId: 'org-1',
      requestId: 'req-1',
      entitlementId: 'ent-1',
      quotaWindow,
    }),
    {
      decisionKey: 'access-decision:org-1:req-1',
      usageKey: 'access-usage:org-1:req-1',
      quotaReservationKey:
        'access-quota:org-1:ent-1:2026-08-09T00:00:00.000Z:req-1',
    },
  );
});

test('rejette un timestamp invalide et les segments ambigus', () => {
  assert.throws(() => calculateAccessQuotaWindow('not-a-date', 'DAY'));
  const quotaWindow = calculateAccessQuotaWindow('2026-08-09T16:43:05Z', 'DAY');
  assert.throws(() =>
    createAccessPersistenceIdentity({
      organizationId: 'org:1',
      requestId: 'req-1',
      entitlementId: 'ent-1',
      quotaWindow,
    }),
  );
});

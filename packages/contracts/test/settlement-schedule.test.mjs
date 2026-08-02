import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSettlementSchedule,
  isSettlementFrequency,
  isSettlementScheduleStatus,
  updateSettlementSchedule,
} from '../dist/settlement-schedule.js';

const base = {
  scheduleId: 'schedule-1',
  merchantId: 'merchant-1',
  frequency: 'DAILY',
  timezone: 'Africa/Bamako',
  cutoffHourUtc: 18,
  minimumAmountMinor: 10000,
  currency: 'xof',
  createdAt: '2026-08-02T15:00:00.000Z',
};

test('crée une planification quotidienne active', () => {
  const schedule = createSettlementSchedule(base);
  assert.equal(schedule.status, 'ACTIVE');
  assert.equal(schedule.currency, 'XOF');
  assert.equal(schedule.minimumAmountMinor, 10000);
});

test('valide les fréquences et statuts', () => {
  assert.equal(isSettlementFrequency('WEEKLY'), true);
  assert.equal(isSettlementFrequency('HOURLY'), false);
  assert.equal(isSettlementScheduleStatus('PAUSED'), true);
});

test('impose le jour attendu pour les cycles hebdomadaires et mensuels', () => {
  assert.throws(() => createSettlementSchedule({ ...base, frequency: 'WEEKLY' }));
  assert.throws(() => createSettlementSchedule({ ...base, frequency: 'MONTHLY', dayOfMonth: 29 }));

  const weekly = createSettlementSchedule({ ...base, frequency: 'WEEKLY', dayOfWeek: 5 });
  assert.equal(weekly.dayOfWeek, 5);
});

test('met à jour et suspend une planification', () => {
  const current = createSettlementSchedule(base);
  const updated = updateSettlementSchedule(current, {
    status: 'PAUSED',
    minimumAmountMinor: 25000,
    updatedAt: '2026-08-02T16:00:00.000Z',
  });
  assert.equal(updated.status, 'PAUSED');
  assert.equal(updated.minimumAmountMinor, 25000);
});

test('refuse les paramètres incohérents', () => {
  assert.throws(() => createSettlementSchedule({ ...base, cutoffHourUtc: 24 }));
  assert.throws(() => createSettlementSchedule({ ...base, minimumAmountMinor: -1 }));
  assert.throws(() => createSettlementSchedule({ ...base, frequency: 'DAILY', dayOfWeek: 2 }));
});

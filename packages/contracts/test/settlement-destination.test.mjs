import assert from 'node:assert/strict';
import test from 'node:test';

import {
  changeSettlementDestinationStatus,
  createSettlementDestination,
  isSettlementDestinationStatus,
  isSettlementDestinationType,
  verifySettlementDestination,
} from '../dist/settlement-destination.js';

const base = {
  destinationId: 'destination-1',
  merchantId: 'merchant-1',
  type: 'MOBILE_MONEY',
  currency: 'xof',
  countryCode: 'ml',
  details: {
    mobileMoneyToken: 'vault-token-1',
    providerCode: 'orange_ml',
    accountHolderName: 'Commerce Démo',
    maskedReference: '+223 ** ** 12 34',
  },
  createdAt: '2026-08-02T16:30:00.000Z',
};

test('crée une destination en attente de vérification', () => {
  const destination = createSettlementDestination(base);
  assert.equal(destination.status, 'PENDING_VERIFICATION');
  assert.equal(destination.currency, 'XOF');
  assert.equal(destination.countryCode, 'ML');
  assert.equal(destination.isDefault, false);
});

test('valide les types et statuts', () => {
  assert.equal(isSettlementDestinationType('BANK_ACCOUNT'), true);
  assert.equal(isSettlementDestinationType('CASH'), false);
  assert.equal(isSettlementDestinationStatus('SUSPENDED'), true);
});

test('active uniquement après vérification', () => {
  const destination = createSettlementDestination(base);
  assert.throws(() => changeSettlementDestinationStatus(destination, {
    status: 'ACTIVE',
    updatedAt: '2026-08-02T16:40:00.000Z',
  }));

  const verified = verifySettlementDestination(destination, {
    verifiedAt: '2026-08-02T16:45:00.000Z',
  });
  assert.equal(verified.status, 'ACTIVE');
  assert.equal(verified.verifiedAt, '2026-08-02T16:45:00.000Z');
});

test('suspend une destination active', () => {
  const active = verifySettlementDestination(createSettlementDestination(base), {
    verifiedAt: '2026-08-02T16:45:00.000Z',
  });
  const suspended = changeSettlementDestinationStatus(active, {
    status: 'SUSPENDED',
    updatedAt: '2026-08-02T17:00:00.000Z',
  });
  assert.equal(suspended.status, 'SUSPENDED');
});

test('refuse une référence incompatible ou ambiguë', () => {
  assert.throws(() => createSettlementDestination({
    ...base,
    details: { ...base.details, bankAccountToken: 'bank-token' },
  }));
  assert.throws(() => createSettlementDestination({
    ...base,
    type: 'BANK_ACCOUNT',
  }));
  assert.throws(() => createSettlementDestination({ ...base, countryCode: 'MALI' }));
});

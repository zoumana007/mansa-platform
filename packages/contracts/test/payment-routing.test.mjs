import assert from 'node:assert/strict';
import test from 'node:test';

import { selectPaymentRoute } from '../dist/payment-routing.js';

const routes = [
  {
    routeId: 'route-bank',
    providerId: 'bank-a',
    operationType: 'CARD_PAYMENT',
    countryCode: 'ML',
    currency: 'XOF',
    status: 'ACTIVE',
    priority: 2,
    estimatedCostMinor: 100n,
    availabilityBasisPoints: 9_990,
    minimumAmountMinor: 100n,
    maximumAmountMinor: 1_000_000n,
  },
  {
    routeId: 'route-processor',
    providerId: 'processor-b',
    operationType: 'CARD_PAYMENT',
    countryCode: 'ML',
    currency: 'XOF',
    status: 'ACTIVE',
    priority: 1,
    estimatedCostMinor: 150n,
    availabilityBasisPoints: 9_950,
  },
];

const command = {
  operationType: 'CARD_PAYMENT',
  countryCode: 'ML',
  currency: 'XOF',
  amountMinor: 10_000n,
  strategy: 'PRIORITY',
};

test('sélectionne la route active ayant la priorité la plus forte', () => {
  const selection = selectPaymentRoute(routes, command);
  assert.equal(selection.selectedRoute.routeId, 'route-processor');
  assert.deepEqual(selection.eligibleRouteIds, ['route-processor', 'route-bank']);
});

test('sélectionne le coût le plus faible puis utilise la priorité comme départage', () => {
  const selection = selectPaymentRoute(routes, { ...command, strategy: 'LOWEST_COST' });
  assert.equal(selection.selectedRoute.routeId, 'route-bank');
});

test('sélectionne la disponibilité la plus élevée', () => {
  const selection = selectPaymentRoute(routes, { ...command, strategy: 'HIGHEST_AVAILABILITY' });
  assert.equal(selection.selectedRoute.routeId, 'route-bank');
});

test('exclut les routes inactives, incompatibles ou hors limites', () => {
  const selection = selectPaymentRoute(
    [
      ...routes,
      { ...routes[0], routeId: 'disabled', status: 'DISABLED', priority: 0 },
      { ...routes[0], routeId: 'other-currency', currency: 'EUR', priority: 0 },
      { ...routes[0], routeId: 'too-small', minimumAmountMinor: 20_000n, priority: 0 },
    ],
    command,
  );
  assert.deepEqual(selection.eligibleRouteIds, ['route-processor', 'route-bank']);
});

test('refuse un montant négatif ou une absence de route éligible', () => {
  assert.throws(() => selectPaymentRoute(routes, { ...command, amountMinor: -1n }));
  assert.throws(() => selectPaymentRoute(routes, { ...command, countryCode: 'SN' }));
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyHealth,
  isAllowedMetricLabel,
  isValidMetricDefinition,
  isValidStructuredLogEvent,
  redactLogAttributes,
  sanitizeStructuredLogEvent,
} from '../dist/index.js';

test('redactLogAttributes masque les secrets imbriqués et les tableaux', () => {
  const input = {
    operation: 'payment.authorized',
    authorization: 'Bearer secret',
    nested: {
      accessToken: 'token-value',
      safe: 'visible',
      cards: [{ cardNumber: '4111111111111111', last4: '1111' }],
    },
  };

  assert.deepEqual(redactLogAttributes(input), {
    operation: 'payment.authorized',
    authorization: '[REDACTED]',
    nested: {
      accessToken: '[REDACTED]',
      safe: 'visible',
      cards: [{ cardNumber: '[REDACTED]', last4: '1111' }],
    },
  });
});

test('redactLogAttributes neutralise les références circulaires', () => {
  const input = { safe: 'value' };
  input.self = input;

  assert.deepEqual(redactLogAttributes(input), {
    safe: 'value',
    self: '[CIRCULAR]',
  });
});

test('sanitizeStructuredLogEvent conserve le contrat et masque les attributs', () => {
  const event = {
    timestamp: '2026-08-07T10:00:00.000Z',
    level: 'INFO',
    service: 'payments-api',
    event: 'payment.created',
    message: 'Payment created',
    correlation: { correlationId: 'corr-123' },
    attributes: { otp: '123456', transactionId: 'txn-1' },
  };

  const sanitized = sanitizeStructuredLogEvent(event);
  assert.equal(sanitized.attributes.otp, '[REDACTED]');
  assert.equal(sanitized.attributes.transactionId, 'txn-1');
  assert.equal(event.attributes.otp, '123456');
});

test('isValidStructuredLogEvent impose timestamp, service et corrélation', () => {
  assert.equal(
    isValidStructuredLogEvent({
      timestamp: '2026-08-07T10:00:00.000Z',
      level: 'INFO',
      service: 'wallet-api',
      event: 'wallet.read',
      message: 'Wallet read',
      correlation: { correlationId: 'corr-1' },
    }),
    true,
  );

  assert.equal(
    isValidStructuredLogEvent({
      timestamp: 'invalid',
      level: 'INFO',
      service: 'wallet-api',
      event: 'wallet.read',
      message: 'Wallet read',
      correlation: { correlationId: '' },
    }),
    false,
  );
});

test('les labels de métriques interdisent les identifiants à cardinalité non bornée', () => {
  assert.equal(isAllowedMetricLabel('countryCode'), true);
  assert.equal(isAllowedMetricLabel('payment_method'), true);
  assert.equal(isAllowedMetricLabel('userId'), false);
  assert.equal(isAllowedMetricLabel('transaction_id'), false);
  assert.equal(isAllowedMetricLabel('correlation-id'), false);
  assert.equal(isAllowedMetricLabel('phoneNumber'), false);
});

test('isValidMetricDefinition valide nom unité unicité et labels', () => {
  assert.equal(
    isValidMetricDefinition({
      name: 'payments_authorized_total',
      description: 'Nombre de paiements autorisés',
      unit: 'COUNT',
      allowedLabels: ['countryCode', 'paymentMethod'],
    }),
    true,
  );

  assert.equal(
    isValidMetricDefinition({
      name: 'payments_authorized_total',
      description: 'Nombre de paiements autorisés',
      unit: 'COUNT',
      allowedLabels: ['countryCode', 'country_code'],
    }),
    false,
  );

  assert.equal(
    isValidMetricDefinition({
      name: 'payments_authorized_total',
      description: 'Nombre de paiements autorisés',
      unit: 'COUNT',
      allowedLabels: ['userId'],
    }),
    false,
  );
});

test('classifyHealth classe les dépendances de manière déterministe', () => {
  assert.equal(classifyHealth(0, 0), 'HEALTHY');
  assert.equal(classifyHealth(3, 3), 'HEALTHY');
  assert.equal(classifyHealth(2, 3), 'DEGRADED');
  assert.equal(classifyHealth(0, 3), 'UNHEALTHY');
});

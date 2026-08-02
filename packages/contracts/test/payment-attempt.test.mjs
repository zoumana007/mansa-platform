import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canTransitionPaymentAttempt,
  createPaymentAttempt,
  isFinalPaymentAttemptStatus,
  isRetryablePaymentFailure,
  transitionPaymentAttempt,
} from '../dist/payment-attempt.js';

const baseCommand = {
  attemptId: 'attempt-1',
  paymentId: 'payment-1',
  routeId: 'route-1',
  providerId: 'provider-1',
  idempotencyKey: 'idem-1',
  sequence: 1,
  createdAt: '2026-08-02T10:00:00.000Z',
};

test('crée une tentative dans l’état CREATED', () => {
  const attempt = createPaymentAttempt(baseCommand);
  assert.equal(attempt.status, 'CREATED');
  assert.equal(attempt.updatedAt, baseCommand.createdAt);
});

test('valide les transitions normales et protège les états finaux', () => {
  const created = createPaymentAttempt(baseCommand);
  const processing = transitionPaymentAttempt(created, {
    status: 'PROCESSING',
    updatedAt: '2026-08-02T10:00:01.000Z',
  });
  const succeeded = transitionPaymentAttempt(processing, {
    status: 'SUCCEEDED',
    updatedAt: '2026-08-02T10:00:02.000Z',
    providerReference: 'provider-ref-1',
  });

  assert.equal(succeeded.providerReference, 'provider-ref-1');
  assert.equal(isFinalPaymentAttemptStatus(succeeded.status), true);
  assert.equal(canTransitionPaymentAttempt('SUCCEEDED', 'FAILED'), false);
  assert.throws(() => transitionPaymentAttempt(succeeded, {
    status: 'FAILED',
    updatedAt: '2026-08-02T10:00:03.000Z',
    failureCategory: 'TECHNICAL',
  }));
});

test('exige une catégorie pour un échec', () => {
  const processing = transitionPaymentAttempt(createPaymentAttempt(baseCommand), {
    status: 'PROCESSING',
    updatedAt: '2026-08-02T10:00:01.000Z',
  });

  assert.throws(() => transitionPaymentAttempt(processing, {
    status: 'FAILED',
    updatedAt: '2026-08-02T10:00:02.000Z',
  }));

  const failed = transitionPaymentAttempt(processing, {
    status: 'FAILED',
    updatedAt: '2026-08-02T10:00:02.000Z',
    failureCategory: 'TEMPORARY',
    failureCode: 'PROVIDER_TIMEOUT',
  });
  assert.equal(failed.failureCategory, 'TEMPORARY');
  assert.equal(isRetryablePaymentFailure(failed.failureCategory), true);
});

test('interdit les détails d’échec sur un succès', () => {
  const processing = transitionPaymentAttempt(createPaymentAttempt(baseCommand), {
    status: 'PROCESSING',
    updatedAt: '2026-08-02T10:00:01.000Z',
  });
  assert.throws(() => transitionPaymentAttempt(processing, {
    status: 'SUCCEEDED',
    updatedAt: '2026-08-02T10:00:02.000Z',
    failureCode: 'INVALID',
  }));
});

test('refuse une séquence invalide', () => {
  assert.throws(() => createPaymentAttempt({ ...baseCommand, sequence: 0 }));
  assert.throws(() => createPaymentAttempt({ ...baseCommand, sequence: 1.5 }));
});

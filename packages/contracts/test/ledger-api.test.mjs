import assert from 'node:assert/strict';
import test from 'node:test';

import { LEDGER_API_METHODS, LEDGER_API_ROUTES } from '../dist/ledger-api.js';

test('ledger API publishes the operational outbox routes', () => {
  assert.equal(
    LEDGER_API_ROUTES.listOutboxDeadLetters,
    '/v1/internal/ledger/outbox/dead-letters',
  );
  assert.equal(
    LEDGER_API_ROUTES.requeueOutboxDeadLetter,
    '/v1/internal/ledger/outbox/dead-letters/:eventId/requeue',
  );
  assert.equal(LEDGER_API_METHODS.listOutboxDeadLetters, 'GET');
  assert.equal(LEDGER_API_METHODS.requeueOutboxDeadLetter, 'POST');
});

test('ledger API keeps the six financial routes stable', () => {
  assert.equal(LEDGER_API_ROUTES.postTransaction, '/v1/internal/ledger/transactions');
  assert.equal(
    LEDGER_API_ROUTES.getTransaction,
    '/v1/internal/ledger/transactions/:transactionId',
  );
  assert.equal(
    LEDGER_API_ROUTES.reverseTransaction,
    '/v1/internal/ledger/transactions/:transactionId/reverse',
  );
  assert.equal(LEDGER_API_ROUTES.getAccount, '/v1/internal/ledger/accounts/:accountId');
  assert.equal(
    LEDGER_API_ROUTES.getBalance,
    '/v1/internal/ledger/accounts/:accountId/balance',
  );
  assert.equal(
    LEDGER_API_ROUTES.listEntries,
    '/v1/internal/ledger/accounts/:accountId/entries',
  );
});

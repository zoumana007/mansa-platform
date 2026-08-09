import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RECONCILIATION_API_METHODS,
  RECONCILIATION_API_ROUTES,
} from '../dist/reconciliation-api.js';

test('reconciliation API contract stays inside the protected internal namespace', () => {
  assert.deepEqual(RECONCILIATION_API_ROUTES, {
    batches: '/v1/internal/reconciliation/batches',
    batchById: '/v1/internal/reconciliation/batches/:batchId',
    itemsByBatch: '/v1/internal/reconciliation/batches/:batchId/items',
    itemById: '/v1/internal/reconciliation/items/:itemId',
    resolveItem: '/v1/internal/reconciliation/items/:itemId/resolve',
  });
});

test('reconciliation API methods match the controller surface', () => {
  assert.deepEqual(RECONCILIATION_API_METHODS, {
    listBatches: 'GET',
    getBatch: 'GET',
    listItems: 'GET',
    getItem: 'GET',
    resolveItem: 'POST',
  });
});

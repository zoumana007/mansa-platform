import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACCESS_MOBILITY_API_METHODS,
  ACCESS_MOBILITY_API_ROUTES,
} from '../dist/access-mobility-api.js';

test('access mobility contract stays inside the protected internal namespace', () => {
  for (const route of Object.values(ACCESS_MOBILITY_API_ROUTES)) {
    assert.match(route, /^\/v1\/internal\/access(?:\/|$)/);
  }
});

test('access mobility routes match the internal controller surface', () => {
  assert.equal(ACCESS_MOBILITY_API_ROUTES.createCredential, '/v1/internal/access/credentials');
  assert.equal(ACCESS_MOBILITY_API_ROUTES.getCredential, '/v1/internal/access/credentials/:credentialId');
  assert.equal(ACCESS_MOBILITY_API_ROUTES.listCredentials, '/v1/internal/access/credentials');
  assert.equal(ACCESS_MOBILITY_API_ROUTES.createEntitlement, '/v1/internal/access/entitlements');
  assert.equal(ACCESS_MOBILITY_API_ROUTES.getEntitlement, '/v1/internal/access/entitlements/:entitlementId');
  assert.equal(ACCESS_MOBILITY_API_ROUTES.listEntitlements, '/v1/internal/access/entitlements');
  assert.equal(ACCESS_MOBILITY_API_ROUTES.evaluateAccess, '/v1/internal/access/evaluate');
});

test('access mobility methods keep reads and mutations explicit', () => {
  assert.equal(ACCESS_MOBILITY_API_METHODS.getCredential, 'GET');
  assert.equal(ACCESS_MOBILITY_API_METHODS.listCredentials, 'GET');
  assert.equal(ACCESS_MOBILITY_API_METHODS.getEntitlement, 'GET');
  assert.equal(ACCESS_MOBILITY_API_METHODS.listEntitlements, 'GET');
  assert.equal(ACCESS_MOBILITY_API_METHODS.createCredential, 'POST');
  assert.equal(ACCESS_MOBILITY_API_METHODS.createEntitlement, 'POST');
  assert.equal(ACCESS_MOBILITY_API_METHODS.evaluateAccess, 'POST');
  assert.equal(ACCESS_MOBILITY_API_METHODS.recordUsage, 'POST');
  assert.equal(ACCESS_MOBILITY_API_METHODS.updateServiceAvailability, 'PUT');
});

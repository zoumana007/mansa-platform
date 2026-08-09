import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateAccessDecision } from '../dist/access-decision-engine.js';

const request = Object.freeze({
  requestId: 'req-1',
  organizationId: 'org-1',
  useCase: 'TOLL',
  credentialType: 'RFID_UHF_TAG',
  credentialReference: 'tag-public-1',
  locationId: 'toll-1',
  paymentMethod: 'SUBSCRIPTION',
  occurredAt: '2026-08-09T12:00:00.000Z',
  correlationId: 'corr-1',
});

const credential = Object.freeze({
  id: 'cred-1',
  organizationId: 'org-1',
  subjectType: 'VEHICLE',
  subjectId: 'vehicle-1',
  credentialType: 'RFID_UHF_TAG',
  publicReference: 'tag-public-1',
  status: 'ACTIVE',
  metadata: { licensePlate: 'AA-123-AA' },
});

const entitlement = Object.freeze({
  id: 'ent-1',
  organizationId: 'org-1',
  subjectId: 'vehicle-1',
  useCase: 'TOLL',
  status: 'ACTIVE',
  validFrom: '2026-08-01T00:00:00.000Z',
  validUntil: '2026-08-31T23:59:59.000Z',
  allowedLocationIds: ['toll-1'],
  maxUsesPerPeriod: 100,
  period: 'MONTH',
});

const service = Object.freeze({
  organizationId: 'org-1',
  locationId: 'toll-1',
  status: 'ACTIVE',
  matchPolicy: 'CREDENTIAL_AND_PLATE_REQUIRED',
  availablePaymentMethods: ['SUBSCRIPTION', 'BANK_CARD'],
  equipment: [],
  effectiveFrom: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-09T00:00:00.000Z',
  updatedBy: 'admin-1',
});

test('allows a valid toll entitlement with matching plate', () => {
  const result = evaluateAccessDecision({
    request: { ...request, observedLicensePlate: 'AA-123-AA' },
    credential,
    entitlement,
    service,
  });
  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.reason, 'ENTITLEMENT_VALID');
  assert.equal(result.credentialId, 'cred-1');
  assert.equal(result.entitlementId, 'ent-1');
});

test('denies unknown or inactive credentials', () => {
  assert.equal(evaluateAccessDecision({ request }).reason, 'CREDENTIAL_UNKNOWN');
  const inactive = evaluateAccessDecision({
    request,
    credential: { ...credential, status: 'REVOKED' },
  });
  assert.equal(inactive.decision, 'DENY');
  assert.equal(inactive.reason, 'CREDENTIAL_INACTIVE');
});

test('denies missing, inactive and expired entitlements', () => {
  assert.equal(evaluateAccessDecision({ request, credential }).reason, 'ENTITLEMENT_MISSING');
  assert.equal(
    evaluateAccessDecision({
      request,
      credential,
      entitlement: { ...entitlement, status: 'SUSPENDED' },
    }).reason,
    'ENTITLEMENT_INACTIVE',
  );
  assert.equal(
    evaluateAccessDecision({
      request: { ...request, occurredAt: '2026-09-01T00:00:00.000Z' },
      credential,
      entitlement,
    }).reason,
    'OUTSIDE_VALIDITY_WINDOW',
  );
});

test('enforces location, product, usage and amount limits', () => {
  assert.equal(
    evaluateAccessDecision({
      request: { ...request, locationId: 'toll-2' },
      credential,
      entitlement,
    }).reason,
    'LOCATION_NOT_ALLOWED',
  );
  assert.equal(
    evaluateAccessDecision({
      request: { ...request, productCode: 'DIESEL' },
      credential,
      entitlement: { ...entitlement, allowedProductCodes: ['PETROL'] },
    }).reason,
    'PRODUCT_NOT_ALLOWED',
  );
  assert.equal(
    evaluateAccessDecision({ request, credential, entitlement, usageCountInPeriod: 100 }).reason,
    'USAGE_LIMIT_REACHED',
  );
  assert.equal(
    evaluateAccessDecision({
      request: { ...request, requestedAmount: { amountMinor: 2000n, currency: 'XOF' } },
      credential,
      entitlement: { ...entitlement, amountLimit: { amountMinor: 1000n, currency: 'XOF' } },
    }).reason,
    'AMOUNT_LIMIT_EXCEEDED',
  );
});

test('enforces service availability and payment availability before authorization', () => {
  assert.equal(
    evaluateAccessDecision({
      request,
      credential,
      entitlement,
      service: { ...service, status: 'CLOSED' },
    }).reason,
    'SERVICE_CLOSED',
  );
  const unavailable = evaluateAccessDecision({
    request: { ...request, paymentMethod: 'MOBILE_MONEY' },
    credential,
    entitlement,
    service,
  });
  assert.equal(unavailable.reason, 'PAYMENT_METHOD_UNAVAILABLE');
  assert.deepEqual(unavailable.fallbackPaymentMethods, ['SUBSCRIPTION', 'BANK_CARD']);
});

test('requires plate when policy requires it and denies a mismatch', () => {
  assert.equal(
    evaluateAccessDecision({ request, credential, entitlement, service }).reason,
    'PLATE_UNREADABLE',
  );
  assert.equal(
    evaluateAccessDecision({
      request: { ...request, observedLicensePlate: 'ZZ-999-ZZ' },
      credential,
      entitlement,
      service,
    }).reason,
    'PLATE_MISMATCH',
  );
});

test('manual review policy never silently allows access', () => {
  const result = evaluateAccessDecision({
    request: { ...request, matchPolicy: 'MANUAL_REVIEW' },
    credential,
    entitlement,
    service: { ...service, matchPolicy: 'CREDENTIAL_ONLY' },
  });
  assert.equal(result.decision, 'REVIEW');
  assert.equal(result.reason, 'MANUAL_REVIEW_REQUIRED');
});

test('rejects service availability from another organization or location', () => {
  assert.throws(
    () =>
      evaluateAccessDecision({
        request,
        credential,
        entitlement,
        service: { ...service, organizationId: 'org-2' },
      }),
    /request scope/,
  );
});

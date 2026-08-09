import assert from 'node:assert/strict';
import test from 'node:test';

import { processAccessRequest } from '../dist/access-application-service.js';

const request = Object.freeze({
  requestId: 'req-42',
  organizationId: 'org-1',
  useCase: 'TOLL',
  credentialType: 'RFID_UHF_TAG',
  credentialReference: 'tag-1',
  observedLicensePlate: 'AA-123-AA',
  locationId: 'toll-1',
  terminalId: 'lane-1',
  paymentMethod: 'SUBSCRIPTION',
  occurredAt: '2026-08-09T15:00:00.000Z',
  correlationId: 'corr-42',
});

const credential = Object.freeze({
  id: 'cred-1',
  organizationId: 'org-1',
  subjectType: 'VEHICLE',
  subjectId: 'vehicle-1',
  credentialType: 'RFID_UHF_TAG',
  publicReference: 'tag-1',
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
  maxUsesPerPeriod: 2,
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

const terminal = Object.freeze({
  terminalId: 'lane-1',
  organizationId: 'org-1',
  locationId: 'toll-1',
  heightProfile: 'DUAL_HEIGHT',
  paymentMethods: ['SUBSCRIPTION', 'BANK_CARD'],
  supportedCurrencies: ['XOF'],
  canGiveChange: false,
  receiptPrinter: true,
  intercom: true,
});

function fixtures({ reserve = true, usage = 0, terminalProfile = terminal } = {}) {
  const decisions = [];
  const usages = [];
  const reservations = [];
  return {
    decisions,
    usages,
    reservations,
    dependencies: {
      now: () => '2026-08-09T15:00:00.500Z',
      repository: {
        async resolveCredential() { return credential; },
        async resolveEntitlement() { return entitlement; },
        async loadServiceAvailability() { return service; },
        async loadTerminalProfile() { return terminalProfile; },
        async countUsageInCurrentPeriod() { return usage; },
      },
      quota: {
        async reserve(command) {
          reservations.push(command);
          return reserve;
        },
      },
      journal: {
        async recordDecision(accessRequest, decision) { decisions.push({ accessRequest, decision }); },
        async recordUsage(accessRequest, command) { usages.push({ accessRequest, command }); },
      },
    },
  };
}

test('orchestrates a valid access and records decision plus usage', async () => {
  const state = fixtures();
  const result = await processAccessRequest(request, state.dependencies);
  assert.equal(result.decision.decision, 'ALLOW');
  assert.equal(result.decision.reason, 'ENTITLEMENT_VALID');
  assert.equal(result.terminalProfile.terminalId, 'lane-1');
  assert.equal(state.reservations.length, 1);
  assert.equal(state.decisions.length, 1);
  assert.equal(state.usages.length, 1);
  assert.equal(state.decisions[0].accessRequest.organizationId, 'org-1');
  assert.equal(state.usages[0].accessRequest.organizationId, 'org-1');
  assert.equal(state.usages[0].command.requestId, 'req-42');
  assert.equal(state.usages[0].command.correlationId, 'corr-42');
});

test('turns a concurrent quota reservation failure into a deterministic denial', async () => {
  const state = fixtures({ reserve: false, usage: 1 });
  const result = await processAccessRequest(request, state.dependencies);
  assert.equal(result.decision.decision, 'DENY');
  assert.equal(result.decision.reason, 'USAGE_LIMIT_REACHED');
  assert.equal(state.decisions.length, 1);
  assert.equal(state.usages.length, 0);
});

test('does not reserve quota when the pure decision already denies access', async () => {
  const state = fixtures();
  state.dependencies.repository.loadServiceAvailability = async () => ({ ...service, status: 'CLOSED' });
  const result = await processAccessRequest(request, state.dependencies);
  assert.equal(result.decision.reason, 'SERVICE_CLOSED');
  assert.equal(state.reservations.length, 0);
  assert.equal(state.usages.length, 0);
  assert.equal(state.decisions.length, 1);
});

test('rejects a terminal profile from another tenant before journaling', async () => {
  const state = fixtures({ terminalProfile: { ...terminal, organizationId: 'org-2' } });
  await assert.rejects(
    () => processAccessRequest(request, state.dependencies),
    /terminal profile does not belong to the request scope/,
  );
  assert.equal(state.decisions.length, 0);
  assert.equal(state.usages.length, 0);
});

test('rejects a terminal profile that does not match request terminalId', async () => {
  const state = fixtures({ terminalProfile: { ...terminal, terminalId: 'lane-2' } });
  await assert.rejects(
    () => processAccessRequest(request, state.dependencies),
    /does not match request terminalId/,
  );
});

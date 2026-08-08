import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isAccessCredentialStatus,
  isAccessCredentialType,
  isAccessDecision,
  isAccessDecisionReason,
  isAccessEntitlementStatus,
  isAccessUseCase,
} from '../dist/access-mobility.js';

test('recognizes supported access credential technologies', () => {
  assert.equal(isAccessCredentialType('NFC_CARD'), true);
  assert.equal(isAccessCredentialType('RFID_UHF_TAG'), true);
  assert.equal(isAccessCredentialType('MAGSTRIPE'), false);
});

test('recognizes reusable access and mobility use cases', () => {
  assert.equal(isAccessUseCase('TOLL'), true);
  assert.equal(isAccessUseCase('FUEL_FLEET'), true);
  assert.equal(isAccessUseCase('PUBLIC_TRANSPORT'), true);
  assert.equal(isAccessUseCase('UNSUPPORTED'), false);
});

test('recognizes credential, entitlement and decision states', () => {
  assert.equal(isAccessCredentialStatus('ACTIVE'), true);
  assert.equal(isAccessEntitlementStatus('SUSPENDED'), true);
  assert.equal(isAccessDecision('ALLOW'), true);
  assert.equal(isAccessDecisionReason('USAGE_LIMIT_REACHED'), true);
  assert.equal(isAccessDecisionReason('UNKNOWN'), false);
});

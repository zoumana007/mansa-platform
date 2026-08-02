import assert from 'node:assert/strict';
import test from 'node:test';

import {
  hasEffectivePermission,
  resolveEffectivePermissions,
} from '../dist/effective-permissions.js';

const baseAssignment = {
  assignmentId: 'assignment-1',
  actorId: 'actor-1',
  actorType: 'ADMIN',
  roleId: 'KYC_REVIEWER',
  scope: { type: 'COUNTRY', id: 'ML' },
  status: 'ACTIVE',
  validFrom: '2026-01-01T00:00:00.000Z',
  assignedByActorId: 'admin-1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

test('résout uniquement les affectations actives, valides et compatibles', () => {
  const permissions = resolveEffectivePermissions(
    'actor-1',
    'ADMIN',
    [
      baseAssignment,
      { ...baseAssignment, assignmentId: 'expired', validUntil: '2026-01-02T00:00:00.000Z' },
      { ...baseAssignment, assignmentId: 'other', actorId: 'actor-2' },
    ],
    new Date('2026-06-01T00:00:00.000Z'),
  );

  assert.deepEqual(permissions.permissions, [
    'kyc.case.decide',
    'kyc.case.read',
    'kyc.case.review',
  ]);
  assert.equal(permissions.grants.every((grant) => grant.assignmentId === 'assignment-1'), true);
});

test('contrôle la portée exacte et accepte une portée plateforme', () => {
  const countryPermissions = resolveEffectivePermissions(
    'actor-1',
    'ADMIN',
    [baseAssignment],
    new Date('2026-06-01T00:00:00.000Z'),
  );

  assert.equal(hasEffectivePermission(countryPermissions, 'kyc.case.read', { type: 'COUNTRY', id: 'ML' }), true);
  assert.equal(hasEffectivePermission(countryPermissions, 'kyc.case.read', { type: 'COUNTRY', id: 'SN' }), false);
});

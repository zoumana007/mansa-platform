import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findDutyConflicts,
  hasDutyConflict,
} from '../dist/separation-of-duties.js';

const baseAssignment = {
  actorId: 'actor-1',
  actorType: 'ADMIN',
  scope: { type: 'COUNTRY', id: 'ML' },
  status: 'ACTIVE',
  validFrom: '2026-01-01T00:00:00.000Z',
  assignedByActorId: 'security-admin-1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function assignment(assignmentId, roleId, overrides = {}) {
  return { ...baseAssignment, assignmentId, roleId, ...overrides };
}

test('détecte la proposition et l’approbation financières dans une même portée', () => {
  const assignments = [
    assignment('operator', 'FINANCE_OPERATOR'),
    assignment('approver', 'FINANCE_APPROVER'),
  ];

  const conflicts = findDutyConflicts(assignments, new Date('2026-06-01T00:00:00.000Z'));

  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].code, 'FINANCIAL_PROPOSAL_APPROVAL');
  assert.deepEqual(conflicts[0].assignmentIds, ['approver', 'operator']);
  assert.equal(hasDutyConflict(assignments, new Date('2026-06-01T00:00:00.000Z')), true);
});

test('ne mélange pas les portées et ignore les affectations inactives', () => {
  const assignments = [
    assignment('operator', 'FINANCE_OPERATOR'),
    assignment('other-country', 'FINANCE_APPROVER', { scope: { type: 'COUNTRY', id: 'SN' } }),
    assignment('suspended', 'FINANCE_APPROVER', { status: 'SUSPENDED' }),
    assignment('expired', 'FINANCE_APPROVER', { validUntil: '2026-02-01T00:00:00.000Z' }),
  ];

  assert.deepEqual(
    findDutyConflicts(assignments, new Date('2026-06-01T00:00:00.000Z')),
    [],
  );
});

test('détecte les conflits entre audit et administration des habilitations', () => {
  const assignments = [
    assignment('auditor', 'AUDITOR'),
    assignment('security', 'SECURITY_ADMIN'),
  ];

  const conflicts = findDutyConflicts(assignments, new Date('2026-06-01T00:00:00.000Z'));

  assert.equal(conflicts[0].code, 'ROLE_ASSIGNMENT_AUDIT');
});

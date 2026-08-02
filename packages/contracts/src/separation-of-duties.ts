import type { ReferenceRole } from './permission-catalog.js';
import type { RoleAssignment, RoleScope } from './role-assignment.js';

export const DUTY_CONFLICT_CODES = [
  'FINANCIAL_PROPOSAL_APPROVAL',
  'ROLE_ASSIGNMENT_AUDIT',
  'PUBLIC_COLLECTION_CANCELLATION',
] as const;

export type DutyConflictCode = (typeof DUTY_CONFLICT_CODES)[number];

export interface DutyConflictRule {
  readonly code: DutyConflictCode;
  readonly description: string;
  readonly incompatibleRoleSets: readonly (readonly ReferenceRole[])[];
}

export interface DutyConflict {
  readonly code: DutyConflictCode;
  readonly actorId: string;
  readonly scope: RoleScope;
  readonly roleIds: readonly ReferenceRole[];
  readonly assignmentIds: readonly string[];
  readonly description: string;
}

export const DUTY_CONFLICT_RULES: readonly DutyConflictRule[] = [
  {
    code: 'FINANCIAL_PROPOSAL_APPROVAL',
    description: 'Un même acteur ne doit pas proposer et approuver un ajustement financier dans une même portée.',
    incompatibleRoleSets: [['FINANCE_OPERATOR', 'FINANCE_APPROVER']],
  },
  {
    code: 'ROLE_ASSIGNMENT_AUDIT',
    description: 'Un auditeur ne doit pas administrer les habilitations qu’il contrôle dans une même portée.',
    incompatibleRoleSets: [
      ['AUDITOR', 'SECURITY_ADMIN'],
      ['AUDITOR', 'COUNTRY_ADMIN'],
    ],
  },
  {
    code: 'PUBLIC_COLLECTION_CANCELLATION',
    description: 'La collecte et l’annulation d’un paiement public doivent être séparées lorsque les deux rôles sont affectés explicitement.',
    incompatibleRoleSets: [['PUBLIC_AGENT_COLLECTOR', 'PUBLIC_AGENT_SUPERVISOR']],
  },
] as const;

export function findDutyConflicts(
  assignments: readonly RoleAssignment[],
  now: Date = new Date(),
): readonly DutyConflict[] {
  const activeAssignments = assignments.filter((assignment) => isActiveAt(assignment, now));
  const groups = groupByActorAndScope(activeAssignments);
  const conflicts: DutyConflict[] = [];

  for (const group of groups.values()) {
    const roleIds = new Set(group.assignments.map((assignment) => assignment.roleId as ReferenceRole));

    for (const rule of DUTY_CONFLICT_RULES) {
      for (const incompatibleRoles of rule.incompatibleRoleSets) {
        if (!incompatibleRoles.every((role) => roleIds.has(role))) continue;

        const matchingAssignments = group.assignments.filter((assignment) =>
          incompatibleRoles.includes(assignment.roleId as ReferenceRole),
        );

        conflicts.push({
          code: rule.code,
          actorId: group.actorId,
          scope: group.scope,
          roleIds: incompatibleRoles,
          assignmentIds: matchingAssignments.map((assignment) => assignment.assignmentId).sort(),
          description: rule.description,
        });
      }
    }
  }

  return conflicts.sort((left, right) =>
    `${left.actorId}:${scopeKey(left.scope)}:${left.code}`.localeCompare(
      `${right.actorId}:${scopeKey(right.scope)}:${right.code}`,
    ),
  );
}

export function hasDutyConflict(
  assignments: readonly RoleAssignment[],
  now: Date = new Date(),
): boolean {
  return findDutyConflicts(assignments, now).length > 0;
}

function isActiveAt(assignment: RoleAssignment, now: Date): boolean {
  if (assignment.status !== 'ACTIVE') return false;

  const instant = now.getTime();
  const startsAt = Date.parse(assignment.validFrom);
  const endsAt = assignment.validUntil ? Date.parse(assignment.validUntil) : Number.POSITIVE_INFINITY;

  return startsAt <= instant && instant < endsAt;
}

function groupByActorAndScope(assignments: readonly RoleAssignment[]): Map<
  string,
  { readonly actorId: string; readonly scope: RoleScope; readonly assignments: RoleAssignment[] }
> {
  const groups = new Map<
    string,
    { actorId: string; scope: RoleScope; assignments: RoleAssignment[] }
  >();

  for (const assignment of assignments) {
    const key = `${assignment.actorId}:${scopeKey(assignment.scope)}`;
    const existing = groups.get(key);

    if (existing) {
      existing.assignments.push(assignment);
    } else {
      groups.set(key, {
        actorId: assignment.actorId,
        scope: assignment.scope,
        assignments: [assignment],
      });
    }
  }

  return groups;
}

function scopeKey(scope: RoleScope): string {
  return `${scope.type}:${scope.id ?? ''}:${scope.countryCode ?? ''}`;
}

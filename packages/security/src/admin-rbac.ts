export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "COUNTRY_ADMIN",
  "COMPLIANCE_OFFICER",
  "RISK_MANAGER",
  "FINANCE_OPERATOR",
  "FINANCE_APPROVER",
  "SUPPORT_AGENT",
  "SUPPORT_MANAGER",
  "MERCHANT_OPERATIONS",
  "PUBLIC_SERVICE_OPERATOR",
  "PUBLIC_SERVICE_APPROVER",
  "AUDITOR",
  "READ_ONLY_ANALYST",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "identity.user.read",
  "identity.user.suspend",
  "identity.user.restore",
  "kyc.case.read",
  "kyc.case.review",
  "kyc.case.approve",
  "risk.rule.read",
  "risk.rule.update",
  "risk.rule.approve",
  "payments.transaction.read",
  "payments.transaction.refund.request",
  "payments.transaction.refund.approve",
  "ledger.adjustment.request",
  "ledger.adjustment.approve",
  "finance.reconciliation.read",
  "finance.reconciliation.execute",
  "finance.settlement.read",
  "finance.settlement.execute",
  "finance.fee.update",
  "finance.fee.approve",
  "merchant.profile.read",
  "merchant.profile.update",
  "merchant.terminal.manage",
  "state.service.read",
  "state.service.update",
  "state.operation.cancel.request",
  "state.operation.cancel.approve",
  "platform.feature-flag.read",
  "platform.feature-flag.update",
  "admin.role.read",
  "admin.role.assign",
  "audit.event.read",
  "audit.event.export",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const APPROVAL_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "EXECUTED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export interface AuthorizationScope {
  countryCodes?: readonly string[];
  legalEntityIds?: readonly string[];
  organizationIds?: readonly string[];
  merchantIds?: readonly string[];
  merchantGroupIds?: readonly string[];
  productIds?: readonly string[];
  environment?: "DEMO" | "STAGING" | "PRODUCTION";
  validFrom?: string;
  validUntil?: string;
  maximumAmountMinor?: bigint;
  currency?: string;
}

export interface RoleDefinition {
  role: AdminRole;
  permissions: readonly AdminPermission[];
  incompatibleRoles?: readonly AdminRole[];
}

export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  {
    role: "SUPER_ADMIN",
    permissions: ADMIN_PERMISSIONS,
  },
  {
    role: "PLATFORM_ADMIN",
    permissions: [
      "identity.user.read",
      "risk.rule.read",
      "payments.transaction.read",
      "merchant.profile.read",
      "merchant.profile.update",
      "merchant.terminal.manage",
      "platform.feature-flag.read",
      "platform.feature-flag.update",
      "admin.role.read",
      "audit.event.read",
    ],
  },
  {
    role: "COUNTRY_ADMIN",
    permissions: [
      "identity.user.read",
      "identity.user.suspend",
      "identity.user.restore",
      "kyc.case.read",
      "risk.rule.read",
      "payments.transaction.read",
      "payments.transaction.refund.request",
      "merchant.profile.read",
      "merchant.profile.update",
      "merchant.terminal.manage",
      "state.service.read",
      "platform.feature-flag.read",
      "admin.role.read",
      "audit.event.read",
    ],
  },
  {
    role: "COMPLIANCE_OFFICER",
    permissions: [
      "identity.user.read",
      "identity.user.suspend",
      "identity.user.restore",
      "kyc.case.read",
      "kyc.case.review",
      "kyc.case.approve",
      "risk.rule.read",
      "payments.transaction.read",
      "audit.event.read",
      "audit.event.export",
    ],
  },
  {
    role: "RISK_MANAGER",
    permissions: [
      "identity.user.read",
      "identity.user.suspend",
      "identity.user.restore",
      "kyc.case.read",
      "risk.rule.read",
      "risk.rule.update",
      "risk.rule.approve",
      "payments.transaction.read",
      "audit.event.read",
    ],
  },
  {
    role: "FINANCE_OPERATOR",
    incompatibleRoles: ["FINANCE_APPROVER"],
    permissions: [
      "payments.transaction.read",
      "payments.transaction.refund.request",
      "ledger.adjustment.request",
      "finance.reconciliation.read",
      "finance.reconciliation.execute",
      "finance.settlement.read",
      "finance.settlement.execute",
      "finance.fee.update",
      "audit.event.read",
    ],
  },
  {
    role: "FINANCE_APPROVER",
    incompatibleRoles: ["FINANCE_OPERATOR"],
    permissions: [
      "payments.transaction.read",
      "payments.transaction.refund.approve",
      "ledger.adjustment.approve",
      "finance.reconciliation.read",
      "finance.settlement.read",
      "finance.fee.approve",
      "audit.event.read",
    ],
  },
  {
    role: "SUPPORT_AGENT",
    permissions: [
      "identity.user.read",
      "kyc.case.read",
      "payments.transaction.read",
      "merchant.profile.read",
      "state.service.read",
    ],
  },
  {
    role: "SUPPORT_MANAGER",
    permissions: [
      "identity.user.read",
      "identity.user.suspend",
      "identity.user.restore",
      "kyc.case.read",
      "payments.transaction.read",
      "payments.transaction.refund.request",
      "merchant.profile.read",
      "state.service.read",
      "audit.event.read",
    ],
  },
  {
    role: "MERCHANT_OPERATIONS",
    permissions: [
      "kyc.case.read",
      "merchant.profile.read",
      "merchant.profile.update",
      "merchant.terminal.manage",
      "payments.transaction.read",
      "audit.event.read",
    ],
  },
  {
    role: "PUBLIC_SERVICE_OPERATOR",
    incompatibleRoles: ["PUBLIC_SERVICE_APPROVER"],
    permissions: [
      "state.service.read",
      "state.service.update",
      "state.operation.cancel.request",
      "payments.transaction.read",
      "audit.event.read",
    ],
  },
  {
    role: "PUBLIC_SERVICE_APPROVER",
    incompatibleRoles: ["PUBLIC_SERVICE_OPERATOR"],
    permissions: [
      "state.service.read",
      "state.operation.cancel.approve",
      "payments.transaction.read",
      "audit.event.read",
    ],
  },
  {
    role: "AUDITOR",
    permissions: [
      "identity.user.read",
      "kyc.case.read",
      "risk.rule.read",
      "payments.transaction.read",
      "finance.reconciliation.read",
      "finance.settlement.read",
      "merchant.profile.read",
      "state.service.read",
      "platform.feature-flag.read",
      "admin.role.read",
      "audit.event.read",
      "audit.event.export",
    ],
  },
  {
    role: "READ_ONLY_ANALYST",
    permissions: [
      "payments.transaction.read",
      "finance.reconciliation.read",
      "merchant.profile.read",
      "state.service.read",
    ],
  },
] as const;

export function getRoleDefinition(role: AdminRole): RoleDefinition {
  const definition = ROLE_DEFINITIONS.find((candidate) => candidate.role === role);

  if (!definition) {
    throw new Error(`Unknown admin role: ${role}`);
  }

  return definition;
}

export function resolvePermissions(roles: readonly AdminRole[]): Set<AdminPermission> {
  return new Set(
    roles.flatMap((role) => [...getRoleDefinition(role).permissions]),
  );
}

export function findRoleConflicts(roles: readonly AdminRole[]): readonly string[] {
  const assigned = new Set(roles);
  const conflicts = new Set<string>();

  for (const role of roles) {
    for (const incompatibleRole of getRoleDefinition(role).incompatibleRoles ?? []) {
      if (assigned.has(incompatibleRole)) {
        conflicts.add([role, incompatibleRole].sort().join(":"));
      }
    }
  }

  return [...conflicts];
}

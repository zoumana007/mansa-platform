export const ROLES = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "COMPLIANCE_OFFICER",
  "RISK_ANALYST",
  "FINANCE_OPERATOR",
  "SUPPORT_AGENT",
  "AUDITOR",
  "MERCHANT_OWNER",
  "MERCHANT_MANAGER",
  "MERCHANT_CASHIER",
  "PUBLIC_AGENCY_ADMIN",
  "PUBLIC_AGENT",
  "CUSTOMER",
  "SERVICE_ACCOUNT",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "identity.user.read",
  "identity.user.update",
  "identity.user.suspend",
  "identity.kyc.read",
  "identity.kyc.review",
  "identity.kyc.approve",
  "identity.kyc.reject",
  "identity.document.read_sensitive",
  "account.read",
  "account.freeze",
  "payment.read",
  "payment.create",
  "payment.refund",
  "payment.cancel",
  "ledger.read",
  "ledger.adjustment.initiate",
  "ledger.adjustment.approve",
  "merchant.read",
  "merchant.update",
  "merchant.employee.manage",
  "merchant.terminal.manage",
  "merchant.settlement.read",
  "merchant.settlement.configure",
  "pos.sale.create",
  "pos.refund.create",
  "pos.shift.close",
  "configuration.read",
  "configuration.update",
  "feature_flag.manage",
  "fee_rule.manage",
  "limit_rule.manage",
  "partner.manage",
  "audit.read",
  "support.case.read",
  "support.case.update",
  "data.export",
  "public_service.read",
  "public_service.configure",
  "public_case.create",
  "public_case.cancel",
  "public_payment.collect",
  "public_agent.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type Environment = "DEMO" | "STAGING" | "PRODUCTION";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuthorizationScope {
  readonly countryCode?: string;
  readonly organizationId?: string;
  readonly merchantId?: string;
  readonly storeId?: string;
  readonly agencyId?: string;
}

export interface AuthorizationActor {
  readonly actorId: string;
  readonly roles: readonly Role[];
  readonly permissions: readonly Permission[];
  readonly scope: AuthorizationScope;
}

export interface AuthorizationRequest {
  readonly permission: Permission;
  readonly environment: Environment;
  readonly actor: AuthorizationActor;
  readonly resourceScope?: AuthorizationScope;
  readonly resourceOwnerId?: string;
  readonly amountMinor?: bigint;
  readonly riskLevel?: RiskLevel;
  readonly requiresDualApproval?: boolean;
  readonly approverActorId?: string;
}

export type DenialReason =
  | "MISSING_PERMISSION"
  | "SCOPE_MISMATCH"
  | "OWNER_MISMATCH"
  | "DUAL_APPROVAL_REQUIRED"
  | "SELF_APPROVAL_FORBIDDEN";

export type AuthorizationDecision =
  | { readonly allowed: true; readonly reason: "AUTHORIZED" }
  | { readonly allowed: false; readonly reason: DenialReason };

const SCOPED_KEYS = [
  "countryCode",
  "organizationId",
  "merchantId",
  "storeId",
  "agencyId",
] as const satisfies readonly (keyof AuthorizationScope)[];

function scopeMatches(
  actorScope: AuthorizationScope,
  resourceScope: AuthorizationScope,
): boolean {
  return SCOPED_KEYS.every((key) => {
    const requiredValue = resourceScope[key];
    return requiredValue === undefined || actorScope[key] === requiredValue;
  });
}

export function authorize(request: AuthorizationRequest): AuthorizationDecision {
  if (!request.actor.permissions.includes(request.permission)) {
    return { allowed: false, reason: "MISSING_PERMISSION" };
  }

  if (
    request.resourceScope !== undefined &&
    !scopeMatches(request.actor.scope, request.resourceScope)
  ) {
    return { allowed: false, reason: "SCOPE_MISMATCH" };
  }

  if (
    request.actor.roles.includes("CUSTOMER") &&
    request.resourceOwnerId !== undefined &&
    request.resourceOwnerId !== request.actor.actorId
  ) {
    return { allowed: false, reason: "OWNER_MISMATCH" };
  }

  if (request.requiresDualApproval === true) {
    if (request.approverActorId === undefined) {
      return { allowed: false, reason: "DUAL_APPROVAL_REQUIRED" };
    }

    if (request.approverActorId === request.actor.actorId) {
      return { allowed: false, reason: "SELF_APPROVAL_FORBIDDEN" };
    }
  }

  return { allowed: true, reason: "AUTHORIZED" };
}

export * from "./audit.js";
export * from "./beneficiary.js";
export * from "./compliance-case.js";
export * from "./compliance-decision.js";
export * from "./compliance-evidence.js";
export * from "./device.js";
export * from "./limits.js";
export * from "./risk.js";
export * from "./role-policy.js";
export * from "./screening.js";
export * from "./session.js";
export * from "./transaction-gate.js";
export * from "./transaction-monitoring.js";
export * from "./velocity.js";

import type { Environment, Permission, RiskLevel } from "./index.js";

export const SENSITIVE_PERMISSIONS = [
  "identity.user.suspend",
  "identity.kyc.approve",
  "identity.kyc.reject",
  "identity.document.read_sensitive",
  "account.freeze",
  "payment.refund",
  "ledger.adjustment.initiate",
  "ledger.adjustment.approve",
  "configuration.update",
  "feature_flag.manage",
  "fee_rule.manage",
  "limit_rule.manage",
  "partner.manage",
  "data.export",
  "public_service.configure",
  "public_case.cancel",
  "public_agent.manage",
] as const satisfies readonly Permission[];

export type SensitivePermission = (typeof SENSITIVE_PERMISSIONS)[number];

export interface PrivilegedAccessContext {
  readonly permission: Permission;
  readonly environment: Environment;
  readonly riskLevel?: RiskLevel;
  readonly amountMinor?: bigint;
  readonly elevatedAmountThresholdMinor?: bigint;
}

export interface PrivilegedAccessRequirements {
  readonly sensitive: boolean;
  readonly requireRecentAuthentication: boolean;
  readonly requireMultiFactorAuthentication: boolean;
  readonly requireJustification: boolean;
  readonly requireAuditEvent: boolean;
  readonly requireDualApproval: boolean;
}

export function isSensitivePermission(
  permission: Permission,
): permission is SensitivePermission {
  return (SENSITIVE_PERMISSIONS as readonly Permission[]).includes(permission);
}

export function privilegedAccessRequirements(
  context: PrivilegedAccessContext,
): PrivilegedAccessRequirements {
  const sensitive = isSensitivePermission(context.permission);
  const elevatedRisk =
    context.riskLevel === "HIGH" || context.riskLevel === "CRITICAL";
  const elevatedAmount =
    context.amountMinor !== undefined &&
    context.elevatedAmountThresholdMinor !== undefined &&
    context.amountMinor >= context.elevatedAmountThresholdMinor;
  const productionSensitive =
    context.environment === "PRODUCTION" && sensitive;

  return {
    sensitive,
    requireRecentAuthentication: sensitive || elevatedRisk,
    requireMultiFactorAuthentication: productionSensitive || elevatedRisk,
    requireJustification: sensitive,
    requireAuditEvent: sensitive || elevatedRisk || elevatedAmount,
    requireDualApproval:
      context.permission === "ledger.adjustment.approve" ||
      context.permission === "fee_rule.manage" ||
      context.permission === "limit_rule.manage" ||
      context.permission === "partner.manage" ||
      context.permission === "data.export" ||
      elevatedRisk ||
      elevatedAmount,
  };
}

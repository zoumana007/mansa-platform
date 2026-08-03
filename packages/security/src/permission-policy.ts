import type { Permission } from "./index.js";

export type PermissionDomain =
  | "IDENTITY"
  | "ACCOUNT"
  | "PAYMENT"
  | "LEDGER"
  | "MERCHANT"
  | "POS"
  | "CONFIGURATION"
  | "AUDIT"
  | "SUPPORT"
  | "DATA"
  | "PUBLIC_SERVICE";

export interface PermissionPolicy {
  readonly domain: PermissionDomain;
  readonly sensitive: boolean;
  readonly productionDualApproval: boolean;
  readonly requiresReason: boolean;
}

const policy = (
  domain: PermissionDomain,
  options: Partial<Omit<PermissionPolicy, "domain">> = {},
): PermissionPolicy => ({
  domain,
  sensitive: false,
  productionDualApproval: false,
  requiresReason: false,
  ...options,
});

/**
 * Métadonnées de sécurité communes à toutes les applications.
 *
 * Ce catalogue ne donne aucun droit à lui seul : l'autorisation effective
 * reste calculée à partir des rôles, permissions, périmètres ABAC et règles
 * d'approbation. Il permet aux API et interfaces de traiter uniformément les
 * opérations sensibles.
 */
export const PERMISSION_POLICIES: Readonly<Record<Permission, PermissionPolicy>> = {
  "identity.user.read": policy("IDENTITY"),
  "identity.user.update": policy("IDENTITY", { requiresReason: true }),
  "identity.user.suspend": policy("IDENTITY", {
    sensitive: true,
    requiresReason: true,
  }),
  "identity.kyc.read": policy("IDENTITY", { sensitive: true }),
  "identity.kyc.review": policy("IDENTITY", {
    sensitive: true,
    requiresReason: true,
  }),
  "identity.kyc.approve": policy("IDENTITY", {
    sensitive: true,
    requiresReason: true,
  }),
  "identity.kyc.reject": policy("IDENTITY", {
    sensitive: true,
    requiresReason: true,
  }),
  "identity.document.read_sensitive": policy("IDENTITY", {
    sensitive: true,
    requiresReason: true,
  }),
  "account.read": policy("ACCOUNT"),
  "account.freeze": policy("ACCOUNT", {
    sensitive: true,
    requiresReason: true,
  }),
  "payment.read": policy("PAYMENT"),
  "payment.create": policy("PAYMENT"),
  "payment.refund": policy("PAYMENT", {
    sensitive: true,
    requiresReason: true,
  }),
  "payment.cancel": policy("PAYMENT", {
    sensitive: true,
    requiresReason: true,
  }),
  "ledger.read": policy("LEDGER", { sensitive: true }),
  "ledger.adjustment.initiate": policy("LEDGER", {
    sensitive: true,
    requiresReason: true,
  }),
  "ledger.adjustment.approve": policy("LEDGER", {
    sensitive: true,
    productionDualApproval: true,
    requiresReason: true,
  }),
  "merchant.read": policy("MERCHANT"),
  "merchant.update": policy("MERCHANT", { requiresReason: true }),
  "merchant.employee.manage": policy("MERCHANT", {
    sensitive: true,
    requiresReason: true,
  }),
  "merchant.terminal.manage": policy("MERCHANT", {
    sensitive: true,
    requiresReason: true,
  }),
  "merchant.settlement.read": policy("MERCHANT", { sensitive: true }),
  "merchant.settlement.configure": policy("MERCHANT", {
    sensitive: true,
    productionDualApproval: true,
    requiresReason: true,
  }),
  "pos.sale.create": policy("POS"),
  "pos.refund.create": policy("POS", {
    sensitive: true,
    requiresReason: true,
  }),
  "pos.shift.close": policy("POS"),
  "configuration.read": policy("CONFIGURATION"),
  "configuration.update": policy("CONFIGURATION", {
    sensitive: true,
    requiresReason: true,
  }),
  "feature_flag.manage": policy("CONFIGURATION", {
    sensitive: true,
    productionDualApproval: true,
    requiresReason: true,
  }),
  "fee_rule.manage": policy("CONFIGURATION", {
    sensitive: true,
    productionDualApproval: true,
    requiresReason: true,
  }),
  "limit_rule.manage": policy("CONFIGURATION", {
    sensitive: true,
    productionDualApproval: true,
    requiresReason: true,
  }),
  "partner.manage": policy("CONFIGURATION", {
    sensitive: true,
    productionDualApproval: true,
    requiresReason: true,
  }),
  "audit.read": policy("AUDIT", { sensitive: true }),
  "support.case.read": policy("SUPPORT"),
  "support.case.update": policy("SUPPORT", { requiresReason: true }),
  "data.export": policy("DATA", {
    sensitive: true,
    requiresReason: true,
  }),
  "public_service.read": policy("PUBLIC_SERVICE"),
  "public_service.configure": policy("PUBLIC_SERVICE", {
    sensitive: true,
    productionDualApproval: true,
    requiresReason: true,
  }),
  "public_case.create": policy("PUBLIC_SERVICE", { requiresReason: true }),
  "public_case.cancel": policy("PUBLIC_SERVICE", {
    sensitive: true,
    requiresReason: true,
  }),
  "public_payment.collect": policy("PUBLIC_SERVICE", { sensitive: true }),
  "public_agent.manage": policy("PUBLIC_SERVICE", {
    sensitive: true,
    requiresReason: true,
  }),
};

export function permissionPolicy(permission: Permission): PermissionPolicy {
  return PERMISSION_POLICIES[permission];
}

export function requiresProductionDualApproval(permission: Permission): boolean {
  return PERMISSION_POLICIES[permission].productionDualApproval;
}

export function requiresAuditReason(permission: Permission): boolean {
  return PERMISSION_POLICIES[permission].requiresReason;
}

import type { ActorType } from './authorization.js';
import type { Permission, ReferenceRole } from './permission-catalog.js';
import type { RoleScopeType } from './role-assignment.js';

export interface ReferenceRoleProfile {
  readonly role: ReferenceRole;
  readonly actorTypes: readonly ActorType[];
  readonly permissions: readonly Permission[];
  readonly allowedScopeTypes: readonly RoleScopeType[];
  readonly systemManaged: boolean;
  readonly description: string;
}

const ownUserPermissions = [
  'identity.profile.read-own',
  'identity.profile.update-own',
  'identity.session.revoke-own',
  'wallet.balance.read-own',
  'payment.create-own',
  'transfer.create-own',
  'beneficiary.manage-own',
  'card.manage-own',
] as const satisfies readonly Permission[];

export const REFERENCE_ROLE_PROFILES = {
  CLIENT: profile('CLIENT', ['USER'], ownUserPermissions, ['PLATFORM'], false, 'Client particulier limité à ses propres ressources'),
  MERCHANT_OWNER: profile('MERCHANT_OWNER', ['MERCHANT_MEMBER'], ['merchant.payment.collect', 'merchant.payment.refund', 'merchant.settlement.read'], ['MERCHANT', 'LOCATION'], false, 'Propriétaire de commerce'),
  MERCHANT_MANAGER: profile('MERCHANT_MANAGER', ['MERCHANT_MEMBER'], ['merchant.payment.collect', 'merchant.payment.refund', 'merchant.settlement.read'], ['MERCHANT', 'LOCATION'], false, 'Responsable opérationnel de commerce'),
  MERCHANT_CASHIER: profile('MERCHANT_CASHIER', ['MERCHANT_MEMBER'], ['merchant.payment.collect'], ['LOCATION'], false, 'Caissier limité aux emplacements affectés'),
  MERCHANT_ACCOUNTANT: profile('MERCHANT_ACCOUNTANT', ['MERCHANT_MEMBER'], ['merchant.settlement.read'], ['MERCHANT', 'LOCATION'], false, 'Lecture des règlements commerçants'),
  MERCHANT_SUPPORT: profile('MERCHANT_SUPPORT', ['MERCHANT_MEMBER'], [], ['MERCHANT', 'LOCATION'], false, 'Support opérationnel du commerce'),
  PUBLIC_AGENT_COLLECTOR: profile('PUBLIC_AGENT_COLLECTOR', ['PUBLIC_AGENT'], ['public-service.obligation.read', 'public-service.fine.create', 'public-service.payment.collect'], ['PUBLIC_ORGANIZATION'], false, 'Agent de constatation et de collecte'),
  PUBLIC_AGENT_SUPERVISOR: profile('PUBLIC_AGENT_SUPERVISOR', ['PUBLIC_AGENT'], ['public-service.obligation.read', 'public-service.fine.create', 'public-service.payment.collect', 'public-service.payment.cancel'], ['PUBLIC_ORGANIZATION', 'COUNTRY'], false, 'Superviseur des opérations publiques'),
  PUBLIC_ORG_ADMIN: profile('PUBLIC_ORG_ADMIN', ['PUBLIC_AGENT', 'ADMIN'], ['public-service.catalog.update', 'administration.role.read', 'administration.role.assign'], ['PUBLIC_ORGANIZATION'], false, 'Administrateur d’un organisme public'),
  SCHOLARSHIP_REVIEWER: profile('SCHOLARSHIP_REVIEWER', ['PUBLIC_AGENT', 'ADMIN'], ['public-service.scholarship.review', 'public-service.scholarship.decide'], ['PUBLIC_ORGANIZATION', 'COUNTRY'], false, 'Instruction des dossiers de bourse'),
  STUDENT_CARD_OPERATOR: profile('STUDENT_CARD_OPERATOR', ['PUBLIC_AGENT', 'ADMIN'], ['public-service.student-card.issue'], ['PUBLIC_ORGANIZATION'], false, 'Émission des cartes étudiantes'),
  SUPPORT_AGENT: profile('SUPPORT_AGENT', ['ADMIN'], ['identity.user.read'], ['COUNTRY', 'ORGANIZATION'], false, 'Support client à accès limité'),
  SUPPORT_SUPERVISOR: profile('SUPPORT_SUPERVISOR', ['ADMIN'], ['identity.user.read', 'identity.user.restrict', 'audit.event.read'], ['COUNTRY', 'ORGANIZATION'], false, 'Supervision du support'),
  KYC_REVIEWER: profile('KYC_REVIEWER', ['ADMIN'], ['kyc.case.read', 'kyc.case.review', 'kyc.case.decide'], ['COUNTRY'], false, 'Revue et décision KYC'),
  COMPLIANCE_OFFICER: profile('COMPLIANCE_OFFICER', ['ADMIN'], ['identity.user.read', 'identity.user.restrict', 'kyc.case.read', 'audit.event.read'], ['COUNTRY', 'ORGANIZATION'], false, 'Conformité et restrictions'),
  RISK_ANALYST: profile('RISK_ANALYST', ['ADMIN'], ['identity.user.read', 'audit.event.read'], ['COUNTRY', 'ORGANIZATION'], false, 'Analyse des risques'),
  FINANCE_OPERATOR: profile('FINANCE_OPERATOR', ['ADMIN'], ['finance.adjustment.propose', 'merchant.settlement.read'], ['COUNTRY', 'ORGANIZATION'], false, 'Proposition d’ajustements financiers'),
  FINANCE_APPROVER: profile('FINANCE_APPROVER', ['ADMIN'], ['finance.adjustment.approve', 'finance.reconciliation.approve', 'merchant.settlement.read'], ['COUNTRY', 'ORGANIZATION'], false, 'Approbation financière séparée'),
  PARTNER_MANAGER: profile('PARTNER_MANAGER', ['ADMIN'], ['administration.partner.activate', 'audit.event.read'], ['COUNTRY', 'ORGANIZATION'], false, 'Gestion des partenaires'),
  PRODUCT_ADMIN: profile('PRODUCT_ADMIN', ['ADMIN'], ['administration.feature-flag.update', 'administration.fee.update', 'administration.limit.update'], ['PLATFORM', 'COUNTRY'], false, 'Administration des produits et paramètres'),
  SECURITY_ADMIN: profile('SECURITY_ADMIN', ['ADMIN'], ['identity.user.read', 'identity.user.restrict', 'administration.role.read', 'administration.role.assign', 'audit.event.read'], ['PLATFORM', 'COUNTRY'], false, 'Administration de la sécurité et des habilitations'),
  AUDITOR: profile('AUDITOR', ['ADMIN'], ['administration.role.read', 'audit.event.read', 'audit.export.create'], ['PLATFORM', 'COUNTRY', 'ORGANIZATION'], false, 'Audit en lecture et exports contrôlés'),
  COUNTRY_ADMIN: profile('COUNTRY_ADMIN', ['ADMIN'], ['identity.user.read', 'administration.role.read', 'administration.role.assign', 'administration.feature-flag.update', 'administration.fee.update', 'administration.limit.update', 'audit.event.read'], ['COUNTRY'], false, 'Administration déléguée d’un pays'),
  SUPER_ADMIN: profile('SUPER_ADMIN', ['ADMIN'], [
    'identity.user.read', 'identity.user.restrict', 'kyc.case.read', 'kyc.case.review', 'kyc.case.decide',
    'finance.adjustment.propose', 'finance.adjustment.approve', 'finance.reconciliation.approve',
    'administration.role.read', 'administration.role.assign', 'administration.feature-flag.update',
    'administration.fee.update', 'administration.limit.update', 'administration.partner.activate',
    'audit.event.read', 'audit.export.create', 'public-service.catalog.update',
  ], ['PLATFORM', 'COUNTRY', 'ORGANIZATION', 'MERCHANT', 'LOCATION', 'PUBLIC_ORGANIZATION'], true, 'Administration centrale exceptionnelle'),
  SERVICE_API_GATEWAY: profile('SERVICE_API_GATEWAY', ['SERVICE'], [], ['PLATFORM'], true, 'Orchestration et autorisation des requêtes'),
  SERVICE_WORKER: profile('SERVICE_WORKER', ['SERVICE'], [], ['PLATFORM', 'COUNTRY', 'ORGANIZATION'], true, 'Traitements asynchrones ciblés'),
  SERVICE_NOTIFICATION: profile('SERVICE_NOTIFICATION', ['SERVICE'], [], ['PLATFORM', 'COUNTRY'], true, 'Envoi de notifications'),
  SERVICE_RECONCILIATION: profile('SERVICE_RECONCILIATION', ['SERVICE'], ['merchant.settlement.read'], ['PLATFORM', 'COUNTRY', 'ORGANIZATION'], true, 'Production des rapprochements'),
  SERVICE_AI: profile('SERVICE_AI', ['SERVICE'], [], ['PLATFORM', 'COUNTRY', 'ORGANIZATION'], true, 'Services IA à finalité limitée'),
} as const satisfies Record<ReferenceRole, ReferenceRoleProfile>;

export function getReferenceRoleProfile(role: ReferenceRole): ReferenceRoleProfile {
  return REFERENCE_ROLE_PROFILES[role];
}

export function roleProfileAllowsActorType(role: ReferenceRole, actorType: ActorType): boolean {
  return REFERENCE_ROLE_PROFILES[role].actorTypes.includes(actorType);
}

export function roleProfileAllowsScope(role: ReferenceRole, scopeType: RoleScopeType): boolean {
  return REFERENCE_ROLE_PROFILES[role].allowedScopeTypes.includes(scopeType);
}

function profile(
  role: ReferenceRole,
  actorTypes: readonly ActorType[],
  permissions: readonly Permission[],
  allowedScopeTypes: readonly RoleScopeType[],
  systemManaged: boolean,
  description: string,
): ReferenceRoleProfile {
  return { role, actorTypes, permissions, allowedScopeTypes, systemManaged, description };
}

import type { AuthenticationLevel } from './authorization.js';

export const PERMISSIONS = [
  'identity.profile.read-own',
  'identity.profile.update-own',
  'identity.session.revoke-own',
  'identity.user.read',
  'identity.user.restrict',
  'kyc.case.read',
  'kyc.case.review',
  'kyc.case.decide',
  'wallet.balance.read-own',
  'payment.create-own',
  'transfer.create-own',
  'beneficiary.manage-own',
  'card.manage-own',
  'merchant.payment.collect',
  'merchant.payment.refund',
  'merchant.settlement.read',
  'finance.adjustment.propose',
  'finance.adjustment.approve',
  'finance.reconciliation.approve',
  'administration.role.read',
  'administration.role.assign',
  'administration.feature-flag.update',
  'administration.fee.update',
  'administration.limit.update',
  'administration.partner.activate',
  'audit.event.read',
  'audit.export.create',
  'public-service.obligation.read',
  'public-service.fine.create',
  'public-service.payment.collect',
  'public-service.payment.cancel',
  'public-service.catalog.update',
  'public-service.scholarship.review',
  'public-service.scholarship.decide',
  'public-service.student-card.issue',
] as const;

export const REFERENCE_ROLES = [
  'CLIENT',
  'MERCHANT_OWNER',
  'MERCHANT_MANAGER',
  'MERCHANT_CASHIER',
  'MERCHANT_ACCOUNTANT',
  'MERCHANT_SUPPORT',
  'PUBLIC_AGENT_COLLECTOR',
  'PUBLIC_AGENT_SUPERVISOR',
  'PUBLIC_ORG_ADMIN',
  'SCHOLARSHIP_REVIEWER',
  'STUDENT_CARD_OPERATOR',
  'SUPPORT_AGENT',
  'SUPPORT_SUPERVISOR',
  'KYC_REVIEWER',
  'COMPLIANCE_OFFICER',
  'RISK_ANALYST',
  'FINANCE_OPERATOR',
  'FINANCE_APPROVER',
  'PARTNER_MANAGER',
  'PRODUCT_ADMIN',
  'SECURITY_ADMIN',
  'AUDITOR',
  'COUNTRY_ADMIN',
  'SUPER_ADMIN',
  'SERVICE_API_GATEWAY',
  'SERVICE_WORKER',
  'SERVICE_NOTIFICATION',
  'SERVICE_RECONCILIATION',
  'SERVICE_AI',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type ReferenceRole = (typeof REFERENCE_ROLES)[number];

export interface PermissionDefinition {
  readonly permission: Permission;
  readonly minimumAuthenticationLevel: AuthenticationLevel;
  readonly sensitive: boolean;
  readonly approvalRequiredInProduction: boolean;
  readonly description: string;
}

export const PERMISSION_CATALOG: readonly PermissionDefinition[] = [
  define('identity.profile.read-own', 'PRIMARY_FACTOR', false, false, 'Lire son propre profil'),
  define('identity.profile.update-own', 'PRIMARY_FACTOR', false, false, 'Modifier son propre profil'),
  define('identity.session.revoke-own', 'PRIMARY_FACTOR', false, false, 'Révoquer une de ses sessions'),
  define('identity.user.read', 'MULTI_FACTOR', true, false, 'Consulter une identité dans un périmètre autorisé'),
  define('identity.user.restrict', 'MULTI_FACTOR', true, false, 'Restreindre un compte avec justification'),
  define('kyc.case.read', 'MULTI_FACTOR', true, false, 'Consulter un dossier KYC'),
  define('kyc.case.review', 'MULTI_FACTOR', true, false, 'Examiner un dossier KYC'),
  define('kyc.case.decide', 'MULTI_FACTOR', true, false, 'Décider du statut KYC'),
  define('wallet.balance.read-own', 'PRIMARY_FACTOR', false, false, 'Lire ses propres soldes'),
  define('payment.create-own', 'PRIMARY_FACTOR', true, false, 'Initier un paiement pour soi-même'),
  define('transfer.create-own', 'PRIMARY_FACTOR', true, false, 'Initier un transfert pour soi-même'),
  define('beneficiary.manage-own', 'PRIMARY_FACTOR', true, false, 'Gérer ses bénéficiaires'),
  define('card.manage-own', 'MULTI_FACTOR', true, false, 'Gérer ses cartes, contrôles et limites'),
  define('merchant.payment.collect', 'PRIMARY_FACTOR', true, false, 'Encaisser un paiement commerçant'),
  define('merchant.payment.refund', 'MULTI_FACTOR', true, false, 'Initier un remboursement commerçant'),
  define('merchant.settlement.read', 'PRIMARY_FACTOR', true, false, 'Consulter les règlements commerçants'),
  define('finance.adjustment.propose', 'MULTI_FACTOR', true, false, 'Proposer un ajustement financier'),
  define('finance.adjustment.approve', 'MULTI_FACTOR', true, true, 'Approuver un ajustement financier'),
  define('finance.reconciliation.approve', 'MULTI_FACTOR', true, true, 'Valider un rapprochement financier'),
  define('administration.role.read', 'MULTI_FACTOR', true, false, 'Lire les rôles et permissions'),
  define('administration.role.assign', 'MULTI_FACTOR', true, true, 'Affecter ou retirer un rôle'),
  define('administration.feature-flag.update', 'MULTI_FACTOR', true, true, 'Modifier un drapeau de fonctionnalité'),
  define('administration.fee.update', 'MULTI_FACTOR', true, true, 'Modifier les frais et commissions'),
  define('administration.limit.update', 'MULTI_FACTOR', true, true, 'Modifier les limites produit ou risque'),
  define('administration.partner.activate', 'MULTI_FACTOR', true, true, 'Activer une intégration partenaire'),
  define('audit.event.read', 'MULTI_FACTOR', true, false, 'Consulter les événements d’audit'),
  define('audit.export.create', 'MULTI_FACTOR', true, true, 'Créer un export d’audit'),
  define('public-service.obligation.read', 'PRIMARY_FACTOR', true, false, 'Rechercher une obligation publique'),
  define('public-service.fine.create', 'PRIMARY_FACTOR', true, false, 'Constater une amende'),
  define('public-service.payment.collect', 'PRIMARY_FACTOR', true, false, 'Collecter le paiement d’une obligation publique'),
  define('public-service.payment.cancel', 'MULTI_FACTOR', true, true, 'Annuler ou corriger une collecte publique'),
  define('public-service.catalog.update', 'MULTI_FACTOR', true, true, 'Modifier un catalogue ou barème public'),
  define('public-service.scholarship.review', 'MULTI_FACTOR', true, false, 'Examiner un dossier de bourse'),
  define('public-service.scholarship.decide', 'MULTI_FACTOR', true, false, 'Décider un dossier de bourse'),
  define('public-service.student-card.issue', 'MULTI_FACTOR', true, false, 'Émettre une carte étudiante'),
];

export function isPermission(value: string): value is Permission {
  return PERMISSIONS.includes(value as Permission);
}

export function isReferenceRole(value: string): value is ReferenceRole {
  return REFERENCE_ROLES.includes(value as ReferenceRole);
}

export function getPermissionDefinition(
  permission: Permission,
): PermissionDefinition {
  const definition = PERMISSION_CATALOG.find(
    (candidate) => candidate.permission === permission,
  );

  if (!definition) {
    throw new Error(`Permission non cataloguée: ${permission}`);
  }

  return definition;
}

function define(
  permission: Permission,
  minimumAuthenticationLevel: AuthenticationLevel,
  sensitive: boolean,
  approvalRequiredInProduction: boolean,
  description: string,
): PermissionDefinition {
  return {
    permission,
    minimumAuthenticationLevel,
    sensitive,
    approvalRequiredInProduction,
    description,
  };
}

# Carte cible du monorepo Mansa

Cette carte décrit le périmètre complet attendu. La présence d’un dossier ne signifie pas que le produit est terminé ; chaque application doit avoir un README, des scripts, des tests et des critères de recette.

```text
apps/
  api-gateway/              API publique et orchestration NestJS
  admin-web/                portail Super Admin et opérations
  merchant-web/             portail web commerçant
  public-web/               site public Mansa
  developer-portal/         documentation API, sandbox et webhooks
  partner-portal/           banques, institutions et partenaires
  mobile-client/            application mobile client
  mobile-merchant/          application mobile commerçant
  mobile-admin-lite/        supervision mobile
  mobile-directory/         annuaire / Hub professionnel
  tpe-android/              application terminal Android

services/
  identity-service/         identité, sessions, appareils et MFA
  compliance-service/       KYC, KYB, consentements et contrôles
  ledger-service/           grand livre en partie double
  wallet-service/           comptes et portefeuilles
  payment-service/          paiements et orchestration
  transfer-service/         transferts internes et bancaires
  card-service/             cartes et contrôles
  mobile-money-service/     adaptateurs opérateurs
  merchant-service/         commerces, établissements et employés
  terminal-service/         parc TPE et politiques hors ligne
  catalog-service/          produits, stock et tarification
  order-service/            paniers, commandes et additions
  billing-service/          factures, reçus et fiscalité configurée
  settlement-service/       règlements et rapprochement
  loyalty-service/          points, cashback, coupons et promotions
  savings-service/          coffres, objectifs et tontines
  subscription-service/     paiements récurrents et détection
  directory-service/        recherche et mini-sites
  government-service/       amendes, taxes, bourses et scolarité
  notification-service/     push, SMS, e-mail et in-app
  support-service/          tickets, chat, litiges et preuves
  risk-service/             fraude, règles et décisions
  ai-service/               Jini et fonctions IA gouvernées
  analytics-service/        événements, rapports et BI
  audit-service/            audit append-only
  configuration-service/    paramètres, limites et feature flags

packages/
  config/                   configurations partagées
  contracts/                DTO, schémas, API et événements
  domain/                   primitives et règles indépendantes
  database/                 clients, migrations et outils de données
  observability/            logs, métriques et traces
  security/                 utilitaires sécurité communs
  testing/                  fixtures, mocks et outils de test
  ui/                       design tokens et composants partagés
  localization/             langues, formats et traductions

infra/
  docker/                   développement local uniquement
  kubernetes/               manifests ou chart lorsque retenu
  terraform/                infrastructure déclarative
  monitoring/               tableaux de bord et alertes
  runbooks/                 procédures d’exploitation
```

## Dépendances autorisées

- `apps/*` consomment les contrats et SDK ; elles ne manipulent pas directement les tables d’un autre domaine.
- `services/*` exposent des API ou événements versionnés.
- `packages/domain` ne dépend d’aucun framework web ou ORM.
- Les adaptateurs partenaires sont interchangeables et testables avec des simulateurs.
- Les événements financiers portent un identifiant, une version, une date, une corrélation et une clé d’idempotence.

## Ordre recommandé

1. Outils du monorepo et CI.
2. Contrats, primitives monétaires, identité et permissions.
3. Grand livre, portefeuille et idempotence.
4. Paiements et adaptateurs simulés.
5. Administration et observabilité.
6. Applications Client, Commerçant et TPE.
7. Annuaire, services publics, fidélité, épargne et IA.
8. Durcissement, performance, sécurité et production.

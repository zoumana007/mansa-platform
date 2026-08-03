# Mansa Platform

Monorepo technique de la plateforme fintech Mansa. La documentation fonctionnelle exhaustive est conservée dans `zoumana007/mansa-docs` et prévaut sur les descriptions résumées de ce dépôt.

## Applications mobiles

- `apps/mobile-client` : application Client React Native.
- `apps/mobile-merchant` : application Commerçant React Native.
- `apps/mobile-admin-lite` : administration mobile React Native.
- `apps/mobile-directory` : application autonome Annuaire / Hub React Native.
- `apps/tpe-android` : application terminal de paiement Android, avec couche d’intégration matérielle isolée.

## Applications web

- `apps/admin-web` : portail d’administration Next.js.
- `apps/public-web` : site public officiel Mansa Next.js.
- `apps/business-web` : second site Next.js dédié aux commerçants, partenaires, TPE et services professionnels.

## Backend et services

- `apps/api-gateway` : API NestJS, authentification, orchestration et exposition des contrats.
- `apps/ai-services` : services IA contrôlés pour Jini, support, fraude et recommandations.
- `apps/workers` : traitements asynchrones, événements, notifications et tâches planifiées.

## Paquets partagés

- `packages/config` : configurations TypeScript, ESLint et outils.
- `packages/contracts` : contrats, DTO, événements et schémas partagés.
- `packages/domain` : primitives métier indépendantes des frameworks.
- `packages/ui` : design system et composants partagés lorsque pertinent.
- `packages/security` : politiques, autorisations et primitives de sécurité.
- `packages/observability` : logs structurés, métriques, traces et corrélation.

## Infrastructure

- `infra/` : définitions d’environnements, déploiement, observabilité, sauvegardes et reprise.
- `.github/workflows/` : validation CI sans secret de production.
- `docs/` : décisions techniques locales et liens vers le dépôt documentaire.

La vue technique des frontières, dépendances et flux financiers se trouve dans [`docs/architecture.md`](docs/architecture.md).

## Principes obligatoires

- TypeScript strict lorsque la technologie le permet.
- Architecture modulaire et dépendances orientées vers le domaine.
- Montants financiers stockés en unités mineures avec entiers.
- Ledger en partie double pour les mouvements financiers.
- Idempotence obligatoire pour les opérations financières et webhooks.
- Aucun secret versionné ; uniquement des fichiers `.env.example` sans valeur réelle.
- Environnements Démo, Recette et Production séparés.
- RBAC/ABAC, moindre privilège, double validation et audit pour actions sensibles.
- Multi-pays, multi-devise, multi-langue et configuration administrable.
- CI obligatoire avant fusion.

## Démarrage cible

```bash
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Pour exécuter la validation complète du monorepo :

```bash
pnpm validate
```

Copier `.env.example` vers `.env` uniquement en local. Les valeurs réelles doivent provenir d’un gestionnaire de secrets en environnement hébergé.

## Règle pour Codex et VS Code IA

Avant de générer un module, lire l’inventaire produit, la spécification de l’application concernée, les règles métier, les contrats API, le modèle de données et les critères d’acceptation dans `mansa-docs`. Ne pas supprimer un produit parce que son squelette n’est pas encore implémenté.

## État

Le dépôt est en construction progressive. Les cinq applications mobiles, les trois interfaces web, le backend, les services IA, les workers, les packages partagés et l’infrastructure font partie du périmètre obligatoire.

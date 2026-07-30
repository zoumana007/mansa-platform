# Mansa Platform

Monorepo technique de la plateforme fintech Mansa.

## Applications prévues

- `apps/api-gateway` : API NestJS et orchestration métier.
- `apps/admin-web` : portail d’administration Next.js.
- `apps/public-web` : site public Next.js.
- `apps/mobile-client` : application client React Native.
- `apps/mobile-merchant` : application commerçant React Native.
- `apps/mobile-admin-lite` : administration mobile React Native.
- `apps/mobile-directory` : annuaire et découverte React Native.
- `apps/tpe-android` : application terminal de paiement Android.

## Paquets partagés

- `packages/config` : configurations TypeScript, ESLint et outils.
- `packages/contracts` : contrats, DTO, événements et schémas partagés.
- `packages/domain` : primitives métier indépendantes des frameworks.
- `packages/ui` : composants d’interface partagés lorsque pertinent.

## Principes

- TypeScript strict.
- Architecture modulaire et dépendances orientées vers le domaine.
- Montants financiers stockés en unités mineures avec entiers.
- Idempotence obligatoire pour les opérations financières.
- Aucun secret versionné.
- Environnements Démo, Recette et Production séparés.
- CI obligatoire avant fusion.

## Démarrage

```bash
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Copier `.env.example` vers `.env` uniquement en local. Les valeurs réelles doivent provenir d’un gestionnaire de secrets en environnement hébergé.

## État

Le dépôt est en phase de construction progressive. La documentation de référence est conservée dans `zoumana007/mansa-docs`.

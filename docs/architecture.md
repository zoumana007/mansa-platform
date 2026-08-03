# Architecture technique de Mansa

Ce document décrit l’architecture réellement visée par le monorepo `mansa-platform`. La spécification fonctionnelle détaillée reste dans `zoumana007/mansa-docs`, notamment le volume 1.

## Modèle d’évolution

Le backend démarre comme un monolithe modulaire NestJS afin de conserver des transactions simples, une observabilité homogène et un coût d’exploitation maîtrisé. Un domaine ne doit être extrait en service autonome que lorsqu’une contrainte mesurable le justifie : charge, isolation réglementaire, cycle de livraison indépendant ou besoin de résilience spécifique.

## Frontières principales

### Applications

- `apps/api-gateway` : API HTTP versionnée, authentification, autorisation et orchestration.
- `apps/workers` : traitements asynchrones, rapprochements, notifications et tâches planifiées.
- `apps/ai-services` : services IA contrôlés, sans accès direct non autorisé aux données sensibles.
- `apps/admin-web`, `apps/public-web`, `apps/business-web` : interfaces web.
- `apps/mobile-client`, `apps/mobile-merchant`, `apps/mobile-admin-lite`, `apps/mobile-directory` : applications mobiles.
- `apps/tpe-android` : application terminal Android et couche matérielle isolée.

### Paquets partagés

- `packages/domain` : invariants métier indépendants des frameworks.
- `packages/contracts` : DTO, événements, erreurs publiques et enveloppes d’API.
- `packages/security` : politiques d’autorisation et primitives de sécurité.
- `packages/observability` : corrélation, logs structurés, métriques et traces.
- `packages/config` : configurations d’outillage sans secrets.
- `packages/ui` : composants visuels réellement mutualisables.

## Règles de dépendance

1. Les frontends ne dépendent jamais de Prisma ni de PostgreSQL.
2. `packages/domain` ne dépend d’aucune application ni d’un framework web.
3. `packages/contracts` expose uniquement des formats sérialisables et versionnés.
4. Les applications consomment les paquets partagés par leur API publique, jamais par import profond.
5. Les intégrations banques, Mobile Money, cartes, SMS, e-mail et identité passent par des ports et adaptateurs.
6. Les secrets et valeurs de production ne sont jamais stockés dans Git.

## Flux financier de référence

1. La requête reçoit un identifiant d’idempotence.
2. L’identité, les autorisations, les limites et l’état KYC sont contrôlés.
3. Une intention de transaction est créée.
4. Le grand livre applique les écritures en partie double dans une transaction atomique.
5. L’appel partenaire éventuel est exécuté avec délai d’expiration, réessais bornés et coupe-circuit.
6. Le résultat et les événements sont persistés.
7. Les notifications, webhooks et rapprochements sont traités de manière asynchrone.
8. Chaque transition sensible est auditée avec un identifiant de corrélation.

## Données et cohérence

- Les montants sont stockés en unités mineures avec des entiers.
- Une écriture financière validée n’est jamais modifiée silencieusement ; une correction utilise une écriture compensatoire.
- Les événements externes sont dédupliqués.
- Les opérations longues publient un état explicite et reprenable.
- Les lectures analytiques sont séparées progressivement des transactions opérationnelles.

## Validation obligatoire

La commande racine de référence est :

```bash
pnpm validate
```

Elle doit couvrir le registre produit, le formatage, le lint, le typage, les tests et le build. Un nouveau workspace doit fournir les scripts pertinents pour être automatiquement inclus dans cette validation.

## Références documentaires

- `mansa-docs/volume-01-socle-technique/01-vision-et-perimetre.md`
- `mansa-docs/volume-01-socle-technique/02-architecture-cible.md`
- `mansa-docs/volume-01-socle-technique/03-structure-du-monorepo.md`
- `mansa-docs/volume-10-tests-documentation-roadmap/02-matrice-de-recette-transverse.md`

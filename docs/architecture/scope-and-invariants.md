# Périmètre technique et invariants Mansa

Ce document relie le socle du monorepo à la spécification `mansa-docs/volume-01-socle-technique/01-vision-perimetre-et-principes.md`.

## Responsabilités du monorepo

- `apps/api-gateway` : API publique et interne, authentification, orchestration et exposition des contrats.
- `apps/workers` : traitements asynchrones, files d’événements, notifications et tâches planifiées.
- `apps/ai-services` : services IA isolés pour Jini, support, fraude et recommandations.
- `packages/contracts` : DTO, événements, schémas et contrats versionnés.
- `packages/domain` : primitives métier sans dépendance aux frameworks.
- `packages/security` : autorisations, politiques et contrôles réutilisables.
- `packages/observability` : corrélation, logs structurés, métriques et traces.
- `infra` : définitions d’environnements, déploiement, sauvegardes et observabilité.

## Invariants obligatoires

1. Les montants sont stockés en unités mineures avec des entiers.
2. Les écritures financières suivent un grand livre en partie double.
3. Toute opération financière ou webhook est idempotent.
4. Toute action sensible est autorisée et auditée.
5. Aucun secret réel n’est versionné.
6. Les environnements Démo, Recette et Production sont séparés.
7. Toute intégration externe passe par un adaptateur.
8. Les contrats exposés sont versionnés.
9. Une fonction, un compte, un partenaire ou un pays doit pouvoir être bloqué sans redéploiement complet.
10. La validation locale et CI doit utiliser la commande racine `pnpm validate`.

## Règle de cohérence documentaire

Une modification de responsabilité, de chemin, de contrat partagé ou d’invariant doit mettre à jour ce fichier et le volume correspondant de `mansa-docs` dans le même lot logique.
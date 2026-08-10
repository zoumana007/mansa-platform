# Mansa Platform

Ce dépôt contient le socle technique exécutable de Mansa. La documentation produit et d’architecture détaillée vit dans le dépôt `mansa-docs`.

## Principes

- aucun secret réel dans Git ;
- séparation stricte entre contrats partagés, logique métier, persistance et exposition HTTP ;
- opérations financières idempotentes et auditables ;
- isolation tenant appliquée dans les requêtes de persistance, pas seulement après lecture ;
- intégrations externes derrière des adaptateurs ;
- migrations PostgreSQL versionnées et contrôlées.

## Grand livre financier

Le contrat de transport interne est défini dans `packages/contracts/src/ledger-api.ts`. Il expose les routes internes de publication, lecture, compensation, consultation de compte, solde et écritures. Le package `@mansa/contracts` publie explicitement les sous-chemins `./ledger` et `./ledger-api`.

Les invariants du ledger disposent de tests runtime dans `packages/contracts/test/ledger.test.mjs`. Le script de test du package compile d’abord les contrats puis exécute `node --test`, afin que les tests puissent importer les fichiers JavaScript générés sans dépendre d’artefacts déjà présents dans le dépôt.

Le backend contient désormais la persistance PostgreSQL de référence, les lectures compte/solde/écritures avec pagination keyset, la publication et la compensation atomiques, les protections de routes internes ainsi que le cycle de livraison outbox. L’outbox sait réclamer un lot avec bail, marquer les succès, replanifier les échecs, appliquer un backoff exponentiel borné avec jitter, exécuter un worker périodique sans chevauchement, exposer un snapshot local d’observabilité et identifier les événements ayant épuisé leur budget de tentatives comme dead-letters opérationnelles. Ces dead-letters peuvent être listées sans sélectionner leur payload puis remises explicitement en file par une opération bornée. Le worker est maintenant câblé au cycle de vie NestJS avec configuration runtime validée, reste désactivé par défaut et refuse de démarrer si aucun publisher réel n’est lié. La remise en file manuelle est désormais couplée atomiquement à `OperationalAuditLog` dans une transaction Prisma/PostgreSQL : acteur, motif, corrélation, ressource et seuil opérationnel sont persistés dans la même unité transactionnelle, et un échec d’audit annule la mutation. L’identité de workload attestée, le broker définitif, l’export des métriques/alertes et les validations PostgreSQL/concurrence restent à terminer avant toute utilisation réelle. La spécification fonctionnelle et le contrat d’intégration sont documentés dans `mansa-docs/volume-01-socle-technique/09-grand-livre-et-integrite-financiere.md`, `mansa-docs/volume-01-socle-technique/10-contrat-api-ledger.md`, `mansa-docs/volume-01-socle-technique/12-outbox-transactionnelle.md`, `mansa-docs/volume-01-socle-technique/13-cablage-runtime-worker-outbox.md` et `mansa-docs/volume-01-socle-technique/14-audit-operationnel-dead-letter.md`.

## Rapprochement financier

Les contrats partagés `@mansa/contracts/reconciliation` et `@mansa/contracts/reconciliation-api` définissent les lots, items, motifs d’écart, résolution et routes de consultation. Le moteur de comparaison pur couvre les transactions manquantes, doublons fournisseur, différences de devise, montant et statut ainsi que le résumé déterministe d’un lot.

La persistance PostgreSQL de référence est engagée dans `apps/api-gateway/prisma/schema.prisma` avec `ReconciliationBatch` et `ReconciliationItem`, accompagnés d’une migration versionnée. `organizationId` est désormais matérialisé sur les lots et les items. L’unicité d’import est scoppée par `(organizationId, providerId, sourceFingerprint)` et l’idempotence de résolution par `(organizationId, resolutionIdempotencyKey)`.

Le repository `apps/api-gateway/src/reconciliation/reconciliation.repository.ts` exige maintenant explicitement la portée d’organisation pour les imports, recherches idempotentes, lectures, listes paginées et résolutions. La portée est appliquée dans les requêtes Prisma elles-mêmes. Un identifiant appartenant à un autre tenant est donc traité comme absent ; les résolutions inter-tenant ne créent ni mutation ni audit. Les items créés héritent explicitement de l’`organizationId` du lot et les audits de résolution conservent cette portée dans leurs métadonnées.

Le contrôleur interne exige également un `organizationId` explicite sur toutes les routes de rapprochement. Cette exigence est une étape transitoire de sûreté derrière `InternalServiceGuard`, en attendant une identité workload attestée qui fournira la portée autorisée sans faire confiance à une valeur arbitraire en production.

Les tests de contrôleur couvrent l’absence de portée, la propagation de l’organisation et les comportements `404/400`. La recette PostgreSQL couvre l’isolation lecture/liste, l’idempotence d’import par tenant, la coexistence d’une même source dans deux organisations, la pagination scoppée et le refus d’une résolution inter-tenant. La prochaine tranche doit ajouter les filtres de consultation prévus par le contrat partagé puis sérialiser strictement les réponses HTTP vers les DTO publics avant d’aborder identité workload attestée, métriques/alertes et premiers adaptateurs partenaires réels.

Les spécifications correspondantes se trouvent dans `mansa-docs/volume-08-donnees-analytics/10-moteur-rapprochement-financier.md`, `mansa-docs/volume-08-donnees-analytics/11-validation-postgresql-rapprochement.md` et `mansa-docs/volume-08-donnees-analytics/12-isolation-tenant-rapprochement.md`.

## Accès, mobilité et cartes multiservices

Le socle partagé expose désormais les contrats `@mansa/contracts/access-mobility` et `@mansa/contracts/access-mobility-api`. Ils séparent le moyen d’identification (`AccessCredential`) du droit métier (`AccessEntitlement`) et couvrent NFC, RFID UHF, QR, plaque et jeton d’appareil pour les cas d’usage péage, parking, transport public, campus, badge employé, flotte carburant, restauration et événementiel.

Le moteur de décision reste indépendant du fabricant du lecteur ou de la barrière. Les périphériques physiques devront être intégrés par adaptateurs, tandis que les règles, limites, statuts, décisions et audits restent côté plateforme. La spécification fonctionnelle se trouve dans `mansa-docs/volume-06-module-etat/05-acces-mobilite-cartes-multiservices.md`.

## Démarrage cible

```bash
corepack enable
pnpm install
pnpm build
pnpm test
```

Les tests PostgreSQL d’intégration sont opt-in et nécessitent une base dédiée ainsi que `RUN_POSTGRES_TESTS=1`.

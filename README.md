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

Le backend contient désormais la persistance PostgreSQL de référence, les lectures compte/solde/écritures avec pagination keyset, la publication et la compensation atomiques, les protections de routes internes ainsi que le cycle de livraison outbox. L’outbox sait réclamer un lot avec bail, marquer les succès, replanifier les échecs, appliquer un backoff exponentiel borné avec jitter, exécuter un worker périodique sans chevauchement, exposer un snapshot local d’observabilité et identifier les événements ayant épuisé leur budget de tentatives comme dead-letters opérationnelles. Ces dead-letters peuvent être listées sans sélectionner leur payload puis remises explicitement en file par une opération bornée. Le worker est câblé au cycle de vie NestJS avec configuration runtime validée, reste désactivé par défaut et refuse de démarrer si aucun publisher réel n’est lié. La remise en file manuelle est couplée atomiquement à `OperationalAuditLog` dans une transaction Prisma/PostgreSQL : acteur, motif, corrélation, ressource et seuil opérationnel sont persistés dans la même unité transactionnelle, et un échec d’audit annule la mutation.

Le contrat d’identité workload, sa validation, son guard d’authentification, le guard de scopes fail-closed et un verifier HMAC strict sont maintenant présents. Le rapprochement est le premier domaine interne migré vers cette identité attestée. La généralisation au Ledger et aux routes opérations, le broker définitif, l’export des métriques/alertes et les validations PostgreSQL/concurrence complémentaires restent nécessaires avant toute utilisation réelle. La spécification fonctionnelle et le contrat d’intégration sont documentés dans `mansa-docs/volume-01-socle-technique/09-grand-livre-et-integrite-financiere.md`, `mansa-docs/volume-01-socle-technique/10-contrat-api-ledger.md`, `mansa-docs/volume-01-socle-technique/12-outbox-transactionnelle.md`, `mansa-docs/volume-01-socle-technique/13-cablage-runtime-worker-outbox.md`, `mansa-docs/volume-01-socle-technique/14-audit-operationnel-dead-letter.md` et `mansa-docs/volume-01-socle-technique/15-identite-et-autorisation-workload.md`.

## Identité des workloads internes

Le package `@mansa/contracts/workload-identity` définit une identité normalisée de service à service avec `workloadId`, `organizationId`, scopes, dates d’émission/expiration et `tokenId`. Les credentials ont une durée bornée et sont validés avant création du contexte applicatif.

`WorkloadIdentityVerifier` isole la vérification cryptographique brute. L’implémentation actuelle `HmacWorkloadIdentityVerifier` vérifie un JWT HS256, exige un secret d’au moins 32 octets, contrôle issuer et audience, refuse les algorithmes inattendus et compare la signature avec `timingSafeEqual`. Les tests couvrent signature valide, altération, algorithme non supporté, issuer/audience invalides et configuration faible.

`WorkloadIdentityGuard` extrait le bearer credential, délègue la vérification, applique le contrat partagé et n’attache à la requête que le contexte normalisé. `WorkloadScopeGuard` et `RequireWorkloadScopes(...)` appliquent ensuite l’autorisation de façon fail-closed : une route sans politique déclarée est refusée, comme une requête sans contexte ou avec un scope manquant.

Le rapprochement utilise maintenant ce socle en runtime. Les lectures exigent `reconciliation:read`, la résolution exige `reconciliation:write`, la portée tenant est dérivée de `request.workloadIdentity.organizationId` et l’acteur d’une résolution du `workloadId` attesté. Les routes migrées ne dépendent plus d’un `organizationId` fourni librement par l’appelant.

Le verifier HMAC reste un mécanisme de socle interne. Avant une généralisation de production distribuée, il faut définir par ADR le mécanisme d’identité définitif, mettre en place rotation/révocation, stratégie anti-rejeu distribuée et observabilité de sécurité. Un simple cache mémoire local ne doit pas être considéré comme une protection anti-rejeu suffisante sur plusieurs instances.

## Rapprochement financier

Les contrats partagés `@mansa/contracts/reconciliation` et `@mansa/contracts/reconciliation-api` définissent les lots, items, motifs d’écart, résolution et routes de consultation. Le moteur de comparaison pur couvre les transactions manquantes, doublons fournisseur, différences de devise, montant et statut ainsi que le résumé déterministe d’un lot.

La persistance PostgreSQL de référence est engagée dans `apps/api-gateway/prisma/schema.prisma` avec `ReconciliationBatch` et `ReconciliationItem`, accompagnés d’une migration versionnée. `organizationId` est matérialisé sur les lots et les items. L’unicité d’import est scoppée par `(organizationId, providerId, sourceFingerprint)` et l’idempotence de résolution par `(organizationId, resolutionIdempotencyKey)`.

Le repository `apps/api-gateway/src/reconciliation/reconciliation.repository.ts` exige explicitement la portée d’organisation pour les imports, recherches idempotentes, lectures, listes paginées et résolutions. La portée est appliquée dans les requêtes Prisma elles-mêmes. Un identifiant appartenant à un autre tenant est donc traité comme absent ; les résolutions inter-tenant ne créent ni mutation ni audit. Les items créés héritent explicitement de l’`organizationId` du lot et les audits de résolution conservent cette portée dans leurs métadonnées.

Les filtres prévus par le contrat partagé sont appliqués au niveau repository : fournisseur, statut et période pour les lots ; fournisseur, statut, motif d’écart, références et fenêtre de création pour les items. Ils restent cumulables avec la pagination keyset et l’isolation organisationnelle.

Le contrôleur interne est maintenant protégé par `WorkloadIdentityGuard` et `WorkloadScopeGuard`. Toutes les lectures tirent la portée organisationnelle de l’identité attestée ; la résolution utilise la même portée et renseigne l’acteur depuis `workloadId`. Les scopes `reconciliation:read` et `reconciliation:write` séparent explicitement lecture et mutation.

Les réponses HTTP ne renvoient pas directement les modèles Prisma. `reconciliation.presenter.ts` sérialise les lots vers `ReconciliationBatchSummary` et les items vers `ReconciliationItem`, convertit les dates en ISO 8601, vérifie les montants `bigint` avant conversion et exclut les champs internes tels que `organizationId`, empreintes de source/ligne, métadonnées et clés d’idempotence de résolution.

Les tests de contrôleur couvrent la propagation du tenant attesté, les filtres, la validation des enums/dates, les comportements `404/400`, les scopes et l’absence de fuite des champs Prisma internes. La recette PostgreSQL couvre l’isolation lecture/liste, l’idempotence d’import par tenant, la coexistence d’une même source dans deux organisations, la pagination scoppée et le refus d’une résolution inter-tenant.

La prochaine tranche de rapprochement doit ajouter l’observabilité opérationnelle (métriques et alertes) puis des adaptateurs partenaires derrière un contrat strict, sans inventer de schéma fournisseur avant disponibilité d’un format réel ou d’une sandbox officielle.

Les spécifications correspondantes se trouvent dans `mansa-docs/volume-08-donnees-analytics/10-moteur-rapprochement-financier.md`, `mansa-docs/volume-08-donnees-analytics/11-validation-postgresql-rapprochement.md`, `mansa-docs/volume-08-donnees-analytics/12-isolation-tenant-rapprochement.md`, `mansa-docs/volume-08-donnees-analytics/13-filtres-et-contrats-http-rapprochement.md` et `mansa-docs/volume-01-socle-technique/15-identite-et-autorisation-workload.md`.

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

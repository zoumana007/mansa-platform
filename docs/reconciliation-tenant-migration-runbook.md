# Rapprochement — runbook de migration isolation tenant

Ce runbook accompagne `docs/reconciliation-tenant-isolation.md` et la documentation fonctionnelle `mansa-docs/volume-08-donnees-analytics/13-migration-isolation-tenant-rapprochement.md`.

## Objectif de la tranche

La prochaine tranche de code doit rendre l’isolation organisationnelle déployable sans casser les données de développement existantes ni créer une fenêtre de lecture globale.

Le déploiement est volontairement découpé : structure, backfill contrôlé, double écriture, lecture scoppée, mutation scoppée, puis suppression de la compatibilité historique.

## Étape 1 — ajout structurel

Modifier `apps/api-gateway/prisma/schema.prisma` :

```prisma
model ReconciliationBatch {
  organizationId String
  // ...

  @@unique([organizationId, providerId, sourceFingerprint])
  @@index([organizationId, status, createdAt])
  @@index([organizationId, providerId, status, createdAt])
  @@index([organizationId, periodStart, periodEnd])
}

model ReconciliationItem {
  organizationId String
  // ...

  @@index([organizationId, batchId, status])
  @@index([organizationId, batchId, mismatchReason])
  @@index([organizationId, internalReference])
  @@index([organizationId, providerReference])
  @@index([organizationId, createdAt, id])
}
```

Pour une base déjà peuplée, la migration SQL ne doit pas ajouter directement un `NOT NULL` sans stratégie de backfill. En recette, préférer :

1. colonnes temporaires nullable ;
2. backfill explicite des données de test ;
3. contrôle des divergences lot/item ;
4. passage `NOT NULL` ;
5. remplacement des contraintes d’unicité.

Aucune valeur de tenant de production ne doit être inventée dans la migration.

## Étape 2 — repository

Toutes les méthodes publiques de `ReconciliationRepository` doivent exiger l’organisation :

```ts
findBatchBySource(organizationId, providerId, sourceFingerprint)
getBatch(organizationId, batchId)
getItem(organizationId, itemId)
listBatches(organizationId, query)
listItems(organizationId, batchId, query)
resolveItem({ organizationId, ...command })
```

Règles d’implémentation :

- normaliser et valider `organizationId` à l’entrée ;
- combiner toujours `organizationId` avec l’identifiant ou les filtres ;
- ne jamais faire `findUnique({ where: { id } })` pour une lecture exposée lorsque le tenant doit être vérifié ;
- l’idempotence d’import doit utiliser la clé composite tenant-aware ;
- l’idempotence de résolution doit vérifier l’organisation avant de considérer une requête comme un rejeu ;
- l’incrément de compteur du lot doit viser le lot de la même organisation ;
- les métadonnées d’audit doivent porter `organizationId` pour faciliter l’investigation.

## Étape 3 — service d’import

`ReconciliationImportService` reçoit l’organisation depuis le contexte interne appelant. Le `TestReconciliationProviderAdapter` reste responsable uniquement de la normalisation fournisseur et ne décide jamais du tenant.

Signature cible :

```ts
importTestProviderSource(
  organizationId: string,
  source: ProviderReconciliationSource,
  internalRows: readonly InternalReconciliationRow[],
)
```

Le fingerprint de source reste calculé à partir de la source normalisée. Il ne doit pas inclure `organizationId` : la séparation est assurée par la clé composite de persistance.

## Étape 4 — frontière HTTP interne

Pendant la phase transitoire, l’organisation peut être explicitement transportée par une en-tête ou un contexte interne attesté. Elle ne doit pas être lue depuis le payload fournisseur.

La cible est une résolution depuis l’identité workload et les autorisations du service appelant.

Comportement inter-tenant recommandé : retourner `404` pour une ressource appartenant à un autre tenant afin de ne pas révéler son existence.

## Étape 5 — pagination et curseurs

La condition de curseur est toujours ajoutée à une condition tenant :

```text
organizationId = tenant courant
AND
condition keyset(createdAt, id)
```

Un curseur ne contient pas besoin de secret mais ne constitue jamais une autorisation. Même un curseur fabriqué ou réutilisé doit rester incapable de récupérer une ligne étrangère.

## Étape 6 — résolution atomique

Dans une seule transaction PostgreSQL :

1. rechercher le rejeu tenant-aware ;
2. charger l’item dans l’organisation ;
3. vérifier son statut ;
4. modifier l’item ;
5. incrémenter le compteur du lot de la même organisation ;
6. écrire l’audit avec l’organisation ;
7. commit.

Si une étape échoue, aucun compteur, statut ou audit ne doit rester modifié.

## Étape 7 — tests obligatoires

Ajouter ou adapter les tests PostgreSQL :

- deux organisations importent la même source avec le même provider et obtiennent deux lots ;
- la même organisation rejoue la même source et récupère son lot existant ;
- `getBatch` et `getItem` ne voient jamais les ressources étrangères ;
- `listBatches` et `listItems` sont strictement scoppés ;
- résolution étrangère rejetée sans modification ;
- idempotency key étrangère ne produit pas de faux rejeu ;
- curseur d’une organisation ne fuit aucune donnée d’une autre ;
- compteurs et audit restent inchangés après tentative étrangère ;
- chaque item créé porte la même organisation que son lot.

## Étape 8 — contrôles SQL de recette

Avant activation :

```sql
SELECT COUNT(*) FROM "ReconciliationBatch" WHERE "organizationId" IS NULL;
SELECT COUNT(*) FROM "ReconciliationItem" WHERE "organizationId" IS NULL;

SELECT COUNT(*)
FROM "ReconciliationItem" i
JOIN "ReconciliationBatch" b ON b.id = i."batchId"
WHERE i."organizationId" <> b."organizationId";
```

Les trois résultats doivent être `0` avant suppression des chemins transitoires.

## Ordre des commits recommandé

1. `feat(reconciliation): ajouter portée organisationnelle au schéma`
2. `feat(reconciliation): scoppe repository et import par organisation`
3. `test(reconciliation): couvrir isolation tenant PostgreSQL`
4. `feat(reconciliation): scoppe routes internes et sérialisation`
5. `docs(reconciliation): valider migration isolation tenant`

Chaque commit doit rester exécutable ou explicitement appartenir à une série atomique immédiatement complétée.

## Conditions de sortie

La tranche est terminée uniquement lorsque :

- schéma et migration sont cohérents ;
- aucun repository public ne lit ou modifie sans organisation ;
- le service d’import reçoit l’organisation explicitement ;
- les tests inter-tenant passent dans PostgreSQL ;
- les anciennes contraintes globales sont supprimées ;
- les données de recette ne contiennent aucun tenant manquant ou incohérent ;
- les documents `mansa-docs` et `mansa-platform` décrivent le même comportement.

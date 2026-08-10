# Rapprochement — plan d’implémentation isolation tenant

Ce document traduit la spécification fonctionnelle de `mansa-docs/volume-08-donnees-analytics/12-isolation-tenant-rapprochement.md` en lot technique pour `mansa-platform`.

## État actuel

Le repository de rapprochement persiste et consulte actuellement les lots par `providerId`, `sourceFingerprint` et identifiants techniques sans portée organisationnelle obligatoire. Cette situation est acceptable uniquement dans le socle de développement actuel ; elle bloque toute intégration partenaire ou exposition réelle.

## Cible du lot

La prochaine implémentation doit introduire `organizationId` comme frontière obligatoire à tous les niveaux :

```text
contrat d’appel interne
→ service d’import
→ repository
→ PostgreSQL
→ pagination / filtres
→ résolution / audit
→ DTO de sortie
```

Aucune méthode publique du `ReconciliationRepository` ne devra permettre la lecture ou la mutation d’un lot/item sans organisation explicite.

## Modifications prévues

### Prisma

`ReconciliationBatch` :

- ajouter `organizationId String` ;
- remplacer l’unicité `(providerId, sourceFingerprint)` par `(organizationId, providerId, sourceFingerprint)` ;
- ajouter les index organisationnels pour statut, fournisseur et période.

`ReconciliationItem` :

- conserver la relation obligatoire au lot ;
- matérialiser `organizationId` pour rendre les sélections de sécurité explicites et indexables ;
- écrire la même organisation que le lot lors de l’import ;
- ajouter les index de consultation organisationnels.

La migration doit être compatible avec les bases de test existantes et ne doit contenir aucune donnée ou secret réel.

### Repository

Les signatures cibles incluent obligatoirement la portée :

```ts
findBatchBySource(organizationId, providerId, sourceFingerprint)
getBatch(organizationId, batchId)
getItem(organizationId, itemId)
listBatches(organizationId, query)
listItems(organizationId, batchId, query)
resolveItem({ organizationId, ...command })
```

L’idempotence de résolution doit être recherchée dans la même organisation avant de conclure à un rejeu ou à un conflit.

### Import

`ReconciliationImportService` doit recevoir une organisation explicite depuis un contexte interne autorisé et la transmettre au repository. Le provider adapter ne choisit jamais le tenant.

### Contrôleur

La première étape peut rendre `organizationId` explicitement requis à la frontière interne pour faciliter les tests. Cette donnée ne constitue pas à elle seule une preuve d’autorisation en production.

La cible ultérieure est de la dériver d’une identité workload attestée et de ses autorisations.

### Filtres

Pendant le même lot, implémenter les filtres déjà présents dans `@mansa/contracts/reconciliation-api` :

- lots : fournisseur, statut, bornes de période ;
- items : statut, motif d’écart, références, bornes de création.

Les conditions de filtre doivent être combinées avec `organizationId` et la condition keyset du curseur.

### DTO HTTP

Après l’isolation et les filtres, les contrôleurs ne devront plus retourner directement les objets Prisma. Une fonction de sérialisation dédiée doit exposer uniquement les champs des contrats partagés et convertir notamment les `BigInt` en nombres sûrs ou représentations prévues par le contrat.

## Tests de non-régression obligatoires

Le lot devra ajouter des tests démontrant :

- même source importable par deux organisations ;
- rejeu idempotent dans une seule organisation ;
- lecture inter-tenant impossible ;
- liste inter-tenant impossible ;
- résolution inter-tenant impossible ;
- aucune modification de compteur ou audit lors d’une tentative étrangère ;
- curseur d’une organisation inutilisable pour récupérer des lignes d’une autre ;
- filtres cumulables avec la pagination ;
- sérialisation sans champs internes.

## Ordre d’exécution recommandé

1. migration Prisma + génération client ;
2. repository scoppé ;
3. import scoppé ;
4. contrôleur et tests de contrat ;
5. tests PostgreSQL concurrence/idempotence ;
6. filtres ;
7. sérialisation DTO ;
8. mise à jour README et documentation de validation.

Aucun adaptateur partenaire réel ne doit être branché avant la réussite de ce lot.

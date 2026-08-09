# Reconciliation engine

La spécification fonctionnelle de référence est maintenue dans `zoumana007/mansa-docs`, fichier :

`volume-08-donnees-analytics/10-moteur-rapprochement-financier.md`

## Implémentation courante

Le contrat métier se trouve dans :

`packages/contracts/src/reconciliation.ts`

Le contrat HTTP se trouve dans :

`packages/contracts/src/reconciliation-api.ts`

La tranche exécutable actuelle expose :

- `compareReconciliationTransactions` ;
- `summarizeReconciliationComparisons` ;
- les statuts et motifs de rapprochement ;
- la résolution manuelle des items ;
- les contrats de lots et routes API.

## Invariants

- montants en unités mineures entières ;
- devise normalisée sur trois lettres ;
- aucun rapprochement silencieux de références fournisseur dupliquées ;
- comparaison déterministe ;
- aucune mutation des snapshots d'entrée ;
- aucun ajustement automatique du ledger pour masquer un écart ;
- résolution manuelle justifiée et auditée dans la future couche de persistance ;
- imports fournisseurs considérés comme entrées non fiables.

## Ordre de classement des écarts

1. transaction interne absente ;
2. transaction fournisseur absente ;
3. doublon fournisseur ;
4. devise ;
5. montant ;
6. statut ;
7. correspondance complète.

## Tests

Les tests runtime sont dans :

`packages/contracts/test/reconciliation.test.mjs`

Ils couvrent la normalisation, les transactions manquantes, doublons, écarts devise/montant/statut, validation des snapshots et résumé de lot.

## Prochaines étapes

- persistance PostgreSQL des lots et items ;
- import fournisseur de référence ;
- isolation tenant et contrôle d'accès ;
- audit des résolutions ;
- métriques et alertes ;
- tests PostgreSQL et concurrence ;
- branchement sur les adaptateurs de règlement réels.

# Invariants du grand livre

La spécification fonctionnelle de référence se trouve dans `zoumana007/mansa-docs`, fichier `volume-01-socle-technique/04-modele-financier-et-ledger.md`.

Ce document maintient la correspondance entre cette spécification et le code du monorepo.

## Implémentation actuelle

- `packages/domain/src/money.ts` : montants en unités mineures et devise explicite.
- `packages/domain/src/ledger.ts` : validation des écritures, devise unique par journal et équilibre débit/crédit.
- `packages/domain/src/ledger-account.ts` : identité et propriétés des comptes de grand livre.
- `packages/domain/src/ledger-balance.ts` : calcul et contrôle des soldes comptables.
- `packages/domain/src/available-balance.ts` : distinction entre solde comptable, réservé et disponible.
- `packages/domain/src/idempotency.ts` : primitives d’idempotence.
- `packages/domain/src/transaction.ts` : modèle de transaction financière.
- `packages/domain/src/transaction-state.ts` : transitions d’état autorisées.
- `packages/domain/src/transaction-outbox.ts` : publication fiable des événements.
- `packages/domain/src/fee-policy.ts` : règles de frais versionnables.

## Invariants déjà imposés par le domaine

1. Une écriture de journal contient au moins deux lignes.
2. Chaque ligne possède un compte, un sens, une devise et un montant strictement positif.
3. Toutes les lignes d’une même écriture utilisent la même devise.
4. Le total des débits est égal au total des crédits.
5. Les identifiants de journal, transaction et idempotence sont obligatoires.
6. Les montants utilisent `bigint` et non un nombre flottant.

## Règles d’implémentation pour les modules applicatifs

- Ne jamais construire directement un solde final dans un contrôleur.
- Passer par les objets du domaine avant toute persistance.
- Conserver la clé d’idempotence dans une contrainte unique adaptée au périmètre métier.
- Persister transaction, écritures et événement outbox dans une même transaction de base de données.
- Ne jamais modifier une écriture validée ; créer une contre-écriture liée.
- Vérifier les limites et autorisations avant la réservation ou le débit.
- Ne publier aucun événement externe avant la validation atomique de la base.

## Travaux restant à intégrer

- Persistance Prisma complète des journaux et lignes.
- Service applicatif atomique pour réservation, capture, annulation et remboursement.
- Contraintes SQL d’unicité et de non-modification.
- Rapprochement partenaire et comptes de suspense.
- Tests d’intégration PostgreSQL.
- Vérification périodique de l’équilibre et reconstruction des projections.

## Validation attendue

Tout nouveau flux financier doit fournir :

- un scénario nominal ;
- un test de rejeu idempotent ;
- un test de déséquilibre refusé ;
- un test d’échec partenaire ;
- un test de reprise après interruption ;
- un test de remboursement ou compensation lorsque le flux le permet.

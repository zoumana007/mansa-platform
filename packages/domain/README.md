# `@mansa/domain`

Ce paquet contient le noyau métier indépendant des frameworks de la plateforme Mansa. Il ne doit dépendre ni de NestJS, ni de Prisma, ni d’un fournisseur de paiement.

## Responsabilités actuelles

- Représentation sûre des montants avec `Money` et unités mineures entières.
- Validation des commandes de transfert.
- Exécution idempotente des transferts entre wallets.
- Détection des conflits d’identité sur une même clé d’idempotence.
- Normalisation des identifiants reçus aux frontières du domaine.
- Contrats de dépôts permettant de brancher ultérieurement PostgreSQL ou un autre stockage.

## Invariants de transfert

Un transfert valide respecte obligatoirement les règles suivantes :

1. `transferId`, `idempotencyKey`, `sourceWalletId` et `destinationWalletId` sont présents après normalisation.
2. Le wallet source et le wallet destination sont différents après normalisation.
3. Le montant est strictement positif et exprimé dans une devise explicite.
4. Une clé d’idempotence déjà utilisée avec la même commande rejoue le résultat enregistré sans nouvelle mutation.
5. Une clé d’idempotence déjà utilisée avec une commande différente provoque un conflit.
6. L’opération atomique doit retourner un identifiant de transaction non vide.
7. La date de complétion doit être valide avant toute mutation persistée.
8. Le résultat enregistré est normalisé avant d’être renvoyé.

## Frontière de persistance

Le domaine expose des interfaces et ne connaît pas la base de données. L’adaptateur persistant devra garantir dans une transaction unique :

- le verrouillage ou contrôle concurrentiel nécessaire ;
- la vérification du solde disponible ;
- l’écriture du mouvement de débit ;
- l’écriture du mouvement de crédit ;
- l’écriture des écritures du grand livre en partie double ;
- l’enregistrement du résultat d’idempotence ;
- la publication différée d’un événement via une outbox transactionnelle.

Aucun adaptateur ne doit considérer le simple enregistrement d’un solde agrégé comme une preuve comptable suffisante.

## Commandes de validation

Depuis la racine du monorepo :

```bash
pnpm --filter @mansa/domain typecheck
pnpm --filter @mansa/domain test
pnpm --filter @mansa/domain build
```

Ou pour tout le dépôt :

```bash
pnpm validate
```

## Règles d’évolution

- Ajouter un test pour chaque nouvel invariant ou erreur métier.
- Ne pas introduire de dépendance vers une application ou un framework.
- Ne jamais utiliser de nombre flottant pour un montant financier.
- Ne jamais journaliser de secret, jeton ou donnée KYC réelle.
- Documenter dans `mansa-docs` toute modification du comportement public du domaine.

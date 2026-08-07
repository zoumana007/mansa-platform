# Catalogue des contrats partagés

Ce document décrit les règles d'utilisation de `@mansa/contracts` dans le monorepo Mansa.

## Objectif

Le package `packages/contracts` constitue la frontière stable entre les applications, l'API, les workers et les adaptateurs partenaires. Il contient uniquement des types, constantes, validateurs déterministes et contrats de transport sans dépendance à NestJS, React Native, Next.js, une base de données ou un fournisseur externe.

## Règles de dépendance

- Les applications consomment les contrats ; elles ne les redéfinissent pas localement.
- Le domaine ne dépend jamais d'un contrôleur, d'un ORM ou d'un SDK partenaire.
- Les montants utilisent des unités mineures entières ou des chaînes numériques lorsque la sérialisation JSON l'exige.
- Les commandes financières portent une clé d'idempotence.
- Les réponses API utilisent les enveloppes définies dans `api-response.ts`.
- Les erreurs publiques utilisent le catalogue de `api-error.ts` et ne révèlent aucune donnée interne.
- Les dates transportées par API sont des chaînes ISO 8601 en UTC.
- Les identifiants sont opaques pour les clients.

## Familles de contrats

### Identité et conformité

- identité, authentification et sessions ;
- autorisation, politiques, rôles et séparation des tâches ;
- KYC et vérification documentaire ;
- audit et corrélation.

### Finance

- argent et devises ;
- grand livre en partie double ;
- portefeuilles ;
- transferts et bénéficiaires ;
- paiements, demandes de paiement et historique ;
- frais, commissions, limites et routage ;
- remboursements, litiges, réconciliation et règlements.

### Produits

- cartes ;
- épargne, budgets et abonnements ;
- commerçants, terminaux et annuaire ;
- catalogue, commandes, inventaire et facturation ;
- fidélité et promotions.

### Plateforme

- administration ;
- notifications et support ;
- webhooks et intégrations ;
- services publics ;
- intelligence artificielle, gouvernance IA et analytics ;
- opérations et tableaux de bord.

## Conventions des fichiers API

Un fichier `*-api.ts` doit exposer au minimum :

1. un préfixe de version, généralement `/v1` ;
2. une table de routes immuable ;
3. une table de méthodes HTTP immuable ;
4. les requêtes, réponses et filtres associés ;
5. un type d'erreur compatible avec l'enveloppe commune.

Les noms de paramètres de chemin utilisent la forme `:resourceId`. Les opérations qui peuvent être rejouées exigent une clé d'idempotence. Les listes utilisent une pagination par curseur ou une pagination explicitement normalisée.

## Publication et points d'entrée

Chaque contrat API stable doit être publié de deux façons cohérentes :

- via `packages/contracts/src/api-contracts.ts`, qui constitue l'agrégat des contrats de transport ;
- via un sous-chemin explicite dans `packages/contracts/package.json` lorsqu'un consommateur doit pouvoir importer le contrat directement.

Exemple : un fichier `src/refund-api.ts` est accessible via l'agrégat `@mansa/contracts/api-contracts` et via le sous-chemin `@mansa/contracts/refund-api`.

Lorsqu'un nouveau fichier `*-api.ts` est ajouté, la même modification doit vérifier l'agrégat et la table `exports`. Un contrat présent dans l'un mais absent de l'autre est considéré comme une divergence de publication et doit être corrigé avant recette.

Les familles actuellement publiées couvrent notamment identité, KYC, ledger, wallet, paiements, transferts, cartes, épargne, budgets, abonnements, commerçants, terminaux, services publics, notifications, support, bénéficiaires, annuaire, fidélité, limites, commissions, commandes, inventaire, facturation, IA, gouvernance IA, analytics, administration, intégrations, réconciliation, règlements, remboursements, litiges, audit et webhooks.

## Compatibilité

- Une modification additive est autorisée dans une version mineure.
- La suppression ou le renommage d'un champ public nécessite une nouvelle version d'API.
- Un nouveau statut doit être traité comme inconnu par les clients anciens lorsqu'il traverse une frontière externe.
- Les contrats expérimentaux doivent être protégés par un drapeau de fonctionnalité et ne doivent pas être utilisés en Production sans décision d'architecture.

## Checklist avant fusion

- Le fichier est exporté par le point d'entrée approprié.
- Tout fichier `*-api.ts` stable est référencé par `api-contracts.ts`.
- Le sous-chemin est déclaré dans `packages/contracts/package.json` lorsqu'un import ciblé est prévu.
- L'agrégat et la table `exports` ne présentent aucune divergence connue.
- Le typecheck du package réussit.
- Les invariants déterministes possèdent des tests.
- La documentation fonctionnelle correspondante existe dans `mansa-docs`.
- Aucun secret, jeton, identifiant réel ou donnée personnelle n'est présent.

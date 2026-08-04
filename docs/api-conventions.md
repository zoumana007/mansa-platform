# Conventions API du monorepo

La spécification fonctionnelle de référence se trouve dans `mansa-docs/volume-01-socle-technique/08-conventions-api-erreurs-idempotence.md`. Ce document traduit les exigences en règles d’implémentation pour le monorepo.

## Contrats partagés

Le paquet `@mansa/contracts` contient les formes publiques utilisées par l’API Gateway, les applications et les workers. Les erreurs utilisent exclusivement :

- `API_ERROR_CODES` ;
- `ApiErrorCode` ;
- `ApiErrorDetails` ;
- `ApiErrorResponse` ;
- `isApiErrorCode`.

Les services ne doivent pas redéfinir localement une structure d’erreur concurrente.

## Pipeline HTTP attendu

Chaque requête doit suivre cet ordre logique :

1. créer ou valider `X-Request-Id` ;
2. enregistrer le contexte de corrélation sans donnée sensible ;
3. authentifier l’acteur ;
4. vérifier les permissions et obligations ;
5. valider les entrées ;
6. vérifier l’idempotence pour les commandes concernées ;
7. exécuter le cas d’usage ;
8. écrire audit, événements et métriques ;
9. retourner une réponse normalisée avec le même `X-Request-Id`.

## Traduction des erreurs

| Catégorie interne | Code public | HTTP |
| --- | --- | ---: |
| session absente ou invalide | `AUTHENTICATION_REQUIRED` | 401 |
| permission refusée | `FORBIDDEN` | 403 |
| validation de schéma ou métier | `VALIDATION_FAILED` | 400 |
| ressource absente | `RESOURCE_NOT_FOUND` | 404 |
| transition d’état impossible | `CONFLICT` | 409 |
| clé idempotente incohérente | `IDEMPOTENCY_CONFLICT` | 409 |
| limite anti-abus | `RATE_LIMITED` | 429 |
| dépendance externe indisponible | `PARTNER_UNAVAILABLE` | 503 |
| erreur non classée | `INTERNAL_ERROR` | 500 |

Une exception interne ne doit jamais être renvoyée telle quelle. La stack trace et les détails du fournisseur restent dans les logs sécurisés.

## Idempotence

L’API Gateway doit appliquer une politique commune aux paiements, transferts, remboursements, ventes TPE, règlements, services publics et webhooks.

Le stockage doit associer au minimum :

- la clé ;
- l’acteur ou le partenaire ;
- la route ou le type de commande ;
- l’empreinte canonique de la charge utile ;
- l’état de traitement ;
- la référence métier créée ;
- le statut HTTP et la réponse rejouable ;
- les dates de création et d’expiration.

La création du verrou idempotent et le début de l’effet métier doivent être protégés contre les courses concurrentes. Une contrainte unique en base est obligatoire même si un verrou distribué est également utilisé.

## Corrélation

Le `requestId` doit être propagé dans le contexte asynchrone, les logs structurés, les spans de trace, les événements et les jobs. Les références financières restent distinctes et stables sur plusieurs tentatives techniques.

## Vérifications minimales

Les tests d’intégration de l’API Gateway devront prouver que :

- le même `requestId` est retourné ;
- les réponses d’erreur respectent `ApiErrorResponse` ;
- aucune stack trace n’est exposée ;
- une commande répétée avec la même clé ne crée pas un second effet ;
- une charge utile différente avec la même clé échoue avec `IDEMPOTENCY_CONFLICT` ;
- les appels partenaires conservent la corrélation disponible.

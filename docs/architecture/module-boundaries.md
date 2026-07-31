# Frontières des modules Mansa

Document d’alignement avec `mansa-docs/volume-01-socle-technique/02-architecture-et-frontieres.md`.

## Direction des dépendances

```text
interfaces -> application -> domain
infrastructure -> application/domain ports
```

`packages/domain` ne doit importer ni NestJS, ni Prisma, ni Next.js, ni React Native, ni SDK partenaire. Les adaptateurs techniques dépendent des ports, jamais l’inverse.

## Contextes métier cibles

- identity-access
- compliance
- wallet-ledger
- payments
- merchant
- administration
- public-services
- notifications
- data-ai

Les contextes ne partagent pas leurs modèles de persistance. Ils communiquent par services publiés ou événements versionnés dans `packages/contracts`.

## Règles applicables au code

1. Les montants utilisent des entiers en unités mineures et une devise explicite.
2. Toute écriture financière passe par le ledger en partie double.
3. Toute commande financière et tout webhook possèdent une clé d’idempotence.
4. La publication fiable d’événements utilise une outbox transactionnelle.
5. Les consommateurs d’événements dédupliquent les messages.
6. Les erreurs publiques et les événements sont versionnés.
7. Les fonctions IA sont consultatives par défaut et ne modifient jamais directement un solde.
8. Les règles financières faisant autorité ne résident pas dans les interfaces mobiles ou web.
9. Toute intégration partenaire est derrière un port et dispose d’un faux de test.
10. Les actions sensibles produisent une trace d’audit corrélée.

## Contrôle progressif

À mesure que les paquets sont ajoutés, la CI doit vérifier :

- l’absence d’import de framework dans `packages/domain` ;
- l’absence de dépendance circulaire entre contextes ;
- la compatibilité des contrats publiés ;
- les tests unitaires du domaine sans infrastructure ;
- les tests d’intégration des adaptateurs ;
- l’absence de secrets détectables dans les commits.

## État actuel

Le wallet, le ledger et leurs services applicatifs constituent le premier noyau du contexte `wallet-ledger`. Les autres contextes restent des cibles obligatoires à construire sans casser les contrats déjà publiés.

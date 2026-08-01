# ADR 0001 — Socle financier et architecture modulaire

- Statut : accepté
- Portée : monorepo Mansa
- Documentation de référence : `zoumana007/mansa-docs/volume-01-socle-technique/09-decisions-architecture.md`

## Contexte

Mansa regroupe plusieurs applications mobiles et web, une API, des workers et des intégrations financières. Le socle doit éviter la duplication, préserver la cohérence des contrats et empêcher les erreurs classiques de calcul ou de livraison financière.

## Décision

1. Le dépôt reste un monorepo pnpm : applications dans `apps/`, bibliothèques dans `packages/`.
2. Les applications ne s’importent pas directement entre elles. Les contrats réutilisables appartiennent à `packages/contracts`, les primitives métier à `packages/domain` et les politiques de sécurité à `packages/security`.
3. Tous les montants utilisent des entiers en unités mineures avec un code devise explicite.
4. Toute opération comptabilisée repose sur un grand livre en partie double et des écritures immuables.
5. Les opérations financières, webhooks et consommateurs asynchrones sont idempotents.
6. Les fournisseurs externes sont isolés derrière des adaptateurs et disposent d’un mode simulé hors production.
7. Démo, Recette et Production sont séparés et n’utilisent jamais les mêmes secrets.
8. L’autorisation combine RBAC et restrictions contextuelles ABAC.
9. Les événements métier sont versionnés et corrélés.
10. Les logs structurés excluent les secrets, documents KYC et données de carte sensibles.

## Conséquences

- Un nouveau module doit exposer ses contrats avant d’ajouter son transport HTTP ou son adaptateur.
- Une dépendance circulaire entre applications ou domaines est un défaut d’architecture.
- Une opération financière utilisant `number` pour un montant non borné ou un calcul flottant doit être refusée en revue.
- Toute mutation financière doit prévoir son comportement en cas de répétition.
- Toute intégration réelle exige une configuration externe au dépôt.

## Validation

La commande de référence reste :

```bash
pnpm validate
```

Elle doit couvrir au minimum le registre produit, le formatage, le lint, le typage, les tests et la construction des espaces de travail présents.

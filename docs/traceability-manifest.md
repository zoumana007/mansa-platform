# Manifeste technique de traçabilité

Ce fichier relie les exigences du dépôt `zoumana007/mansa-docs` aux emplacements techniques du monorepo. Il ne remplace pas les spécifications fonctionnelles.

## États

- `planned` : emplacement cible identifié, implémentation absente.
- `scaffolded` : contrats ou structure initiale présents.
- `implemented` : comportement codé avec tests pertinents.
- `verified` : validations reproductibles exécutées avec succès.
- `blocked` : dépendance externe ou décision manquante documentée.

## Matrice initiale

| Exigence | Domaine | Contrats | Code responsable | Validation attendue | État |
|---|---|---|---|---|---|
| MANSA-AUTH-001 | identité | `packages/contracts` | `apps/api-gateway`, `packages/security` | tests unité, intégration et E2E | scaffolded |
| MANSA-KYC-001 | conformité | `packages/contracts` | `apps/api-gateway` | contrat fournisseur simulé et intégration | planned |
| MANSA-LEDGER-001 | grand livre | `packages/contracts` | `packages/domain`, `apps/api-gateway` | écritures équilibrées et transaction DB | scaffolded |
| MANSA-PAY-001 | paiements | `packages/contracts` | `apps/api-gateway`, `apps/workers` | idempotence, panne et reprise | planned |
| MANSA-MERCHANT-001 | commerçants | `packages/contracts` | `apps/api-gateway`, `apps/mobile-merchant` | unité et E2E | planned |
| MANSA-TPE-001 | terminaux | `packages/contracts` | `apps/tpe-android`, `apps/api-gateway` | simulateur matériel et E2E | planned |
| MANSA-ADMIN-001 | administration | `packages/contracts`, `packages/security` | `apps/admin-web`, `apps/api-gateway` | permissions et audit | planned |
| MANSA-STATE-001 | services publics | `packages/contracts` | `apps/api-gateway`, interfaces agents | anti-double paiement et audit | planned |
| MANSA-AI-001 | Jini | `packages/contracts` | `apps/ai-services`, `apps/api-gateway` | évaluation et garde-fous | planned |
| MANSA-REPORT-001 | reporting | `packages/contracts` | `apps/workers`, `apps/admin-web` | intégrité export et autorisation | planned |
| MANSA-OPS-001 | exploitation | `packages/observability` | `infra`, applications déployables | alertes, sauvegarde et reprise | planned |

## Règles de mise à jour

1. Ne passer une ligne à `implemented` que lorsque le comportement et ses tests existent.
2. Ne passer une ligne à `verified` qu’après exécution des commandes reproductibles du dépôt.
3. Toute nouvelle route publique doit être rattachée à un contrat versionné.
4. Toute opération financière doit référencer des tests d’idempotence et d’équilibrage.
5. Toute action sensible doit référencer une permission et une preuve d’audit.
6. Les chemins supprimés ou renommés doivent être corrigés dans ce manifeste dans le même commit.
7. Aucun secret, identifiant partenaire réel ou donnée personnelle ne doit apparaître dans les preuves.

## Contrôles racine cibles

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Lorsque tous les espaces de travail ne disposent pas encore d’une implémentation exécutable, la validation doit indiquer explicitement quels paquets ont été contrôlés et ne doit pas présenter une commande partielle comme une validation globale.

## Source fonctionnelle

La définition des identifiants, des colonnes obligatoires et des critères d’acceptation se trouve dans :

```text
mansa-docs/volume-10-tests-documentation-roadmap/11-matrice-tracabilite-doc-code.md
```

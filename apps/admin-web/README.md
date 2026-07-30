# @mansa/admin-web

Portail d’administration Next.js de Mansa.

## Périmètre obligatoire

- Dashboard global.
- Utilisateurs, commerçants, organisations et établissements.
- TPE, transactions, cartes, wallets et ledger.
- KYC/KYB, conformité, fraude, litiges et support.
- CMS des sites public et professionnel.
- Administration de l’Annuaire/Hub.
- Tarification, commissions, pays, devises, langues et partenaires.
- Module État, bourses, taxes, amendes et cartes étudiantes.
- IA/Jini, analytics, monitoring, incidents et feature flags.
- Environnements Démo, Recette et Production.
- RBAC/ABAC, audit et double validation.

## Exigences techniques

- Next.js App Router, React, TypeScript strict et Tailwind CSS.
- Contrats API importés depuis `packages/contracts`.
- Primitives de sécurité depuis `packages/security`.
- Design system depuis `packages/ui`.
- Aucune autorisation fondée uniquement sur l’interface : toutes les mutations sont contrôlées côté serveur.
- Aucun secret exposé au navigateur ou stocké dans le dépôt.
- Animations courtes, accessibles et désactivables ; priorité aux performances opérationnelles.

## Structure cible

```text
app/
  (auth)/
  (dashboard)/
    users/
    merchants/
    terminals/
    transactions/
    cards/
    wallets/
    compliance/
    fraud/
    disputes/
    support/
    cms/
    directory/
    state-services/
    ai/
    analytics/
    monitoring/
    settings/
components/
features/
lib/
tests/
```

## Garde-fous

Les actions financières, les changements de permissions, les exports massifs et les modifications de configuration Production doivent utiliser une confirmation renforcée, une justification, un audit et, selon la politique, une double validation indépendante.

La spécification fonctionnelle de référence se trouve dans `mansa-docs/volume-05-administration/admin-web-complet.md`.
# UI — navigation accessible

Le package `@mansa/ui` expose `createNavigationSemantics()` afin d’unifier la sémantique de navigation entre Web, mobile et interfaces spécialisées.

## Objectif

Fournir un contrat indépendant du framework pour les navigations principales, secondaires, fils d’Ariane et ensembles d’onglets, avec un état courant explicite et des règles d’accessibilité cohérentes.

## Règles

- chaque navigation possède un identifiant et un libellé non vides ;
- une navigation contient au moins un élément ;
- les types disponibles sont `primary`, `secondary`, `breadcrumb` et `tabs` ;
- les navigations classiques utilisent le rôle logique `navigation` ;
- les ensembles d’onglets utilisent le rôle logique `tablist` ;
- les identifiants d’éléments sont uniques ;
- au maximum un élément peut être courant ;
- un élément courant ne peut pas être désactivé ;
- un élément désactivé n’est pas focalisable ;
- l’élément courant expose une sémantique équivalente à `aria-current=page` pour les adaptateurs concernés ;
- les objets retournés sont immuables.

## Accessibilité

Les adaptateurs Web doivent préserver les repères de navigation, le nom accessible et l’état courant. Les applications mobiles doivent utiliser les mécanismes natifs équivalents. La position active ne doit jamais être communiquée uniquement par une couleur, une icône ou une animation.

Le focus clavier ou d’assistance doit rester déterministe. Les éléments désactivés ne doivent pas piéger le focus. La navigation doit conserver un ordre logique identique à l’ordre de lecture.

## Sécurité et UX

La structure de navigation ne doit jamais exposer de secret, identifiant sensible ou route administrative interdite à l’utilisateur. L’affichage d’un élément n’est jamais une autorisation : les contrôles RBAC/ABAC restent obligatoires côté serveur et dans les couches applicatives adaptées.

Un élément masqué ou désactivé pour des raisons de droits ne doit pas permettre de contourner les contrôles en appelant directement une route ou une API.

## Tests

`packages/ui/test/navigation.test.mjs` couvre :

- normalisation ;
- élément courant ;
- rôle des onglets ;
- élément désactivé non focalisable ;
- rejet de plusieurs éléments courants ;
- rejet d’un élément courant désactivé ;
- rejet des identifiants dupliqués ;
- rejet d’une navigation vide ;
- rejet des champs obligatoires vides.

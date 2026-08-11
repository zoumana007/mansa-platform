# UI — progression accessible

Le package `@mansa/ui` expose `createProgressSemantics()` afin d’unifier la sémantique des chargements et progressions dans les applications Web et mobiles.

## Objectif

Fournir un contrat indépendant du framework pour représenter une opération en attente, en cours, terminée ou en erreur, sans obliger chaque application à réinventer les règles d’accessibilité.

## Règles

- chaque progression possède un identifiant et un libellé non vides ;
- les états disponibles sont `idle`, `running`, `success` et `error` ;
- une progression peut être déterminée avec `value`, `min` et `max`, ou indéterminée sans valeur ;
- `max` doit être strictement supérieur à `min` ;
- une valeur déterminée doit rester dans la plage autorisée ;
- une progression indéterminée ne doit jamais exposer une fausse valeur numérique ;
- l’objet retourné est immuable.

## Annonces accessibles

Une progression en cours n’utilise pas de région live afin d’éviter l’annonce répétitive de chaque variation de pourcentage. Les adaptateurs visuels peuvent mettre à jour la valeur du composant sans provoquer d’interruptions vocales permanentes.

La réussite utilise une annonce `polite`. L’erreur utilise une annonce `assertive`, car une opération financière, un import KYC ou une synchronisation critique peut nécessiter une attention immédiate.

Les adaptateurs Web peuvent mapper le rôle logique `progressbar` et les bornes/valeurs vers les attributs ARIA correspondants. Les applications mobiles utilisent les mécanismes d’accessibilité natifs équivalents.

## Sécurité et UX

Une progression ne doit pas afficher de secret, identifiant technique sensible ou détail interne. Pour une opération financière, elle ne doit jamais simuler une réussite avant confirmation serveur. L’état `success` doit refléter un état métier confirmé, et non la simple fin d’une animation locale.

## Tests

`packages/ui/test/progress.test.mjs` couvre :

- normalisation ;
- progression déterminée ;
- progression indéterminée ;
- annonces de fin et d’erreur ;
- bornes invalides ;
- valeurs hors plage ;
- combinaisons déterminées/indéterminées incohérentes ;
- identifiant et libellé vides.

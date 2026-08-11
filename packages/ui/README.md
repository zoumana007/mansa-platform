# @mansa/ui

Fondations UI partagées et indépendantes de React pour les produits Mansa.

## Objectifs

- partager les mêmes espacements, rayons, tailles typographiques et dimensions de contrôle entre Web et mobile ;
- garder le package utilisable sans dépendance React, React Native ou Next.js ;
- imposer des rôles de couleur sémantiques au lieu d’embarquer une palette de marque arbitraire ;
- permettre à chaque produit de fournir sa palette réelle tout en conservant une structure commune ;
- centraliser les valeurs de base qui doivent rester cohérentes entre produits ;
- normaliser les règles d’interaction, d’accessibilité et de formulaire avant leur rendu par une technologie spécifique.

## Fondations exportées

Le package exporte notamment :

- `spacing` ;
- `radii` ;
- `typography` ;
- `controlSize` ;
- `motion` ;
- `createUiTheme()` ;
- `createControlSemantics()` ;
- `createFieldSemantics()` ;
- `accessibility`, `focusRing` et `interactionOpacity` ;
- les types du thème, des contrôles et des champs.

Toutes les fondations et les objets normalisés retournés sont immuables.

## Couleurs

Le package ne fixe pas encore la palette finale de marque. Une application fournit explicitement les rôles sémantiques :

- `background` ;
- `surface` ;
- `surfaceRaised` ;
- `text` ;
- `textMuted` ;
- `border` ;
- `primary` ;
- `onPrimary` ;
- `success` ;
- `warning` ;
- `danger`.

`createUiTheme()` refuse une valeur vide et retourne un thème immuable. La validation de contraste et les thèmes clair/sombre restent sous la responsabilité des produits jusqu’à ce qu’un contrat de palette officiel soit adopté.

## Interaction et accessibilité

`controlSize.minimumTouchTarget` et `accessibility.minimumTouchTarget` sont fixés à 44 pixels logiques. Les composants consommateurs doivent respecter cette valeur ou une valeur supérieure pour les zones interactives principales.

`createControlSemantics()` exige un nom accessible non vide, normalise l’intention et l’état et impose l’intention `danger` aux actions destructives. Les états `disabled` et `loading` ne sont pas considérés comme interactifs.

Les durées de `motion` sont des valeurs de référence. Les produits doivent désactiver ou réduire les animations lorsque la préférence système de réduction des mouvements l’exige.

## Formulaires

`createFieldSemantics()` fournit un contrat cross-platform pour les champs :

- `id` et `label` obligatoires et normalisés ;
- `description` et `errorMessage` optionnels ;
- états `required`, `disabled` et `readOnly` ;
- statut `error` automatique lorsqu’un message d’erreur est présent ;
- génération déterministe des références `describedBy` (`<id>-description` et `<id>-error`) ;
- refus d’un champ simultanément `disabled` et `readOnly` afin d’éviter une sémantique ambiguë.

Les adaptateurs React, React Native ou natifs sont responsables du mapping vers `aria-describedby`, `aria-invalid`, les propriétés d’accessibilité mobiles et le rendu visuel.

## Tests

Le package compile avant d’exécuter ses tests Node :

```bash
pnpm --filter @mansa/ui test
```

Les tests couvrent les fondations de thème, les primitives d’interaction, les contraintes d’accessibilité et la sémantique de formulaire.

# @mansa/ui

Fondations UI partagées et indépendantes de React pour les produits Mansa.

## Objectifs

- partager les mêmes espacements, rayons, tailles typographiques et dimensions de contrôle entre Web et mobile ;
- garder le package utilisable sans dépendance React, React Native ou Next.js ;
- imposer des rôles de couleur sémantiques au lieu d’embarquer une palette de marque arbitraire ;
- permettre à chaque produit de fournir sa palette réelle tout en conservant une structure commune ;
- centraliser les valeurs de base qui doivent rester cohérentes entre produits.

## Fondations exportées

Le package exporte :

- `spacing` ;
- `radii` ;
- `typography` ;
- `controlSize` ;
- `motion` ;
- `createUiTheme()` ;
- les types `SemanticPaletteInput` et `MansaUiTheme`.

Toutes les fondations sont immuables.

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

## Accessibilité

`controlSize.minimumTouchTarget` est fixé à 44 pixels logiques. Les composants consommateurs doivent respecter cette valeur ou une valeur supérieure pour les zones interactives principales.

Les durées de `motion` sont des valeurs de référence. Les produits doivent désactiver ou réduire les animations lorsque la préférence système de réduction des mouvements l’exige.

## Tests

Le package compile avant d’exécuter ses tests Node :

```bash
pnpm --filter @mansa/ui test
```

Le test couvre l’immuabilité des fondations, la taille tactile minimale, la normalisation du thème et le refus des couleurs sémantiques vides.

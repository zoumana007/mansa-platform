# UI — feedback accessible

Le package `@mansa/ui` expose désormais un contrat cross-platform pour les messages de feedback via `createFeedbackSemantics()`.

## Objectif

Uniformiser la sémantique des confirmations, avertissements, erreurs et informations dans les applications Web et mobiles sans imposer un framework de rendu.

## Règles

- `info`, `success` et `warning` produisent un rôle logique `status` et une annonce `polite` ;
- `error` produit un rôle logique `alert` et une annonce `assertive` ;
- une erreur est persistante par défaut afin qu’un rejet critique ne disparaisse pas sans traitement ;
- un feedback persistant ne peut pas être déclaré simultanément dismissible ;
- l’identifiant et le message sont obligatoires et normalisés ;
- les objets retournés sont immuables.

Les adaptateurs Web peuvent traduire `role` et `live` vers ARIA. Les adaptateurs mobiles doivent utiliser les mécanismes d’accessibilité équivalents de la plateforme.

## Sécurité

Un feedback ne doit jamais afficher de secret, PIN, CVV, PAN complet, jeton, clé ou détail interne exploitable. Les erreurs techniques doivent être journalisées côté serveur avec corrélation ; l’utilisateur reçoit un message compréhensible et non sensible.

## Tests

`packages/ui/test/feedback.test.mjs` couvre la normalisation, les annonces polies, les erreurs assertives et persistantes, les contraintes de dismissal et les entrées vides.

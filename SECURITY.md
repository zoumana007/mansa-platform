# Politique de sécurité

## Signaler une vulnérabilité

Ne publiez pas de vulnérabilité exploitable, de secret, de donnée personnelle ou de preuve contenant des informations sensibles dans une issue publique.

Préparez un signalement contenant :

- le composant et la version concernés ;
- les étapes minimales de reproduction ;
- l’impact estimé ;
- les conditions nécessaires à l’exploitation ;
- une proposition de correction si disponible.

Le canal privé de signalement devra être configuré avant toute ouverture publique ou mise en production du projet.

## Données interdites dans le dépôt

- mots de passe et jetons ;
- clés API et clés privées ;
- fichiers `.env` réels ;
- données KYC ou personnelles ;
- numéros de carte complets et CVV ;
- identifiants de partenaires de production ;
- sauvegardes de bases de données.

## Exigences de correction

Une vulnérabilité critique entraîne le blocage des livraisons concernées, la rotation des secrets potentiellement exposés, la conservation des preuves et une revue des composants similaires.

Toute correction de sécurité doit inclure un test empêchant la régression lorsque cela est techniquement possible.

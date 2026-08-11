# @mansa/config

Package partagé de configuration runtime pour les produits Mansa.

## Objectifs

- centraliser la validation des paramètres runtime communs ;
- éviter les valeurs implicites différentes entre applications ;
- rester indépendant de `process.env` afin d'être réutilisable par Node, React Native et outils de build ;
- refuser les configurations ambiguës ou non sûres avant le démarrage d'un produit.

## Contrat actuel

`parseRuntimeConfig()` valide et normalise :

- `environment` : `demo`, `staging` ou `production` ;
- `countryCode` : code ISO 3166-1 alpha-2 ;
- `currency` : code ISO 4217 alpha-3 ;
- `apiBaseUrl` : HTTPS obligatoire hors `localhost`/`127.0.0.1` ;
- `logLevel` : `debug`, `info`, `warn` ou `error`, avec `info` par défaut.

Le résultat retourné est immuable.

## Sécurité

Ce package ne doit jamais contenir de secret, token, mot de passe ou clé privée. Il valide uniquement des paramètres non secrets. Les secrets restent fournis par l'environnement d'exécution ou un gestionnaire de secrets adapté au produit.

## Usage

Chaque application doit construire explicitement un `RuntimeConfigInput` depuis son mécanisme propre d'injection de configuration, puis appeler `parseRuntimeConfig()` avant d'initialiser ses clients réseau ou services métier.

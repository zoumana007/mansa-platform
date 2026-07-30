# Instructions pour Codex et les IA de développement

## Sources de vérité

1. Lire `README.md`.
2. Lire le dépôt `zoumana007/mansa-docs`, en priorité `00-reference-projet/INVENTAIRE-FONCTIONNEL-COMPLET.md`.
3. Lire les contrats et décisions d’architecture du module concerné.
4. Ne jamais inventer une intégration partenaire, une règle réglementaire ou une certification.

## Méthode obligatoire

- Travailler sur un seul lot cohérent à la fois.
- Inspecter l’existant avant de créer ou remplacer un fichier.
- Préserver le code valide et éviter les refontes globales non demandées.
- Utiliser TypeScript strict et interdire les contournements par `any` non justifiés.
- Ajouter les tests dans le même changement que l’implémentation.
- Exécuter les validations disponibles avant de déclarer le lot terminé.
- Résumer les fichiers modifiés, les décisions, les tests et les limites restantes.

## Règles financières

- Tous les montants sont des entiers en unités mineures avec code devise explicite.
- Toute opération créant un mouvement d’argent est idempotente.
- Le grand livre en partie double est la source comptable ; un solde affiché ne doit pas être modifié directement.
- Les écritures validées ne sont jamais supprimées : elles sont compensées.
- Les webhooks sont authentifiés, rejouables sans doublon et journalisés.
- Les changements de frais, commissions et limites sont versionnés et auditables.

## Sécurité et données

- Aucun secret, jeton, mot de passe, document KYC réel ou donnée personnelle réelle dans Git.
- Utiliser `.env.example` avec des valeurs factices.
- Autorisation côté serveur pour chaque action ; l’interface ne constitue jamais une protection.
- Double validation pour les actions critiques définies dans la documentation.
- Journaliser les actions sensibles sans exposer les secrets ni les données complètes.
- Prévoir limitation de débit, validation d’entrée et protection contre les rejeux.

## Architecture

- Les applications ne dépendent pas directement de Prisma ou de détails d’infrastructure partagés.
- Les contrats publics sont versionnés dans `packages/contracts`.
- Les primitives métier sans dépendance framework vivent dans `packages/domain`.
- Les intégrations banques, Mobile Money, cartes, SMS, e-mail et identité sont derrière des ports/adaptateurs.
- Les environnements Démo, Recette et Production sont isolés.

## UX

- Chaque parcours doit couvrir chargement, vide, erreur, succès, hors ligne et attente de validation lorsque pertinent.
- Respecter les design tokens et l’accessibilité.
- Les animations doivent être performantes et désactivables avec la préférence de réduction des mouvements.
- Toute donnée marketing configurable doit venir de l’administration ou d’un contenu versionné, jamais être codée en dur sans raison.

## Commandes de validation attendues

```bash
corepack enable
pnpm install
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Si une commande n’existe pas encore, créer le script cohérent ou documenter précisément le blocage. Ne jamais prétendre qu’une validation a réussi sans l’avoir exécutée.

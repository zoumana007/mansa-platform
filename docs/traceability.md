# Traçabilité vers les exigences Mansa

La source fonctionnelle et d’architecture de référence est le dépôt `zoumana007/mansa-docs`. La matrice principale se trouve dans :

`volume-10-tests-documentation-roadmap/04-matrice-tracabilite.md`

## Utilisation dans ce dépôt

Chaque module significatif doit référencer les identifiants d’exigences concernés dans sa documentation locale, ses tests ou la description de sa pull request.

Exemples :

- `LED-001`, `LED-002` pour les primitives financières et le grand livre ;
- `IAM-001`, `IAM-002` pour l’authentification et les autorisations ;
- `PAY-001`, `PAY-002` pour l’idempotence et les webhooks ;
- `ADM-001`, `ADM-002` pour l’audit et la double validation ;
- `OPS-001` à `OPS-003` pour les validations d’exploitation.

## Règles de cohérence

1. Aucun module n’est déclaré terminé uniquement parce qu’il compile.
2. Le statut `Terminé` exige une implémentation, des tests, une documentation et une preuve de recette.
3. Les chemins mentionnés dans la documentation doivent exister dans le monorepo ou être marqués explicitement comme cibles à créer.
4. Les tests financiers doivent vérifier les invariants, l’idempotence et l’absence de nombres flottants pour les montants.
5. Les changements sensibles doivent prévoir l’autorisation, l’audit et, lorsque requis, le mécanisme maker-checker.
6. Aucun exemple ne doit contenir de secret ou de donnée personnelle réelle.

## Checklist de pull request

- [ ] Identifiants d’exigences indiqués.
- [ ] Contrats et modèles de données cohérents.
- [ ] Tests ajoutés ou justification documentée.
- [ ] Documentation mise à jour.
- [ ] Aucun secret ajouté.
- [ ] Migration et retour arrière décrits si la base change.
- [ ] Observabilité et journalisation prévues pour les flux critiques.

# Le Pouls 2027

Consultation citoyenne pour la présidentielle française de 2027 : un test de tribu politique, une question du jour tirée de l'actualité et des duels de second tour, avec des résultats par tribu.

Ce n'est pas un sondage : les résultats ne reflètent que les participant·es.

## Fichiers

- `index.html`, `app.js` : le site (GitHub Pages).
- `config.js` : adresse et clé publique Supabase. Vide = mode démonstration.
- `data/daily.json` : questions du jour, la plus récente en premier ; mis à jour chaque matin.
- `supabase/setup.sql` : création de la base (à exécuter une fois dans Supabase).
- `politique.html` : politique de confidentialité.

## Ajouter une question du jour

Ajouter en tête de `data/daily.json` un objet :

```json
{"date": "AAAA-MM-JJ", "qid": "dAAAAMMJJ", "text": "Faut-il … ?", "ctx": "Contexte factuel.", "theme": "santé", "origin": "actualité", "src": [["Média, date", "https://…"]]}
```

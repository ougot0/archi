# Atelier Archi

Site vitrine pour un cabinet d'architecture — statique, léger et sans dépendance
(HTML / CSS / JavaScript). Facile à héberger (GitHub Pages, Netlify, n'importe
quel serveur statique).

## Aperçu

- **Design** sobre et contemporain, typographie sérif + sans-serif, palette
  terracotta / beige.
- **Sections** : accueil (hero), chiffres clés animés, projets, savoir-faire,
  présentation de l'agence, contact.
- **Responsive** avec menu mobile.
- **Accessibilité** : lien d'évitement, navigation au clavier, `aria-*`,
  respect de `prefers-reduced-motion`.
- **Aucune dépendance** ni build : ouvrez `index.html` et c'est prêt.

## Structure

```
.
├── index.html      # Structure et contenu
├── css/
│   └── style.css   # Styles, mise en page et animations
└── js/
    └── main.js     # Menu mobile, apparition au scroll, compteurs, formulaire
```

## Lancer en local

Ouvrez simplement `index.html` dans un navigateur, ou servez le dossier :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Personnaliser

- **Textes / projets** : éditez `index.html`.
- **Couleurs / typographie** : variables CSS en haut de `css/style.css`
  (`:root`).
- **Images de projets** : les visuels sont des dégradés CSS (`.project-media--a`
  à `--f`). Remplacez-les par de vraies photos via `background-image: url(...)`.

## Formulaire de contact

Le formulaire est validé côté client uniquement (démo, pas de backend). Pour
recevoir réellement les messages, branchez-le sur un service (Formspree, Netlify
Forms, une API, etc.) dans `js/main.js`.

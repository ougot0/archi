# Alon Marec — Architecture d'intérieur

Site vitrine multi-pages pour un professionnel de l'architecture d'intérieur :
**conception d'intérieur, plans & visualisation 3D**. 100 % statique
(HTML / CSS / JavaScript), sans dépendance ni build — facile à héberger
(GitHub Pages, Netlify, OVH, etc.).

## Pages

| Page | Fichier |
|------|---------|
| Accueil | `index.html` |
| Projets (portfolio filtrable) | `projets.html` |
| Fiches projet (exemples) | `projet-appartement-levallois.html`, `projet-studio-paris.html`, `projet-restaurant.html` |
| Services (offres A→G détaillées) | `services.html` |
| À propos | `a-propos.html` |
| Méthode (6 étapes) | `methode.html` |
| Tarifs | `tarifs.html` |
| FAQ (accordéon) | `faq.html` |
| Contact (formulaire complet) | `contact.html` |
| Mentions légales | `mentions-legales.html` |
| Confidentialité & cookies | `politique-confidentialite.html` |

Fichiers communs : `css/style.css`, `js/main.js`, `favicon.svg`,
`robots.txt`, `sitemap.xml`.

## Fonctionnalités

- Design sobre et contemporain (blanc cassé, noyer, accent terracotta), grandes images.
- Menu mobile, apparition au scroll, compteurs, filtres de projets, accordéon FAQ.
- Bouton **WhatsApp** flottant + numéro cliquable.
- **Bandeau cookies** (choix mémorisé) et pages **RGPD / mentions légales**.
- SEO : `<title>` et meta description par page, URLs simples, balises `alt`,
  données structurées **LocalBusiness** et **FAQPage** (JSON-LD), `sitemap.xml`.
- Accessibilité : lien d'évitement, navigation clavier, `aria-*`,
  respect de `prefers-reduced-motion`.

## Lancer en local

```bash
python3 -m http.server 8000   # puis http://localhost:8000
```

## ⚠︎ À personnaliser avant la mise en ligne

Le contenu est un **modèle réaliste** ; remplacez les valeurs d'exemple :

- **Nom / marque** : « Alon Marec » (déduit de votre exemple d'e-mail) — à confirmer.
- **Coordonnées** : e-mail `contact@alonmarec-interiors.fr`, téléphone et
  WhatsApp `+33 6 00 00 00 00`, Instagram `@alonmarec.interiors` — tous des
  placeholders. Cherchez `33600000000`, `alonmarec-interiors.fr` et
  `alonmarec.interiors` pour les remplacer.
- **Projets** : remplacez les projets d'exemple par vos vrais projets et
  indiquez honnêtement leur statut (réalisé, client, étude, concept, 3D).
- **Images** : les visuels sont des **dégradés CSS** (placeholders). Remplacez-les
  par de vraies photos via `background-image: url(...)` sur les classes
  `.project-media--a` … `--f`, `.hero-bg`, `.about-photo`, `.gallery-media`.
- **Mentions légales & confidentialité** : complétez identité, statut,
  SIREN/SIRET, hébergeur (obligatoire en France).
- **Nom de domaine** : les URLs canoniques et le sitemap pointent vers
  `https://alonmarec-interiors.fr/` — adaptez à votre domaine définitif.

## Formulaire de contact

Le formulaire est validé **côté client** uniquement (démo, pas de backend).
Pour recevoir réellement les demandes, branchez-le sur un service
(Formspree, Netlify Forms, une API…) — voir `js/main.js`.

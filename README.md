# AM Studio — Architecture d'intérieur

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

- **Nom / marque** : « AM Studio » (déduit de votre exemple d'e-mail) — à confirmer.
- **Coordonnées** : e-mail `contact@am-studio.fr`, téléphone et
  WhatsApp `+33 6 00 00 00 00`, Instagram `@amstudio` — tous des
  placeholders. Cherchez `33600000000`, `am-studio.fr` et
  `amstudio` pour les remplacer.
- **Projets** : remplacez les projets d'exemple par vos vrais projets et
  indiquez honnêtement leur statut (réalisé, client, étude, concept, 3D).
- **Images** : les visuels sont des **dégradés CSS** (placeholders). Remplacez-les
  par de vraies photos via `background-image: url(...)` sur les classes
  `.project-media--a` … `--f`, `.hero-bg`, `.about-photo`, `.gallery-media`.
- **Mentions légales & confidentialité** : complétez identité, statut,
  SIREN/SIRET, hébergeur (obligatoire en France).
- **Nom de domaine** : les URLs canoniques et le sitemap pointent vers
  `https://am-studio.fr/` — adaptez à votre domaine définitif.

## Formulaire de contact

Le formulaire est validé **côté client** uniquement (démo, pas de backend).
Pour recevoir réellement les demandes, branchez-le sur un service
(Formspree, Netlify Forms, une API…) — voir `js/main.js`.

## Refonte 3D

- **Accueil** : modèle 3D de l'accueil Matzav Zor (`models/matzav-zor-accueil.glb`) en temps réel
  (Three.js r160 embarqué dans `js/vendor/`, sans CDN ; `js/hero-3d.js`). La caméra suit le curseur et avance au scroll ;
  pause hors écran ; repli sur l'image si WebGL est indisponible ; image fixe avec
  `prefers-reduced-motion`.
- **Vue éclatée** plan → matériaux → rendu sur l'accueil, pilotée par le scroll.
- **Cartes en relief** (inclinaison 3D + reflet au survol, souris uniquement).
- **Fiches projets** : démarche (contexte, demande, contraintes, intention, choix, matériaux),
  sections **Avant / Après** (Matzav Zor, Tiny House, Zohar en plan), planches agrandissables
  en plein écran (clic ou Entrée, Échap pour fermer).
- Tiny House : les 2 photos « avant » du couloir sont à fournir — remplacer les blocs
  `ba-missing` dans `projet-tiny-house.html` par des `<img>`.

## Visite 3D (`visite-3d.html`)

Visite à hauteur d'œil des créations : glisser pour regarder, ZQSD / WASD / flèches pour avancer
(Maj = plus vite), toucher le sol pour s'y rendre, boutons à l'écran sur mobile, plein écran.
Murs, verrière et mobilier bloquent le passage.

**Ajouter une visite** : déposer le fichier `.glb` dans `models/`, puis ajouter une entrée dans
`MODELS` en haut de `js/models-3d.js` (titre, image de couverture, fiche projet, point de départ
`spawn` et direction du regard `lookAt`). Lien direct : `visite-3d.html?m=<id>#visite`.

Les exports de logiciels de rendu (SimLab, D5, SketchUp…) sont lourds et utilisent souvent des
matières « spéculaires » que le moteur ne lit plus. Les convertir et les compresser avant de les
déposer (ex. l'appartement haussmannien : 51 Mo → 13 Mo) :

```bash
npx @gltf-transform/cli metalrough export.glb tmp.glb
npx @gltf-transform/cli optimize tmp.glb models/mon-projet.glb \
  --compress meshopt --texture-compress webp --texture-size 1024
```

Puis, dans `MODELS`, `keepMaterials: true` (matières du fichier conservées, collisions calculées
sur la géométrie réelle) et, pour l'accueil, `hero: { …, clip: 2.3, free: true }` (vue en coupe).

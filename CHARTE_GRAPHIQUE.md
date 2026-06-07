# Charte graphique — refuges.info

Identité visuelle de la nouvelle interface. Univers **montagne, refuge, randonnée,
outdoor** : naturel, robuste, lisible en plein soleil comme à la frontale. Design
**moderne** (typo expressive, coins généreux, profondeur douce) mais **sobre** : la
carte et l'information priment sur la décoration.

Thèmes **clair** et **sombre** de premier rang — le sombre n'est pas un dérivé, c'est
le compagnon nocturne / faible-luminosité (bivouac, refuge, mode batterie).

> Tous les tokens sont fournis en variables CSS prêtes à coller dans
> [src/index.css](./src/index.css). Le thème se pilote par `data-theme="light|dark"`
> sur `<html>`, avec bascule auto via `prefers-color-scheme`.

---

## 1. Principes

1. **La nature d'abord.** Verts sapin, bois/ember, pierre, glacier. Pas de couleurs
   « tech » criardes ; les accents servent l'information (eau, statut, danger).
2. **Lisible en extérieur.** Contrastes AA minimum, AAA sur le texte courant. Cibles
   tactiles ≥ 44 px. Pas de gris sur gris.
3. **Carte reine.** L'UI est une surface flottante au-dessus de la carte : verre dépoli,
   ombres douces, bords arrondis. Elle n'écrase jamais le terrain.
4. **Moderne et calme.** Typo grotesque pour les titres, beaucoup d'air, mouvements
   courts et naturels. Aucune animation gratuite.
5. **Cohérence light/dark.** Mêmes intentions sémantiques, mêmes composants ; seules
   les valeurs changent.

---

## 2. Couleurs

### 2.1 Couleurs de marque

| Rôle | Nom | Hex | Usage |
| --- | --- | --- | --- |
| Primaire | **Sapin** (Pine) | `#1E6F4C` | Actions, en-tête, refuges gardés, identité |
| Secondaire | **Braise** (Ember) | `#E8662A` | Accent chaud, cabanes, CTA secondaires, feu/bois |
| Tertiaire | **Glacier** | `#2E97C5` | Eau, liens, informations, sentiers |
| Sombre signature | **Nuit sapin** | `#0E120C` | Fond du thème sombre (charbon teinté vert) |

### 2.2 Échelles

Chaque famille va de 50 (clair) à 900 (profond). On référence toujours l'échelle, on
ne « pioche » pas un hex au hasard.

**Sapin / Pine (primaire)**

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#ECF6F0` | `#D2EBDD` | `#A6D7BC` | `#73BE97` | `#43A276` | `#22895B` | `#1E6F4C` | `#185A3E` | `#134630` | `#0C3020` |

**Braise / Ember (secondaire)**

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#FEF1E9` | `#FBDCC9` | `#F7BC98` | `#F19A66` | `#EC7C3D` | `#E8662A` | `#C9501C` | `#A23F18` | `#7C3115` | `#562210` |

**Glacier (tertiaire)**

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#EAF6FB` | `#CAE7F3` | `#98D0E8` | `#5FB4D8` | `#3399C7` | `#2E97C5` | `#1F7AA3` | `#1A6181` | `#164E66` | `#103747` |

**Pierre / Stone (neutres, légèrement chauds-verdâtres)**

| 0 | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#FFFFFF` | `#F7F8F5` | `#EDEFEA` | `#DCE0D7` | `#C3C9BC` | `#9BA294` | `#6E766A` | `#525A4E` | `#3C433A` | `#272D25` | `#161A14` | `#0E120C` |

### 2.3 Couleurs sémantiques (statut & domaine)

| Intention | Clair | Sombre | Usage métier |
| --- | --- | --- | --- |
| Succès / Ouvert | `#22895B` (sapin-500) | `#43A276` | Refuge ouvert, gardiennage en cours |
| Attention | `#E8662A` (braise-500) | `#F19A66` | Hors gardiennage, infos à vérifier |
| Danger / Fermé | `#C53A2B` | `#E8675A` | Fermé, risque (avalanche, interdiction) |
| Info / Eau | `#2E97C5` (glacier-500) | `#5FB4D8` | Points d'eau, sources, liens |
| Neutre | `#6E766A` (pierre-500) | `#9BA294` | Données secondaires, métadonnées |

### 2.4 Couleurs par type de point (marqueurs carte)

Cohérence directe avec les catégories de l'API (`type.icone` / `type_points`).

| Type de point | Couleur | Token |
| --- | --- | --- |
| Refuge gardé | Sapin `#1E6F4C` | `--pt-refuge-garde` |
| Cabane non gardée | Braise `#E8662A` | `--pt-cabane` |
| Gîte d'étape | Pourpre myrtille `#7A4FA3` | `--pt-gite` |
| Point d'eau / source | Glacier `#2E97C5` | `--pt-eau` |
| Sommet | Pierre foncée `#3C433A` | `--pt-sommet` |
| Grotte / abri / bivouac | Brun roche `#8A6A4F` | `--pt-abri` |
| Divers (ruine, bunker…) | Pierre `#6E776A` | `--pt-divers` |

---

## 3. Tokens CSS (light + dark)

À coller dans [src/index.css](./src/index.css). Le **dark** s'applique via
`prefers-color-scheme` et peut être forcé par `data-theme` sur `<html>`.

```css
:root {
  /* ---- Échelles brutes (indépendantes du thème) ---- */
  --pine-50:#ECF6F0; --pine-100:#D2EBDD; --pine-200:#A6D7BC; --pine-300:#73BE97;
  --pine-400:#43A276; --pine-500:#22895B; --pine-600:#1E6F4C; --pine-700:#185A3E;
  --pine-800:#134630; --pine-900:#0C3020;

  --ember-50:#FEF1E9; --ember-100:#FBDCC9; --ember-200:#F7BC98; --ember-300:#F19A66;
  --ember-400:#EC7C3D; --ember-500:#E8662A; --ember-600:#C9501C; --ember-700:#A23F18;
  --ember-800:#7C3115; --ember-900:#562210;

  --glacier-50:#EAF6FB; --glacier-100:#CAE7F3; --glacier-200:#98D0E8; --glacier-300:#5FB4D8;
  --glacier-400:#3399C7; --glacier-500:#2E97C5; --glacier-600:#1F7AA3; --glacier-700:#1A6181;
  --glacier-800:#164E66; --glacier-900:#103747;

  --stone-0:#FFFFFF; --stone-50:#F7F8F5; --stone-100:#EDEFEA; --stone-200:#DCE0D7;
  --stone-300:#C3C9BC; --stone-400:#9BA294; --stone-500:#6E766A; --stone-600:#525A4E;
  --stone-700:#3C433A; --stone-800:#272D25; --stone-900:#161A14; --stone-950:#0E120C;

  /* ---- Marqueurs par type de point ---- */
  --pt-refuge-garde:#1E6F4C; --pt-cabane:#E8662A; --pt-gite:#7A4FA3;
  --pt-eau:#2E97C5; --pt-sommet:#3C433A; --pt-abri:#8A6A4F; --pt-divers:#6E776A;

  /* ---- Rayons, espacement, typo, élévation (voir §4-§6) ---- */
  --radius-xs:6px; --radius-sm:8px; --radius-md:12px; --radius-lg:16px;
  --radius-xl:24px; --radius-full:999px;

  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px;
  --space-6:24px; --space-8:32px; --space-10:40px; --space-12:48px; --space-16:64px;

  --font-display:"Bricolage Grotesque","Inter",system-ui,sans-serif;
  --font-sans:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --font-mono:"IBM Plex Mono",ui-monospace,"SFMono-Regular",Menlo,monospace;

  --ease-out:cubic-bezier(.22,.61,.36,1);
  --ease-spring:cubic-bezier(.34,1.56,.64,1);
  --dur-fast:120ms; --dur-base:200ms; --dur-slow:320ms;
}

/* ===================== THÈME CLAIR ===================== */
:root, [data-theme="light"] {
  color-scheme: light;

  --bg:               var(--stone-50);     /* fond appli */
  --bg-elevated:      var(--stone-0);       /* cartes, panneaux */
  --bg-sunken:        var(--stone-100);     /* champs, zones creuses */
  --surface-glass:    rgba(255,255,255,.82);/* overlays au-dessus de la carte */
  --surface-glass-brd:rgba(22,26,20,.08);

  --text:             var(--stone-900);
  --text-muted:       var(--stone-600);
  --text-subtle:      var(--stone-500);
  --text-on-brand:    #FFFFFF;

  --border:           var(--stone-200);
  --border-strong:    var(--stone-300);

  --brand:            var(--pine-600);
  --brand-hover:      var(--pine-700);
  --brand-soft:       var(--pine-50);
  --accent:           var(--ember-500);
  --accent-hover:     var(--ember-600);
  --link:             var(--glacier-600);

  --success:#22895B; --warning:#C9501C; --danger:#C53A2B; --info:#2E97C5;

  --shadow-sm: 0 1px 2px rgba(22,26,20,.08), 0 1px 3px rgba(22,26,20,.06);
  --shadow-md: 0 2px 6px rgba(22,26,20,.10), 0 6px 16px rgba(22,26,20,.08);
  --shadow-lg: 0 8px 24px rgba(22,26,20,.14), 0 16px 48px rgba(22,26,20,.12);
  --focus-ring: 0 0 0 3px rgba(46,151,197,.45);
}

/* ===================== THÈME SOMBRE ===================== */
[data-theme="dark"] {
  color-scheme: dark;

  --bg:               var(--stone-950);     /* nuit sapin */
  --bg-elevated:      #171C15;               /* panneaux surélevés */
  --bg-sunken:        #0B0E09;
  --surface-glass:    rgba(20,25,18,.72);
  --surface-glass-brd:rgba(255,255,255,.08);

  --text:             #EAEDE6;
  --text-muted:       #A9B0A2;
  --text-subtle:      #828A7C;
  --text-on-brand:    #FFFFFF;

  --border:           rgba(255,255,255,.10);
  --border-strong:    rgba(255,255,255,.18);

  --brand:            var(--pine-400);       /* éclairci pour le contraste */
  --brand-hover:      var(--pine-300);
  --brand-soft:       rgba(67,162,118,.14);
  --accent:           var(--ember-400);
  --accent-hover:     var(--ember-300);
  --link:             var(--glacier-300);

  --success:#43A276; --warning:#F19A66; --danger:#E8675A; --info:#5FB4D8;

  --shadow-sm: 0 1px 2px rgba(0,0,0,.40);
  --shadow-md: 0 4px 12px rgba(0,0,0,.45);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.55);
  --focus-ring: 0 0 0 3px rgba(95,180,216,.50);
}

/* Bascule automatique si l'utilisateur n'a pas choisi explicitement */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
    /* …recopier le bloc [data-theme="dark"] ci-dessus… */
  }
}
```

> **Astuce d'implémentation** : pour éviter la duplication du media query, on peut
> définir les tokens sombres dans une classe utilitaire et faire pointer
> `prefers-color-scheme` dessus, ou gérer la bascule en JS (lecture de
> `localStorage` → `data-theme`), avec `prefers-color-scheme` en valeur par défaut.

---

## 4. Typographie

| Usage | Police | Graisse | Notes |
| --- | --- | --- | --- |
| Titres / display | **Bricolage Grotesque** | 600–800 | Grotesque chaleureuse, caractère « topo/affiche de parc » |
| Corps / UI | **Inter** | 400–600 | Neutre, ultra-lisible, riche en variantes |
| Données / coord. | **IBM Plex Mono** | 400–500 | Altitudes, coordonnées, tableaux GPS |

Fallback système si polices non chargées : `system-ui`. Charger via `@fontsource`
(self-hosted, pas de CDN tiers) pour la perf et la vie privée.

### Échelle typographique (ratio ~1.20, base 16 px)

| Token | Taille / interligne | Emploi |
| --- | --- | --- |
| `display` | 40 / 44 px, 800 | Hero, grands titres |
| `h1` | 32 / 38 px, 700 | Titre de page |
| `h2` | 26 / 32 px, 700 | Section |
| `h3` | 21 / 28 px, 600 | Sous-section, titre de fiche |
| `body-lg` | 18 / 28 px, 400 | Intro, description de refuge |
| `body` | 16 / 24 px, 400 | Texte courant |
| `body-sm` | 14 / 20 px, 400 | Légendes, métadonnées |
| `caption` | 12 / 16 px, 500 | Badges, labels carte |
| `mono` | 14 / 20 px, 450 | Altitude « 2410 m », `45.1149, 6.5424` |

Règles : titres en `letter-spacing:-0.01em`, capitales évitées (sauf badges
`caption` en `letter-spacing:.04em`). Largeur de lecture max ~68 caractères.

---

## 5. Espacement, rayons, grille

- **Espacement** : échelle 4 px (`--space-1`…`--space-16`). Respiration généreuse
  dans les panneaux (padding ≥ `--space-5`).
- **Rayons** : boutons/inputs `--radius-sm`/`md` ; cartes & panneaux `--radius-lg` ;
  feuilles modales / bottom-sheet `--radius-xl` ; pastilles & avatars `--radius-full`.
  Esthétique **arrondie et douce**, jamais d'angles vifs sur les surfaces flottantes.
- **Grille** : conteneur de contenu max `1200px` ; gouttières `--space-6`. Sur mobile,
  l'UI passe en **bottom-sheet** au-dessus de la carte plein écran.
- **Bordures** : 1 px `--border` ; états forts `--border-strong`. Préférer l'élévation
  (ombre) aux bordures pour détacher les surfaces de la carte.

---

## 6. Élévation, profondeur, « verre »

L'UI flotte au-dessus de la carte. Trois niveaux :

| Niveau | Ombre | Exemple |
| --- | --- | --- |
| Surface posée | `--shadow-sm` | Champ de recherche, chips |
| Panneau flottant | `--shadow-md` | Panneau de filtres, fiche latérale |
| Surcouche modale | `--shadow-lg` | Bottom-sheet, popups, dialogues |

**Effet verre dépoli** pour les overlays sur la carte :

```css
.glass {
  background: var(--surface-glass);
  border: 1px solid var(--surface-glass-brd);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(12px) saturate(1.1);
}
```

---

## 7. Iconographie & marqueurs

- **Style** : icônes **linéaires**, trait 1.75 px, bouts arrondis (jeu type
  *Lucide*). Cohérent avec le caractère humaniste de la typo.
- **Marqueurs carte** : « goutte arrondie » (pin) en couleur du type (§2.4), pictogramme
  blanc centré, halo blanc 1.5 px pour le détachement sur tout fond. Taille 28–34 px,
  ombre portée `--shadow-sm`.
- **Clusters** : pastille `--radius-full` en `--brand`, chiffre en `--text-on-brand`,
  taille croissante selon le nombre.
- **États** : ouvert = liseré `--success` ; fermé = liseré `--danger` ; sélectionné =
  agrandissement + `--focus-ring`.
- **Sélections de couches** : le champ `type.icone` de l'API alimente un **sprite** ;
  garder la même grille 24×24 pour tous les pictos.

---

## 8. Composants clés

**Boutons**
- *Primaire* : fond `--brand`, texte `--text-on-brand`, `--radius-sm`, hauteur 44 px,
  hover `--brand-hover`, focus `--focus-ring`.
- *Secondaire* : fond `--bg-elevated`, bordure `--border-strong`, texte `--text`.
- *Accent* : fond `--accent` (réservé aux actions chaudes : « Ajouter », « Itinéraire »).
- *Ghost* : transparent, texte `--brand`, hover `--brand-soft`.

**Champ de recherche** (overlay carte) : `.glass`, icône loupe `--text-subtle`,
texte `--text`, placeholder `--text-subtle`.

**Chips de filtre** (par type de point) : pastille `--radius-full`, point coloré du
type + label `caption`. Actif = fond couleur du type à 14 % + texte foncé.

**Fiche de point** : panneau latéral (desktop) / bottom-sheet (mobile), `.glass`,
en-tête avec nom (`h3`), badge de type coloré, altitude en `mono`, statut sémantique,
photos, description, lien « Voir sur refuges.info ».

**Badges de statut** : fond couleur sémantique à 14 %, texte couleur sémantique 600,
`--radius-full`, `caption` en majuscules douces.

---

## 9. Carte (MapLibre) — habillage

Deux fonds cohérents avec les thèmes :

- **Topo clair** : fond `--stone-50`, reliefs/ombrage doux, sentiers en `--glacier-600`,
  forêts en `--pine-100`, eau en `--glacier-200`. Étiquettes `--text-muted`.
- **Topo nuit** : fond `--stone-950`, ombrage très contenu, sentiers `--glacier-300`,
  eau `--glacier-800`, forêts `--pine-900`. Étiquettes `--text-muted` (sombre).

Contrôles MapLibre (zoom, géoloc, échelle) restylés en `.glass`, icônes `--text`.
Les marqueurs et popups reprennent §7 et §8. Échelle et attribution toujours visibles
(licence CC By-Sa 2.0 / ODbL — cf. [ANALYSIS.md](./ANALYSIS.md)).

---

## 10. Mouvement

- **Durées** : `--dur-fast` (survols, focus), `--dur-base` (panneaux, popups),
  `--dur-slow` (bottom-sheet, transitions de vue).
- **Courbes** : `--ease-out` par défaut ; `--ease-spring` pour l'apparition des
  marqueurs/sheets (rebond léger, « naturel »).
- **Carte** : `flyTo` fluide pour le recentrage ; marqueurs en *fade + scale* à
  l'arrivée des données.
- **Respect** : `@media (prefers-reduced-motion: reduce)` → animations réduites aux
  fondus, pas de translation ni de rebond.

---

## 11. Accessibilité

- Contraste **AA** minimum partout, **AAA** sur `body`/`body-lg`.
- Focus visible systématique (`--focus-ring`), jamais supprimé.
- Cibles tactiles ≥ 44 px ; espacement ≥ `--space-2` entre cibles.
- Ne jamais coder une information **par la couleur seule** : statut = couleur **+**
  libellé/icône (ouvert/fermé, eau, danger).
- Mode sombre pensé pour la faible luminosité (pas de blanc pur en grande surface).
- Testé clavier complet + lecteurs d'écran sur la fiche et les filtres.

---

## 12. Voix & ton

Clair, factuel, montagnard sans folklore. Tutoiement évité dans l'UI ;
phrases courtes et utiles (« 1 place », « Hors gardiennage », « Source à 50 m »).
Le français est la langue de référence (EN/ES/IT en i18n, cf. roadmap ANALYSIS.md).

---

### Récapitulatif des tokens essentiels

| Catégorie | Tokens |
| --- | --- |
| Marque | `--brand`, `--brand-hover`, `--brand-soft`, `--accent`, `--link` |
| Surfaces | `--bg`, `--bg-elevated`, `--bg-sunken`, `--surface-glass` |
| Texte | `--text`, `--text-muted`, `--text-subtle`, `--text-on-brand` |
| Sémantique | `--success`, `--warning`, `--danger`, `--info` |
| Points | `--pt-refuge-garde`, `--pt-cabane`, `--pt-gite`, `--pt-eau`, `--pt-sommet`, `--pt-abri`, `--pt-divers` |
| Forme | `--radius-*`, `--space-*`, `--shadow-*`, `--focus-ring` |
| Typo | `--font-display`, `--font-sans`, `--font-mono` |
| Mouvement | `--dur-*`, `--ease-out`, `--ease-spring` |

# Analyse de refuges.info

Document de référence pour la réécriture du front-end. Il décrit le site existant,
son périmètre fonctionnel, et **l'API publique** que la nouvelle interface réutilise
(le back-end n'est pas réimplémenté).

> Sources : le site [refuges.info](https://www.refuges.info), sa
> [documentation API](https://www.refuges.info/api/doc/), le wiki
> ([fonctionnement](https://www.refuges.info/wiki/fonctionnement),
> [format d'exportation](https://www.refuges.info/wiki/format_exportation),
> [licence](https://www.refuges.info/wiki/licence)), et le dépôt source
> [RefugesInfo/www.refuges.info](https://github.com/RefugesInfo/www.refuges.info).

---

## 1. Qu'est-ce que refuges.info ?

Plateforme **collaborative et non commerciale** de cartographie des points utiles à
la randonnée et à la montagne. Le contenu est contributif : les utilisateurs ajoutent,
modifient, commentent et vérifient les points.

Ordres de grandeur (page d'accueil) : **~8 500 points**, **~494 massifs**,
**~26 900 photos**.

### Types de contenu

- Refuges gardés
- Cabanes non gardées
- Gîtes d'étape
- Points d'eau (sources)
- Grottes, abris, bivouacs
- Structures diverses (bunkers, ruines, sommets…)

### Fonctionnalités du site actuel

- Carte interactive multi-fonds
- Recherche et filtrage de points (recherche avancée)
- Fiche détaillée par point (description, accès, équipement, photos, commentaires, météo)
- Export GPS : KMZ, KML, GPX, formats Garmin
- Contributions communautaires (ajout/édition de points et de photos)
- Forum de discussion
- Fils d'actualité (derniers points, derniers commentaires)
- Interface principalement en **français**

---

## 2. Stack du site existant (back-end conservé)

D'après le dépôt GitHub :

| Couche       | Technologie                                                  |
| ------------ | ------------------------------------------------------------ |
| Back-end     | **PHP** (~89 % du code), architecture MVC maison             |
| Base         | **PostgreSQL** (PostGIS pour la géométrie)                   |
| Front actuel | HTML / CSS / JavaScript, cartographie via **`myol`** (« My OpenLayers », surcouche d'OpenLayers) |
| Licence code | WTFPL                                                        |

Organisation du dépôt : `controlleurs/`, `modeles/`, `vues/`, `includes/`,
`ressources/`, `forum/`, `gps/`, `photos_points/`, `routes/`, `myol/`.

**Implication pour ce projet** : on ne touche pas à ce back-end. La nouvelle
interface est une SPA séparée qui consomme l'API HTTP publique ci-dessous.

---

## 3. API publique (la surface réutilisée)

Base : `https://www.refuges.info/api/`. **Lecture seule, sans authentification.**
Doc : <https://www.refuges.info/api/doc/>.

### 3.1 Points — `GET /api/bbox`, `/api/massif`, `/api/point`

Export de points. Les trois endpoints partagent les mêmes paramètres ; ils diffèrent
par le mode de sélection (emprise, massif, ou identifiant unique).

| Paramètre      | Défaut    | Description                                                            |
| -------------- | --------- | --------------------------------------------------------------------- |
| `bbox`         | `world`   | Emprise `ouest,sud,est,nord` ou `world` (endpoint `/api/bbox`)        |
| `massif`       | —         | Ids de massifs séparés par des virgules (endpoint `/api/massif`)      |
| `id`           | —         | Id unique du point (endpoint `/api/point`)                            |
| `type_points`  | —         | Ids de catégories séparés par des virgules, ou `all`                  |
| `depuis`       | `0`       | Timestamp Unix : ne renvoyer que les points modifiés depuis           |
| `nb_points`    | `250`     | Limite de résultats ; `all` pour tout                                 |
| `detail`       | `simple`  | Niveau de détail : `icone`, `simple`, `complet`, `fiche`              |
| `format`       | `geojson` | `geojson`, `kmz`, `kml`, `gml`, `gpx`, `csv`, `xml`, `rss`            |
| `format_texte` | `html`    | Format des champs texte : `bbcode`, `texte`, `markdown`, `html`       |

Niveaux de détail (GeoJSON) :

- **`icone`** : id, nom, type, coordonnées, altitude, icône
- **`simple`** : `icone` + état, places, lien vers la fiche
- **`complet`** : toutes les informations de la fiche
- **`fiche`** : `complet` + commentaires

Exemples :

```
GET /api/bbox?bbox=6.4,45.1,6.6,45.3&format=geojson&detail=simple&nb_points=250
GET /api/massif?massif=351&type_points=all&nb_points=22
GET /api/point?id=583&detail=fiche&format=geojson
```

### 3.2 Autres endpoints

| Endpoint             | Rôle                                                                |
| -------------------- | ------------------------------------------------------------------- |
| `GET /api/commentaires` | Commentaires d'un point (`id_point`, `format_texte`)             |
| `GET /api/contributions` | Contributions récentes (`type`, `massif`, `nombre`, `avec_photo`…) |
| `GET /api/polygones` | Polygones / polylignes : massifs, parcs, limites administratives    |

---

## 4. Modèle de données d'un point (GeoJSON)

Réponse type d'un point au niveau `simple` (observée en direct) :

```json
{
  "type": "Feature",
  "id": 5936,
  "geometry": { "type": "Point", "coordinates": [6.5424, 45.1149] },
  "properties": {
    "nom": "La Pierre du Déjeuner",
    "type": { "id": 7, "valeur": "cabane non gardée", "icone": "cabane_manqueunmur_eau" },
    "id": 5936,
    "coord": { "alt": 2410 },
    "sym": "Fishing Hot Spot Facility",
    "etat": { "valeur": "" },
    "places": { "nom": "Places prévues pour dormir", "valeur": 1 },
    "lien": "https://www.refuges.info/point/5936/cabane-non-gardee/la-Pierre-du-Dejeuner/"
  }
}
```

Remarques utiles pour le front :

- La position (lon/lat) est portée par `geometry.coordinates` ; `coord` ne contient
  généralement que l'altitude.
- Les champs catégoriels sont des objets `{ id, valeur, icone? }`.
- Les booléens valent `1`/`0` ; `null` signifie « absent / non pertinent ».
- `lien` pointe vers la fiche publique — utile tant qu'on n'a pas réécrit la page de fiche.

### Quelques ids de catégories (`type_points`)

| id | Catégorie                              |
| -- | -------------------------------------- |
| 1  | Sommet                                 |
| 6  | Point d'eau                            |
| 7  | Cabane non gardée                      |
| 9  | Gîte d'étape                           |
| 10 | Refuge gardé                           |
| 23 | Refuge ouvert hors période de gardiennage |

Liste non exhaustive — à compléter via la doc / les réponses `icone`.

---

## 5. Licence des données

Données refuges.info sous **CC By-Sa 2.0** ; résultats issus d'OpenStreetMap sous
**ODbL**. Toute réutilisation doit créditer refuges.info / OSM.
Voir <https://www.refuges.info/wiki/licence>.

---

## 6. Pistes pour la nouvelle interface

Implémenté dans ce dépôt (socle) :

- [x] Carte plein écran (MapLibre GL) centrée sur les Alpes
- [x] Chargement des points de l'emprise visible via `/api/bbox` (debounce sur `moveend`)
- [x] Infobulle au clic avec lien vers la fiche
- [x] Client API typé + types GeoJSON

À faire (suggestions, par ordre de valeur) :

- [ ] Icônes par type de point (sprite à partir du champ `type.icone`)
- [ ] Clustering / agrégation à bas niveau de zoom
- [ ] Panneau latéral de filtres par catégorie (`type_points`)
- [ ] Fiche détaillée (niveau `complet`/`fiche`) en panneau ou route dédiée
- [ ] Recherche (nom, massif) et géolocalisation
- [ ] Fonds de carte alternatifs (IGN, OpenTopoMap, ortho) et sélecteur de couches
- [ ] Export GPX/KML du point ou de la sélection
- [ ] Affichage des polygones de massifs (`/api/polygones`)
- [ ] i18n (FR par défaut, EN/ES/IT comme le site historique)
- [ ] PWA / mode hors-ligne pour l'usage en montagne

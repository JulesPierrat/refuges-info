# refuges.info — nouveau front-end

Réécriture de l'interface web de [refuges.info](https://www.refuges.info), la base
collaborative des refuges, cabanes non gardées, gîtes et points d'eau de montagne.

**Périmètre : le front-end uniquement.** Le back-end (base PostgreSQL, contributions,
photos, forum) n'est pas réimplémenté : cette application consomme l'[API publique
existante](https://www.refuges.info/api/doc/) en lecture seule. Voir [ANALYSIS.md](./ANALYSIS.md)
pour l'analyse complète du site actuel et de son API.

## Stack

- [Vite](https://vite.dev/) — build / dev server
- [Lit](https://lit.dev/) + TypeScript — composants web (Web Components)
- [MapLibre GL JS](https://maplibre.org/) — carte vectorielle WebGL
- API refuges.info — source de données (GeoJSON, CC By-Sa 2.0)

## Démarrage

```bash
npm install
npm run dev      # serveur de dev sur http://localhost:5173
```

Le serveur de dev proxifie `/api/*` vers `https://www.refuges.info` (voir
[vite.config.ts](./vite.config.ts)) pour éviter les problèmes de CORS.

### Scripts

| Commande            | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Serveur de développement avec HMR            |
| `npm run build`     | Type-check (`tsc`) puis build de production  |
| `npm run preview`   | Sert le build de production localement       |
| `npm run typecheck` | Vérifie les types sans émettre               |

### Configuration

En production, l'API n'est pas proxifiée. Définissez l'origine de l'API via une
variable d'environnement Vite :

```bash
# .env.production
VITE_API_BASE=https://www.refuges.info
```

## Structure

```
src/
├── main.ts                      # point d'entrée — enregistre <refuges-app>
├── index.css                    # styles globaux
├── api/
│   ├── client.ts                # client typé de l'API refuges.info (lecture seule)
│   └── types.ts                 # types des réponses GeoJSON + ids de catégories
└── components/
    ├── refuges-app.ts           # coquille de l'application (en-tête + carte)
    └── refuge-map.ts            # carte MapLibre, charge les points du viewport
```

## Fonctionnement de la carte

`<refuge-map>` charge les points dans l'emprise visible via `GET /api/bbox` puis
les recharge (avec un *debounce*) à chaque déplacement de la carte. Un clic sur un
point ouvre une infobulle avec un lien vers sa fiche sur refuges.info.

## Licence des données

Les données proviennent de refuges.info sous licence **CC By-Sa 2.0** (résultats
OpenStreetMap sous **ODbL**). Voir la [page licence](https://www.refuges.info/wiki/licence).

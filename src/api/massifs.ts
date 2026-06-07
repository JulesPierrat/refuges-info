/**
 * Massifs (mountain ranges) list, from `GET /api/polygones?type_polygon=1`.
 * Returns the 494 massifs with name, color, link and a bounding box derived
 * from their geometry (used to zoom the globe to a massif).
 */
import { API_BASE } from './config';
import type { Bbox } from './types';

export interface Massif {
  id: number;
  nom: string;
  couleur: string;
  lien: string;
  bbox: Bbox;
}

type MassifProps = { id: number; nom: string; couleur?: string; lien?: string };
type MassifFeature = GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon, MassifProps>;
export type MassifCollection = GeoJSON.FeatureCollection<
  GeoJSON.MultiPolygon | GeoJSON.Polygon,
  MassifProps
>;

function geometryBbox(geom: GeoJSON.MultiPolygon | GeoJSON.Polygon): Bbox {
  let w = 180, s = 90, e = -180, n = -90;
  const rings = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const polygon of rings)
    for (const ring of polygon)
      for (const [lng, lat] of ring) {
        if (lng < w) w = lng;
        if (lng > e) e = lng;
        if (lat < s) s = lat;
        if (lat > n) n = lat;
      }
  return [w, s, e, n];
}

let rawCache: Promise<MassifCollection> | undefined;
let listCache: Promise<Massif[]> | undefined;

/** Raw massif polygons (with geometry) — used to draw clickable contours. */
export function getMassifPolygons(signal?: AbortSignal): Promise<MassifCollection> {
  if (!rawCache) rawCache = fetchRaw(signal);
  return rawCache;
}

/** The 494 massifs as a sorted list (derived from the same cached fetch). */
export function getMassifs(signal?: AbortSignal): Promise<Massif[]> {
  if (!listCache)
    listCache = getMassifPolygons(signal).then((data) =>
      data.features
        .map((f: MassifFeature) => ({
          id: f.properties.id,
          nom: f.properties.nom.trim(),
          couleur: f.properties.couleur ?? 'var(--brand)',
          lien: f.properties.lien ?? '#',
          bbox: geometryBbox(f.geometry),
        }))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    );
  return listCache;
}

async function fetchRaw(signal?: AbortSignal): Promise<MassifCollection> {
  const res = await fetch(`${API_BASE}/api/polygones?type_polygon=1&format=geojson`, { signal });
  if (!res.ok) throw new Error(`massifs: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as MassifCollection;
  // Trim names in place so the contour labels match the list.
  for (const f of data.features) f.properties.nom = f.properties.nom.trim();
  return data;
}

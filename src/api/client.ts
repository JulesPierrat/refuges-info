/**
 * Thin typed client for the read-only refuges.info public API.
 *
 * We do NOT reimplement the backend — this front-end only consumes the existing
 * public endpoints documented at https://www.refuges.info/api/doc/.
 *
 * In development, requests go through the Vite dev-server proxy (see vite.config.ts)
 * under `/api` to avoid CORS issues. In production, set VITE_API_BASE to the
 * absolute API origin (e.g. https://www.refuges.info).
 */
import type { Bbox, DetailLevel, PointCollection, PointType } from './types';
import { API_BASE } from './config';

interface PointsQuery {
  bbox?: Bbox | 'world';
  massif?: number[];
  typesPoint?: PointType[] | 'all';
  detail?: DetailLevel;
  nbPoints?: number | 'all';
  /** Unix timestamp; only return points modified since. */
  depuis?: number;
}

function buildPointsParams(q: PointsQuery): URLSearchParams {
  const p = new URLSearchParams({ format: 'geojson', detail: q.detail ?? 'simple' });
  if (q.bbox) p.set('bbox', q.bbox === 'world' ? 'world' : q.bbox.join(','));
  if (q.massif?.length) p.set('massif', q.massif.join(','));
  if (q.typesPoint)
    p.set('type_points', q.typesPoint === 'all' ? 'all' : q.typesPoint.join(','));
  if (q.nbPoints != null) p.set('nb_points', String(q.nbPoints));
  if (q.depuis != null) p.set('depuis', String(q.depuis));
  return p;
}

async function getJson<T>(path: string, params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}/api/${path}?${params}`, { signal });
  if (!res.ok) throw new Error(`refuges.info API ${path}: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface PointComment {
  id: number;
  texte?: string;
  auteur?: string;
  /** Path under the site root, e.g. "/photos_points/51684-originale.jpeg?...". */
  photo?: string;
  date_photo?: string;
}

/** Full detail for the point panel: `complet` fields merged with `fiche` comments. */
export interface PointFull {
  id: number;
  nom: string;
  lien?: string;
  type: { id?: number | string; valeur?: string };
  coord: { alt?: number; long?: number; lat?: number };
  etat?: { valeur?: string };
  places?: { valeur?: number | null };
  acces?: { valeur?: string };
  remarque?: { valeur?: string };
  description?: { valeur?: string };
  info_comp?: Record<string, { nom?: string; valeur?: string } | undefined>;
  commentaires?: PointComment[];
}

/** Fetch a point's complete info + its comment/photo thread (two parallel calls). */
export async function getPointFull(id: number, signal?: AbortSignal): Promise<PointFull> {
  const q = (detail: DetailLevel) =>
    new URLSearchParams({ format: 'geojson', detail, id: String(id), format_texte: 'texte' });
  type FC = { features: { properties: Record<string, unknown> }[] };
  const [complet, fiche] = await Promise.all([
    getJson<FC>('point', q('complet'), signal),
    getJson<FC>('point', q('fiche'), signal),
  ]);
  const cp = complet.features?.[0]?.properties ?? {};
  const fp = fiche.features?.[0]?.properties ?? {};
  return { ...(cp as unknown as PointFull), commentaires: (fp.commentaires as PointComment[]) ?? [] };
}

/** Points within a bounding box (the map's current view). */
export function getPointsInBbox(
  bbox: Bbox,
  opts: Omit<PointsQuery, 'bbox'> = {},
  signal?: AbortSignal,
): Promise<PointCollection> {
  return getJson('bbox', buildPointsParams({ bbox, ...opts }), signal);
}

/** All points of one or more massifs. */
export function getPointsInMassif(
  massif: number[],
  opts: Omit<PointsQuery, 'massif'> = {},
  signal?: AbortSignal,
): Promise<PointCollection> {
  return getJson('massif', buildPointsParams({ massif, ...opts }), signal);
}

/** Full detail (incl. comments at `fiche`) for a single point. */
export function getPoint(
  id: number,
  detail: DetailLevel = 'complet',
  signal?: AbortSignal,
): Promise<PointCollection> {
  const p = new URLSearchParams({ format: 'geojson', detail, id: String(id) });
  return getJson('point', p, signal);
}

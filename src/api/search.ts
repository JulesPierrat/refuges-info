/**
 * Server-side point search.
 *
 * The public read API has no JSON full-text endpoint, so we use the site's own
 * search route `/point_recherche?nom=…&limite=…`, which runs the query against
 * the whole database server-side and returns an HTML result list. We parse the
 * embedded `/point/<id>/<type-slug>/…` anchors into structured results.
 *
 * Coordinates are not in the result list; resolve them on selection via
 * `getPoint(id)` from ./client.
 */
import { API_BASE } from './config';

export interface SearchResult {
  id: number;
  nom: string;
  /** Type slug from the URL, e.g. "refuge-garde", "cabane-non-gardee", "point-d-eau". */
  typeSlug: string;
  /** Human label derived from the slug. */
  typeLabel: string;
  lien: string;
}

const TYPE_LABELS: Record<string, string> = {
  'refuge-garde': 'Refuge gardé',
  'cabane-non-gardee': 'Cabane non gardée',
  'gite-d-etape': "Gîte d'étape",
  'point-d-eau': "Point d'eau",
  sommet: 'Sommet',
  'bivouac-trepied': 'Bivouac',
};

/** CSS custom property for the marker color of a type slug. */
export function colorVarForType(slug: string): string {
  if (slug.startsWith('refuge')) return 'var(--pt-refuge-garde)';
  if (slug.startsWith('cabane')) return 'var(--pt-cabane)';
  if (slug.startsWith('gite')) return 'var(--pt-gite)';
  if (slug.includes('eau')) return 'var(--pt-eau)';
  if (slug.startsWith('sommet')) return 'var(--pt-sommet)';
  if (slug.includes('bivouac') || slug.includes('abri') || slug.includes('grotte'))
    return 'var(--pt-abri)';
  return 'var(--pt-divers)';
}

function labelForSlug(slug: string): string {
  return TYPE_LABELS[slug] ?? slug.replace(/-/g, ' ');
}

export async function searchPoints(
  query: string,
  limit = 25,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ nom: query, limite: String(limit) });
  const res = await fetch(`${API_BASE}/point_recherche?${params}`, { signal });
  if (!res.ok) throw new Error(`search: ${res.status} ${res.statusText}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const results: SearchResult[] = [];
  const seen = new Set<number>();
  for (const a of doc.querySelectorAll<HTMLAnchorElement>('a[href*="/point/"]')) {
    const href = a.getAttribute('href') ?? '';
    const m = href.match(/\/point\/(\d+)\/([^/]+)/);
    if (!m) continue;
    const id = Number(m[1]);
    if (seen.has(id)) continue;
    const nom = a.textContent?.replace(/\s+/g, ' ').trim();
    if (!nom) continue;
    seen.add(id);
    const typeSlug = m[2];
    results.push({
      id,
      nom,
      typeSlug,
      typeLabel: labelForSlug(typeSlug),
      lien: href.startsWith('http') ? href : `https://www.refuges.info${href}`,
    });
  }
  return results;
}

/**
 * Composable point icons, in the spirit of the original refuges.info pictograms.
 *
 * A base shape per category (refuge, cabane, gîte, point d'eau, sommet, abri…),
 * colored, with overlays layered on top:
 *  - cheminée (fireplace)        → a chimney with smoke
 *  - nombre de lits (beds)       → the number drawn inside the shelter
 *  - manque un mur (only 3 walls)→ the body filled with hatching (rayure)
 *  - eau à proximité (water)     → a small water drop badge
 *
 * Returns SVG strings, usable both as MapLibre images and as <img> in lists.
 */

export type IconCategory =
  | 'refuge'
  | 'cabane'
  | 'gite'
  | 'eau'
  | 'sommet'
  | 'abri'
  | 'divers';

export interface IconAttrs {
  category: IconCategory;
  fire?: boolean;
  water?: boolean;
  missingWall?: boolean;
  beds?: number;
}

/** Loose shape of an API point's properties needed to build its icon. */
export interface PointIconInput {
  type?: { id?: number | string; valeur?: string };
  places?: { valeur?: number | null };
  info_comp?: Record<string, { valeur?: string } | undefined>;
}

const COLORS: Record<IconCategory, { main: string; dark: string }> = {
  refuge: { main: '#1E6F4C', dark: '#134630' },
  cabane: { main: '#E8662A', dark: '#A23F18' },
  gite: { main: '#7A4FA3', dark: '#57367A' },
  eau: { main: '#2E97C5', dark: '#1A6181' },
  sommet: { main: '#3C433A', dark: '#20251E' },
  abri: { main: '#8A6A4F', dark: '#5E4733' },
  divers: { main: '#6E776A', dark: '#444B41' },
};

export function categoryFromType(id?: number | string, valeur = ''): IconCategory {
  // The API's French `valeur` is the reliable signal (type ids are inconsistent —
  // e.g. "point d'eau" is id 23, not a refuge).
  const v = valeur.toLowerCase();
  if (/(eau|source|fontaine|puits)/.test(v)) return 'eau';
  if (/refuge/.test(v)) return 'refuge';
  if (/g[iî]te/.test(v)) return 'gite';
  if (/(grotte|abri|bivouac|tr[ée]pied|tente)/.test(v)) return 'abri';
  if (/sommet/.test(v)) return 'sommet';
  if (/cabane/.test(v)) return 'cabane';
  // Fallback by id only when the label is missing.
  switch (typeof id === 'string' ? Number(id) : id) {
    case 10:
      return 'refuge';
    case 9:
      return 'gite';
    case 7:
      return 'cabane';
    case 23:
      return 'eau';
    case 1:
      return 'sommet';
  }
  return 'divers';
}

export function categoryFromSlug(slug: string): IconCategory {
  if (slug.startsWith('refuge')) return 'refuge';
  if (slug.startsWith('cabane')) return 'cabane';
  if (slug.startsWith('gite')) return 'gite';
  if (slug.includes('eau') || slug.includes('source') || slug.includes('fontaine')) return 'eau';
  if (slug.startsWith('sommet')) return 'sommet';
  if (slug.includes('grotte') || slug.includes('abri') || slug.includes('bivouac')) return 'abri';
  return 'divers';
}

const isOui = (f?: { valeur?: string }): boolean =>
  typeof f?.valeur === 'string' && f.valeur.toLowerCase().startsWith('oui');

export function iconAttrsFromPoint(p: PointIconInput): IconAttrs {
  const ic = p.info_comp ?? {};
  return {
    category: categoryFromType(p.type?.id, p.type?.valeur),
    fire: isOui(ic.cheminee),
    water: isOui(ic.eau),
    missingWall: isOui(ic.manque_un_mur),
    beds: Number(p.places?.valeur) || 0,
  };
}

/** Stable key identifying a unique icon combination (used as map image id). */
export function iconKey(a: IconAttrs): string {
  return [
    a.category,
    a.fire ? 'f' : '',
    a.water ? 'w' : '',
    a.missingWall ? 'm' : '',
    a.beds ? `b${Math.min(a.beds, 99)}` : '',
  ].join('');
}

// ---- SVG building blocks ------------------------------------------------

function chimney(c: { dark: string }): string {
  return (
    `<rect x="26.5" y="11.5" width="3.2" height="7" rx="0.6" fill="${c.dark}" stroke="#fff" stroke-width="1"/>` +
    `<circle cx="28.4" cy="10.2" r="1.3" fill="#cfd3cb"/>` +
    `<circle cx="30.1" cy="7.8" r="1.6" fill="#cfd3cb"/>`
  );
}

function waterDrop(): string {
  return (
    `<g transform="translate(7.5 27.5) scale(0.62)">` +
    `<path d="M9 1 C15 9, 15 14, 9 17 C3 14, 3 9, 9 1 Z" fill="#2E97C5" stroke="#fff" stroke-width="1.6"/>` +
    `</g>`
  );
}

function bedsLabel(beds: number, color: string): string {
  // White digits with a colored outline read on any body fill (incl. hatching).
  return (
    `<text x="22" y="31.6" text-anchor="middle" font-family="sans-serif" font-size="11" ` +
    `font-weight="700" fill="#fff" stroke="${color}" stroke-width="0.8" paint-order="stroke">${beds}</text>`
  );
}

function buildHut(a: IconAttrs, opts: { door?: boolean; flag?: boolean }): string {
  const c = COLORS[a.category];
  const bodyFill = a.missingWall ? 'url(#hatch)' : c.main;
  const pattern = a.missingWall
    ? `<defs><pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
      `<rect width="4" height="4" fill="#fff"/><line x1="0" y1="0" x2="0" y2="4" stroke="${c.main}" stroke-width="2.2"/>` +
      `</pattern></defs>`
    : '';
  return (
    pattern +
    // body
    `<rect x="12" y="21" width="20" height="14" rx="1" fill="${bodyFill}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>` +
    // roof
    `<path d="M9 21.5 L22 9 L35 21.5 Z" fill="${c.dark}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>` +
    (opts.flag
      ? `<line x1="22" y1="9" x2="22" y2="3" stroke="#fff" stroke-width="1.6"/>` +
        `<path d="M22 3 L28.5 5 L22 7 Z" fill="#C53A2B" stroke="#fff" stroke-width="0.8"/>`
      : '') +
    (opts.door && !a.beds
      ? `<rect x="20" y="27" width="4" height="8" rx="0.5" fill="${c.dark}"/>`
      : '') +
    (a.fire ? chimney(c) : '') +
    (a.beds ? bedsLabel(a.beds, c.dark) : '') +
    (a.water ? waterDrop() : '')
  );
}

function buildDrop(): string {
  return (
    `<path d="M22 9 C31 21, 30 29, 22 34 C14 29, 13 21, 22 9 Z" fill="${COLORS.eau.main}" stroke="#fff" stroke-width="2"/>` +
    `<ellipse cx="18.5" cy="22" rx="2.2" ry="3.2" fill="#fff" opacity="0.45"/>`
  );
}

function buildPeak(): string {
  return (
    `<path d="M7 35 L22 11 L37 35 Z" fill="${COLORS.sommet.main}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M17 22 L22 12 L27 22 L23.5 19 L22 21 L20.5 19 Z" fill="#fff"/>`
  );
}

function buildCave(): string {
  const c = COLORS.abri;
  return (
    `<path d="M9 35 L9 25 A13 13 0 0 1 35 25 L35 35 Z" fill="${c.main}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M16 35 L16 27 A6 6 0 0 1 28 27 L28 35 Z" fill="${c.dark}"/>`
  );
}

function buildGeneric(): string {
  return `<circle cx="22" cy="22" r="11" fill="${COLORS.divers.main}" stroke="#fff" stroke-width="2"/>`;
}

/** Compose the full SVG (44×44 viewBox) for a set of attributes. */
export function composeIconSvg(a: IconAttrs): string {
  let body: string;
  switch (a.category) {
    case 'refuge': body = buildHut(a, { door: true, flag: true }); break;
    case 'gite': body = buildHut(a, { door: true }); break;
    case 'cabane': body = buildHut(a, {}); break;
    case 'eau': body = buildDrop(); break;
    case 'sommet': body = buildPeak(); break;
    case 'abri': body = buildCave(); break;
    default: body = buildGeneric();
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 44 44">` +
    `<g filter="">${body}</g></svg>`
  );
}

/** `data:` URI usable directly as an <img> src. */
export function iconDataUri(a: IconAttrs): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(composeIconSvg(a));
}

import type { Massif } from './api/massifs';

const DIACRITICS = /\p{Diacritic}/gu;

/** URL-safe slug from a massif name: "Acarnanie et Macrynoros" → "acarnanie-et-macrynoros". */
export function massifSlug(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function findMassifBySlug(massifs: Massif[], slug: string): Massif | undefined {
  return massifs.find((m) => massifSlug(m.nom) === slug);
}

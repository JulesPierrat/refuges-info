import { SITE_BASE } from '../api/config';

/** A burger-menu entry. `external` links open the historic site in a new tab. */
export interface MenuItem {
  /** msg() id for the label. */
  key: string;
  href: string;
  external: boolean;
  /** Optional non-translated suffix (e.g. "€ ❤️"). */
  suffix?: string;
}

const ext = (path: string): string => `${SITE_BASE}${path}`;

/** Order and links mirror the historic refuges.info menu/footer. */
export const MENU_ITEMS: MenuItem[] = [
  { key: 'nav_home', href: '/', external: false },
  { key: 'nav_about', href: ext('/wiki/'), external: true },
  { key: 'nav_donate', href: ext('/wiki/dons'), external: true, suffix: '€ ❤️' },
  { key: 'nav_cabin_rules', href: ext('/wiki/cabane_principe_bonne_conduite'), external: true },
  { key: 'nav_safety', href: ext('/wiki/prudence'), external: true },
  { key: 'nav_search_points', href: ext('/point_formulaire_recherche'), external: true },
  { key: 'nav_export_points', href: ext('/formulaire_exportations'), external: true },
  { key: 'nav_gps_app', href: ext('/gps'), external: true },
  { key: 'nav_rss', href: ext('/formulaire_rss_et_nouvelles?choix=flux_rss'), external: true },
  { key: 'nav_support', href: ext('/wiki/contact'), external: true },
  { key: 'nav_api_doc', href: ext('/api/doc/'), external: true },
  { key: 'nav_cookies', href: ext('/wiki/cookies'), external: true },
  { key: 'nav_license', href: ext('/wiki/licence'), external: true },
  { key: 'nav_legal', href: ext('/wiki/mentions-legales'), external: true },
  { key: 'nav_links', href: ext('/wiki/liens'), external: true },
];

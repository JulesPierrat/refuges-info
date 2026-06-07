import { msg } from '@lit/localize';

/**
 * All translatable UI strings, as functions evaluated at render time so they
 * react to locale changes. Each msg() has an explicit, stable id; the same ids
 * key the generated French templates and the xliff catalog.
 */
export const t = {
  tagline: () => msg('Mountain refuges, cabins and water points', { id: 'tagline' }),

  searchPlaceholder: () =>
    msg('Search a refuge, cabin, water point…', { id: 'search_placeholder' }),
  searchSearching: () => msg('Searching…', { id: 'search_searching' }),
  searchNoResults: () => msg('No results', { id: 'search_no_results' }),
  searchMinChars: () => msg('Type at least 2 characters', { id: 'search_min_chars' }),
  searchResults: () => msg('Results', { id: 'search_results' }),

  massifsTitle: () => msg('Mountain ranges', { id: 'massifs_title' }),
  massifsLoading: () => msg('Loading mountain ranges…', { id: 'massifs_loading' }),
  massifsFilter: () => msg('Filter ranges…', { id: 'massifs_filter' }),

  menuTitle: () => msg('Menu', { id: 'menu_title' }),
  menuOpen: () => msg('Open menu', { id: 'menu_open' }),
  menuClose: () => msg('Close menu', { id: 'menu_close' }),
  themeToggle: () => msg('Switch light/dark theme', { id: 'theme_toggle' }),
  langToggle: () => msg('Switch language', { id: 'lang_toggle' }),

  navHome: () => msg('Home', { id: 'nav_home' }),
  navAbout: () => msg('About us', { id: 'nav_about' }),
  navDonate: () => msg('Donate', { id: 'nav_donate' }),
  navCabinRules: () => msg('Cabin etiquette', { id: 'nav_cabin_rules' }),
  navSafety: () => msg('Safety rules', { id: 'nav_safety' }),
  navSearchPoints: () => msg('Search points', { id: 'nav_search_points' }),
  navExportPoints: () => msg('Export points', { id: 'nav_export_points' }),
  navGpsApp: () => msg('GPS app', { id: 'nav_gps_app' }),
  navRss: () => msg('RSS feed', { id: 'nav_rss' }),
  navSupport: () => msg('Support the site', { id: 'nav_support' }),
  navApiDoc: () => msg('API docs', { id: 'nav_api_doc' }),
  navCookies: () => msg('Cookies', { id: 'nav_cookies' }),
  navLicense: () => msg('License', { id: 'nav_license' }),
  navLegal: () => msg('Legal notice', { id: 'nav_legal' }),
  navLinks: () => msg('Links', { id: 'nav_links' }),
};

/** Localized label for a menu item key (literal msg() calls live in `t`). */
export function navLabel(key: string): string {
  switch (key) {
    case 'nav_home': return t.navHome();
    case 'nav_about': return t.navAbout();
    case 'nav_donate': return t.navDonate();
    case 'nav_cabin_rules': return t.navCabinRules();
    case 'nav_safety': return t.navSafety();
    case 'nav_search_points': return t.navSearchPoints();
    case 'nav_export_points': return t.navExportPoints();
    case 'nav_gps_app': return t.navGpsApp();
    case 'nav_rss': return t.navRss();
    case 'nav_support': return t.navSupport();
    case 'nav_api_doc': return t.navApiDoc();
    case 'nav_cookies': return t.navCookies();
    case 'nav_license': return t.navLicense();
    case 'nav_legal': return t.navLegal();
    case 'nav_links': return t.navLinks();
    default: return key;
  }
}

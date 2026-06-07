import { configureLocalization } from '@lit/localize';
import { sourceLocale, targetLocales } from './generated/locale-codes.js';

/**
 * Runtime localization. Default (source) locale is English; French is the only
 * translated target for v1. Locales are loaded on demand from generated modules.
 */
export const { getLocale, setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  // Static map (not a variable dynamic import) so the production bundler can
  // resolve and emit the locale chunks. A templated import fails at build time
  // ("Unknown variable dynamic import").
  loadLocale: (locale) =>
    locale === 'fr'
      ? import('./generated/locales/fr.js')
      : Promise.reject(new Error(`Unsupported locale: ${locale}`)),
});

export type AppLocale = 'en' | 'fr';
export const LOCALES: { code: AppLocale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
];

const STORAGE_KEY = 'refuges.locale';

/** Saved choice → browser language → English. */
export function initialLocale(): AppLocale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'fr') return saved;
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export async function applyLocale(locale: AppLocale): Promise<void> {
  await setLocale(locale);
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

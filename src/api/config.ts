/**
 * Origin of the refuges.info backend. Empty in dev (the Vite proxy forwards
 * `/api` and `/point_recherche` to www.refuges.info — see vite.config.ts).
 * In production set VITE_API_BASE to https://www.refuges.info.
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/** Absolute base of the historic site, for external menu links. */
export const SITE_BASE = 'https://www.refuges.info';

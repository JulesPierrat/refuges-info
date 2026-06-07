import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { updateWhenLocaleChanges } from '@lit/localize';
import './app-globe';
import './nav-menu';
import './discovery-panel';
import './massif-panel';
import { type AppGlobe, type Basemap, BASEMAP_LABELS } from './app-globe';
import { getPoint } from '../api/client';
import type { SearchResult } from '../api/search';
import type { Massif } from '../api/massifs';
import { applyLocale, getLocale, type AppLocale } from '../i18n';
import { massifSlug } from '../slug';
import { currentRoute, navigate, onRouteChange, type Route } from '../router';
import { t } from '../labels';

type Theme = 'light' | 'dark';
const THEME_KEY = 'refuges.theme';

/**
 * Persistent application shell. Owns the single globe instance (never remounts)
 * and a top bar; swaps only the side panel as the route changes.
 */
@customElement('app-shell')
export class AppShell extends LitElement {
  static styles = css`
    :host { display: block; position: fixed; inset: 0; }
    app-globe { position: absolute; inset: 0; }

    .topbar {
      position: absolute;
      top: var(--space-4); left: var(--space-4); right: var(--space-4);
      display: flex; align-items: center; gap: var(--space-3);
      z-index: 30; pointer-events: none;
    }
    .topbar > * { pointer-events: auto; }

    .brand {
      display: flex; flex-direction: column;
      padding: var(--space-2) var(--space-4);
      background: var(--surface-glass);
      backdrop-filter: blur(12px) saturate(1.1);
      border: 1px solid var(--surface-glass-brd);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      cursor: pointer; color: inherit; text-decoration: none;
    }
    .brand strong { font-family: var(--font-display); font-size: 1.05rem; line-height: 1.1; }
    .brand strong span { color: var(--brand); }
    .brand small { color: var(--text-muted); font-size: 0.74rem; }

    .spacer { flex: 1; }

    .pill {
      height: 44px; min-width: 44px; padding: 0 var(--space-3);
      display: inline-flex; align-items: center; justify-content: center; gap: var(--space-1);
      border: 1px solid var(--surface-glass-brd);
      border-radius: var(--radius-md);
      background: var(--surface-glass);
      backdrop-filter: blur(12px) saturate(1.1);
      box-shadow: var(--shadow-sm);
      color: var(--text); font: 600 0.85rem var(--font-sans); cursor: pointer;
    }
    .pill:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .pill svg { width: 20px; height: 20px; }

    .panel {
      position: absolute;
      top: calc(var(--space-4) + 60px); left: var(--space-4); bottom: var(--space-4);
      width: min(92vw, 360px); z-index: 20;
    }
    discovery-panel, massif-panel { height: 100%; }

    @media (max-width: 640px) {
      .brand small { display: none; }
      .panel { right: var(--space-4); width: auto; top: auto; height: 48vh; }
    }
  `;

  @query('app-globe') private globe!: AppGlobe;
  @state() private theme: Theme | null = null;
  @state() private route: Route = currentRoute();
  @state() private basemap: Basemap = 'vector';

  private offRoute?: () => void;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  connectedCallback() {
    super.connectedCallback();
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') this.applyTheme(saved);
    this.offRoute = onRouteChange((r) => {
      this.route = r;
      if (r.name === 'home') this.globe?.showPoints(undefined);
    });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.offRoute?.();
  }

  private applyTheme(theme: Theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }
  private toggleTheme() {
    const current =
      this.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.applyTheme(current === 'dark' ? 'light' : 'dark');
  }
  private toggleLocale() {
    const next: AppLocale = getLocale() === 'fr' ? 'en' : 'fr';
    applyLocale(next);
  }
  private toggleBasemap() {
    const next: Basemap = this.basemap === 'vector' ? 'opentopomap' : 'vector';
    this.basemap = next;
    this.globe.setBasemap(next);
  }

  private goHome(e: Event) {
    e.preventDefault();
    navigate('/');
  }

  /** Search result selected → resolve its coordinates and fly there. */
  private async onPointSelected(e: CustomEvent<SearchResult>) {
    try {
      const fc = await getPoint(e.detail.id, 'simple');
      const geom = fc.features[0]?.geometry;
      if (geom?.type === 'Point') this.globe.flyToPoint(geom.coordinates[0], geom.coordinates[1]);
    } catch (err) {
      console.error('resolve point', err);
    }
  }
  private onMassifSelected(e: CustomEvent<Massif>) {
    navigate(`/massif/${massifSlug(e.detail.nom)}`);
  }
  private onShowMassif(e: CustomEvent<{ bbox: Parameters<AppGlobe['flyToBbox']>[0]; collection: Parameters<AppGlobe['showPoints']>[0] }>) {
    this.globe.showPoints(e.detail.collection);
    this.globe.flyToBbox(e.detail.bbox);
  }
  private onPointFly(e: CustomEvent<{ lng: number; lat: number }>) {
    this.globe.flyToPoint(e.detail.lng, e.detail.lat);
  }

  render() {
    const isDark =
      this.theme === 'dark' ||
      (this.theme === null && matchMedia('(prefers-color-scheme: dark)').matches);

    return html`
      <app-globe></app-globe>

      <div class="topbar">
        <nav-menu></nav-menu>
        <a class="brand" href="/" @click=${this.goHome}>
          <strong>refuges<span>.info</span></strong>
          <small>${t.tagline()}</small>
        </a>
        <span class="spacer"></span>
        <button class="pill" @click=${this.toggleBasemap} aria-label=${t.basemapToggle()} title=${t.basemapToggle()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${BASEMAP_LABELS[this.basemap]}
        </button>
        <button class="pill" @click=${this.toggleLocale} aria-label=${t.langToggle()}>
          ${getLocale() === 'fr' ? 'FR' : 'EN'}
        </button>
        <button class="pill" @click=${this.toggleTheme} aria-label=${t.themeToggle()}>
          ${isDark
            ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`
            : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`}
        </button>
      </div>

      <div
        class="panel"
        @point-selected=${this.onPointSelected}
        @massif-selected=${this.onMassifSelected}
        @show-massif=${this.onShowMassif}
        @point-fly=${this.onPointFly}
      >
        ${this.route.name === 'massif'
          ? html`<massif-panel .slug=${this.route.slug}></massif-panel>`
          : html`<discovery-panel></discovery-panel>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}

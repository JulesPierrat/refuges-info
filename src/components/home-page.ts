import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { updateWhenLocaleChanges } from '@lit/localize';
import './app-globe';
import './nav-menu';
import './discovery-panel';
import type { AppGlobe } from './app-globe';
import { getPoint } from '../api/client';
import { colorVarForType, type SearchResult } from '../api/search';
import type { Massif } from '../api/massifs';
import { applyLocale, getLocale, type AppLocale } from '../i18n';
import { t } from '../labels';

type Theme = 'light' | 'dark';
const THEME_KEY = 'refuges.theme';

/** Home page: full-bleed globe with a top bar and a floating discovery panel. */
@customElement('home-page')
export class HomePage extends LitElement {
  static styles = css`
    :host { display: block; position: fixed; inset: 0; }

    app-globe { position: absolute; inset: 0; }

    .topbar {
      position: absolute;
      top: var(--space-4);
      left: var(--space-4);
      right: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      z-index: 30;
      pointer-events: none;
    }
    .topbar > * { pointer-events: auto; }

    .brand {
      display: flex;
      flex-direction: column;
      padding: var(--space-2) var(--space-4);
      background: var(--surface-glass);
      backdrop-filter: blur(12px) saturate(1.1);
      border: 1px solid var(--surface-glass-brd);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }
    .brand strong { font-family: var(--font-display); font-size: 1.05rem; line-height: 1.1; }
    .brand strong span { color: var(--brand); }
    .brand small { color: var(--text-muted); font-size: 0.74rem; }

    .spacer { flex: 1; }

    .pill {
      height: 44px;
      min-width: 44px;
      padding: 0 var(--space-3);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      border: 1px solid var(--surface-glass-brd);
      border-radius: var(--radius-md);
      background: var(--surface-glass);
      backdrop-filter: blur(12px) saturate(1.1);
      box-shadow: var(--shadow-sm);
      color: var(--text);
      font: 600 0.85rem var(--font-sans);
      cursor: pointer;
    }
    .pill:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .pill svg { width: 20px; height: 20px; }

    .panel {
      position: absolute;
      top: calc(var(--space-4) + 60px);
      left: var(--space-4);
      bottom: var(--space-4);
      width: min(92vw, 360px);
      z-index: 20;
    }
    discovery-panel { height: 100%; }

    @media (max-width: 640px) {
      .brand small { display: none; }
      .panel { right: var(--space-4); width: auto; top: auto; height: 45vh; }
    }
  `;

  @query('app-globe') private globe!: AppGlobe;
  @state() private theme: Theme | null = null;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  connectedCallback() {
    super.connectedCallback();
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') this.applyTheme(saved);
  }

  private applyTheme(theme: Theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  private toggleTheme() {
    const current =
      this.theme ??
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  private toggleLocale() {
    const next: AppLocale = getLocale() === 'fr' ? 'en' : 'fr';
    applyLocale(next);
  }

  private async onPointSelected(e: CustomEvent<SearchResult>) {
    const r = e.detail;
    try {
      const fc = await getPoint(r.id, 'simple');
      const geom = fc.features[0]?.geometry;
      if (geom?.type === 'Point') {
        const [lng, lat] = geom.coordinates;
        this.globe.flyToPoint(lng, lat, colorVarForType(r.typeSlug));
      }
    } catch (err) {
      console.error('resolve point', err);
    }
  }

  private onMassifSelected(e: CustomEvent<Massif>) {
    this.globe.flyToBbox(e.detail.bbox);
  }

  render() {
    const isDark =
      this.theme === 'dark' ||
      (this.theme === null && matchMedia('(prefers-color-scheme: dark)').matches);

    return html`
      <app-globe></app-globe>

      <div class="topbar">
        <nav-menu></nav-menu>
        <div class="brand">
          <strong>refuges<span>.info</span></strong>
          <small>${t.tagline()}</small>
        </div>
        <span class="spacer"></span>
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
      >
        <discovery-panel></discovery-panel>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}

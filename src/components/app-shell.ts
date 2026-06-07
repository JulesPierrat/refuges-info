import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { updateWhenLocaleChanges } from '@lit/localize';
import './app-globe';
import './nav-menu';
import './discovery-panel';
import './massif-panel';
import './point-detail-panel';
import './map-legend';
import './photo-modal';
import type { GalleryPhoto } from './photo-modal';
import { type AppGlobe, type Basemap, BASEMAPS } from './app-globe';
import { getMassifPolygons, type Massif } from '../api/massifs';
import { applyLocale, getLocale, type AppLocale } from '../i18n';
import { massifSlug } from '../slug';
import {
  closePointHash,
  currentPointId,
  currentRoute,
  navigate,
  onRouteChange,
  openPointHash,
  type Route,
} from '../router';
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

    .basemap { position: relative; }
    .basemap-menu {
      position: absolute; top: calc(100% + 6px); right: 0; min-width: 180px;
      padding: var(--space-1); z-index: 31;
      background: var(--surface-glass); backdrop-filter: blur(14px) saturate(1.1);
      border: 1px solid var(--surface-glass-brd); border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }
    .basemap-menu button {
      display: flex; align-items: center; gap: var(--space-2); width: 100%;
      padding: var(--space-2) var(--space-3); border: none; border-radius: var(--radius-sm);
      background: transparent; color: var(--text); font: inherit; text-align: left; cursor: pointer;
    }
    .basemap-menu button:hover { background: var(--brand-soft); }
    .basemap-menu button[aria-current='true'] { color: var(--brand); font-weight: 600; }
    .basemap-menu .check { margin-left: auto; opacity: 0; }
    .basemap-menu button[aria-current='true'] .check { opacity: 1; }

    .panel {
      position: absolute;
      top: calc(var(--space-4) + 60px); left: var(--space-4); bottom: var(--space-4);
      width: min(92vw, 360px); z-index: 20;
    }
    discovery-panel, massif-panel, point-detail-panel { height: 100%; }

    .detail {
      position: absolute;
      top: calc(var(--space-4) + 60px); right: var(--space-4); bottom: var(--space-4);
      width: min(94vw, 380px); z-index: 25;
    }
    .legend-wrap { position: absolute; left: var(--space-4); bottom: var(--space-4); z-index: 20; }

    @media (max-width: 720px) {
      .brand small { display: none; }
      .panel { right: var(--space-4); width: auto; top: auto; height: 42vh; }
      .detail { left: var(--space-4); width: auto; top: auto; height: 60vh; z-index: 26; }
      .legend-wrap { display: none; }
    }
  `;

  @query('app-globe') private globe!: AppGlobe;
  @state() private theme: Theme | null = null;
  @state() private route: Route = currentRoute();
  @state() private basemap: Basemap = 'ign-ortho';
  @state() private basemapMenuOpen = false;
  @state() private selectedPointId?: number;
  @state() private gallery?: { photos: GalleryPhoto[]; index: number };

  private offRoute?: () => void;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  connectedCallback() {
    super.connectedCallback();
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') this.applyTheme(saved);
    this.selectedPointId = currentPointId();
    this.offRoute = onRouteChange((r) => {
      const routeChanged = r.name !== this.route.name || (r as { slug?: string }).slug !== (this.route as { slug?: string }).slug;
      this.route = r;
      this.selectedPointId = currentPointId();
      if (routeChanged) {
        if (r.name === 'home') this.globe?.showPoints(undefined);
        this.updateMassifOverlay(r);
      }
    });
    this.updateMassifOverlay(this.route);
    this.addEventListener('open-point', this.onOpenPoint as EventListener);
    this.addEventListener('open-massif', this.onOpenMassif as EventListener);
    this.addEventListener('close-detail', this.onCloseDetail);
    this.addEventListener('open-gallery', this.onOpenGallery as EventListener);
    this.addEventListener('close-gallery', this.onCloseGallery);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.offRoute?.();
    this.removeEventListener('open-point', this.onOpenPoint as EventListener);
    this.removeEventListener('open-massif', this.onOpenMassif as EventListener);
    this.removeEventListener('close-detail', this.onCloseDetail);
    this.removeEventListener('open-gallery', this.onOpenGallery as EventListener);
    this.removeEventListener('close-gallery', this.onCloseGallery);
  }

  private onOpenGallery = (e: CustomEvent<{ photos: GalleryPhoto[]; index: number }>) => {
    this.gallery = e.detail;
  };
  private onCloseGallery = () => {
    this.gallery = undefined;
  };

  /** Show clickable massif contours on home; hide them elsewhere. */
  private async updateMassifOverlay(route: Route) {
    if (route.name !== 'home') {
      this.globe?.showMassifContours(undefined);
      return;
    }
    try {
      this.globe?.showMassifContours(await getMassifPolygons());
    } catch (err) {
      console.error('massif contours', err);
    }
  }

  private onOpenMassif = (e: CustomEvent<{ nom: string }>) => {
    navigate(`/massif/${massifSlug(e.detail.nom)}`);
  };

  /** A point clicked on the map or in the massif list → fly + deep-link via hash. */
  private onOpenPoint = (e: CustomEvent<{ id: number; nom?: string; lng?: number; lat?: number }>) => {
    if (e.detail.lng != null && e.detail.lat != null) this.globe.flyTo(e.detail.lng, e.detail.lat);
    openPointHash(e.detail.id, e.detail.nom ? massifSlug(e.detail.nom) : undefined);
  };
  private onCloseDetail = () => {
    closePointHash();
  };

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
  private selectBasemap(kind: Basemap) {
    this.basemap = kind;
    this.basemapMenuOpen = false;
    this.globe.setBasemap(kind);
  }
  private basemapLabel(kind: Basemap): string {
    switch (kind) {
      case 'vector': return t.basemapMap();
      case 'opentopomap': return t.basemapTopo();
      case 'ign-topo': return t.basemapIgnTopo();
      case 'ign-ortho': return t.basemapIgn();
      case 'swisstopo': return t.basemapSwiss();
    }
  }

  private goHome(e: Event) {
    e.preventDefault();
    navigate('/');
  }

  private onMassifSelected(e: CustomEvent<Massif>) {
    navigate(`/massif/${massifSlug(e.detail.nom)}`);
  }
  private onShowMassif(e: CustomEvent<{ bbox: Parameters<AppGlobe['flyToBbox']>[0]; collection: Parameters<AppGlobe['showPoints']>[0] }>) {
    this.globe.showPoints(e.detail.collection);
    this.globe.flyToBbox(e.detail.bbox);
  }

  render() {
    const isDark =
      this.theme === 'dark' ||
      (this.theme === null && matchMedia('(prefers-color-scheme: dark)').matches);

    return html`
      <app-globe></app-globe>

      ${this.basemapMenuOpen
        ? html`<div
            style="position:absolute;inset:0;z-index:29"
            @click=${() => (this.basemapMenuOpen = false)}
          ></div>`
        : ''}

      <div class="topbar">
        <nav-menu></nav-menu>
        <a class="brand" href="/" @click=${this.goHome}>
          <strong>refuges<span>.info</span></strong>
          <small>${t.tagline()}</small>
        </a>
        <span class="spacer"></span>
        <div class="basemap">
          <button
            class="pill"
            @click=${() => (this.basemapMenuOpen = !this.basemapMenuOpen)}
            aria-haspopup="listbox"
            aria-expanded=${this.basemapMenuOpen}
            aria-label=${t.basemapToggle()}
            title=${t.basemapToggle()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            ${this.basemapLabel(this.basemap)}
          </button>
          ${this.basemapMenuOpen
            ? html`<div class="basemap-menu" role="listbox">
                ${BASEMAPS.map(
                  (kind) => html`
                    <button
                      role="option"
                      aria-current=${kind === this.basemap}
                      @click=${() => this.selectBasemap(kind)}
                    >
                      ${this.basemapLabel(kind)}<span class="check">✓</span>
                    </button>
                  `,
                )}
              </div>`
            : ''}
        </div>
        <button class="pill" @click=${this.toggleLocale} aria-label=${t.langToggle()}>
          ${getLocale() === 'fr' ? 'FR' : 'EN'}
        </button>
        <button class="pill" @click=${this.toggleTheme} aria-label=${t.themeToggle()}>
          ${isDark
            ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`
            : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`}
        </button>
        <a
          class="pill"
          href="https://github.com/JulesPierrat/refuges-info"
          target="_blank"
          rel="noopener"
          aria-label="GitHub"
          title="GitHub"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.7c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.6 18 4.9 18 4.9c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0 0 23.5 12C23.5 5.7 18.3.5 12 .5z"/></svg>
        </a>
      </div>

      <div
        class="panel"
        @massif-selected=${this.onMassifSelected}
        @show-massif=${this.onShowMassif}
      >
        ${this.route.name === 'massif'
          ? html`<massif-panel .slug=${this.route.slug}></massif-panel>`
          : html`<discovery-panel></discovery-panel>`}
      </div>

      ${this.selectedPointId != null
        ? html`<div class="detail">
            <point-detail-panel .pointId=${this.selectedPointId}></point-detail-panel>
          </div>`
        : ''}

      <div class="legend-wrap"><map-legend></map-legend></div>

      ${this.gallery
        ? html`<photo-modal
            .photos=${this.gallery.photos}
            .startIndex=${this.gallery.index}
          ></photo-modal>`
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}

import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { updateWhenLocaleChanges } from '@lit/localize';
import { getPointsInMassif } from '../api/client';
import { getMassifs, type Massif } from '../api/massifs';
import type { PointFeature } from '../api/types';
import { iconAttrsFromPoint, iconDataUri, type PointIconInput } from '../icons';
import { findMassifBySlug } from '../slug';
import { navigate } from '../router';
import { t } from '../labels';

/**
 * Massif page (`/massif/:slug`): same layout as home, but the panel lists the
 * massif's points. Reuses the persistent globe via bubbling events — it never
 * mounts its own map.
 */
@customElement('massif-panel')
export class MassifPanel extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      max-height: 100%;
      background: var(--surface-glass);
      backdrop-filter: blur(14px) saturate(1.1);
      border: 1px solid var(--surface-glass-brd);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }
    header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-3) var(--space-3) var(--space-2);
      border-bottom: 1px solid var(--border);
    }
    .back {
      width: 36px; height: 36px; flex: none;
      display: inline-flex; align-items: center; justify-content: center;
      border: none; border-radius: var(--radius-sm);
      background: transparent; color: var(--text-muted); cursor: pointer;
    }
    .back:hover { background: var(--bg-sunken); color: var(--text); }
    .title { overflow: hidden; }
    .title h1 {
      margin: 0; font-family: var(--font-display); font-size: 1.1rem; font-weight: 700;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .title .sub { font-size: 0.78rem; color: var(--text-subtle); }

    .scroll { overflow-y: auto; }
    .hint { padding: var(--space-3) var(--space-4); color: var(--text-subtle); font-size: 0.88rem; }
    ul { list-style: none; margin: 0; padding: var(--space-1) 0 var(--space-2); }
    li button {
      display: flex; align-items: center; gap: var(--space-3);
      width: 100%; padding: var(--space-2) var(--space-4);
      border: none; background: transparent; color: var(--text);
      font: inherit; text-align: left; cursor: pointer;
    }
    li button:hover { background: var(--brand-soft); }
    li button:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .ic { width: 30px; height: 30px; flex: none; }
    .label { overflow: hidden; }
    .label .name { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .label .meta { font-size: 0.78rem; color: var(--text-subtle); }
    .alt { color: var(--text-subtle); font: 500 0.78rem var(--font-mono); margin-left: auto; }
  `;

  @property() slug = '';

  @state() private massif?: Massif;
  @state() private points: PointFeature[] = [];
  @state() private loading = true;
  @state() private notFound = false;

  private abort?: AbortController;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  willUpdate(changed: PropertyValues) {
    if (changed.has('slug')) this.load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.abort?.abort();
  }

  private async load() {
    this.loading = true;
    this.notFound = false;
    this.points = [];
    this.abort?.abort();
    this.abort = new AbortController();
    try {
      const massif = findMassifBySlug(await getMassifs(this.abort.signal), this.slug);
      this.massif = massif;
      if (!massif) {
        this.notFound = true;
        return;
      }
      const fc = await getPointsInMassif(
        [massif.id],
        { detail: 'complet', typesPoint: 'all', nbPoints: 'all' },
        this.abort.signal,
      );
      this.points = fc.features;
      // Drive the shared globe: fit to the massif and show its points.
      this.dispatchEvent(
        new CustomEvent('show-massif', {
          detail: { bbox: massif.bbox, collection: fc },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('massif load', err);
    } finally {
      this.loading = false;
    }
  }

  private flyTo(f: PointFeature) {
    const [lng, lat] = f.geometry.coordinates;
    this.dispatchEvent(
      new CustomEvent('open-point', {
        detail: { id: f.properties.id, lng, lat },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <header>
        <button class="back" aria-label=${t.back()} @click=${() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div class="title">
          <h1>${this.massif?.nom ?? (this.notFound ? t.massifNotFound() : '…')}</h1>
          ${this.massif
            ? html`<span class="sub">${this.points.length} ${t.massifPoints()}</span>`
            : ''}
        </div>
      </header>

      <div class="scroll">
        ${this.loading
          ? html`<p class="hint">${t.massifLoading()}</p>`
          : this.notFound
            ? html`<p class="hint">${t.massifNotFound()}</p>`
            : html`
                <ul>
                  ${this.points.map(
                    (f) => html`
                      <li>
                        <button @click=${() => this.flyTo(f)}>
                          <img
                            class="ic"
                            src=${iconDataUri(iconAttrsFromPoint(f.properties as unknown as PointIconInput))}
                            alt=""
                          />
                          <span class="label">
                            <span class="name">${f.properties.nom}</span>
                            <span class="meta">${f.properties.type?.valeur ?? ''}</span>
                          </span>
                          ${f.properties.coord?.alt
                            ? html`<span class="alt">${f.properties.coord.alt} m</span>`
                            : ''}
                        </button>
                      </li>
                    `,
                  )}
                </ul>
              `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'massif-panel': MassifPanel;
  }
}

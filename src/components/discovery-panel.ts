import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { updateWhenLocaleChanges } from '@lit/localize';
import { getMassifs, type Massif } from '../api/massifs';
import { searchPoints, type SearchResult } from '../api/search';
import { categoryFromSlug, iconDataUri } from '../icons';
import { t } from '../labels';

/**
 * Floating panel over the globe: a server-side point search bar on top and the
 * full list of massifs below. Emits `point-selected` / `massif-selected`.
 */
@customElement('discovery-panel')
export class DiscoveryPanel extends LitElement {
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

    .search {
      position: relative;
      padding: var(--space-3);
      border-bottom: 1px solid var(--border);
    }
    .search svg { position: absolute; left: 22px; top: 50%; transform: translateY(-50%); color: var(--text-subtle); pointer-events: none; }
    input {
      width: 100%;
      box-sizing: border-box;
      height: 44px;
      padding: 0 var(--space-3) 0 40px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text);
      font: inherit;
    }
    input::placeholder { color: var(--text-subtle); }
    input:focus-visible { outline: none; box-shadow: var(--focus-ring); border-color: var(--brand); }

    .scroll { overflow-y: auto; }
    .section-title {
      display: flex; align-items: baseline; gap: var(--space-2);
      padding: var(--space-3) var(--space-4) var(--space-1);
      font: 600 0.72rem/1 var(--font-sans);
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-subtle);
    }
    .count { color: var(--text-subtle); font-weight: 500; }
    .hint { padding: var(--space-2) var(--space-4) var(--space-3); color: var(--text-subtle); font-size: 0.85rem; }

    ul { list-style: none; margin: 0; padding: 0 0 var(--space-2); }
    li button {
      display: flex; align-items: center; gap: var(--space-3);
      width: 100%; padding: var(--space-2) var(--space-4);
      border: none; background: transparent; color: var(--text);
      font: inherit; text-align: left; cursor: pointer;
    }
    li button:hover { background: var(--brand-soft); }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--brand); }
    .ic { width: 28px; height: 28px; flex: none; }
    .label { overflow: hidden; }
    .label .name { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .label .meta { font-size: 0.78rem; color: var(--text-subtle); }
    .chev { margin-left: auto; color: var(--text-subtle); font-size: 1.1rem; line-height: 1; }
    li button:focus-visible { outline: none; box-shadow: var(--focus-ring); }
  `;

  @state() private query = '';
  @state() private results: SearchResult[] = [];
  @state() private searching = false;
  @state() private massifs: Massif[] = [];
  @state() private massifFilter = '';

  private debounce?: ReturnType<typeof setTimeout>;
  private abort?: AbortController;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  connectedCallback() {
    super.connectedCallback();
    getMassifs()
      .then((m) => (this.massifs = m))
      .catch((e) => console.error('massifs', e));
  }

  private onInput(e: Event) {
    this.query = (e.target as HTMLInputElement).value;
    clearTimeout(this.debounce);
    const q = this.query.trim();
    if (q.length < 2) {
      this.results = [];
      this.searching = false;
      return;
    }
    this.searching = true;
    this.debounce = setTimeout(() => this.runSearch(q), 300);
  }

  private async runSearch(q: string) {
    this.abort?.abort();
    this.abort = new AbortController();
    try {
      this.results = await searchPoints(q, 25, this.abort.signal);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('search', err);
    } finally {
      this.searching = false;
    }
  }

  private selectPoint(r: SearchResult) {
    this.dispatchEvent(new CustomEvent('point-selected', { detail: r, bubbles: true, composed: true }));
  }
  private selectMassif(m: Massif) {
    this.dispatchEvent(new CustomEvent('massif-selected', { detail: m, bubbles: true, composed: true }));
  }

  render() {
    const q = this.query.trim();
    const filtered = this.massifFilter
      ? this.massifs.filter((m) => m.nom.toLowerCase().includes(this.massifFilter.toLowerCase()))
      : this.massifs;

    return html`
      <div class="search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          .value=${this.query}
          placeholder=${t.searchPlaceholder()}
          aria-label=${t.searchPlaceholder()}
          @input=${this.onInput}
        />
      </div>

      <div class="scroll">
        ${q.length >= 2
          ? html`
              <div class="section-title">${t.searchResults()}</div>
              ${this.searching
                ? html`<p class="hint">${t.searchSearching()}</p>`
                : this.results.length === 0
                  ? html`<p class="hint">${t.searchNoResults()}</p>`
                  : html`
                      <ul>
                        ${this.results.map(
                          (r) => html`
                            <li>
                              <button @click=${() => this.selectPoint(r)}>
                                <img
                                  class="ic"
                                  src=${iconDataUri({ category: categoryFromSlug(r.typeSlug) })}
                                  alt=""
                                />
                                <span class="label">
                                  <span class="name">${r.nom}</span>
                                  <span class="meta">${r.typeLabel}</span>
                                </span>
                              </button>
                            </li>
                          `,
                        )}
                      </ul>
                    `}
            `
          : html`<p class="hint">${t.searchMinChars()}</p>`}

        <div class="section-title">
          ${t.massifsTitle()} <span class="count">${this.massifs.length || ''}</span>
        </div>
        ${this.massifs.length === 0
          ? html`<p class="hint">${t.massifsLoading()}</p>`
          : html`
              <div class="search" style="border-bottom:none;padding-top:0">
                <input
                  style="height:38px"
                  type="search"
                  placeholder=${t.massifsFilter()}
                  aria-label=${t.massifsFilter()}
                  @input=${(e: Event) => (this.massifFilter = (e.target as HTMLInputElement).value)}
                />
              </div>
              <ul>
                ${filtered.map(
                  (m) => html`
                    <li>
                      <button @click=${() => this.selectMassif(m)}>
                        <span class="dot"></span>
                        <span class="label"><span class="name">${m.nom}</span></span>
                        <span class="chev">›</span>
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
    'discovery-panel': DiscoveryPanel;
  }
}

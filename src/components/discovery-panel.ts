import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { updateWhenLocaleChanges } from '@lit/localize';
import { getMassifs, type Massif } from '../api/massifs';
import { t } from '../labels';

/**
 * Home panel: the list of massifs with a client-side name filter. Selecting a
 * massif opens its page. (No global server search here — massifs are also
 * clickable directly on the map.)
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
    .head {
      padding: var(--space-3) var(--space-4) var(--space-2);
      border-bottom: 1px solid var(--border);
    }
    .title {
      display: flex; align-items: baseline; gap: var(--space-2);
      font: 600 0.72rem/1 var(--font-sans);
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-subtle);
      margin-bottom: var(--space-2);
    }
    .count { color: var(--text-subtle); font-weight: 500; }
    input {
      width: 100%; box-sizing: border-box; height: 40px;
      padding: 0 var(--space-3); border: 1px solid var(--border-strong);
      border-radius: var(--radius-md); background: var(--bg-elevated);
      color: var(--text); font: inherit;
    }
    input::placeholder { color: var(--text-subtle); }
    input:focus-visible { outline: none; box-shadow: var(--focus-ring); border-color: var(--brand); }

    .scroll { overflow-y: auto; }
    .hint { padding: var(--space-3) var(--space-4); color: var(--text-subtle); font-size: 0.85rem; }
    ul { list-style: none; margin: 0; padding: var(--space-1) 0 var(--space-2); }
    li button {
      display: flex; align-items: center; gap: var(--space-3);
      width: 100%; padding: var(--space-2) var(--space-4);
      border: none; background: transparent; color: var(--text);
      font: inherit; text-align: left; cursor: pointer;
    }
    li button:hover { background: var(--brand-soft); }
    li button:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--brand); }
    .name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .chev { margin-left: auto; color: var(--text-subtle); font-size: 1.1rem; line-height: 1; }
  `;

  @state() private massifs: Massif[] = [];
  @state() private filter = '';

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

  private select(m: Massif) {
    this.dispatchEvent(
      new CustomEvent('massif-selected', { detail: m, bubbles: true, composed: true }),
    );
  }

  render() {
    const filtered = this.filter
      ? this.massifs.filter((m) => m.nom.toLowerCase().includes(this.filter.toLowerCase()))
      : this.massifs;

    return html`
      <div class="head">
        <div class="title">${t.massifsTitle()} <span class="count">${this.massifs.length || ''}</span></div>
        <input
          type="search"
          placeholder=${t.massifsFilter()}
          aria-label=${t.massifsFilter()}
          @input=${(e: Event) => (this.filter = (e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="scroll">
        ${this.massifs.length === 0
          ? html`<p class="hint">${t.massifsLoading()}</p>`
          : html`
              <ul>
                ${filtered.map(
                  (m) => html`
                    <li>
                      <button @click=${() => this.select(m)}>
                        <span class="dot"></span>
                        <span class="name">${m.nom}</span>
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

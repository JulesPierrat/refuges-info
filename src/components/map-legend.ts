import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { updateWhenLocaleChanges } from '@lit/localize';
import { iconDataUri, type IconCategory } from '../icons';
import { t } from '../labels';

/** Collapsible legend explaining the point icons and overlay symbols. */
@customElement('map-legend')
export class MapLegend extends LitElement {
  static styles = css`
    :host { display: block; }
    .toggle {
      display: inline-flex; align-items: center; gap: 6px;
      height: 38px; padding: 0 var(--space-3);
      border: 1px solid var(--surface-glass-brd); border-radius: var(--radius-md);
      background: var(--surface-glass); backdrop-filter: blur(12px) saturate(1.1);
      box-shadow: var(--shadow-sm); color: var(--text);
      font: 600 0.82rem var(--font-sans); cursor: pointer;
    }
    .toggle:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .panel {
      margin-top: var(--space-2);
      width: 230px; max-height: 60vh; overflow-y: auto;
      padding: var(--space-3) var(--space-4);
      background: var(--surface-glass); backdrop-filter: blur(14px) saturate(1.1);
      border: 1px solid var(--surface-glass-brd); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }
    h3 {
      margin: var(--space-3) 0 var(--space-1); font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-subtle);
    }
    h3:first-child { margin-top: 0; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; align-items: center; gap: var(--space-2); padding: 3px 0; font-size: 0.86rem; }
    li img { width: 26px; height: 26px; flex: none; }
  `;

  @state() private open = false;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  private types(): { cat: IconCategory; label: string }[] {
    return [
      { cat: 'refuge', label: t.catRefuge() },
      { cat: 'cabane', label: t.catCabane() },
      { cat: 'gite', label: t.catGite() },
      { cat: 'eau', label: t.catEau() },
      { cat: 'sommet', label: t.catSommet() },
      { cat: 'abri', label: t.catAbri() },
    ];
  }

  render() {
    return html`
      <button class="toggle" aria-expanded=${this.open} @click=${() => (this.open = !this.open)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h13M3 12h13M3 18h13M19 6h2M19 12h2M19 18h2"/></svg>
        ${t.legendTitle()}
      </button>
      ${this.open
        ? html`
            <div class="panel">
              <h3>${t.legendTypes()}</h3>
              <ul>
                ${this.types().map(
                  (x) => html`<li><img src=${iconDataUri({ category: x.cat })} alt="" />${x.label}</li>`,
                )}
              </ul>
              <h3>${t.legendSymbols()}</h3>
              <ul>
                <li><img src=${iconDataUri({ category: 'cabane', fire: true })} alt="" />${t.legendFireplace()}</li>
                <li><img src=${iconDataUri({ category: 'cabane', beds: 6 })} alt="" />${t.legendBeds()}</li>
                <li><img src=${iconDataUri({ category: 'cabane', missingWall: true })} alt="" />${t.legendMissingWall()}</li>
                <li><img src=${iconDataUri({ category: 'cabane', water: true })} alt="" />${t.legendWater()}</li>
              </ul>
            </div>
          `
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'map-legend': MapLegend;
  }
}

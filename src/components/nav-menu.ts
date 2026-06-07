import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { updateWhenLocaleChanges } from '@lit/localize';
import { MENU_ITEMS } from '../data/menu';
import { navLabel, t } from '../labels';

/** Burger button that opens a sliding navigation drawer. */
@customElement('nav-menu')
export class NavMenu extends LitElement {
  static styles = css`
    :host { display: contents; }

    .burger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: 1px solid var(--surface-glass-brd);
      border-radius: var(--radius-md);
      background: var(--surface-glass);
      backdrop-filter: blur(12px) saturate(1.1);
      box-shadow: var(--shadow-sm);
      color: var(--text);
      cursor: pointer;
    }
    .burger svg { width: 22px; height: 22px; }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--dur-base) var(--ease-out);
      z-index: 40;
    }
    .backdrop.open { opacity: 1; pointer-events: auto; }

    .drawer {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: min(86vw, 320px);
      background: var(--bg-elevated);
      border-right: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      transform: translateX(-100%);
      transition: transform var(--dur-slow) var(--ease-out);
      z-index: 41;
      display: flex;
      flex-direction: column;
    }
    .drawer.open { transform: translateX(0); }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border);
    }
    header h2 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
    }
    .close {
      width: 36px; height: 36px;
      border: none; border-radius: var(--radius-sm);
      background: transparent; color: var(--text-muted); cursor: pointer;
    }
    .close:hover { background: var(--bg-sunken); color: var(--text); }

    nav { overflow-y: auto; padding: var(--space-2) 0; }
    a {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-5);
      color: var(--text);
      text-decoration: none;
      font-size: 0.95rem;
    }
    a:hover { background: var(--brand-soft); color: var(--brand-hover); }
    a .ext { margin-left: auto; opacity: 0.4; font-size: 0.8rem; }

    :focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: var(--radius-sm); }
  `;

  @state() private open = false;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.onKey = this.onKey.bind(this);
    window.addEventListener('keydown', this.onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.onKey);
  }
  private onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') this.open = false;
  }

  render() {
    return html`
      <button
        class="burger"
        aria-label=${t.menuOpen()}
        aria-expanded=${this.open}
        @click=${() => (this.open = true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div class="backdrop ${this.open ? 'open' : ''}" @click=${() => (this.open = false)}></div>

      <aside class="drawer ${this.open ? 'open' : ''}" aria-hidden=${!this.open}>
        <header>
          <h2>${t.menuTitle()}</h2>
          <button class="close" aria-label=${t.menuClose()} @click=${() => (this.open = false)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <nav>
          ${MENU_ITEMS.map(
            (item) => html`
              <a
                href=${item.href}
                target=${item.external ? '_blank' : '_self'}
                rel=${item.external ? 'noopener' : ''}
                @click=${() => (this.open = false)}
              >
                <span>${navLabel(item.key)}</span>
                ${item.suffix ? html`<span>${item.suffix}</span>` : ''}
                ${item.external ? html`<span class="ext">↗</span>` : ''}
              </a>
            `,
          )}
        </nav>
      </aside>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nav-menu': NavMenu;
  }
}

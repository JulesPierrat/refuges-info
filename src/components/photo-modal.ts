import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface GalleryPhoto {
  full: string;
  auteur?: string;
  date?: string;
}

/**
 * Full-screen photo gallery modal. Rendered at the app-shell level (not inside a
 * panel) so its fixed positioning fills the viewport — a `backdrop-filter`
 * ancestor would otherwise trap and crop it. Emits `close-gallery`.
 */
@customElement('photo-modal')
export class PhotoModal extends LitElement {
  static styles = css`
    .overlay {
      position: fixed; inset: 0; z-index: 80;
      background: rgba(0, 0, 0, 0.93);
      display: flex; align-items: center; justify-content: center;
    }
    img {
      max-width: 94vw; max-height: 86vh; object-fit: contain;
      border-radius: var(--radius-sm, 8px); box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
    }
    button {
      position: absolute; border: none; cursor: pointer; color: #fff;
      background: rgba(255, 255, 255, 0.14);
      width: 50px; height: 50px; border-radius: 999px; font-size: 1.5rem; line-height: 1;
    }
    button:hover { background: rgba(255, 255, 255, 0.3); }
    button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
    .close { top: 18px; right: 22px; }
    .nav { top: 50%; transform: translateY(-50%); }
    .prev { left: 18px; }
    .next { right: 18px; }
    .caption {
      position: absolute; bottom: 20px; left: 0; right: 0; text-align: center;
      color: rgba(255, 255, 255, 0.85); font: 0.85rem system-ui, sans-serif;
    }
  `;

  @property({ attribute: false }) photos: GalleryPhoto[] = [];
  @property({ type: Number }) startIndex = 0;

  @state() private index = 0;

  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
    else if (e.key === 'ArrowRight') this.step(1);
    else if (e.key === 'ArrowLeft') this.step(-1);
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.onKey);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.onKey);
  }
  willUpdate(changed: PropertyValues) {
    if (changed.has('startIndex')) this.index = this.startIndex;
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close-gallery', { bubbles: true, composed: true }));
  }
  private step(delta: number) {
    const n = this.photos.length;
    if (n) this.index = (this.index + delta + n) % n;
  }

  render() {
    const p = this.photos[this.index];
    if (!p) return nothing;
    return html`
      <div class="overlay" @click=${this.close}>
        <button class="close" aria-label="✕" @click=${this.close}>✕</button>
        ${this.photos.length > 1
          ? html`
              <button class="nav prev" aria-label="‹" @click=${(e: Event) => { e.stopPropagation(); this.step(-1); }}>‹</button>
              <button class="nav next" aria-label="›" @click=${(e: Event) => { e.stopPropagation(); this.step(1); }}>›</button>
            `
          : nothing}
        <img src=${p.full} alt="" @click=${(e: Event) => e.stopPropagation()} />
        <div class="caption">
          ${this.index + 1} / ${this.photos.length}${p.auteur ? ` · © ${p.auteur}` : ''}${p.date ? ` · ${p.date}` : ''}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'photo-modal': PhotoModal;
  }
}

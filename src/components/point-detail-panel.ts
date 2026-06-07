import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { updateWhenLocaleChanges } from '@lit/localize';
import { getPointFull, type PointComment, type PointFull } from '../api/client';
import { SITE_BASE } from '../api/config';
import { iconAttrsFromPoint, iconDataUri, type PointIconInput } from '../icons';
import { t } from '../labels';

const isOui = (f?: { valeur?: string }) =>
  typeof f?.valeur === 'string' && f.valeur.toLowerCase().startsWith('oui');

/** Reduced-size photo URL from a comment's `-originale` path. */
function photoUrl(path: string): string {
  return SITE_BASE + path.replace('-originale', '-reduite');
}

/**
 * Right-side panel with a point's main info and photos. Opens on point click;
 * "See full page" links to the complete refuges.info page (comments, details).
 */
@customElement('point-detail-panel')
export class PointDetailPanel extends LitElement {
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
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-4); border-bottom: 1px solid var(--border);
    }
    header img.ic { width: 36px; height: 36px; flex: none; }
    .htext { flex: 1; min-width: 0; }
    h1 { margin: 0; font-family: var(--font-display); font-size: 1.15rem; line-height: 1.15; }
    .sub { color: var(--text-muted); font-size: 0.82rem; }
    .sub .alt { font-family: var(--font-mono); }
    .close {
      width: 34px; height: 34px; flex: none; border: none; border-radius: var(--radius-sm);
      background: transparent; color: var(--text-muted); cursor: pointer;
    }
    .close:hover { background: var(--bg-sunken); color: var(--text); }

    .scroll { overflow-y: auto; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-4); }
    .chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: var(--radius-full);
      background: var(--brand-soft); color: var(--brand-hover);
      font-size: 0.78rem; font-weight: 600;
    }
    .chip.muted { background: var(--bg-sunken); color: var(--text-muted); }

    section h2 {
      margin: 0 0 var(--space-1); font-size: 0.72rem; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-subtle);
    }
    p.body { margin: 0; font-size: 0.9rem; line-height: 1.45; color: var(--text); white-space: pre-line; }

    .photos { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2); }
    .photos button {
      display: block; padding: 0; border: none; cursor: pointer;
      aspect-ratio: 4 / 3; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-sunken);
    }
    .photos img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photos button:focus-visible { outline: none; box-shadow: var(--focus-ring); }

    .more {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 0 var(--space-4); height: 44px; border-radius: var(--radius-md);
      background: var(--brand); color: var(--text-on-brand);
      font: 600 0.9rem var(--font-sans); text-decoration: none;
    }
    .more:hover { background: var(--brand-hover); }
    .hint { color: var(--text-subtle); font-size: 0.88rem; }
    footer { padding: var(--space-4); border-top: 1px solid var(--border); }
    :focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: var(--radius-sm); }
  `;

  @property({ type: Number }) pointId?: number;

  @state() private point?: PointFull;
  @state() private loading = false;

  private abort?: AbortController;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  willUpdate(changed: PropertyValues) {
    if (changed.has('pointId') && this.pointId != null) this.load(this.pointId);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.abort?.abort();
  }

  private get photos(): PointComment[] {
    return (this.point?.commentaires ?? []).filter((c) => c.photo).slice(0, 12);
  }

  /** Ask the shell to open the full-screen gallery (a top-level modal). */
  private openGallery(index: number) {
    const photos = this.photos.map((c) => ({
      full: SITE_BASE + c.photo!,
      auteur: c.auteur,
      date: c.date_photo,
    }));
    this.dispatchEvent(
      new CustomEvent('open-gallery', { detail: { photos, index }, bubbles: true, composed: true }),
    );
  }

  private async load(id: number) {
    this.loading = true;
    this.point = undefined;
    this.abort?.abort();
    this.abort = new AbortController();
    try {
      this.point = await getPointFull(id, this.abort.signal);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('point detail', err);
    } finally {
      this.loading = false;
    }
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close-detail', { bubbles: true, composed: true }));
  }

  private infoChips(p: PointFull) {
    const ic = p.info_comp ?? {};
    const chips: string[] = [];
    if (isOui(ic.cheminee) || isOui(ic.poele)) chips.push(t.legendFireplace());
    if (isOui(ic.eau)) chips.push(t.legendWater());
    if (isOui(ic.couvertures)) chips.push(t.infoBlankets());
    if (isOui(ic.latrines)) chips.push(t.infoLatrines());
    if (isOui(ic.manque_un_mur)) chips.push(t.legendMissingWall());
    return chips;
  }

  render() {
    if (this.loading || !this.point) {
      return html`
        <header>
          <div class="htext"><h1>${t.detailLoading()}</h1></div>
          <button class="close" aria-label=${t.detailClose()} @click=${this.close}>✕</button>
        </header>
      `;
    }
    const p = this.point;
    const beds = Number(p.places?.valeur) || 0;
    const access = p.acces?.valeur?.trim();
    const desc = (p.description?.valeur || p.remarque?.valeur)?.trim();
    const photos = this.photos;
    const chips = this.infoChips(p);

    return html`
      <header>
        <img class="ic" src=${iconDataUri(iconAttrsFromPoint(p as PointIconInput))} alt="" />
        <div class="htext">
          <h1>${p.nom}</h1>
          <div class="sub">
            ${p.type?.valeur ?? ''}${p.coord?.alt
              ? html` · <span class="alt">${p.coord.alt} m</span>`
              : ''}
          </div>
        </div>
        <button class="close" aria-label=${t.detailClose()} @click=${this.close}>✕</button>
      </header>

      <div class="scroll">
        <div class="chips">
          ${beds > 0 ? html`<span class="chip">🛏 ${beds} ${t.detailBeds()}</span>` : nothing}
          ${chips.map((c) => html`<span class="chip muted">${c}</span>`)}
        </div>

        ${photos.length
          ? html`
              <section>
                <h2>${t.detailPhotos()}</h2>
                <div class="photos">
                  ${photos.map(
                    (c, i) => html`
                      <button @click=${() => this.openGallery(i)} aria-label="${t.detailPhotos()} ${i + 1}">
                        <img src=${photoUrl(c.photo!)} loading="lazy" alt="" />
                      </button>
                    `,
                  )}
                </div>
              </section>
            `
          : nothing}

        ${access
          ? html`<section><h2>${t.detailAccess()}</h2><p class="body">${access}</p></section>`
          : nothing}
        ${desc ? html`<section><p class="body">${desc}</p></section>` : nothing}
      </div>

      ${p.lien
        ? html`<footer>
            <a class="more" href=${p.lien} target="_blank" rel="noopener">${t.detailMore()} ↗</a>
          </footer>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'point-detail-panel': PointDetailPanel;
  }
}

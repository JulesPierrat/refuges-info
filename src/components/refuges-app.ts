import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import './refuge-map';

/** Application shell: header + full-bleed map. */
@customElement('refuges-app')
export class RefugesApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100svh;
    }
    header {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      padding: 0.6rem 1rem;
      background: #1f6f43;
      color: #fff;
      font-family: system-ui, sans-serif;
    }
    header h1 {
      margin: 0;
      font-size: 1.15rem;
    }
    header p {
      margin: 0;
      font-size: 0.8rem;
      opacity: 0.85;
    }
    .map-wrap {
      position: relative;
      flex: 1;
      min-height: 0;
    }
  `;

  render() {
    return html`
      <header>
        <h1>refuges.info</h1>
        <p>Refuges, cabanes et points d'eau de montagne</p>
      </header>
      <div class="map-wrap">
        <refuge-map></refuge-map>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'refuges-app': RefugesApp;
  }
}

import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import maplibregl, { type Map as MlMap, type GeoJSONSource } from 'maplibre-gl';
import maplibreCss from 'maplibre-gl/dist/maplibre-gl.css?inline';
import { getPointsInBbox } from '../api/client';
import type { Bbox, PointCollection } from '../api/types';

const EMPTY: PointCollection = { type: 'FeatureCollection', features: [] };

/** Free vector-tile basemap (no API key). Swap for IGN/OSM as needed. */
const STYLE_URL = 'https://demotiles.maplibre.org/style.json';

/** Centred on the French Alps by default. */
const DEFAULT_CENTER: [number, number] = [6.5, 45.2];
const DEFAULT_ZOOM = 7;

/**
 * Interactive map of refuges.info points. Loads points for the current viewport
 * from the public API and re-queries (debounced) whenever the map stops moving.
 */
@customElement('refuge-map')
export class RefugeMap extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    #map {
      width: 100%;
      height: 100%;
    }
    .badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      z-index: 1;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font: 600 0.8rem system-ui, sans-serif;
      background: rgba(255, 255, 255, 0.92);
      color: #1f2933;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }
  `;

  /** Max points requested per viewport load. */
  @property({ type: Number }) nbPoints = 500;

  @state() private count = 0;
  @state() private loading = false;

  private map?: MlMap;
  private abort?: AbortController;
  private debounce?: ReturnType<typeof setTimeout>;

  render() {
    // Inject MapLibre's stylesheet into the shadow root so its controls render.
    return html`
      <style>
        ${maplibreCss}
      </style>
      <div class="badge">
        ${this.loading ? '…' : this.count} ${this.count === 1 ? 'point' : 'points'}
      </div>
      <div id="map"></div>
    `;
  }

  firstUpdated(_changed: PropertyValues) {
    const container = this.renderRoot.querySelector<HTMLElement>('#map')!;
    this.map = new maplibregl.Map({
      container,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    this.map.addControl(new maplibregl.NavigationControl(), 'top-left');
    this.map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }), 'top-left');

    this.map.on('load', () => {
      this.map!.addSource('points', { type: 'geojson', data: EMPTY });
      this.map!.addLayer({
        id: 'points',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': 6,
          'circle-color': '#c0392b',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });
      this.map!.on('click', 'points', (e) => this.onPointClick(e));
      this.map!.on('mouseenter', 'points', () => (this.map!.getCanvas().style.cursor = 'pointer'));
      this.map!.on('mouseleave', 'points', () => (this.map!.getCanvas().style.cursor = ''));
      this.loadViewport();
    });
    this.map.on('moveend', () => this.scheduleLoad());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.abort?.abort();
    clearTimeout(this.debounce);
    this.map?.remove();
  }

  private scheduleLoad() {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.loadViewport(), 350);
  }

  private async loadViewport() {
    if (!this.map) return;
    const b = this.map.getBounds();
    const bbox: Bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];

    this.abort?.abort();
    this.abort = new AbortController();
    this.loading = true;
    try {
      const data = await getPointsInBbox(
        bbox,
        { detail: 'simple', nbPoints: this.nbPoints, typesPoint: 'all' },
        this.abort.signal,
      );
      (this.map.getSource('points') as GeoJSONSource).setData(data);
      this.count = data.features.length;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('Failed to load points', err);
    } finally {
      this.loading = false;
    }
  }

  private onPointClick(e: maplibregl.MapLayerMouseEvent) {
    const f = e.features?.[0];
    if (!f) return;
    const p = f.properties as Record<string, string>;
    // GeoJSON feature properties arrive as strings/JSON through MapLibre.
    const nom = p.nom ?? 'Point';
    const type = safeParse(p.type)?.valeur ?? '';
    const lien = p.lien ?? '#';
    new maplibregl.Popup()
      .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
      .setHTML(
        `<strong>${escapeHtml(nom)}</strong><br><em>${escapeHtml(type)}</em><br>` +
          `<a href="${escapeHtml(lien)}" target="_blank" rel="noopener">Voir la fiche ↗</a>`,
      )
      .addTo(this.map!);
  }
}

function safeParse(v: unknown): { valeur?: string } | undefined {
  if (typeof v !== 'string') return v as { valeur?: string } | undefined;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'refuge-map': RefugeMap;
  }
}

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import maplibregl, {
  type Map as MlMap,
  type Marker,
  type StyleSpecification,
} from 'maplibre-gl';
import maplibreCss from 'maplibre-gl/dist/maplibre-gl.css?inline';
import type { Bbox, PointCollection } from '../api/types';

/** Free, key-less vector topo basemap. */
const VECTOR_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/** OpenTopoMap raster basemap (XYZ tiles, CC-BY-SA). */
const OPENTOPO_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    opentopomap: {
      type: 'raster',
      tiles: [
        'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution:
        'map data: © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | display: © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    },
  },
  layers: [{ id: 'opentopomap', type: 'raster', source: 'opentopomap' }],
};

/** Amazon S3-hosted terrarium-encoded DEM (terrain). */
const TERRAIN_TILES = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png';

/** Single, monochrome marker/point color (no multicolor by point type). */
const MARKER_COLOR = '#1E6F4C';

const HOME_VIEW = { center: [6, 46] as [number, number], zoom: 2.4 };

export type Basemap = 'vector' | 'opentopomap';
export const BASEMAP_LABELS: Record<Basemap, string> = {
  vector: 'Plan',
  opentopomap: 'OpenTopo',
};

/**
 * Full-bleed MapLibre globe with 3D terrain. The map instance is created once
 * and persists for the app's lifetime; the basemap and the displayed points can
 * be swapped without remounting. Imperative API used by the app shell.
 */
@customElement('app-globe')
export class AppGlobe extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; height: 100%; }
    #map { width: 100%; height: 100%; background: var(--bg-sunken); }
  `;

  private map?: MlMap;
  private marker?: Marker;
  private basemap: Basemap = 'vector';
  private points?: PointCollection;

  render() {
    return html`
      <style>
        ${maplibreCss}
      </style>
      <div id="map"></div>
    `;
  }

  firstUpdated() {
    const container = this.renderRoot.querySelector<HTMLElement>('#map')!;
    const map = new maplibregl.Map({
      container,
      style: VECTOR_STYLE,
      center: HOME_VIEW.center,
      zoom: HOME_VIEW.zoom,
      attributionControl: { compact: true },
    });
    this.map = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }), 'bottom-right');

    // Re-applied on every style load (initial + basemap switches).
    map.on('style.load', () => this.decorateStyle());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.map?.remove();
  }

  /** Globe projection, terrain, sky and the points layer — re-added per style. */
  private decorateStyle() {
    const map = this.map!;
    map.setProjection({ type: 'globe' });
    if (!map.getSource('amazon-terrain')) {
      map.addSource('amazon-terrain', {
        type: 'raster-dem',
        tiles: [TERRAIN_TILES],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 14,
        attribution: 'Terrain: AWS Terrain Tiles',
      });
    }
    map.setTerrain({ source: 'amazon-terrain', exaggeration: 1.3 });
    map.setSky({
      'sky-color': '#7AB0DE',
      'horizon-color': '#EAF2FB',
      'fog-color': '#FFFFFF',
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.4,
    });
    this.applyPoints();
  }

  private applyPoints() {
    const map = this.map;
    // Before the style is ready, points are stored and re-applied in decorateStyle().
    if (!map || !map.isStyleLoaded()) return;
    const data = this.points ?? { type: 'FeatureCollection', features: [] };
    const src = map.getSource('points') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(data);
      return;
    }
    map.addSource('points', { type: 'geojson', data });
    map.addLayer({
      id: 'points',
      type: 'circle',
      source: 'points',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, 12, 7],
        'circle-color': MARKER_COLOR,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff',
      },
    });
    map.on('mouseenter', 'points', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'points', () => (map.getCanvas().style.cursor = ''));
  }

  /** Switch the basemap, keeping the same map instance (no remount). */
  setBasemap(kind: Basemap) {
    if (kind === this.basemap || !this.map) return;
    this.basemap = kind;
    this.map.setStyle(kind === 'vector' ? VECTOR_STYLE : OPENTOPO_STYLE);
  }
  getBasemap(): Basemap {
    return this.basemap;
  }

  /** Display a set of points (e.g. a massif's), or clear when undefined. */
  showPoints(collection?: PointCollection) {
    this.points = collection;
    this.applyPoints();
  }

  /** Zoom the globe to fit a bounding box. */
  flyToBbox(bbox: Bbox) {
    this.map?.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 80, duration: 1600 },
    );
  }

  /** Fly to a single point and drop a monochrome marker. */
  flyToPoint(lng: number, lat: number) {
    if (!this.map) return;
    this.marker?.remove();
    const el = document.createElement('div');
    el.style.cssText =
      `width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
      `background:${MARKER_COLOR};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)`;
    this.marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(this.map);
    this.map.flyTo({ center: [lng, lat], zoom: 13, pitch: 55, duration: 2200 });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-globe': AppGlobe;
  }
}

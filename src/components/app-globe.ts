import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import maplibregl, { type Map as MlMap, type Marker } from 'maplibre-gl';
import maplibreCss from 'maplibre-gl/dist/maplibre-gl.css?inline';
import type { Bbox } from '../api/types';

/** Free, key-less vector topo basemap. */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Amazon S3-hosted terrarium-encoded DEM (terrain). */
const TERRAIN_TILES = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png';

const HOME_VIEW = { center: [6, 46] as [number, number], zoom: 2.4 };

/**
 * Full-bleed MapLibre globe with 3D terrain over a vector topo basemap.
 * Exposes imperative `flyToBbox` / `flyToPoint` used by the home page.
 */
@customElement('app-globe')
export class AppGlobe extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    #map {
      width: 100%;
      height: 100%;
      background: var(--bg-sunken);
    }
  `;

  private map?: MlMap;
  private marker?: Marker;

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
      style: STYLE_URL,
      center: HOME_VIEW.center,
      zoom: HOME_VIEW.zoom,
      attributionControl: { compact: true },
    });
    this.map = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }), 'bottom-right');

    map.on('style.load', () => {
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
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.map?.remove();
  }

  /** Zoom the globe to fit a massif's bounds. */
  flyToBbox(bbox: Bbox) {
    this.map?.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 80, duration: 1600 },
    );
  }

  /** Fly to a single point and drop a colored marker. */
  flyToPoint(lng: number, lat: number, color = 'var(--brand)') {
    if (!this.map) return;
    this.marker?.remove();
    const el = document.createElement('div');
    el.style.cssText =
      `width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
      `background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)`;
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

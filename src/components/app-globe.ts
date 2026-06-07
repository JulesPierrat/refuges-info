import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import maplibregl, {
  type Map as MlMap,
  type Marker,
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl';
import maplibreCss from 'maplibre-gl/dist/maplibre-gl.css?inline';
import type { Bbox, PointCollection } from '../api/types';
import { iconAttrsFromPoint, iconKey, composeIconSvg } from '../icons';

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

const HOME_VIEW = { center: [6, 46] as [number, number], zoom: 2.4 };
const EMPTY: PointCollection = { type: 'FeatureCollection', features: [] };

export type Basemap = 'vector' | 'opentopomap';
export const BASEMAP_LABELS: Record<Basemap, string> = {
  vector: 'Plan',
  opentopomap: 'OpenTopo',
};

function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

/**
 * Full-bleed MapLibre globe with 3D terrain. The map instance is created once
 * and persists for the app's lifetime; the basemap and the displayed points can
 * be swapped without remounting.
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
  private svgByKey = new Map<string, string>();
  private addedIcons = new Set<string>();

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
      // Kill pan inertia: on the globe with terrain the post-release glide
      // reads as the camera drifting/tilting oddly.
      dragPan: { maxSpeed: 0, deceleration: 30000 },
    });
    this.map = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true }), 'bottom-right');

    map.on('style.load', () => this.decorateStyle());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.map?.remove();
  }

  /** Globe projection, relief, sky and the points — re-applied per style. */
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
        attribution: 'Relief: AWS Terrain Tiles',
      });
    }
    // Relief is shown as hillshade rather than 3D terrain: setTerrain() makes the
    // camera follow the ground elevation, which jumps oddly when releasing a drag.
    // Hillshade keeps the Amazon DEM relief look without touching the camera.
    if (this.basemap === 'vector' && !map.getLayer('hillshade')) {
      const firstSymbol = map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
      map.addLayer(
        {
          id: 'hillshade',
          type: 'hillshade',
          source: 'amazon-terrain',
          paint: { 'hillshade-exaggeration': 0.45 },
        },
        firstSymbol,
      );
    }
    map.setSky({
      'sky-color': '#7AB0DE',
      'horizon-color': '#EAF2FB',
      'fog-color': '#FFFFFF',
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.4,
    });
    // setStyle() drops images and sources — re-register them.
    this.addedIcons.clear();
    void this.refreshPoints();
  }

  private async refreshPoints() {
    const map = this.map;
    if (!map || !map.isStyleLoaded()) return;
    await this.ensureIcons();
    const data = this.points ?? EMPTY;
    const src = map.getSource('points') as GeoJSONSource | undefined;
    if (src) {
      src.setData(data);
      return;
    }
    map.addSource('points', { type: 'geojson', data });
    map.addLayer({
      id: 'points',
      type: 'symbol',
      source: 'points',
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.5, 10, 0.8],
        'icon-allow-overlap': true,
        'icon-anchor': 'center',
      },
    });
    map.on('mouseenter', 'points', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'points', () => (map.getCanvas().style.cursor = ''));
    map.on('click', 'points', (e) => {
      const f = e.features?.[0];
      if (!f || f.geometry.type !== 'Point') return;
      const id = Number((f.properties as { id?: number | string }).id);
      const [lng, lat] = f.geometry.coordinates;
      this.dispatchEvent(
        new CustomEvent('open-point', { detail: { id, lng, lat }, bubbles: true, composed: true }),
      );
    });
  }

  private async ensureIcons() {
    const map = this.map!;
    const tasks: Promise<void>[] = [];
    for (const [key, svg] of this.svgByKey) {
      if (this.addedIcons.has(key) || map.hasImage(key)) {
        this.addedIcons.add(key);
        continue;
      }
      tasks.push(
        svgToImage(svg).then((img) => {
          if (!map.hasImage(key)) map.addImage(key, img, { pixelRatio: 2 });
          this.addedIcons.add(key);
        }),
      );
    }
    await Promise.all(tasks);
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

  /** Display a set of points with composed type icons (or clear). */
  showPoints(collection?: PointCollection) {
    this.svgByKey = new Map();
    if (collection) {
      for (const f of collection.features) {
        const attrs = iconAttrsFromPoint(f.properties);
        const key = iconKey(attrs);
        (f.properties as unknown as Record<string, unknown>).icon = key;
        if (!this.svgByKey.has(key)) this.svgByKey.set(key, composeIconSvg(attrs));
      }
    }
    this.points = collection;
    void this.refreshPoints();
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

  /** Move the camera to a point (no marker). */
  flyTo(lng: number, lat: number) {
    this.map?.flyTo({ center: [lng, lat], zoom: 13, pitch: 40, duration: 2000 });
  }

  /** Fly to a point and drop a marker — optionally the point's composed icon. */
  flyToPoint(lng: number, lat: number, iconSvg?: string) {
    if (!this.map) return;
    this.marker?.remove();
    const el = document.createElement('div');
    if (iconSvg) {
      el.style.cssText = 'width:40px;height:40px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.4))';
      el.innerHTML = iconSvg;
    } else {
      el.style.cssText =
        `width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
        `background:#1E6F4C;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)`;
    }
    this.marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(this.map);
    this.map.flyTo({ center: [lng, lat], zoom: 13, pitch: 40, duration: 2200 });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-globe': AppGlobe;
  }
}

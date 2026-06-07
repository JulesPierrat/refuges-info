import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import maplibregl, {
  type Map as MlMap,
  type Marker,
  type GeoJSONSource,
  type StyleSpecification,
  type ExpressionSpecification,
} from 'maplibre-gl';
import maplibreCss from 'maplibre-gl/dist/maplibre-gl.css?inline';
import type { Bbox, PointCollection } from '../api/types';
import type { MassifCollection } from '../api/massifs';
import { iconAttrsFromPoint, iconKey, composeIconSvg } from '../icons';

/** Free, key-less vector topo basemap. */
const VECTOR_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/** OpenTopoMap raster basemap (XYZ tiles, CC-BY-SA). */
/** Shared free glyphs so symbol (text) layers work on raster basemaps too. */
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

const OPENTOPO_STYLE: StyleSpecification = {
  version: 8,
  glyphs: GLYPHS,
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
        '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors | © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    },
  },
  layers: [{ id: 'opentopomap', type: 'raster', source: 'opentopomap' }],
};

/** IGN (Géoplateforme) orthophotos — aerial imagery over France, key-less WMTS. */
const IGN_ORTHO_STYLE: StyleSpecification = {
  version: 8,
  glyphs: GLYPHS,
  sources: {
    ign: {
      type: 'raster',
      tiles: [
        'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
          '&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM' +
          '&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.ign.fr">IGN</a> / Géoplateforme',
    },
  },
  layers: [{ id: 'ign', type: 'raster', source: 'ign' }],
};

/** SwissTopo national map at 1:25000 (fixed scale, raster WMTS) — Switzerland. */
const SWISSTOPO_STYLE: StyleSpecification = {
  version: 8,
  glyphs: GLYPHS,
  sources: {
    swisstopo: {
      type: 'raster',
      tiles: [
        'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe-pk25.noscale/default/current/3857/{z}/{x}/{y}.jpeg',
      ],
      tileSize: 256,
      maxzoom: 18,
      attribution: '© <a href="https://www.swisstopo.admin.ch">swisstopo</a>',
    },
  },
  layers: [{ id: 'swisstopo', type: 'raster', source: 'swisstopo' }],
};

/** IGN topographic map "Plan IGN v2" (key-less Géoplateforme) — the SCAN 25-style
 *  topo; the actual SCAN 25® product is not available without an API key. */
const IGN_TOPO_STYLE: StyleSpecification = {
  version: 8,
  glyphs: GLYPHS,
  sources: {
    'ign-topo': {
      type: 'raster',
      tiles: [
        'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
          '&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM' +
          '&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.ign.fr">IGN</a> / Géoplateforme',
    },
  },
  layers: [{ id: 'ign-topo', type: 'raster', source: 'ign-topo' }],
};

/** Amazon S3-hosted terrarium-encoded DEM (3D terrain). */
const TERRAIN_TILES = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png';

const HOME_VIEW = { center: [6, 46] as [number, number], zoom: 2.4 };
const EMPTY: PointCollection = { type: 'FeatureCollection', features: [] };

export type Basemap = 'vector' | 'opentopomap' | 'ign-topo' | 'ign-ortho' | 'swisstopo';
const STYLES: Record<Basemap, string | StyleSpecification> = {
  vector: VECTOR_STYLE,
  opentopomap: OPENTOPO_STYLE,
  'ign-topo': IGN_TOPO_STYLE,
  'ign-ortho': IGN_ORTHO_STYLE,
  swisstopo: SWISSTOPO_STYLE,
};
/** Ordered list for the basemap selector (labels resolved by the shell). */
export const BASEMAPS: Basemap[] = ['vector', 'opentopomap', 'ign-topo', 'ign-ortho', 'swisstopo'];

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
  private basemap: Basemap = 'ign-ortho';
  private points?: PointCollection;
  private massifs?: MassifCollection;
  private hoveredMassif?: number | string;
  private svgByKey = new Map<string, string>();
  private addedIcons = new Set<string>();
  /** True once a style is fully loaded and safe to mutate. Reset on setStyle(). */
  private styleReady = false;

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
      style: STYLES[this.basemap],
      center: HOME_VIEW.center,
      zoom: HOME_VIEW.zoom,
      maxPitch: 80,
      attributionControl: { compact: true },
      // Kill pan inertia: the post-release glide over 3D terrain reads as the
      // camera drifting/tilting oddly.
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

  /** Globe projection, 3D terrain, sky and the points — re-applied per style. */
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
    map.setTerrain({ source: 'amazon-terrain', exaggeration: 1.2 });
    map.setSky({
      'sky-color': '#7AB0DE',
      'horizon-color': '#EAF2FB',
      'fog-color': '#FFFFFF',
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.4,
    });
    // setStyle() drops images, sources and layers — re-register everything.
    this.addedIcons.clear();
    this.styleReady = true;
    this.refreshMassifs();
    void this.refreshPoints();
  }

  /** Draw clickable massif contours (home), or clear them. */
  showMassifContours(collection?: MassifCollection) {
    this.massifs = collection;
    this.refreshMassifs();
  }

  private refreshMassifs() {
    const map = this.map;
    if (!map || !this.styleReady) return;
    const data: MassifCollection = this.massifs ?? { type: 'FeatureCollection', features: [] };
    const src = map.getSource('massifs') as GeoJSONSource | undefined;
    if (src) {
      src.setData(data as unknown as GeoJSON.FeatureCollection);
      return;
    }
    map.addSource('massifs', { type: 'geojson', data: data as never, promoteId: 'id' });
    const hover: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];
    map.addLayer({
      id: 'massif-fill',
      type: 'fill',
      source: 'massifs',
      paint: { 'fill-color': '#1E6F4C', 'fill-opacity': ['case', hover, 0.2, 0.06] },
    });
    map.addLayer({
      id: 'massif-line',
      type: 'line',
      source: 'massifs',
      paint: {
        'line-color': '#1E6F4C',
        'line-width': ['case', hover, 2.6, 1.2],
        'line-opacity': 0.85,
      },
    });
    map.addLayer({
      id: 'massif-label',
      type: 'symbol',
      source: 'massifs',
      minzoom: 4,
      layout: {
        'text-field': ['get', 'nom'],
        'text-size': 12,
        'text-font': ['Noto Sans Regular'],
      },
      paint: {
        'text-color': '#134630',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.4,
      },
    });
    map.on('mousemove', 'massif-fill', (e) => {
      const f = e.features?.[0];
      if (!f) return;
      if (this.hoveredMassif !== undefined)
        map.setFeatureState({ source: 'massifs', id: this.hoveredMassif }, { hover: false });
      this.hoveredMassif = f.id;
      map.setFeatureState({ source: 'massifs', id: f.id }, { hover: true });
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'massif-fill', () => {
      if (this.hoveredMassif !== undefined)
        map.setFeatureState({ source: 'massifs', id: this.hoveredMassif }, { hover: false });
      this.hoveredMassif = undefined;
      map.getCanvas().style.cursor = '';
    });
    map.on('click', 'massif-fill', (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const nom = (f.properties as { nom?: string }).nom ?? '';
      this.dispatchEvent(
        new CustomEvent('open-massif', { detail: { nom }, bubbles: true, composed: true }),
      );
    });
  }

  private async refreshPoints() {
    const map = this.map;
    if (!map || !this.styleReady) return;
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
      const props = f.properties as { id?: number | string; nom?: string };
      const [lng, lat] = f.geometry.coordinates;
      this.dispatchEvent(
        new CustomEvent('open-point', {
          detail: { id: Number(props.id), nom: props.nom, lng, lat },
          bubbles: true,
          composed: true,
        }),
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
    this.styleReady = false; // points/icons are re-added on the next style.load
    this.map.setStyle(STYLES[kind]);
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
    this.map?.flyTo({ center: [lng, lat], zoom: 13, pitch: 50, duration: 2000 });
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
    this.map.flyTo({ center: [lng, lat], zoom: 13, pitch: 50, duration: 2200 });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-globe': AppGlobe;
  }
}

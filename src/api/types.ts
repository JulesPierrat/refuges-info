/**
 * Types describing the refuges.info public API responses.
 * Reference: https://www.refuges.info/api/doc/
 *
 * The point/bbox/massif endpoints return a GeoJSON FeatureCollection where each
 * feature is a Point whose `properties` shape depends on the `detail` level
 * (icone < simple < complet < fiche).
 */

/**
 * Point category ids used by `types_point`. Non-exhaustive — the API exposes more.
 * A plain const object (not an `enum`) to satisfy `erasableSyntaxOnly`.
 */
export const PointType = {
  Sommet: 1,
  PointDEau: 6,
  CabaneNonGardee: 7,
  GiteDEtape: 9,
  RefugeGarde: 10,
  RefugeOuvertHorsGardiennage: 23,
} as const;

export type PointType = (typeof PointType)[keyof typeof PointType];

/** A categorical value as returned by the API (`{ valeur, id }`, sometimes `icone`). */
export interface ApiEnum {
  valeur: string;
  id?: number | string;
  /** Icon key, present on the `type` field. */
  icone?: string;
}

/** Properties present at the `icone` detail level (and above). */
export interface PointPropertiesIcone {
  id: number;
  nom: string;
  sym?: string;
  type: ApiEnum;
  coord: {
    alt: number;
    /** lon/lat are usually carried by the GeoJSON geometry, not duplicated here. */
    long?: number;
    lat?: number;
    /** Precision / source of the coordinates. */
    precision?: ApiEnum;
  };
}

/** Additional properties present at the `simple` detail level (and above). */
export interface PointPropertiesSimple extends PointPropertiesIcone {
  /** Public URL of the point's page on refuges.info. */
  lien: string;
  date?: { derniere_modif: string };
  /** Open/closed-ish status, when meaningful for the type. */
  etat?: ApiEnum | null;
  places?: { valeur: number | null; detail?: string };
}

export type PointProperties = PointPropertiesSimple;

export type PointFeature = GeoJSON.Feature<GeoJSON.Point, PointProperties>;
export type PointCollection = GeoJSON.FeatureCollection<GeoJSON.Point, PointProperties>;

/** A west,south,east,north bounding box. */
export type Bbox = [west: number, south: number, east: number, north: number];

export type DetailLevel = 'icone' | 'simple' | 'complet' | 'fiche';

import type { FieldPolygonPoint } from '../types/agrishift';

export const SQ_METERS_PER_FEDDAN = 4200.83;
export const KIRATS_PER_FEDDAN = 24;
export const SQ_METERS_PER_HECTARE = 10000;
const EARTH_RADIUS_M = 6378137;

/**
 * Converts square meters to Egyptian feddans (1 feddan = 4,200.83 m²).
 */
export function sqMetersToFeddans(sqMeters: number): number {
  if (!Number.isFinite(sqMeters) || sqMeters <= 0) return 0;
  return sqMeters / SQ_METERS_PER_FEDDAN;
}

/**
 * Converts feddans to hectares (1 feddan ≈ 0.420083 ha).
 */
export function feddansToHectares(feddans: number): number {
  if (!Number.isFinite(feddans) || feddans <= 0) return 0;
  return (feddans * SQ_METERS_PER_FEDDAN) / SQ_METERS_PER_HECTARE;
}

/**
 * Converts hectares to Egyptian feddans.
 */
export function hectaresToFeddans(hectares: number): number {
  if (!Number.isFinite(hectares) || hectares <= 0) return 0;
  return (hectares * SQ_METERS_PER_HECTARE) / SQ_METERS_PER_FEDDAN;
}

/**
 * Splits a feddan measurement into whole feddans and remaining kirats (1 feddan = 24 kirats).
 */
export function feddansToFeddansAndKirats(totalFeddans: number): { feddans: number; kirats: number } {
  if (!Number.isFinite(totalFeddans) || totalFeddans <= 0) {
    return { feddans: 0, kirats: 0 };
  }
  const wholeFeddans = Math.floor(totalFeddans);
  const remainderKirats = Math.round((totalFeddans - wholeFeddans) * KIRATS_PER_FEDDAN);
  if (remainderKirats >= KIRATS_PER_FEDDAN) {
    return { feddans: wholeFeddans + 1, kirats: 0 };
  }
  return { feddans: wholeFeddans, kirats: remainderKirats };
}

/**
 * Computes geodesic polygon area on a sphere (m²) using the standard Earth-observation excess formula.
 */
export function calculateGeodesicAreaSqMeters(points: FieldPolygonPoint[]): number {
  if (points.length < 3) return 0;
  let total = 0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const lon1 = toRad(p1.lon);
    const lat1 = toRad(p1.lat);
    const lon2 = toRad(p2.lon);
    const lat2 = toRad(p2.lat);
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

/**
 * Computes polygon area directly in Egyptian feddans.
 */
export function calculatePolygonAreaFeddans(points: FieldPolygonPoint[]): number {
  return sqMetersToFeddans(calculateGeodesicAreaSqMeters(points));
}

/**
 * Computes the geometric centroid of a drawn field polygon.
 */
export function calculatePolygonCentroid(points: FieldPolygonPoint[]): FieldPolygonPoint | null {
  if (points.length === 0) return null;
  let sumLat = 0;
  let sumLon = 0;
  for (const pt of points) {
    sumLat += pt.lat;
    sumLon += pt.lon;
  }
  return {
    lat: Number((sumLat / points.length).toFixed(5)),
    lon: Number((sumLon / points.length).toFixed(5)),
  };
}

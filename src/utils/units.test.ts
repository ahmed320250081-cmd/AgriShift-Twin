import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SQ_METERS_PER_FEDDAN,
  calculatePolygonAreaFeddans,
  calculatePolygonCentroid,
  feddansToFeddansAndKirats,
  feddansToHectares,
  hectaresToFeddans,
  sqMetersToFeddans,
} from './units';

test('converts square meters and hectares to feddans accurately', () => {
  assert.equal(Math.round(sqMetersToFeddans(SQ_METERS_PER_FEDDAN) * 100) / 100, 1);
  assert.equal(Math.round(feddansToHectares(1) * 1000) / 1000, 0.42);
  assert.equal(Math.round(hectaresToFeddans(1) * 100) / 100, 2.38);
});

test('splits feddans into feddans and kirats', () => {
  assert.deepEqual(feddansToFeddansAndKirats(2.5), { feddans: 2, kirats: 12 });
  assert.deepEqual(feddansToFeddansAndKirats(0), { feddans: 0, kirats: 0 });
});

test('calculates geodesic polygon area in feddans for a ~1 feddan Delta plot', () => {
  // ~65m x 65m square in Kafr El-Sheikh (approx 4225 m2 ≈ 1.0 feddan)
  const dLat = 65 / 111320;
  const dLon = 65 / (111320 * Math.cos((31.11 * Math.PI) / 180));
  const polygon = [
    { lat: 31.11, lon: 30.94 },
    { lat: 31.11 + dLat, lon: 30.94 },
    { lat: 31.11 + dLat, lon: 30.94 + dLon },
    { lat: 31.11, lon: 30.94 + dLon },
  ];
  const area = calculatePolygonAreaFeddans(polygon);
  assert.ok(area > 0.9 && area < 1.15, `Expected ~1 feddan, got ${area}`);
  const centroid = calculatePolygonCentroid(polygon);
  assert.ok(centroid !== null && centroid.lat > 31.11 && centroid.lon > 30.94);
});

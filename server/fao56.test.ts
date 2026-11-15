import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFao56Et0, classifyWaterStress } from './fao56';

test('FAO-56 ET0 produces agronomically realistic daily values for Nile Delta & Upper Egypt', () => {
  const deltaSpring = calculateFao56Et0({
    tMaxC: 27,
    tMinC: 14,
    rhPct: 58,
    wind2mMs: 2.2,
    solarMJm2: 20.5,
    elevationM: 8,
  });
  assert.ok(
    deltaSpring >= 3.5 && deltaSpring <= 6.2,
    `Expected Delta spring ET0 around 4-5.5 mm/day, got ${deltaSpring}`
  );

  const upperSummer = calculateFao56Et0({
    tMaxC: 40,
    tMinC: 24,
    rhPct: 26,
    wind2mMs: 3.1,
    solarMJm2: 26.5,
    elevationM: 85,
  });
  assert.ok(
    upperSummer > deltaSpring && upperSummer <= 11.5,
    `Expected Upper Egypt summer ET0 > Delta spring, got ${upperSummer}`
  );
});

test('water stress classifier separates low, moderate, and high stress', () => {
  assert.equal(classifyWaterStress(54, 0.62, 85), 'low');
  assert.equal(classifyWaterStress(34, 0.45, 115), 'moderate');
  assert.equal(classifyWaterStress(19, 0.22, 165), 'high');
});

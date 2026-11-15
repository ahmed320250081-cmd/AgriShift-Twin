import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAllStrategyPlans, generateRotationPlan } from './rotationEngine';
import type { FarmProfile, NasaTelemetryResponse } from '../types/agrishift';

const mockDrySalineTelemetry: NasaTelemetryResponse = {
  lat: 28.11,
  lon: 30.75,
  fetchedAt: '2026-11-14T10:00:00Z',
  cached: false,
  dataSource: 'demo',
  ndviTrend: 'stable',
  latestNdvi: 0.24,
  ndviSeries: [{ date: '2026-10-01', ndvi: 0.24, quality: 'estimated' }],
  dailyWeather: [],
  monthlyClimatology: [],
  summary: {
    avgEt0MmDay: 6.4,
    seasonalEt0Mm: 192,
    seasonalPrecipMm: 2,
    irrigationNeedMm: 190,
    heatStressDays: 14,
    avgTMaxC: 37,
    avgTMinC: 21,
    avgSoilWetnessPct: 20,
    historicalSoilWetnessPct: null,
    waterStressFlag: 'high',
  },
  sources: [],
};

const mockDeltaTelemetry: NasaTelemetryResponse = {
  lat: 31.11,
  lon: 30.94,
  fetchedAt: '2026-11-14T10:00:00Z',
  cached: false,
  dataSource: 'demo',
  ndviTrend: 'rising',
  latestNdvi: 0.62,
  ndviSeries: [{ date: '2026-10-01', ndvi: 0.62, quality: 'estimated' }],
  dailyWeather: [],
  monthlyClimatology: [],
  summary: {
    avgEt0MmDay: 4.1,
    seasonalEt0Mm: 123,
    seasonalPrecipMm: 25,
    irrigationNeedMm: 103,
    heatStressDays: 1,
    avgTMaxC: 27,
    avgTMinC: 15,
    avgSoilWetnessPct: 52,
    historicalSoilWetnessPct: 52,
    waterStressFlag: 'low',
  },
  sources: [],
};

test('dry saline farm in Minya never gets rice or low-salinity crops', () => {
  const drySalineFarm: FarmProfile = {
    governorateId: 'minya',
    lat: 28.11,
    lon: 30.75,
    areaFeddans: 4,
    polygon: [],
    preferredCrops: ['wheat'],
    undecidedCrop: false,
    lastCrop: null,
    irrigationMethod: 'drip',
    waterSource: 'groundwater',
    soilType: 'sandy',
    salinityLevel: 'saline',
  };

  const plans = generateAllStrategyPlans(drySalineFarm, mockDrySalineTelemetry);
  for (const plan of Object.values(plans)) {
    const crops = plan.seasons.map((s) => s.cropId);
    assert.ok(!crops.includes('rice'), 'Dry saline farm must never include rice');
    assert.ok(!crops.includes('faba_bean'), 'Saline farm must exclude low-salinity faba bean');
    assert.ok(!crops.includes('maize'), 'Saline farm must exclude low-salinity maize');
  }
});

test('soil-health strategy in Delta selects a nitrogen-fixing winter legume (berseem or faba bean)', () => {
  const deltaFarm: FarmProfile = {
    governorateId: 'kafr_el_sheikh',
    lat: 31.11,
    lon: 30.94,
    areaFeddans: 3,
    polygon: [],
    preferredCrops: [],
    undecidedCrop: true,
    lastCrop: 'cotton',
    irrigationMethod: 'flood',
    waterSource: 'canal',
    soilType: 'clay',
    salinityLevel: 'fresh',
  };

  const plan = generateRotationPlan(deltaFarm, mockDeltaTelemetry, 'soil_health');
  const winterCrop = plan.seasons.find((s) => s.season === 'winter')?.cropId;
  assert.ok(
    winterCrop === 'berseem' || winterCrop === 'faba_bean',
    `Expected berseem or faba_bean in Delta soil_health winter, got ${winterCrop}`
  );
});

test('engine is strictly deterministic across repeated invocations', () => {
  const farm: FarmProfile = {
    governorateId: 'sharqia',
    lat: 30.58,
    lon: 31.5,
    areaFeddans: 2.5,
    polygon: [],
    preferredCrops: ['wheat', 'tomato'],
    undecidedCrop: false,
    lastCrop: 'rice',
    irrigationMethod: 'sprinkler',
    waterSource: 'canal',
    soilType: 'loamy',
    salinityLevel: 'fresh',
  };

  const p1 = generateRotationPlan(farm, mockDeltaTelemetry, 'balanced');
  const p2 = generateRotationPlan(farm, mockDeltaTelemetry, 'balanced');
  assert.deepEqual(p1, p2);
});

test('lastCrop=rice prevents continuous rice in the following summer season', () => {
  const farm: FarmProfile = {
    governorateId: 'kafr_el_sheikh',
    lat: 31.11,
    lon: 30.94,
    areaFeddans: 3,
    polygon: [],
    preferredCrops: ['rice'],
    undecidedCrop: false,
    lastCrop: 'rice',
    irrigationMethod: 'flood',
    waterSource: 'canal',
    soilType: 'clay',
    salinityLevel: 'fresh',
  };

  const plan = generateRotationPlan(farm, mockDeltaTelemetry, 'balanced');
  const summerCrop = plan.seasons.find((s) => s.season === 'summer')?.cropId;
  assert.notEqual(summerCrop, 'rice', 'Continuous rice must be rejected when lastCrop is rice');
});

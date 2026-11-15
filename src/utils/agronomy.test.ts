import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSeasonalCsv,
  createInitialPlots,
  estimateFarmBoundaries,
  generateWeatherAlerts,
  predictCropYield,
  simulateAdaptationScenario,
} from './agronomy';
import { WeatherForecast } from '../types/farm';

test('createInitialPlots generates 12 plots centered around 22.5833 N, 28.6667 E', () => {
  const plots = createInitialPlots();
  assert.equal(plots.length, 12);
  const avgLat = plots.reduce((s, p) => s + p.center.lat, 0) / plots.length;
  const avgLng = plots.reduce((s, p) => s + p.center.lng, 0) / plots.length;
  assert.ok(Math.abs(avgLat - 22.5833) < 0.01);
  assert.ok(Math.abs(avgLng - 28.6667) < 0.01);
});

test('estimateFarmBoundaries calculates concession polygon, cultivated ha, and perimeter', () => {
  const plots = createInitialPlots();
  const boundary = estimateFarmBoundaries(plots);
  assert.equal(boundary.concessionPolygon.length, 4);
  assert.ok(boundary.cultivatedAreaHa > 600);
  assert.ok(boundary.totalConcessionAreaHa > boundary.cultivatedAreaHa);
  assert.ok(boundary.perimeterKm > 10);
});

test('predictCropYield penalizes moisture stress and returns 0 for Fallow', () => {
  const plots = createInitialPlots();
  const wheat = plots.find((p) => p.plotCode === 'P-01')!;
  const stressedWheat = { ...wheat, smapRootMoisturePct: 26, ndvi: 0.35 };
  const fallow = plots.find((p) => p.cropType === 'Fallow')!;

  const nominalPred = predictCropYield(wheat);
  const stressedPred = predictCropYield(stressedWheat);
  const fallowPred = predictCropYield(fallow);

  assert.ok(nominalPred.predictedYieldTHa > stressedPred.predictedYieldTHa);
  assert.equal(fallowPred.predictedYieldTHa, 0);
  assert.equal(fallowPred.totalPredictedTons, 0);
});

test('generateWeatherAlerts triggers critical evaporation lockout above threshold', () => {
  const hotForecast: WeatherForecast = {
    latitude: 22.5833,
    longitude: 28.6667,
    source: 'climatology-fallback',
    fetchedAt: '2026-11-14T10:00:00Z',
    currentTempC: 37.5,
    currentWindKmh: 31,
    currentHumidityPct: 14,
    currentSolarWm2: 880,
    dailyMaxTempC: 42.4,
    dailyMinTempC: 21.0,
    hourly: [
      {
        timeIso: '2026-11-14T13:00',
        hourLabel: '13:00',
        tempC: 42.4,
        humidityPct: 12,
        windKmh: 33,
        solarWm2: 920,
        et0MmHr: 0.95,
      },
    ],
  };

  const alerts = generateWeatherAlerts(hotForecast, 39);
  assert.ok(alerts.some((a) => a.id === 'evap-lockout' && a.severity === 'critical'));
  assert.ok(alerts.some((a) => a.id === 'khamasin-wind' && a.severity === 'warning'));
  assert.ok(alerts.some((a) => a.id === 'vapor-pressure'));
});

test('simulateAdaptationScenario calculates meaningful aquifer water savings', () => {
  const plots = createInitialPlots();
  const res = simulateAdaptationScenario(plots, {
    deficitIrrigationPct: 12,
    nocturnalShiftPct: 80,
    convertAlfalfaToSorghum: true,
  });

  assert.ok(res.waterSavedM3 > 0);
  assert.ok(res.waterSavedPct > 15);
  assert.ok(res.aquiferSustainabilityIndex >= 60);
});

test('buildSeasonalCsv outputs metadata, header, and 12 plot rows', () => {
  const plots = createInitialPlots();
  const boundary = estimateFarmBoundaries(plots);
  const csv = buildSeasonalCsv(plots, boundary, {
    aquiferDailyCapM3: 48000,
    evapLockoutTempC: 39,
  });
  const lines = csv.split('\n');
  assert.equal(lines.length, 16); // 3 metadata + 1 header + 12 rows
  assert.ok(lines[3].includes('SMAP Surface (m3/m3)'));
  assert.ok(lines[4].startsWith('P-01,'));
});

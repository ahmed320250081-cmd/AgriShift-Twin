import {
  AdaptationScenarioParams,
  AdaptationScenarioResult,
  AnalysisLayer,
  CropType,
  DailyWaterPoint,
  FarmBoundaryEstimate,
  FarmPlot,
  FarmSettings,
  GeoPoint,
  Language,
  WeatherAlert,
  WeatherForecast,
  YieldPrediction,
} from '../types/farm';

export const OWAINAT_CENTER: GeoPoint = {
  lat: 22.5833,
  lng: 28.6667,
};

export const SCENE_METERS_PER_UNIT = 25;

interface CropAgronomySpec {
  potentialYieldTHa: number;
  optimalRootMoisturePct: number;
  salinityThresholdDsM: number;
  salinitySlope: number;
  baseEtcMm: number;
}

export const CROP_SPECS: Record<CropType, CropAgronomySpec> = {
  Wheat: {
    potentialYieldTHa: 7.4,
    optimalRootMoisturePct: 58,
    salinityThresholdDsM: 6.0,
    salinitySlope: 0.071,
    baseEtcMm: 6.4,
  },
  Alfalfa: {
    potentialYieldTHa: 18.5,
    optimalRootMoisturePct: 68,
    salinityThresholdDsM: 2.0,
    salinitySlope: 0.073,
    baseEtcMm: 9.8,
  },
  Potato: {
    potentialYieldTHa: 38.0,
    optimalRootMoisturePct: 72,
    salinityThresholdDsM: 1.7,
    salinitySlope: 0.12,
    baseEtcMm: 7.9,
  },
  Barley: {
    potentialYieldTHa: 6.2,
    optimalRootMoisturePct: 48,
    salinityThresholdDsM: 8.0,
    salinitySlope: 0.05,
    baseEtcMm: 5.1,
  },
  Sorghum: {
    potentialYieldTHa: 8.1,
    optimalRootMoisturePct: 52,
    salinityThresholdDsM: 6.8,
    salinitySlope: 0.06,
    baseEtcMm: 5.8,
  },
  Fallow: {
    potentialYieldTHa: 0,
    optimalRootMoisturePct: 20,
    salinityThresholdDsM: 10.0,
    salinitySlope: 0,
    baseEtcMm: 1.2,
  },
};

export const INITIAL_FARM_SETTINGS: FarmSettings = {
  aquiferDailyCapM3: 48000,
  evapLockoutTempC: 39,
};

export function createInitialPlots(): FarmPlot[] {
  // 12 center-pivot circles arranged in an authentic 4x3 desert reclamation grid around 22.5833 N, 28.6667 E
  const specs: Array<{
    code: string;
    name: string;
    gridCol: number;
    gridRow: number;
    radiusMeters: number;
    crop: CropType;
    stage: string;
    irrigating: boolean;
    boomDeg: number;
    flow: number;
    cap: number;
    targetPct: number;
    smapSurface: number;
    smapRoot: number;
    ndvi: number;
    lst: number;
    ec: number;
    ph: number;
    oc: number;
    operator: string;
    usedM3: number;
    baseM3: number;
    nozzle: number;
  }> = [
    {
      code: 'P-01',
      name: 'Nubian Pivot 01',
      gridCol: 0,
      gridRow: 0,
      radiusMeters: 440,
      crop: 'Wheat',
      stage: 'Grain Filling',
      irrigating: true,
      boomDeg: 35,
      flow: 235,
      cap: 270,
      targetPct: 60,
      smapSurface: 0.28,
      smapRoot: 61,
      ndvi: 0.74,
      lst: 31.4,
      ec: 2.1,
      ph: 7.7,
      oc: 0.64,
      operator: 'Tariq Hassan',
      usedM3: 184200,
      baseM3: 242000,
      nozzle: 97,
    },
    {
      code: 'P-02',
      name: 'Nubian Pivot 02',
      gridCol: 1,
      gridRow: 0,
      radiusMeters: 450,
      crop: 'Alfalfa',
      stage: '3rd Cut Vegetative',
      irrigating: true,
      boomDeg: 142,
      flow: 268,
      cap: 280,
      targetPct: 68,
      smapSurface: 0.31,
      smapRoot: 65,
      ndvi: 0.81,
      lst: 29.8,
      ec: 1.9,
      ph: 7.6,
      oc: 0.78,
      operator: 'Tariq Hassan',
      usedM3: 248000,
      baseM3: 315000,
      nozzle: 94,
    },
    {
      code: 'P-03',
      name: 'Nubian Pivot 03',
      gridCol: 2,
      gridRow: 0,
      radiusMeters: 420,
      crop: 'Potato',
      stage: 'Tuber Bulking',
      irrigating: false,
      boomDeg: 215,
      flow: 0,
      cap: 255,
      targetPct: 72,
      smapSurface: 0.17,
      smapRoot: 49,
      ndvi: 0.63,
      lst: 35.9,
      ec: 2.6,
      ph: 7.8,
      oc: 0.59,
      operator: 'Nadia Mansour',
      usedM3: 176400,
      baseM3: 229000,
      nozzle: 88,
    },
    {
      code: 'P-04',
      name: 'Nubian Pivot 04',
      gridCol: 3,
      gridRow: 0,
      radiusMeters: 430,
      crop: 'Barley',
      stage: 'Heading',
      irrigating: false,
      boomDeg: 290,
      flow: 0,
      cap: 240,
      targetPct: 48,
      smapSurface: 0.22,
      smapRoot: 53,
      ndvi: 0.67,
      lst: 33.1,
      ec: 2.9,
      ph: 7.9,
      oc: 0.55,
      operator: 'Nadia Mansour',
      usedM3: 141200,
      baseM3: 196000,
      nozzle: 98,
    },
    {
      code: 'P-05',
      name: 'East Concession 05',
      gridCol: 0,
      gridRow: 1,
      radiusMeters: 455,
      crop: 'Potato',
      stage: 'Canopy Closure',
      irrigating: true,
      boomDeg: 88,
      flow: 248,
      cap: 265,
      targetPct: 72,
      smapSurface: 0.34,
      smapRoot: 71,
      ndvi: 0.78,
      lst: 30.2,
      ec: 1.7,
      ph: 7.5,
      oc: 0.71,
      operator: 'Tariq Hassan',
      usedM3: 205500,
      baseM3: 264000,
      nozzle: 96,
    },
    {
      code: 'P-06',
      name: 'East Concession 06',
      gridCol: 1,
      gridRow: 1,
      radiusMeters: 445,
      crop: 'Wheat',
      stage: 'Anthesis',
      irrigating: true,
      boomDeg: 312,
      flow: 220,
      cap: 265,
      targetPct: 58,
      smapSurface: 0.27,
      smapRoot: 59,
      ndvi: 0.76,
      lst: 31.8,
      ec: 2.2,
      ph: 7.7,
      oc: 0.66,
      operator: 'Karim El-Sayed',
      usedM3: 189800,
      baseM3: 248000,
      nozzle: 95,
    },
    {
      code: 'P-07',
      name: 'East Concession 07',
      gridCol: 2,
      gridRow: 1,
      radiusMeters: 435,
      crop: 'Alfalfa',
      stage: 'Mid-Bloom',
      irrigating: false,
      boomDeg: 175,
      flow: 0,
      cap: 275,
      targetPct: 68,
      smapSurface: 0.19,
      smapRoot: 52,
      ndvi: 0.69,
      lst: 35.2,
      ec: 2.4,
      ph: 7.8,
      oc: 0.72,
      operator: 'Karim El-Sayed',
      usedM3: 221000,
      baseM3: 289000,
      nozzle: 91,
    },
    {
      code: 'P-08',
      name: 'East Concession 08',
      gridCol: 3,
      gridRow: 1,
      radiusMeters: 410,
      crop: 'Sorghum',
      stage: 'Booting',
      irrigating: true,
      boomDeg: 62,
      flow: 192,
      cap: 240,
      targetPct: 52,
      smapSurface: 0.24,
      smapRoot: 55,
      ndvi: 0.72,
      lst: 32.5,
      ec: 2.7,
      ph: 7.9,
      oc: 0.58,
      operator: 'Nadia Mansour',
      usedM3: 152400,
      baseM3: 210000,
      nozzle: 99,
    },
    {
      code: 'P-09',
      name: 'South Basin 09',
      gridCol: 0,
      gridRow: 2,
      radiusMeters: 430,
      crop: 'Barley',
      stage: 'Maturation',
      irrigating: false,
      boomDeg: 18,
      flow: 0,
      cap: 235,
      targetPct: 45,
      smapSurface: 0.20,
      smapRoot: 49,
      ndvi: 0.61,
      lst: 34.0,
      ec: 3.1,
      ph: 8.0,
      oc: 0.52,
      operator: 'Karim El-Sayed',
      usedM3: 136800,
      baseM3: 188000,
      nozzle: 93,
    },
    {
      code: 'P-10',
      name: 'South Basin 10',
      gridCol: 1,
      gridRow: 2,
      radiusMeters: 450,
      crop: 'Wheat',
      stage: 'Milk Stage',
      irrigating: true,
      boomDeg: 254,
      flow: 228,
      cap: 270,
      targetPct: 58,
      smapSurface: 0.29,
      smapRoot: 60,
      ndvi: 0.75,
      lst: 31.1,
      ec: 2.0,
      ph: 7.6,
      oc: 0.65,
      operator: 'Tariq Hassan',
      usedM3: 186100,
      baseM3: 244000,
      nozzle: 96,
    },
    {
      code: 'P-11',
      name: 'South Basin 11',
      gridCol: 2,
      gridRow: 2,
      radiusMeters: 440,
      crop: 'Sorghum',
      stage: 'Panicle Emergence',
      irrigating: false,
      boomDeg: 120,
      flow: 0,
      cap: 245,
      targetPct: 52,
      smapSurface: 0.23,
      smapRoot: 54,
      ndvi: 0.70,
      lst: 32.8,
      ec: 2.5,
      ph: 7.8,
      oc: 0.61,
      operator: 'Nadia Mansour',
      usedM3: 158200,
      baseM3: 214000,
      nozzle: 95,
    },
    {
      code: 'P-12',
      name: 'South Basin 12',
      gridCol: 3,
      gridRow: 2,
      radiusMeters: 415,
      crop: 'Fallow',
      stage: 'Soil Recovery & Mulch',
      irrigating: false,
      boomDeg: 0,
      flow: 0,
      cap: 220,
      targetPct: 20,
      smapSurface: 0.07,
      smapRoot: 18,
      ndvi: 0.11,
      lst: 42.6,
      ec: 3.4,
      ph: 8.1,
      oc: 0.44,
      operator: 'Karim El-Sayed',
      usedM3: 24000,
      baseM3: 175000,
      nozzle: 92,
    },
  ];

  // Grid spacing ~1020m (~40.8 scene units)
  const spacingMeters = 1020;
  const metersPerDegLat = 110740;
  const metersPerDegLng = 111320 * Math.cos((OWAINAT_CENTER.lat * Math.PI) / 180);

  return specs.map((s) => {
    const offsetEastM = (s.gridCol - 1.5) * spacingMeters;
    const offsetNorthM = (1 - s.gridRow) * spacingMeters;

    const lat = Number((OWAINAT_CENTER.lat + offsetNorthM / metersPerDegLat).toFixed(5));
    const lng = Number((OWAINAT_CENTER.lng + offsetEastM / metersPerDegLng).toFixed(5));
    const areaHectares = Number(((Math.PI * s.radiusMeters * s.radiusMeters) / 10000).toFixed(1));

    return {
      id: s.code,
      plotCode: s.code,
      name: s.name,
      center: { lat, lng },
      sceneX: offsetEastM / SCENE_METERS_PER_UNIT,
      sceneZ: -offsetNorthM / SCENE_METERS_PER_UNIT,
      radiusMeters: s.radiusMeters,
      areaHectares,
      cropType: s.crop,
      growthStage: s.stage,
      irrigating: s.irrigating,
      boomAngleDeg: s.boomDeg,
      flowRateM3Hr: s.flow,
      sustainabilityCapM3Hr: s.cap,
      targetMoisturePct: s.targetPct,
      smapSurfaceMoisture: s.smapSurface,
      smapRootMoisturePct: s.smapRoot,
      ndvi: s.ndvi,
      landSurfaceTempC: s.lst,
      dailyEtcMm: CROP_SPECS[s.crop].baseEtcMm,
      soilSalinityDsM: s.ec,
      soilPh: s.ph,
      organicCarbonPct: s.oc,
      assignedOperator: s.operator,
      seasonalWaterUsedM3: s.usedM3,
      baselineWaterM3: s.baseM3,
      nozzleHealthPct: s.nozzle,
    };
  });
}

export function estimateFarmBoundaries(plots: FarmPlot[]): FarmBoundaryEstimate {
  if (plots.length === 0) {
    return {
      concessionPolygon: [],
      boundingBox: {
        minLat: OWAINAT_CENTER.lat,
        maxLat: OWAINAT_CENTER.lat,
        minLng: OWAINAT_CENTER.lng,
        maxLng: OWAINAT_CENTER.lng,
      },
      totalConcessionAreaHa: 0,
      cultivatedAreaHa: 0,
      perimeterKm: 0,
      aquiferZone: 'Nubian Sandstone Aquifer (NSAS) — Sector East Oweinat',
    };
  }

  const metersPerDegLat = 110740;
  const metersPerDegLng = 111320 * Math.cos((OWAINAT_CENTER.lat * Math.PI) / 180);
  const bufferMeters = 240;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let cultivatedAreaHa = 0;

  for (const plot of plots) {
    const dLat = (plot.radiusMeters + bufferMeters) / metersPerDegLat;
    const dLng = (plot.radiusMeters + bufferMeters) / metersPerDegLng;
    minLat = Math.min(minLat, plot.center.lat - dLat);
    maxLat = Math.max(maxLat, plot.center.lat + dLat);
    minLng = Math.min(minLng, plot.center.lng - dLng);
    maxLng = Math.max(maxLng, plot.center.lng + dLng);
    if (plot.cropType !== 'Fallow') {
      cultivatedAreaHa += plot.areaHectares;
    }
  }

  const widthMeters = (maxLng - minLng) * metersPerDegLng;
  const heightMeters = (maxLat - minLat) * metersPerDegLat;
  const totalConcessionAreaHa = Number(((widthMeters * heightMeters) / 10000).toFixed(1));
  const perimeterKm = Number(((2 * (widthMeters + heightMeters)) / 1000).toFixed(2));

  const concessionPolygon: GeoPoint[] = [
    { lat: Number(maxLat.toFixed(5)), lng: Number(minLng.toFixed(5)) },
    { lat: Number(maxLat.toFixed(5)), lng: Number(maxLng.toFixed(5)) },
    { lat: Number(minLat.toFixed(5)), lng: Number(maxLng.toFixed(5)) },
    { lat: Number(minLat.toFixed(5)), lng: Number(minLng.toFixed(5)) },
  ];

  return {
    concessionPolygon,
    boundingBox: {
      minLat: Number(minLat.toFixed(5)),
      maxLat: Number(maxLat.toFixed(5)),
      minLng: Number(minLng.toFixed(5)),
      maxLng: Number(maxLng.toFixed(5)),
    },
    totalConcessionAreaHa,
    cultivatedAreaHa: Number(cultivatedAreaHa.toFixed(1)),
    perimeterKm,
    aquiferZone: 'Nubian Sandstone Aquifer (NSAS) — Sector East Oweinat',
  };
}

export function predictCropYield(
  plot: FarmPlot,
  climateStressFactor = 1.0,
  deficitPct = 0,
  lang: Language = 'en',
): YieldPrediction {
  const spec = CROP_SPECS[plot.cropType];

  if (plot.cropType === 'Fallow' || spec.potentialYieldTHa === 0) {
    return {
      plotCode: plot.plotCode,
      cropType: plot.cropType,
      predictedYieldTHa: 0,
      totalPredictedTons: 0,
      waterProductivityKgM3: 0,
      moistureStressFactor: 1,
      salinityFactor: 1,
      sustainabilityScore: 95,
      recommendation:
        lang === 'ar'
          ? 'إراحة القطعة يحافظ على احتياطيات الخزان الجوفي النوبي ويجدد بنية التربة.'
          : 'Resting plot preserves Nubian Aquifer reserves and restores soil structure.',
    };
  }

  // Moisture stress factor derived from NASA SMAP root-zone moisture vs optimal crop threshold
  const effectiveRootMoisture = Math.max(
    10,
    plot.smapRootMoisturePct * (1 - deficitPct * 0.0045),
  );
  const moistureRatio = effectiveRootMoisture / spec.optimalRootMoisturePct;
  const moistureStressFactor =
    moistureRatio >= 1
      ? Math.max(0.88, 1 - (moistureRatio - 1) * 0.25) // minor waterlogging penalty
      : Math.max(0.35, Math.pow(moistureRatio, 1.15));

  // Maas-Hoffman salinity yield response
  const excessEc = Math.max(0, plot.soilSalinityDsM - spec.salinityThresholdDsM);
  const salinityFactor = Math.max(0.45, 1 - excessEc * spec.salinitySlope);

  // NDVI canopy vigor adjustment
  const ndviFactor = Math.min(1.06, Math.max(0.65, 0.52 + plot.ndvi * 0.68));

  const predictedYieldTHa = Number(
    (
      spec.potentialYieldTHa *
      moistureStressFactor *
      salinityFactor *
      ndviFactor *
      climateStressFactor
    ).toFixed(2),
  );

  const totalPredictedTons = Number((predictedYieldTHa * plot.areaHectares).toFixed(1));

  const adjustedWaterUsed = Math.max(1, plot.seasonalWaterUsedM3 * (1 - deficitPct / 100));
  const waterProductivityKgM3 = Number(
    ((totalPredictedTons * 1000) / adjustedWaterUsed).toFixed(2),
  );

  // Sustainability score blends water savings vs flood baseline, nozzle health, and moisture precision
  const waterSavingsRatio = Math.max(
    0,
    Math.min(0.45, (plot.baselineWaterM3 - adjustedWaterUsed) / Math.max(1, plot.baselineWaterM3)),
  );
  const moisturePrecision = Math.max(
    0,
    1 - Math.abs(plot.smapRootMoisturePct - plot.targetMoisturePct) / 40,
  );
  const sustainabilityScore = Math.round(
    Math.min(
      100,
      Math.max(
        25,
        35 + waterSavingsRatio * 85 + moisturePrecision * 25 + (plot.nozzleHealthPct / 100) * 15,
      ),
    ),
  );

  let recommendation =
    lang === 'ar'
      ? 'توازن مثالي لرطوبة منطقة الجذور (SMAP)؛ استمر على جدول الري الليلي المحوري.'
      : 'Optimal SMAP root-zone balance; maintain nocturnal pivot schedule.';
  if (moistureStressFactor < 0.82) {
    recommendation =
      lang === 'ar'
        ? `عجز في منطقة الجذور (${plot.smapRootMoisturePct.toFixed(0)}% مقابل المستهدف ${spec.optimalRootMoisturePct}%). جدول دورة ري محوري ليلي لمدة 6 ساعات.`
        : `Root-zone deficit (${plot.smapRootMoisturePct.toFixed(0)}% vs ${spec.optimalRootMoisturePct}% target). Schedule 6h overnight pivot cycle.`;
  } else if (plot.nozzleHealthPct < 92) {
    recommendation =
      lang === 'ar'
        ? `افحص فوهات الرش المتدلية على الطرف الخارجي للذراع (كفاءة ${plot.nozzleHealthPct}%) لتلافي القوس الجاف.`
        : `Inspect outer boom drop nozzles (${plot.nozzleHealthPct}% efficiency) to eliminate dry arc.`;
  } else if (plot.cropType === 'Alfalfa' && plot.dailyEtcMm > 9) {
    recommendation =
      lang === 'ar'
        ? 'محصول عالي السحب من الخزان الجوفي؛ يُنصح بتدوير جزئي إلى الذرة الرفيعة أو الشعير في الدورة القادمة.'
        : 'High aquifer draw crop; consider partial rotation to Sorghum or Barley next cycle.';
  }

  return {
    plotCode: plot.plotCode,
    cropType: plot.cropType,
    predictedYieldTHa,
    totalPredictedTons,
    waterProductivityKgM3,
    moistureStressFactor: Number(moistureStressFactor.toFixed(2)),
    salinityFactor: Number(salinityFactor.toFixed(2)),
    sustainabilityScore,
    recommendation,
  };
}

export function buildDailyWaterTrends(
  plots: FarmPlot[],
  lang: Language = 'en',
): DailyWaterPoint[] {
  const activeDailyExtraction = plots.reduce(
    (sum, p) => sum + (p.irrigating ? p.flowRateM3Hr * 14 : p.dailyEtcMm * p.areaHectares * 3.8),
    0,
  );
  const totalCropDemand = plots.reduce(
    (sum, p) => sum + p.dailyEtcMm * p.areaHectares * 10,
    0,
  );
  const avgSmap =
    plots.reduce((sum, p) => sum + p.smapSurfaceMoisture, 0) / Math.max(1, plots.length);

  const days =
    lang === 'ar'
      ? ['ي-13', 'ي-11', 'ي-9', 'ي-7', 'ي-5', 'ي-3', 'ي-1', 'اليوم']
      : ['D-13', 'D-11', 'D-9', 'D-7', 'D-5', 'D-3', 'D-1', 'Today'];
  const wave = [0.94, 0.98, 1.03, 0.91, 0.89, 0.96, 1.01, 1.0];

  return days.map((dayLabel, idx) => {
    const factor = wave[idx];
    const extractionM3 = Math.round(activeDailyExtraction * factor);
    const cropDemandM3 = Math.round(totalCropDemand * (0.93 + (idx % 3) * 0.04));
    const baselineFloodM3 = Math.round(cropDemandM3 * 1.38);
    const smapAvgSurface = Number((avgSmap * (0.94 + (idx % 4) * 0.03)).toFixed(3));
    return {
      dayLabel,
      extractionM3,
      cropDemandM3,
      baselineFloodM3,
      smapAvgSurface,
    };
  });
}

export function generateWeatherAlerts(
  forecast: WeatherForecast,
  evapLockoutTempC: number,
  lang: Language = 'en',
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const isAr = lang === 'ar';

  if (forecast.dailyMaxTempC >= evapLockoutTempC) {
    alerts.push({
      id: 'evap-lockout',
      severity: 'critical',
      title: isAr ? 'تحذير حظر الري النهاري بسبب التبخر' : 'Midday Evaporation Lockout Advisory',
      description: isAr
        ? `ذروة حرارة الهواء الصحراوي (${forecast.dailyMaxTempC.toFixed(1)}°م) تتجاوز حد ${evapLockoutTempC}°م. أوقف الرش المحوري النهاري بين 11:00 و 16:30 لمنع فقدان 28% بالانجراف والتبخر.`
        : `Peak desert air temperature (${forecast.dailyMaxTempC.toFixed(1)}°C) exceeds ${evapLockoutTempC}°C threshold. Suspend daytime center-pivot spraying between 11:00 and 16:30 to prevent 28% wind-drift and evaporation loss.`,
      actionWindow: isAr ? '11:00 – 16:30 بتوقيت مصر' : '11:00 – 16:30 EET',
      metricValue: `${forecast.dailyMaxTempC.toFixed(1)} °C`,
    });
  } else {
    alerts.push({
      id: 'thermal-window',
      severity: 'advisory',
      title: isAr ? 'نافذة حمل حراري معتدل' : 'Moderate Thermal Load Window',
      description: isAr
        ? `درجة الحرارة القصوى (${forecast.dailyMaxTempC.toFixed(1)}°م) دون سقف الحظر (${evapLockoutTempC}°م). تبقى جداول الري الصباحية والمسائية عالية الكفاءة.`
        : `Peak temperature (${forecast.dailyMaxTempC.toFixed(1)}°C) remains below lockout ceiling (${evapLockoutTempC}°C). Standard morning & evening irrigation schedules remain efficient.`,
      actionWindow: isAr ? 'خلال الـ 24 ساعة القادمة' : 'Next 24 Hours',
      metricValue: `${forecast.dailyMaxTempC.toFixed(1)} °C`,
    });
  }

  const maxWind = Math.max(
    forecast.currentWindKmh,
    ...forecast.hourly.map((h) => h.windKmh),
  );
  if (maxWind >= 28) {
    alerts.push({
      id: 'khamasin-wind',
      severity: 'warning',
      title: isAr ? 'تحذير رياح صحراوية شديدة وانجراف الرش' : 'High Desert Wind & Drift Warning',
      description: isAr
        ? `هبات رياح تصل إلى ${maxWind.toFixed(0)} كم/س عبر السهل النوبي تزيد انجراف الرذاذ وتآكل الرمال على الامتدادات الخارجية. اخفض ضغط الفوهات وافحص مصدات الرياح الغربية.`
        : `Gusts up to ${maxWind.toFixed(0)} km/h across the Nubian plain increase spray drift and sand abrasion on outer pivot spans. Lower drop-nozzle pressure and inspect western windbreak shelterbelts.`,
      actionWindow: isAr ? '13:00 – 19:00 بتوقيت مصر' : '13:00 – 19:00 EET',
      metricValue: `${maxWind.toFixed(0)} km/h`,
    });
  } else {
    alerts.push({
      id: 'wind-nominal',
      severity: 'advisory',
      title: isAr ? 'نافذة ري ليلي منخفضة الانجراف' : 'Low-Drift Nocturnal Pivot Window',
      description: isAr
        ? `سرعة الرياح الليلية (${forecast.currentWindKmh.toFixed(0)} كم/س) واعتدال الرطوبة توفران تجانساً مثالياً لدورات الري المحوري.`
        : `Overnight wind speed (${forecast.currentWindKmh.toFixed(0)} km/h) and cooler humidity create optimal uniformity for center-pivot passes.`,
      actionWindow: isAr ? '20:00 – 05:30 بتوقيت مصر' : '20:00 – 05:30 EET',
      metricValue: `${forecast.currentWindKmh.toFixed(0)} km/h`,
    });
  }

  if (forecast.currentHumidityPct < 22) {
    alerts.push({
      id: 'vapor-pressure',
      severity: 'warning',
      title: isAr ? 'عجز ضغط بخار شديد (VPD)' : 'Extreme Vapor Pressure Deficit (VPD)',
      description: isAr
        ? `انخفاض الرطوبة النسبية إلى ${forecast.currentHumidityPct.toFixed(0)}% يسرّع معدل النتح. تحقق من رطوبة منطقة الجذور في NASA SMAP لقطاعات البرسيم الحجازي والبطاطس.`
        : `Relative humidity at ${forecast.currentHumidityPct.toFixed(0)}% accelerates crop transpiration demand. Cross-check NASA SMAP root-zone moisture on high-ET Alfalfa and Potato plots.`,
      actionWindow: isAr ? 'مستمر' : 'Continuous',
      metricValue: `${forecast.currentHumidityPct.toFixed(0)}% RH`,
    });
  }

  return alerts;
}

export function simulateAdaptationScenario(
  plots: FarmPlot[],
  params: AdaptationScenarioParams,
): AdaptationScenarioResult {
  let baselineWaterM3 = 0;
  let projectedWaterM3 = 0;
  let baselineTotalYieldTons = 0;
  let projectedTotalYieldTons = 0;

  for (const plot of plots) {
    const basePred = predictCropYield(plot, 1.0, 0);
    baselineWaterM3 += plot.seasonalWaterUsedM3;
    baselineTotalYieldTons += basePred.totalPredictedTons;

    const effectiveCrop: CropType =
      params.convertAlfalfaToSorghum && plot.cropType === 'Alfalfa'
        ? 'Sorghum'
        : plot.cropType;

    // Nocturnal shift reduces evaporative loss by up to 14%
    const nocturnalEfficiencyGain = (params.nocturnalShiftPct / 100) * 0.14;
    const cropWaterFactor =
      effectiveCrop === 'Sorghum' && plot.cropType === 'Alfalfa' ? 0.58 : 1.0;

    const plotWater =
      plot.seasonalWaterUsedM3 *
      cropWaterFactor *
      (1 - params.deficitIrrigationPct / 100) *
      (1 - nocturnalEfficiencyGain);

    projectedWaterM3 += plotWater;

    const adaptedPlot: FarmPlot = {
      ...plot,
      cropType: effectiveCrop,
      smapRootMoisturePct:
        effectiveCrop === 'Sorghum' && plot.cropType === 'Alfalfa'
          ? Math.max(plot.smapRootMoisturePct, 54)
          : plot.smapRootMoisturePct,
    };

    // Nocturnal irrigation improves effective moisture retention slightly
    const climateBonus = 1 + (params.nocturnalShiftPct / 100) * 0.03;
    const adaptedPred = predictCropYield(adaptedPlot, climateBonus, params.deficitIrrigationPct);
    projectedTotalYieldTons += adaptedPred.totalPredictedTons;
  }

  const waterSavedM3 = Math.round(baselineWaterM3 - projectedWaterM3);
  const waterSavedPct =
    baselineWaterM3 > 0 ? Number(((waterSavedM3 / baselineWaterM3) * 100).toFixed(1)) : 0;
  const yieldDeltaPct =
    baselineTotalYieldTons > 0
      ? Number(
          (((projectedTotalYieldTons - baselineTotalYieldTons) / baselineTotalYieldTons) * 100).toFixed(
            1,
          ),
        )
      : 0;

  const aquiferSustainabilityIndex = Math.round(
    Math.min(100, Math.max(30, 58 + waterSavedPct * 1.4 + Math.max(-10, yieldDeltaPct) * 0.4)),
  );

  return {
    baselineWaterM3: Math.round(baselineWaterM3),
    projectedWaterM3: Math.round(projectedWaterM3),
    waterSavedM3,
    waterSavedPct,
    projectedTotalYieldTons: Number(projectedTotalYieldTons.toFixed(1)),
    baselineTotalYieldTons: Number(baselineTotalYieldTons.toFixed(1)),
    yieldDeltaPct,
    aquiferSustainabilityIndex,
  };
}

export function getLayerLegend(
  layer: AnalysisLayer,
  lang: Language = 'en',
): {
  title: string;
  unit: string;
  minLabel: string;
  midLabel: string;
  maxLabel: string;
  gradientCss: string;
  source: string;
} {
  const isAr = lang === 'ar';
  switch (layer) {
    case 'smap_surface':
      return {
        title: isAr ? 'رطوبة السطح NASA SMAP (0–5 سم)' : 'NASA SMAP Surface Moisture (0–5 cm)',
        unit: 'm³/m³',
        minLabel: isAr ? '0.04 رمل جاف' : '0.04 Dry Sand',
        midLabel: isAr ? '0.20 طمي رطب' : '0.20 Moist Loam',
        maxLabel: isAr ? '0.38 مشبع' : '0.38 Saturated',
        gradientCss: 'linear-gradient(90deg, #b45309 0%, #eab308 35%, #22c55e 68%, #0284c7 100%)',
        source: isAr
          ? 'NASA SMAP L3 SPL3SMP_E · دقة محسّنة 1 كم'
          : 'NASA SMAP L3 SPL3SMP_E · 1 km Downscaled',
      };
    case 'smap_root':
      return {
        title: isAr ? 'رطوبة منطقة الجذور NASA-USDA SMAP' : 'NASA-USDA Enhanced SMAP Root-Zone',
        unit: isAr ? '% قطاع التربة' : '% Profile',
        minLabel: isAr ? '15% إجهاد' : '15% Stress',
        midLabel: isAr ? '55% مثالي' : '55% Optimal',
        maxLabel: isAr ? '85% ممتلئ' : '85% Full',
        gradientCss: 'linear-gradient(90deg, #dc2626 0%, #f59e0b 38%, #10b981 72%, #06b6d4 100%)',
        source: isAr
          ? 'رطوبة التربة العالمية المحسّنة NASA-USDA SMAP'
          : 'NASA-USDA Enhanced SMAP Global Soil Moisture',
      };
    case 'ndvi':
      return {
        title: isAr ? 'مؤشر الغطاء النباتي MODIS / Sentinel-2 NDVI' : 'MODIS / Sentinel-2 NDVI Vegetation Health',
        unit: isAr ? 'مؤشر' : 'Index',
        minLabel: isAr ? '0.05 أرض جرداء' : '0.05 Bare',
        midLabel: isAr ? '0.45 نمو مبكر' : '0.45 Emerging',
        maxLabel: isAr ? '0.85 غطاء كثيف' : '0.85 Dense Canopy',
        gradientCss: 'linear-gradient(90deg, #92400e 0%, #ca8a04 35%, #65a30d 68%, #15803d 100%)',
        source: 'Sentinel-2 L2A + MODIS MOD13Q1',
      };
    case 'thermal_et':
      return {
        title: isAr ? 'حرارة السطح والإجهاد الحراري ECOSTRESS' : 'ECOSTRESS Land Surface Temp & ET Stress',
        unit: '°C',
        minLabel: isAr ? '26 °C بارد' : '26 °C Cool',
        midLabel: isAr ? '35 °C معتدل' : '35 °C Moderate',
        maxLabel: isAr ? '45 °C إجهاد حراري' : '45 °C Heat Stress',
        gradientCss: 'linear-gradient(90deg, #0ea5e9 0%, #22c55e 35%, #f59e0b 70%, #ef4444 100%)',
        source: isAr ? 'NASA ECOSTRESS / Landsat-9 الحراري' : 'NASA ECOSTRESS / Landsat-9 Thermal',
      };
    case 'satellite':
    default:
      return {
        title: isAr ? 'صورة فضائية بالألوان الحقيقية وخريطة المحاصيل' : 'True-Color Orbital Satellite & Crop Map',
        unit: 'RGB',
        minLabel: isAr ? 'بور / صحراء' : 'Fallow / Reg',
        midLabel: isAr ? 'قمح / شعير' : 'Wheat / Barley',
        maxLabel: isAr ? 'برسيم / بطاطس' : 'Alfalfa / Potato',
        gradientCss: 'linear-gradient(90deg, #c2a070 0%, #a3b86c 40%, #2e7d32 75%, #14532d 100%)',
        source: isAr
          ? 'Sentinel-2 / Landsat-9 ألوان طبيعية (22.5833°N, 28.6667°E)'
          : 'Sentinel-2 / Landsat-9 Natural Color (22.5833°N, 28.6667°E)',
      };
  }
}

function escapeCsvCell(value: string | number | boolean): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildSeasonalCsv(
  plots: FarmPlot[],
  boundary: FarmBoundaryEstimate,
  settings: FarmSettings,
): string {
  const headers = [
    'Plot Code',
    'Plot Name',
    'Latitude',
    'Longitude',
    'Area (ha)',
    'Crop Type',
    'Growth Stage',
    'Irrigating',
    'Flow Rate (m3/hr)',
    'SMAP Surface (m3/m3)',
    'SMAP Root-Zone (%)',
    'NDVI',
    'Surface Temp (C)',
    'Soil Salinity EC (dS/m)',
    'Soil pH',
    'Organic Carbon (%)',
    'Seasonal Water Used (m3)',
    'Predicted Yield (t/ha)',
    'Predicted Total (tons)',
    'Water Productivity (kg/m3)',
    'Sustainability Score',
    'Assigned Operator',
  ];

  const rows = plots.map((plot) => {
    const pred = predictCropYield(plot);
    return [
      plot.plotCode,
      plot.name,
      plot.center.lat,
      plot.center.lng,
      plot.areaHectares,
      plot.cropType,
      plot.growthStage,
      plot.irrigating ? 'Active' : 'Idle',
      plot.flowRateM3Hr,
      plot.smapSurfaceMoisture,
      plot.smapRootMoisturePct,
      plot.ndvi,
      plot.landSurfaceTempC,
      plot.soilSalinityDsM,
      plot.soilPh,
      plot.organicCarbonPct,
      plot.seasonalWaterUsedM3,
      pred.predictedYieldTHa,
      pred.totalPredictedTons,
      pred.waterProductivityKgM3,
      pred.sustainabilityScore,
      plot.assignedOperator,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  const metaLine = [
    `# Sharq El Owainat Seasonal Productivity Report`,
    `# Coordinates: ${OWAINAT_CENTER.lat} N, ${OWAINAT_CENTER.lng} E`,
    `# Cultivated Area: ${boundary.cultivatedAreaHa} ha | Total Concession: ${boundary.totalConcessionAreaHa} ha | Aquifer Daily Cap: ${settings.aquiferDailyCapM3} m3`,
  ];

  return [...metaLine, headers.map(escapeCsvCell).join(','), ...rows].join('\n');
}

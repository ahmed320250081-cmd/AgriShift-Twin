import type {
  DailyWeatherPoint,
  MonthlyClimatologyPoint,
  NasaTelemetryResponse,
  NdviPoint,
  SourceHealthInfo,
} from '../src/types/agrishift';
import { findNearestGovernorate } from '../src/data/egyptGovernorates';
import { calculateFao56Et0, classifyWaterStress } from './fao56';

interface CacheEntry {
  expiresAt: number;
  data: NasaTelemetryResponse;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const REQUEST_TIMEOUT_MS = 5500;
const telemetryCache = new Map<string, CacheEntry>();

function formatDateYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDatePower(date: Date): string {
  return formatDateYmd(date).replace(/-/g, '');
}

async function fetchJsonWithTimeout<T>(url: string, retries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

interface PowerApiResponse {
  properties?: {
    parameter?: {
      T2M_MAX?: Record<string, number>;
      T2M_MIN?: Record<string, number>;
      PRECTOTCORR?: Record<string, number>;
      ALLSKY_SFC_SW_DWN?: Record<string, number>;
      WS2M?: Record<string, number>;
      RH2M?: Record<string, number>;
      GWETTOP?: Record<string, number>;
    };
  };
}

interface ModisSubsetResponse {
  subset?: Array<{
    calendar_date?: string;
    data?: number[];
  }>;
}

interface CmrSearchResponse {
  feed?: {
    entry?: Array<{ id?: string }>;
  };
}

interface PowerClimatologyResponse {
  properties?: {
    parameter?: {
      T2M_MAX?: Record<string, number>;
      PRECTOTCORR?: Record<string, number>;
    };
  };
}

const MONTH_KEYS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

function buildDemoClimatology(lat: number, lon: number): MonthlyClimatologyPoint[] {
  const gov = findNearestGovernorate(lat, lon);
  const offset = gov.region === 'valley' && lat < 28.5 ? 4.5 : gov.region === 'oasis' ? 3.5 : 0;
  const temps = [19.5, 21, 24.5, 29, 33, 35.5, 36, 35.8, 33.5, 30, 25.5, 21];
  const rains = [18, 12, 8, 2, 0.5, 0, 0, 0, 0.2, 4, 10, 16];
  return temps.map((t, i) => ({
    month: i + 1,
    tMaxC: Number((t + offset).toFixed(1)),
    precipMm: gov.region === 'delta' ? rains[i] : Number((rains[i] * 0.2).toFixed(1)),
  }));
}

function computeNdviTrend(series: NdviPoint[]): 'rising' | 'stable' | 'falling' {
  if (series.length < 3) return 'stable';
  const half = Math.floor(series.length / 2);
  const firstAvg =
    series.slice(0, half).reduce((sum, p) => sum + p.ndvi, 0) / Math.max(1, half);
  const secondAvg =
    series.slice(half).reduce((sum, p) => sum + p.ndvi, 0) /
    Math.max(1, series.length - half);
  const delta = secondAvg - firstAvg;
  if (delta > 0.04) return 'rising';
  if (delta < -0.04) return 'falling';
  return 'stable';
}

function buildDeterministicDemoSeries(
  lat: number,
  lon: number,
  elevationM: number
): { dailyWeather: DailyWeatherPoint[]; ndviSeries: NdviPoint[] } {
  const gov = findNearestGovernorate(lat, lon);
  const isUpper = gov.region === 'valley' && lat < 28.5;
  const isOasis = gov.region === 'oasis';

  const baseTmax = isUpper ? 34.5 : isOasis ? 33.0 : 28.5;
  const baseTmin = isUpper ? 18.5 : isOasis ? 17.0 : 16.0;
  const baseSoilWet = isOasis ? 24 : isUpper ? 36 : 49;
  const baseNdvi = isOasis ? 0.29 : isUpper ? 0.48 : 0.61;

  const today = new Date();
  const dailyWeather: DailyWeatherPoint[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const wave = Math.sin(i * 0.45) * 1.8;
    const tMaxC = Number((baseTmax + wave).toFixed(1));
    const tMinC = Number((baseTmin + wave * 0.6).toFixed(1));
    const precipMm = !isUpper && !isOasis && i % 11 === 0 ? 2.4 : 0;
    const solarMJm2 = isUpper ? 23.2 : 19.6;
    const wind2mMs = 2.4;
    const rhPct = isOasis ? 34 : isUpper ? 40 : 58;
    const soilWetnessPct = Number(
      Math.max(12, Math.min(82, baseSoilWet + Math.cos(i * 0.3) * 4)).toFixed(1)
    );
    const et0Mm = calculateFao56Et0({
      tMaxC,
      tMinC,
      rhPct,
      wind2mMs,
      solarMJm2,
      elevationM,
    });

    dailyWeather.push({
      date: formatDateYmd(d),
      tMaxC,
      tMinC,
      precipMm,
      solarMJm2,
      wind2mMs,
      rhPct,
      soilWetnessPct,
      et0Mm,
    });
  }

  const ndviSeries: NdviPoint[] = [];
  for (let w = 7; w >= 0; w--) {
    const d = new Date(today.getTime() - w * 16 * 86400000);
    const ndvi = Number(
      Math.max(0.12, Math.min(0.85, baseNdvi + (7 - w) * 0.012)).toFixed(3)
    );
    ndviSeries.push({
      date: formatDateYmd(d),
      ndvi,
      quality: 'estimated',
    });
  }

  return { dailyWeather, ndviSeries };
}

/**
 * Fetches NASA Earth observations in parallel with TTL caching, timeouts, and honest per-source status.
 */
export async function getNasaTelemetry(
  lat: number,
  lon: number,
  elevationM?: number,
  forceRefresh = false
): Promise<NasaTelemetryResponse> {
  const roundedLat = Number(lat.toFixed(2));
  const roundedLon = Number(lon.toFixed(2));
  const gov = findNearestGovernorate(roundedLat, roundedLon);
  const siteElev = elevationM ?? gov.elevationM;
  const cacheKey = `${roundedLat}:${roundedLon}`;

  const existing = telemetryCache.get(cacheKey);
  if (!forceRefresh && existing && existing.expiresAt > Date.now()) {
    return { ...existing.data, cached: true };
  }

  const endDate = new Date(Date.now() - 4 * 86400000); // POWER latency ~3-4 days
  const startDate = new Date(endDate.getTime() - 29 * 86400000);
  const startPower = formatDatePower(startDate);
  const endPower = formatDatePower(endDate);
  const dateRangeLabel = `${formatDateYmd(startDate)} → ${formatDateYmd(endDate)}`;

  const powerUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS2M,RH2M,GWETTOP&community=AG&longitude=${roundedLon}&latitude=${roundedLat}&start=${startPower}&end=${endPower}&format=JSON`;
  const powerClimUrl = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M_MAX,PRECTOTCORR&community=AG&longitude=${roundedLon}&latitude=${roundedLat}&format=JSON`;
  const modisUrl = `https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?latitude=${roundedLat}&longitude=${roundedLon}&band=250m_16_days_NDVI&startDate=A2025001&endDate=A2026365&kmAboveBelow=0&kmLeftRight=0`;
  const smapCmrUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?short_name=SPL3SMP_E&bounding_box=${roundedLon - 0.3},${roundedLat - 0.3},${roundedLon + 0.3},${roundedLat + 0.3}&page_size=10`;
  const ecostressCmrUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?short_name=ECO_L2_LSTE&bounding_box=${roundedLon - 0.3},${roundedLat - 0.3},${roundedLon + 0.3},${roundedLat + 0.3}&page_size=10`;

  const [powerRes, modisRes, smapRes, ecoRes, climRes] = await Promise.allSettled([
    fetchJsonWithTimeout<PowerApiResponse>(powerUrl),
    fetchJsonWithTimeout<ModisSubsetResponse>(modisUrl),
    fetchJsonWithTimeout<CmrSearchResponse>(smapCmrUrl),
    fetchJsonWithTimeout<CmrSearchResponse>(ecostressCmrUrl),
    fetchJsonWithTimeout<PowerClimatologyResponse>(powerClimUrl),
  ]);

  const demoBaseline = buildDeterministicDemoSeries(roundedLat, roundedLon, siteElev);
  const sources: SourceHealthInfo[] = [];

  // 1. Parse NASA POWER
  let dailyWeather: DailyWeatherPoint[] = [];
  let powerLive = false;

  if (powerRes.status === 'fulfilled' && powerRes.value.properties?.parameter) {
    const params = powerRes.value.properties.parameter;
    const dates = Object.keys(params.T2M_MAX ?? {}).sort();
    for (const dKey of dates) {
      const tMax = params.T2M_MAX?.[dKey] ?? -999;
      const tMin = params.T2M_MIN?.[dKey] ?? -999;
      const precip = params.PRECTOTCORR?.[dKey] ?? 0;
      const solar = params.ALLSKY_SFC_SW_DWN?.[dKey] ?? 18;
      const wind = params.WS2M?.[dKey] ?? 2.2;
      const rh = params.RH2M?.[dKey] ?? 50;
      const gwet = params.GWETTOP?.[dKey] ?? -999;

      if (tMax > -100 && tMin > -100) {
        const soilWetnessPct = gwet >= 0 && gwet <= 1 ? Number((gwet * 100).toFixed(1)) : 40;
        const formattedDate = `${dKey.slice(0, 4)}-${dKey.slice(4, 6)}-${dKey.slice(6, 8)}`;
        dailyWeather.push({
          date: formattedDate,
          tMaxC: Number(tMax.toFixed(1)),
          tMinC: Number(tMin.toFixed(1)),
          precipMm: Number(Math.max(0, precip).toFixed(1)),
          solarMJm2: Number(Math.max(2, solar).toFixed(1)),
          wind2mMs: Number(Math.max(0.2, wind).toFixed(1)),
          rhPct: Number(Math.max(5, Math.min(100, rh)).toFixed(1)),
          soilWetnessPct,
          et0Mm: calculateFao56Et0({
            tMaxC: tMax,
            tMinC: tMin,
            rhPct: rh,
            wind2mMs: wind,
            solarMJm2: solar,
            elevationM: siteElev,
          }),
        });
      }
    }
    if (dailyWeather.length >= 5) {
      powerLive = true;
    }
  }

  if (!powerLive) {
    dailyWeather = demoBaseline.dailyWeather;
  }

  sources.push({
    id: 'power',
    status: powerLive ? 'live' : 'demo',
    dateRange: dateRangeLabel,
    resolution: '0.5° × 0.625° (~50 km)',
    detail: powerLive
      ? 'NASA POWER Ag Climatology daily temperature, rain, solar radiation & surface wetness'
      : 'Regional Egyptian baseline profile (NASA POWER unreachable)',
    url: 'https://power.larc.nasa.gov/',
  });

  // 2. Parse MODIS NDVI
  let ndviSeries: NdviPoint[] = [];
  let modisLive = false;

  if (modisRes.status === 'fulfilled' && Array.isArray(modisRes.value.subset)) {
    const parsed = modisRes.value.subset
      .filter((item) => item.calendar_date && Array.isArray(item.data) && item.data.length > 0)
      .map((item) => {
        const rawVal = item.data?.[0] ?? -3000;
        const scaled = rawVal >= -2000 && rawVal <= 10000 ? rawVal * 0.0001 : null;
        return scaled !== null
          ? {
              date: item.calendar_date as string,
              ndvi: Number(Math.max(0, Math.min(0.95, scaled)).toFixed(3)),
              quality: 'good' as const,
            }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .slice(-10);

    if (parsed.length >= 2) {
      ndviSeries = parsed;
      modisLive = true;
    }
  }

  if (!modisLive) {
    ndviSeries = demoBaseline.ndviSeries;
  }

  sources.push({
    id: 'modis_ndvi',
    status: modisLive ? 'live' : 'demo',
    dateRange:
      ndviSeries.length > 1
        ? `${ndviSeries[0].date} → ${ndviSeries[ndviSeries.length - 1].date}`
        : dateRangeLabel,
    resolution: '250 m (16-day composite)',
    detail: modisLive
      ? 'ORNL DAAC MODIS MOD13Q1 250m vegetation greenness time series'
      : 'Regional Egyptian NDVI profile (MODIS ORNL unreachable)',
    url: 'https://modis.ornl.gov/',
  });

  // 3. SMAP & ECOSTRESS CMR pass index (explicitly labeled as pass index)
  const smapCount =
    smapRes.status === 'fulfilled' ? smapRes.value.feed?.entry?.length ?? 0 : undefined;
  sources.push({
    id: 'smap',
    status: smapRes.status === 'fulfilled' ? 'live' : 'unavailable',
    dateRange: dateRangeLabel,
    resolution: '9 km satellite pass index',
    detail: 'NASA CMR SMAP L3 granule pass count (used for transparency, not direct scoring)',
    granuleCount: smapCount,
    url: 'https://smap.jpl.nasa.gov/',
  });

  const ecoCount =
    ecoRes.status === 'fulfilled' ? ecoRes.value.feed?.entry?.length ?? 0 : undefined;
  sources.push({
    id: 'ecostress',
    status: ecoRes.status === 'fulfilled' ? 'live' : 'unavailable',
    dateRange: dateRangeLabel,
    resolution: '70 m thermal pass index',
    detail: 'NASA CMR ECOSTRESS land surface temperature pass index',
    granuleCount: ecoCount,
    url: 'https://ecostress.jpl.nasa.gov/',
  });

  // 4. GIBS Imagery Layers
  sources.push({
    id: 'gibs',
    status: 'estimated',
    dateRange: 'Daily rolling mosaic',
    resolution: '250 m – 1 km tiles',
    detail: 'NASA GIBS WMTS map tile layers (True Color, MODIS NDVI, LST Heat, SMAP Moisture)',
    url: 'https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs',
  });

  // Summary metrics
  const count = dailyWeather.length;
  const avgEt0MmDay = Number(
    (dailyWeather.reduce((s, d) => s + d.et0Mm, 0) / count).toFixed(2)
  );
  const seasonalEt0Mm = Number(
    dailyWeather.reduce((s, d) => s + d.et0Mm, 0).toFixed(1)
  );
  const seasonalPrecipMm = Number(
    dailyWeather.reduce((s, d) => s + d.precipMm, 0).toFixed(1)
  );
  const irrigationNeedMm = Number(Math.max(0, seasonalEt0Mm - seasonalPrecipMm * 0.8).toFixed(1));
  const heatStressDays = dailyWeather.filter((d) => d.tMaxC >= 36).length;
  const avgTMaxC = Number((dailyWeather.reduce((s, d) => s + d.tMaxC, 0) / count).toFixed(1));
  const avgTMinC = Number((dailyWeather.reduce((s, d) => s + d.tMinC, 0) / count).toFixed(1));
  const avgSoilWetnessPct = Number(
    (dailyWeather.reduce((s, d) => s + d.soilWetnessPct, 0) / count).toFixed(1)
  );
  const latestNdvi = ndviSeries[ndviSeries.length - 1]?.ndvi ?? 0.45;
  const ndviTrend = computeNdviTrend(ndviSeries);

  const dataSource: NasaTelemetryResponse['dataSource'] =
    powerLive && modisLive ? 'live' : powerLive || modisLive ? 'partial' : 'demo';

  // 5. Parse NASA POWER 12-Month Climatology
  let monthlyClimatology = buildDemoClimatology(roundedLat, roundedLon);
  if (climRes.status === 'fulfilled' && climRes.value.properties?.parameter) {
    const cParams = climRes.value.properties.parameter;
    const parsedClim = MONTH_KEYS.map((mKey, idx) => {
      const tVal = cParams.T2M_MAX?.[mKey];
      const pVal = cParams.PRECTOTCORR?.[mKey];
      if (typeof tVal === 'number' && tVal > -100 && typeof pVal === 'number' && pVal >= 0) {
        return {
          month: idx + 1,
          tMaxC: Number(tVal.toFixed(1)),
          precipMm: Number((pVal * 30).toFixed(1)), // mm/day -> approx monthly mm
        };
      }
      return null;
    }).filter((x): x is MonthlyClimatologyPoint => x !== null);
    if (parsedClim.length === 12) {
      monthlyClimatology = parsedClim;
    }
  }

  const result: NasaTelemetryResponse = {
    lat: roundedLat,
    lon: roundedLon,
    fetchedAt: new Date().toISOString(),
    cached: false,
    dataSource,
    ndviTrend,
    latestNdvi,
    ndviSeries,
    dailyWeather,
    monthlyClimatology,
    summary: {
      avgEt0MmDay,
      seasonalEt0Mm,
      seasonalPrecipMm,
      irrigationNeedMm,
      heatStressDays,
      avgTMaxC,
      avgTMinC,
      avgSoilWetnessPct,
      historicalSoilWetnessPct: powerLive ? avgSoilWetnessPct : null,
      waterStressFlag: classifyWaterStress(avgSoilWetnessPct, latestNdvi, irrigationNeedMm),
    },
    sources,
  };

  telemetryCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data: result,
  });

  return result;
}

export function getCacheStats(): { entries: number } {
  return { entries: telemetryCache.size };
}

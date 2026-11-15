import { z } from 'zod';
import { DEFAULT_GOVERNORATE_ID, findGovernorateById } from '../data/egyptGovernorates';
import type {
  DigitMode,
  FarmProfile,
  Language,
  NasaTelemetryResponse,
  SavedPlot,
} from '../types/agrishift';

const FARM_STORAGE_KEY = 'agrishift_farm_v1';
const PREF_STORAGE_KEY = 'agrishift_prefs_v1';
const TELEMETRY_CACHE_KEY = 'agrishift_nasa_cache_v1';
const PLOTS_STORAGE_KEY = 'agrishift_saved_plots_v1';

const cropEnum = z.enum([
  'wheat',
  'berseem',
  'faba_bean',
  'maize',
  'sorghum',
  'rice',
  'cotton',
  'sugar_beet',
  'onion',
  'potato',
  'tomato',
  'sesame',
  'peanut',
]);

const farmSchema = z.object({
  governorateId: z.string(),
  lat: z.number().min(21.5).max(32.5),
  lon: z.number().min(24.5).max(37.0),
  areaFeddans: z.number().min(0.05).max(50000),
  polygon: z.array(z.object({ lat: z.number(), lon: z.number() })),
  preferredCrops: z.array(cropEnum),
  undecidedCrop: z.boolean(),
  lastCrop: cropEnum.nullable(),
  irrigationMethod: z.enum(['flood', 'drip', 'sprinkler', 'pivot']),
  waterSource: z.enum(['canal', 'groundwater']),
  soilType: z.enum(['clay', 'loamy', 'sandy']),
  salinityLevel: z.enum(['fresh', 'moderate', 'saline']),
});

const savedPlotSchema = z.object({
  id: z.string(),
  label: z.string().max(80),
  savedAt: z.string(),
  strategy: z.enum(['balanced', 'water_saving', 'soil_health']),
  farm: farmSchema,
});

const prefsSchema = z.object({
  lang: z.enum(['arz', 'ar', 'en']),
  digitMode: z.enum(['arabic', 'western']),
});

export function getDefaultFarmProfile(): FarmProfile {
  const gov = findGovernorateById(DEFAULT_GOVERNORATE_ID);
  return {
    governorateId: gov.id,
    lat: gov.lat,
    lon: gov.lon,
    areaFeddans: 2.5,
    polygon: [],
    preferredCrops: [],
    undecidedCrop: true,
    lastCrop: null,
    irrigationMethod: 'flood',
    waterSource: 'canal',
    soilType: gov.defaultSoil,
    salinityLevel: 'fresh',
  };
}

export function loadSavedFarm(): FarmProfile {
  try {
    const raw = localStorage.getItem(FARM_STORAGE_KEY);
    if (!raw) return getDefaultFarmProfile();
    const parsed = farmSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
    localStorage.removeItem(FARM_STORAGE_KEY);
  } catch {
    // ignore corrupted storage
  }
  return getDefaultFarmProfile();
}

export function saveFarm(farm: FarmProfile): void {
  try {
    localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farm));
  } catch {
    // ignore quota errors
  }
}

export function loadSavedPlots(): SavedPlot[] {
  try {
    const raw = localStorage.getItem(PLOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = z.array(savedPlotSchema).safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
    localStorage.removeItem(PLOTS_STORAGE_KEY);
  } catch {
    // ignore
  }
  return [];
}

export function savePlots(plots: SavedPlot[]): void {
  try {
    localStorage.setItem(PLOTS_STORAGE_KEY, JSON.stringify(plots.slice(0, 12)));
  } catch {
    // ignore
  }
}

export function loadSavedPrefs(): { lang: Language; digitMode: DigitMode } {
  try {
    const raw = localStorage.getItem(PREF_STORAGE_KEY);
    if (raw) {
      const parsed = prefsSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    }
  } catch {
    // ignore
  }
  return { lang: 'arz', digitMode: 'arabic' };
}

export function savePrefs(lang: Language, digitMode: DigitMode): void {
  try {
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify({ lang, digitMode }));
  } catch {
    // ignore
  }
}

export function loadCachedTelemetry(): NasaTelemetryResponse | null {
  try {
    const raw = localStorage.getItem(TELEMETRY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NasaTelemetryResponse;
    if (!Array.isArray(parsed.monthlyClimatology)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedTelemetry(data: NasaTelemetryResponse): void {
  try {
    localStorage.setItem(TELEMETRY_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

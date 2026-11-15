export type CropType = 'Wheat' | 'Alfalfa' | 'Potato' | 'Barley' | 'Sorghum' | 'Fallow';

export type AnalysisLayer =
  | 'satellite'
  | 'smap_surface'
  | 'smap_root'
  | 'ndvi'
  | 'thermal_et';

export type UserRole = 'farm_manager' | 'field_operator';

export type WorkspaceTab = 'twin' | 'plan' | 'map' | 'analytics' | 'weather' | 'access';

export type CameraPreset = 'overview' | 'flyover' | 'nadir' | 'focus';

export type Language = 'en' | 'ar';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface FarmPlot {
  id: string;
  plotCode: string; // e.g., P-01
  name: string;
  center: GeoPoint;
  // Local 3D scene coordinates (in scene meters, 1 unit = 25m)
  sceneX: number;
  sceneZ: number;
  radiusMeters: number;
  areaHectares: number;
  cropType: CropType;
  growthStage: string;
  irrigating: boolean;
  boomAngleDeg: number;
  flowRateM3Hr: number;
  sustainabilityCapM3Hr: number;
  targetMoisturePct: number;
  // NASA SMAP & EO metrics
  smapSurfaceMoisture: number; // m3/m3 (0.03 - 0.42)
  smapRootMoisturePct: number; // % (10 - 95)
  ndvi: number; // -0.1 to 0.92
  landSurfaceTempC: number; // ECOSTRESS / MODIS LST
  dailyEtcMm: number; // Crop Evapotranspiration mm/day
  // Soil health metrics
  soilSalinityDsM: number; // dS/m
  soilPh: number;
  organicCarbonPct: number;
  // Economics & assignment
  assignedOperator: string;
  seasonalWaterUsedM3: number;
  baselineWaterM3: number;
  nozzleHealthPct: number;
  updatedByUid?: string;
  updatedAt?: string;
}

export interface FarmBoundaryEstimate {
  concessionPolygon: GeoPoint[];
  boundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  totalConcessionAreaHa: number;
  cultivatedAreaHa: number;
  perimeterKm: number;
  aquiferZone: string;
}

export interface YieldPrediction {
  plotCode: string;
  cropType: CropType;
  predictedYieldTHa: number;
  totalPredictedTons: number;
  waterProductivityKgM3: number;
  moistureStressFactor: number; // 0..1
  salinityFactor: number; // 0..1
  sustainabilityScore: number; // 0..100
  recommendation: string;
}

export interface DailyWaterPoint {
  dayLabel: string;
  extractionM3: number;
  cropDemandM3: number;
  baselineFloodM3: number;
  smapAvgSurface: number;
}

export interface HourlyWeatherPoint {
  timeIso: string;
  hourLabel: string;
  tempC: number;
  humidityPct: number;
  windKmh: number;
  solarWm2: number;
  et0MmHr: number;
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  source: 'open-meteo' | 'climatology-fallback';
  fetchedAt: string;
  currentTempC: number;
  currentWindKmh: number;
  currentHumidityPct: number;
  currentSolarWm2: number;
  dailyMaxTempC: number;
  dailyMinTempC: number;
  hourly: HourlyWeatherPoint[];
}

export interface WeatherAlert {
  id: string;
  severity: 'critical' | 'warning' | 'advisory';
  title: string;
  description: string;
  actionWindow: string;
  metricValue: string;
}

export interface FieldLogEntry {
  id: string;
  plotCode: string;
  authorUid: string;
  authorName: string;
  authorRole: UserRole;
  category: 'irrigation' | 'nozzle_check' | 'soil_sample' | 'weather_action';
  note: string;
  createdAt: string;
}

export interface FarmSettings {
  aquiferDailyCapM3: number;
  evapLockoutTempC: number;
  updatedByUid?: string;
  updatedAt?: string;
}

export interface AdaptationScenarioParams {
  deficitIrrigationPct: number; // 0 to 30%
  nocturnalShiftPct: number; // 0 to 100%
  convertAlfalfaToSorghum: boolean;
}

export interface AdaptationScenarioResult {
  baselineWaterM3: number;
  projectedWaterM3: number;
  waterSavedM3: number;
  waterSavedPct: number;
  projectedTotalYieldTons: number;
  baselineTotalYieldTons: number;
  yieldDeltaPct: number;
  aquiferSustainabilityIndex: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  assignedPlotCount?: number;
  updatedAt?: string;
}

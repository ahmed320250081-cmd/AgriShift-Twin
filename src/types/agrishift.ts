export type Language = 'arz' | 'ar' | 'en';
export type DigitMode = 'arabic' | 'western';

export type EgyptianSeason = 'winter' | 'summer' | 'nili';
export type IrrigationMethod = 'flood' | 'drip' | 'sprinkler' | 'pivot';
export type WaterSource = 'canal' | 'groundwater';
export type SoilType = 'clay' | 'loamy' | 'sandy';
export type SalinityLevel = 'fresh' | 'moderate' | 'saline';
export type RotationStrategyId = 'balanced' | 'water_saving' | 'soil_health';
export type WaterNeedLevel = 'low' | 'medium' | 'high';
export type ReviewStatus = 'needs_expert_review' | 'reviewed';
export type DataSourceStatus = 'live' | 'estimated' | 'demo' | 'unavailable';

export type CropId =
  | 'wheat'
  | 'berseem'
  | 'faba_bean'
  | 'maize'
  | 'sorghum'
  | 'rice'
  | 'cotton'
  | 'sugar_beet'
  | 'onion'
  | 'potato'
  | 'tomato'
  | 'sesame'
  | 'peanut';

export interface LocalizedText {
  arz: string;
  ar: string;
  en: string;
}

export interface CropRecord {
  id: CropId;
  name: LocalizedText;
  seasons: EgyptianSeason[];
  sowMonths: [number, number];
  harvestMonths: [number, number];
  waterNeed: WaterNeedLevel;
  waterM3PerFeddanMin: number | null;
  waterM3PerFeddanMax: number | null;
  salinityTolerance: 'low' | 'medium' | 'high';
  preferredSoils: SoilType[];
  tempMinC: number;
  tempMaxC: number;
  nitrogenFixer: boolean;
  avoidContinuousYears: number;
  goodPredecessors: CropId[];
  goodFollowers: CropId[];
  accentHex: string;
  bgTintClass: string;
  sources: string[];
  reviewStatus: ReviewStatus;
}

export interface GovernoratePreset {
  id: string;
  name: LocalizedText;
  region: 'delta' | 'valley' | 'oasis';
  lat: number;
  lon: number;
  elevationM: number;
  defaultSoil: SoilType;
  ricePermitted: boolean;
}

export interface FieldPolygonPoint {
  lat: number;
  lon: number;
}

export interface FarmProfile {
  governorateId: string;
  lat: number;
  lon: number;
  areaFeddans: number;
  polygon: FieldPolygonPoint[];
  preferredCrops: CropId[];
  undecidedCrop: boolean;
  lastCrop: CropId | null;
  irrigationMethod: IrrigationMethod;
  waterSource: WaterSource;
  soilType: SoilType;
  salinityLevel: SalinityLevel;
}

export interface DailyWeatherPoint {
  date: string;
  tMaxC: number;
  tMinC: number;
  precipMm: number;
  solarMJm2: number;
  wind2mMs: number;
  rhPct: number;
  soilWetnessPct: number;
  et0Mm: number;
}

export interface NdviPoint {
  date: string;
  ndvi: number;
  quality: 'good' | 'marginal' | 'estimated';
}

export interface SourceHealthInfo {
  id: 'power' | 'modis_ndvi' | 'smap' | 'ecostress' | 'gibs';
  status: DataSourceStatus;
  dateRange: string;
  resolution: string;
  detail: string;
  granuleCount?: number;
  url: string;
}

export interface Fao56Summary {
  avgEt0MmDay: number;
  seasonalEt0Mm: number;
  seasonalPrecipMm: number;
  irrigationNeedMm: number;
  heatStressDays: number;
  avgTMaxC: number;
  avgTMinC: number;
  avgSoilWetnessPct: number;
  historicalSoilWetnessPct: number | null;
  waterStressFlag: 'low' | 'moderate' | 'high';
}

export interface MonthlyClimatologyPoint {
  month: number; // 1..12
  tMaxC: number;
  precipMm: number;
}

export interface NasaTelemetryResponse {
  lat: number;
  lon: number;
  fetchedAt: string;
  cached: boolean;
  dataSource: 'live' | 'partial' | 'demo';
  ndviTrend: 'rising' | 'stable' | 'falling';
  latestNdvi: number;
  ndviSeries: NdviPoint[];
  dailyWeather: DailyWeatherPoint[];
  monthlyClimatology: MonthlyClimatologyPoint[];
  summary: Fao56Summary;
  sources: SourceHealthInfo[];
}

export interface SavedPlot {
  id: string;
  label: string;
  savedAt: string;
  strategy: RotationStrategyId;
  farm: FarmProfile;
}

export type ReasonBadgeKey =
  | 'nitrogen_fixer'
  | 'good_sequence'
  | 'water_saver'
  | 'heat_tolerant'
  | 'salinity_safe'
  | 'soil_match'
  | 'nasa_moisture_fit'
  | 'policy_check';

export type EvidenceType = 'rain' | 'heat' | 'soil_wetness' | 'ndvi' | 'et0';

export interface SeasonRecommendation {
  season: EgyptianSeason;
  cropId: CropId;
  reasons: ReasonBadgeKey[];
  evidence: EvidenceType[];
  policyWarning: boolean;
  alternatives: CropId[];
  waterEstimateM3Feddan: number | null;
}

export interface RuleTraceEntry {
  season: EgyptianSeason;
  selectedCrop: CropId;
  rejectedCount: number;
  appliedRules: string[];
  nasaInputsUsed: string[];
}

export interface RotationPlan {
  strategy: RotationStrategyId;
  relativeDecisionScore: number;
  scoreBreakdown: {
    climateFit: number;
    waterEfficiency: number;
    soilHealth: number;
    agronomicSequence: number;
  };
  seasons: SeasonRecommendation[];
  ruleTrace: RuleTraceEntry[];
  cautions: string[];
}

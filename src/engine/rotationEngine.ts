import { CROPS_DATABASE, getCropById } from '../data/cropsDatabase';
import { findGovernorateById } from '../data/egyptGovernorates';
import type {
  CropId,
  CropRecord,
  EgyptianSeason,
  EvidenceType,
  FarmProfile,
  NasaTelemetryResponse,
  ReasonBadgeKey,
  RotationPlan,
  RotationStrategyId,
  RuleTraceEntry,
  SeasonRecommendation,
} from '../types/agrishift';

export interface StrategyWeightsConfig {
  waterEfficiency: number;
  soilHealth: number;
  climateFit: number;
  agronomicSequence: number;
  userPreferenceBoost: number;
}

/**
 * Documented scoring weights per strategy.
 * Productivity/preference is never multiplied by climate suitability to prevent non-linear distortion.
 */
export const STRATEGY_WEIGHTS: Record<RotationStrategyId, StrategyWeightsConfig> = {
  balanced: {
    climateFit: 0.28,
    waterEfficiency: 0.24,
    soilHealth: 0.24,
    agronomicSequence: 0.24,
    userPreferenceBoost: 12,
  },
  water_saving: {
    climateFit: 0.2,
    waterEfficiency: 0.45,
    soilHealth: 0.15,
    agronomicSequence: 0.2,
    userPreferenceBoost: 8,
  },
  soil_health: {
    climateFit: 0.18,
    waterEfficiency: 0.17,
    soilHealth: 0.4,
    agronomicSequence: 0.25,
    userPreferenceBoost: 8,
  },
};

function isCropHardRejected(
  crop: CropRecord,
  season: EgyptianSeason,
  farm: FarmProfile,
  telemetry: NasaTelemetryResponse
): string | null {
  if (!crop.seasons.includes(season)) {
    return 'season_mismatch';
  }

  // Salinity hard filter
  if (farm.salinityLevel === 'saline' && crop.salinityTolerance === 'low') {
    return 'salinity_intolerant';
  }

  // Policy & irrigation filter for paddy rice
  if (crop.id === 'rice') {
    const gov = findGovernorateById(farm.governorateId);
    if (!gov.ricePermitted) {
      return 'policy_rice_non_permitted_governorate';
    }
    if (farm.irrigationMethod !== 'flood' || farm.waterSource === 'groundwater') {
      return 'rice_requires_canal_flood';
    }
    if (telemetry.summary.waterStressFlag === 'high') {
      return 'nasa_water_stress_blocks_rice';
    }
  }

  // Avoid planting same crop continuously beyond its limit
  if (farm.lastCrop === crop.id && crop.avoidContinuousYears <= 1) {
    return 'avoid_continuous_monocrop';
  }

  // Sandy soil + high water stress check for heavy clay crops
  if (farm.soilType === 'sandy' && crop.id === 'rice') {
    return 'sandy_soil_unsuitable_for_rice';
  }

  return null;
}

function scoreSingleCrop(
  crop: CropRecord,
  previousCrop: CropRecord | null,
  farm: FarmProfile,
  telemetry: NasaTelemetryResponse,
  weights: StrategyWeightsConfig
): {
  total: number;
  climateFit: number;
  waterEfficiency: number;
  soilHealth: number;
  agronomicSequence: number;
  reasons: ReasonBadgeKey[];
  evidence: EvidenceType[];
} {
  const reasons: ReasonBadgeKey[] = [];
  const evidence: EvidenceType[] = ['et0', 'soil_wetness'];

  // 1. Climate fit (0..100) using NASA POWER temperatures & heat stress
  const tMax = telemetry.summary.avgTMaxC;
  let climateFit = 75;
  if (tMax >= crop.tempMinC && tMax <= crop.tempMaxC) {
    climateFit = 95;
  } else if (tMax > crop.tempMaxC) {
    const excess = tMax - crop.tempMaxC;
    climateFit = Math.max(25, 85 - excess * 8);
  }
  if (telemetry.summary.heatStressDays >= 8 && crop.tempMaxC >= 36) {
    climateFit = Math.min(100, climateFit + 8);
    reasons.push('heat_tolerant');
    evidence.push('heat');
  }

  // 2. Water efficiency (0..100) considering Egyptian irrigation & NASA water stress
  let waterEfficiency =
    crop.waterNeed === 'low' ? 96 : crop.waterNeed === 'medium' ? 68 : 34;

  if (farm.irrigationMethod === 'drip' || farm.irrigationMethod === 'pivot') {
    waterEfficiency = Math.min(100, waterEfficiency + 12);
  }
  if (
    (farm.waterSource === 'groundwater' || telemetry.summary.waterStressFlag !== 'low') &&
    crop.waterNeed === 'high'
  ) {
    waterEfficiency = Math.max(10, waterEfficiency - 26);
  }
  if (crop.waterNeed === 'low') {
    reasons.push('water_saver');
  }
  if (telemetry.summary.avgSoilWetnessPct >= 45 && crop.waterNeed !== 'low') {
    reasons.push('nasa_moisture_fit');
  }
  if (telemetry.summary.seasonalPrecipMm > 15) {
    evidence.push('rain');
  }

  // 3. Soil health & salinity (0..100)
  let soilHealth = crop.preferredSoils.includes(farm.soilType) ? 74 : 48;
  if (crop.preferredSoils.includes(farm.soilType)) {
    reasons.push('soil_match');
  }
  if (crop.nitrogenFixer) {
    soilHealth += 26;
    reasons.push('nitrogen_fixer');
  }
  if (
    farm.salinityLevel !== 'fresh' &&
    (crop.salinityTolerance === 'high' || crop.salinityTolerance === 'medium')
  ) {
    soilHealth = Math.min(100, soilHealth + 8);
    reasons.push('salinity_safe');
  }

  // 4. Agronomic sequence (0..100)
  let agronomicSequence = 65;
  if (previousCrop) {
    if (previousCrop.id === crop.id) {
      agronomicSequence = 15;
    } else if (
      previousCrop.goodFollowers.includes(crop.id) ||
      crop.goodPredecessors.includes(previousCrop.id)
    ) {
      agronomicSequence = 96;
      reasons.push('good_sequence');
    } else if (previousCrop.nitrogenFixer && !crop.nitrogenFixer) {
      agronomicSequence = 88;
      reasons.push('good_sequence');
    }
  } else if (farm.lastCrop) {
    const last = getCropById(farm.lastCrop);
    if (last.id === crop.id) {
      agronomicSequence = 20;
    } else if (last.goodFollowers.includes(crop.id)) {
      agronomicSequence = 94;
      reasons.push('good_sequence');
    }
  }

  if (crop.id === 'rice') {
    reasons.push('policy_check');
  }
  if (telemetry.latestNdvi > 0) {
    evidence.push('ndvi');
  }

  const baseWeighted =
    climateFit * weights.climateFit +
    waterEfficiency * weights.waterEfficiency +
    soilHealth * weights.soilHealth +
    agronomicSequence * weights.agronomicSequence;

  const prefBoost =
    !farm.undecidedCrop && farm.preferredCrops.includes(crop.id)
      ? weights.userPreferenceBoost
      : 0;

  return {
    total: Number((baseWeighted + prefBoost).toFixed(2)),
    climateFit,
    waterEfficiency,
    soilHealth,
    agronomicSequence,
    reasons: Array.from(new Set(reasons)).slice(0, 4),
    evidence: Array.from(new Set(evidence)),
  };
}

/**
 * Generates a deterministic, constraint-filtered 3-season Egyptian crop rotation plan
 * for a requested objective strategy using farm conditions and NASA telemetry.
 */
export function generateRotationPlan(
  farm: FarmProfile,
  telemetry: NasaTelemetryResponse,
  strategy: RotationStrategyId
): RotationPlan {
  const weights = STRATEGY_WEIGHTS[strategy];
  const seasonOrder: EgyptianSeason[] = ['winter', 'summer', 'nili'];

  // Collect valid candidates per season
  const candidatesBySeason: Record<EgyptianSeason, CropRecord[]> = {
    winter: [],
    summer: [],
    nili: [],
  };
  let rejectedCountTotal = 0;

  for (const season of seasonOrder) {
    for (const crop of CROPS_DATABASE) {
      const rejectReason = isCropHardRejected(crop, season, farm, telemetry);
      if (rejectReason === null) {
        candidatesBySeason[season].push(crop);
      } else {
        rejectedCountTotal++;
      }
    }
  }

  // Search all valid 3-season sequences (avoiding duplicate crops across consecutive seasons)
  interface SequenceEval {
    crops: [CropRecord, CropRecord, CropRecord];
    totalScore: number;
    climateAvg: number;
    waterAvg: number;
    soilAvg: number;
    seqAvg: number;
    perSeason: ReturnType<typeof scoreSingleCrop>[];
  }

  const validSequences: SequenceEval[] = [];

  for (const wCrop of candidatesBySeason.winter) {
    for (const sCrop of candidatesBySeason.summer) {
      if (sCrop.id === wCrop.id) {
        rejectedCountTotal++;
        continue;
      }
      for (const nCrop of candidatesBySeason.nili) {
        if (nCrop.id === sCrop.id || nCrop.id === wCrop.id) {
          rejectedCountTotal++;
          continue;
        }
        const evalW = scoreSingleCrop(wCrop, null, farm, telemetry, weights);
        const evalS = scoreSingleCrop(sCrop, wCrop, farm, telemetry, weights);
        const evalN = scoreSingleCrop(nCrop, sCrop, farm, telemetry, weights);

        // Bonus for including at least one legume nitrogen fixer in the 3-season cycle
        const hasNitrogenFixer =
          wCrop.nitrogenFixer || sCrop.nitrogenFixer || nCrop.nitrogenFixer;
        const diversityBonus = hasNitrogenFixer ? 6 : 0;

        const totalScore = Number(
          ((evalW.total + evalS.total + evalN.total) / 3 + diversityBonus).toFixed(2)
        );

        validSequences.push({
          crops: [wCrop, sCrop, nCrop],
          totalScore,
          climateAvg: Math.round((evalW.climateFit + evalS.climateFit + evalN.climateFit) / 3),
          waterAvg: Math.round(
            (evalW.waterEfficiency + evalS.waterEfficiency + evalN.waterEfficiency) / 3
          ),
          soilAvg: Math.round((evalW.soilHealth + evalS.soilHealth + evalN.soilHealth) / 3),
          seqAvg: Math.round(
            (evalW.agronomicSequence + evalS.agronomicSequence + evalN.agronomicSequence) / 3
          ),
          perSeason: [evalW, evalS, evalN],
        });
      }
    }
  }

  // Deterministic tie-breaking sort
  validSequences.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.crops.map((c) => c.id).join(',').localeCompare(b.crops.map((c) => c.id).join(','));
  });

  const best = validSequences[0];
  if (!best) {
    // Safety fallback if extreme constraints eliminated everything
    const fallbackCrops: [CropRecord, CropRecord, CropRecord] = [
      getCropById('berseem'),
      getCropById('sorghum'),
      getCropById('sesame'),
    ];
    const evals = fallbackCrops.map((c, idx) =>
      scoreSingleCrop(c, idx === 0 ? null : fallbackCrops[idx - 1], farm, telemetry, weights)
    );
    return {
      strategy,
      relativeDecisionScore: 70,
      scoreBreakdown: {
        climateFit: 70,
        waterEfficiency: 75,
        soilHealth: 72,
        agronomicSequence: 68,
      },
      seasons: seasonOrder.map((season, i) => ({
        season,
        cropId: fallbackCrops[i].id,
        reasons: evals[i].reasons,
        evidence: evals[i].evidence,
        policyWarning: false,
        alternatives: [],
        waterEstimateM3Feddan: fallbackCrops[i].waterM3PerFeddanMin,
      })),
      ruleTrace: [],
      cautions: [],
    };
  }

  const seasons: SeasonRecommendation[] = seasonOrder.map((season, i) => {
    const selected = best.crops[i];
    const rankedAlts = candidatesBySeason[season]
      .filter((c) => c.id !== selected.id && !best.crops.some((bc, idx) => idx !== i && bc.id === c.id))
      .map((c) => ({
        id: c.id,
        score: scoreSingleCrop(c, i === 0 ? null : best.crops[i - 1], farm, telemetry, weights)
          .total,
      }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, 3)
      .map((a) => a.id);

    const waterAvg =
      selected.waterM3PerFeddanMin !== null && selected.waterM3PerFeddanMax !== null
        ? Math.round((selected.waterM3PerFeddanMin + selected.waterM3PerFeddanMax) / 2)
        : null;

    return {
      season,
      cropId: selected.id,
      reasons: best.perSeason[i].reasons,
      evidence: best.perSeason[i].evidence,
      policyWarning: selected.id === 'rice',
      alternatives: rankedAlts,
      waterEstimateM3Feddan: waterAvg,
    };
  });

  const ruleTrace: RuleTraceEntry[] = seasonOrder.map((season, i) => ({
    season,
    selectedCrop: best.crops[i].id,
    rejectedCount: Math.round(rejectedCountTotal / 3),
    appliedRules: [
      `salinity:${farm.salinityLevel}`,
      `soil:${farm.soilType}`,
      `irrigation:${farm.irrigationMethod}`,
      `source:${farm.waterSource}`,
      ...(best.crops[i].nitrogenFixer ? ['nitrogen_fixation_bonus'] : []),
    ],
    nasaInputsUsed: [
      `Tmax=${telemetry.summary.avgTMaxC.toFixed(1)}C`,
      `ET0=${telemetry.summary.avgEt0MmDay.toFixed(1)}mm/d`,
      `SoilWet=${telemetry.summary.avgSoilWetnessPct.toFixed(0)}%`,
      `NDVI=${telemetry.latestNdvi.toFixed(2)}(${telemetry.ndviTrend})`,
    ],
  }));

  const cautions: string[] = [];
  if (best.crops.some((c) => c.id === 'rice')) {
    cautions.push('rice_policy_check');
  }
  if (telemetry.summary.waterStressFlag === 'high') {
    cautions.push('water_stress_alert');
  }

  return {
    strategy,
    relativeDecisionScore: Math.min(99, Math.round(best.totalScore)),
    scoreBreakdown: {
      climateFit: best.climateAvg,
      waterEfficiency: best.waterAvg,
      soilHealth: best.soilAvg,
      agronomicSequence: best.seqAvg,
    },
    seasons,
    ruleTrace,
    cautions,
  };
}

/**
 * Generates all 3 strategy plans deterministically so the UI can switch instantly.
 */
export function generateAllStrategyPlans(
  farm: FarmProfile,
  telemetry: NasaTelemetryResponse
): Record<RotationStrategyId, RotationPlan> {
  return {
    balanced: generateRotationPlan(farm, telemetry, 'balanced'),
    water_saving: generateRotationPlan(farm, telemetry, 'water_saving'),
    soil_health: generateRotationPlan(farm, telemetry, 'soil_health'),
  };
}

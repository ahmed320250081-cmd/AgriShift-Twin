export interface Fao56Input {
  tMaxC: number;
  tMinC: number;
  rhPct: number;
  wind2mMs: number;
  solarMJm2: number;
  elevationM: number;
}

/**
 * Computes FAO-56 Penman-Monteith daily reference evapotranspiration (ET0 in mm/day).
 * Uses psychrometric constant from site elevation, saturation vapor pressure curve,
 * albedo 0.23 shortwave reflection, and empirical net longwave radiation estimate.
 */
export function calculateFao56Et0(input: Fao56Input): number {
  const tMean = (input.tMaxC + input.tMinC) / 2;

  // Atmospheric pressure (kPa) from elevation (m)
  const pressureKpa = 101.3 * Math.pow((293 - 0.0065 * input.elevationM) / 293, 5.26);

  // Psychrometric constant gamma (kPa / C)
  const gamma = 0.000665 * pressureKpa;

  // Saturation vapor pressure (kPa)
  const esTmax = 0.6108 * Math.exp((17.27 * input.tMaxC) / (input.tMaxC + 237.3));
  const esTmin = 0.6108 * Math.exp((17.27 * input.tMinC) / (input.tMinC + 237.3));
  const es = (esTmax + esTmin) / 2;

  // Actual vapor pressure from mean RH (%)
  const rhClamped = Math.max(5, Math.min(100, input.rhPct));
  const ea = es * (rhClamped / 100);

  // Slope of saturation vapor pressure curve delta (kPa / C)
  const delta =
    (4098 * (0.6108 * Math.exp((17.27 * tMean) / (tMean + 237.3)))) /
    Math.pow(tMean + 237.3, 2);

  // Net shortwave radiation (albedo = 0.23)
  const rs = Math.max(0, input.solarMJm2);
  const rns = (1 - 0.23) * rs;

  // Stefan-Boltzmann daily longwave radiation estimate (MJ/m2/day)
  const sigma = 4.903e-9;
  const tMaxK4 = Math.pow(input.tMaxC + 273.16, 4);
  const tMinK4 = Math.pow(input.tMinC + 273.16, 4);
  const clearSkyFactor = 0.7;
  const rnl =
    sigma *
    ((tMaxK4 + tMinK4) / 2) *
    (0.34 - 0.14 * Math.sqrt(Math.max(0.05, ea))) *
    clearSkyFactor;

  const rn = rns - rnl;
  const g = 0; // Daily soil heat flux is near zero
  const u2 = Math.max(0.2, input.wind2mMs);

  const numerator =
    0.408 * delta * (rn - g) +
    gamma * (900 / (tMean + 273)) * u2 * Math.max(0, es - ea);
  const denominator = delta + gamma * (1 + 0.34 * u2);

  const et0 = numerator / denominator;
  return Number(Math.max(0.5, et0).toFixed(2));
}

/**
 * Classifies water stress from NDVI level and NASA surface soil wetness (%).
 */
export function classifyWaterStress(
  avgSoilWetnessPct: number,
  latestNdvi: number,
  irrigationNeedMm: number
): 'low' | 'moderate' | 'high' {
  if (avgSoilWetnessPct < 24 || (latestNdvi < 0.28 && irrigationNeedMm > 140)) {
    return 'high';
  }
  if (avgSoilWetnessPct < 38 || irrigationNeedMm > 110) {
    return 'moderate';
  }
  return 'low';
}

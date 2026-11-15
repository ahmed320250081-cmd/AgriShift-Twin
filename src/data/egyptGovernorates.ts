import type { GovernoratePreset } from '../types/agrishift';

export const DEFAULT_GOVERNORATE_ID = 'kafr_el_sheikh';

/**
 * Major Egyptian agricultural governorate coordinates, elevations, and rice-zone flags,
 * including the Sharq El Owainat desert reclamation concession linked to the 3D Digital Twin.
 */
export const EGYPT_GOVERNORATES: GovernoratePreset[] = [
  {
    id: 'kafr_el_sheikh',
    name: { arz: 'كفر الشيخ', ar: 'كفر الشيخ', en: 'Kafr El-Sheikh' },
    region: 'delta',
    lat: 31.1107,
    lon: 30.9388,
    elevationM: 6,
    defaultSoil: 'clay',
    ricePermitted: true,
  },
  {
    id: 'beheira',
    name: { arz: 'البحيرة', ar: 'البحيرة', en: 'Beheira' },
    region: 'delta',
    lat: 31.0409,
    lon: 30.47,
    elevationM: 8,
    defaultSoil: 'clay',
    ricePermitted: true,
  },
  {
    id: 'dakahlia',
    name: { arz: 'الدقهلية', ar: 'الدقهلية', en: 'Dakahlia' },
    region: 'delta',
    lat: 31.0409,
    lon: 31.3785,
    elevationM: 7,
    defaultSoil: 'clay',
    ricePermitted: true,
  },
  {
    id: 'sharqia',
    name: { arz: 'الشرقية', ar: 'الشرقية', en: 'Sharqia' },
    region: 'delta',
    lat: 30.5877,
    lon: 31.502,
    elevationM: 12,
    defaultSoil: 'loamy',
    ricePermitted: true,
  },
  {
    id: 'gharbia',
    name: { arz: 'الغربية', ar: 'الغربية', en: 'Gharbia' },
    region: 'delta',
    lat: 30.7865,
    lon: 31.0004,
    elevationM: 10,
    defaultSoil: 'clay',
    ricePermitted: true,
  },
  {
    id: 'monufia',
    name: { arz: 'المنوفية', ar: 'المنوفية', en: 'Monufia' },
    region: 'delta',
    lat: 30.5503,
    lon: 31.0106,
    elevationM: 14,
    defaultSoil: 'clay',
    ricePermitted: false,
  },
  {
    id: 'nubaria',
    name: { arz: 'النوبارية', ar: 'النوبارية', en: 'Nubaria' },
    region: 'oasis',
    lat: 30.6667,
    lon: 30.0667,
    elevationM: 22,
    defaultSoil: 'sandy',
    ricePermitted: false,
  },
  {
    id: 'fayoum',
    name: { arz: 'الفيوم', ar: 'الفيوم', en: 'Fayoum' },
    region: 'valley',
    lat: 29.3084,
    lon: 30.8428,
    elevationM: 24,
    defaultSoil: 'loamy',
    ricePermitted: false,
  },
  {
    id: 'beni_suef',
    name: { arz: 'بني سويف', ar: 'بني سويف', en: 'Beni Suef' },
    region: 'valley',
    lat: 29.0661,
    lon: 31.0994,
    elevationM: 32,
    defaultSoil: 'clay',
    ricePermitted: false,
  },
  {
    id: 'minya',
    name: { arz: 'المنيا', ar: 'المنيا', en: 'Minya' },
    region: 'valley',
    lat: 28.1099,
    lon: 30.7503,
    elevationM: 40,
    defaultSoil: 'loamy',
    ricePermitted: false,
  },
  {
    id: 'assiut',
    name: { arz: 'أسيوط', ar: 'أسيوط', en: 'Assiut' },
    region: 'valley',
    lat: 27.1809,
    lon: 31.1837,
    elevationM: 52,
    defaultSoil: 'clay',
    ricePermitted: false,
  },
  {
    id: 'sohag',
    name: { arz: 'سوهاج', ar: 'سوهاج', en: 'Sohag' },
    region: 'valley',
    lat: 26.5569,
    lon: 31.6948,
    elevationM: 61,
    defaultSoil: 'loamy',
    ricePermitted: false,
  },
  {
    id: 'qena',
    name: { arz: 'قنا', ar: 'قنا', en: 'Qena' },
    region: 'valley',
    lat: 26.1551,
    lon: 32.716,
    elevationM: 76,
    defaultSoil: 'loamy',
    ricePermitted: false,
  },
  {
    id: 'luxor',
    name: { arz: 'الأقصر', ar: 'الأقصر', en: 'Luxor' },
    region: 'valley',
    lat: 25.6872,
    lon: 32.6396,
    elevationM: 82,
    defaultSoil: 'loamy',
    ricePermitted: false,
  },
  {
    id: 'aswan',
    name: { arz: 'أسوان', ar: 'أسوان', en: 'Aswan' },
    region: 'valley',
    lat: 24.0889,
    lon: 32.8998,
    elevationM: 108,
    defaultSoil: 'sandy',
    ricePermitted: false,
  },
  {
    id: 'new_valley',
    name: { arz: 'الوادي الجديد', ar: 'الوادي الجديد', en: 'New Valley' },
    region: 'oasis',
    lat: 25.4474,
    lon: 30.546,
    elevationM: 112,
    defaultSoil: 'sandy',
    ricePermitted: false,
  },
  {
    id: 'sharq_el_owainat',
    name: { arz: 'شرق العوينات', ar: 'شرق العوينات', en: 'Sharq El Owainat' },
    region: 'oasis',
    lat: 22.5833,
    lon: 28.6667,
    elevationM: 190,
    defaultSoil: 'sandy',
    ricePermitted: false,
  },
  {
    id: 'north_sinai',
    name: { arz: 'شمال سيناء', ar: 'شمال سيناء', en: 'North Sinai' },
    region: 'oasis',
    lat: 31.1321,
    lon: 33.8033,
    elevationM: 18,
    defaultSoil: 'sandy',
    ricePermitted: false,
  },
];

export function findGovernorateById(id: string): GovernoratePreset {
  return EGYPT_GOVERNORATES.find((g) => g.id === id) ?? EGYPT_GOVERNORATES[0];
}

export function findNearestGovernorate(lat: number, lon: number): GovernoratePreset {
  let best = EGYPT_GOVERNORATES[0];
  let bestDist = Infinity;
  for (const gov of EGYPT_GOVERNORATES) {
    const dLat = gov.lat - lat;
    const dLon = gov.lon - lon;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < bestDist) {
      bestDist = dist;
      best = gov;
    }
  }
  return best;
}

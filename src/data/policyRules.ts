import type { EgyptianSeason, LocalizedText } from '../types/agrishift';

export interface SeasonWindowConfig {
  id: EgyptianSeason;
  name: LocalizedText;
  monthsLabel: LocalizedText;
  startMonth: number;
  endMonth: number;
}

export const EGYPTIAN_SEASONS: SeasonWindowConfig[] = [
  {
    id: 'winter',
    name: { arz: 'الشتوي', ar: 'الموسم الشتوي', en: 'Winter' },
    monthsLabel: { arz: 'نوفمبر – أبريل', ar: 'نوفمبر – أبريل', en: 'Nov – Apr' },
    startMonth: 11,
    endMonth: 4,
  },
  {
    id: 'summer',
    name: { arz: 'الصيفي', ar: 'الموسم الصيفي', en: 'Summer' },
    monthsLabel: { arz: 'أبريل – أكتوبر', ar: 'أبريل – أكتوبر', en: 'Apr – Oct' },
    startMonth: 4,
    endMonth: 10,
  },
  {
    id: 'nili',
    name: { arz: 'النيلي', ar: 'الموسم النيلي', en: 'Nili' },
    monthsLabel: { arz: 'يوليو – نوفمبر', ar: 'يوليو – نوفمبر', en: 'Jul – Nov' },
    startMonth: 7,
    endMonth: 11,
  },
];

export interface RegionalPolicyRule {
  id: string;
  cropId: 'rice';
  title: LocalizedText;
  cautionNote: LocalizedText;
  source: string;
  updatedYear: number;
}

/**
 * Configurable Egyptian Ministry of Water Resources & Irrigation / MALR policy rules.
 * Kept external to engine logic so local agricultural directorate quotas can be updated cleanly.
 */
export const EGYPT_POLICY_RULES: RegionalPolicyRule[] = [
  {
    id: 'rice_delta_zoning',
    cropId: 'rice',
    title: {
      arz: 'تصريح زراعة الأرز',
      ar: 'ضوابط زراعة الأرز المقررة',
      en: 'Rice Area Zoning Rule',
    },
    cautionNote: {
      arz: 'راجع الإدارة الزراعية في محافظتك',
      ar: 'راجع الإدارة الزراعية في محافظتك قبل زراعة الأرز',
      en: 'Check your local Agricultural Directorate permit',
    },
    source: 'Ministry of Water Resources & Irrigation / MALR Annual Rice Zoning Decree',
    updatedYear: 2025,
  },
];

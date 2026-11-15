import type { DigitMode, Language } from '../types/agrishift';

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

/**
 * Converts Western ASCII digits (0-9) into Eastern Arabic-Indic digits (٠-٩).
 */
export function toArabicIndicDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[Number(d)] ?? d);
}

/**
 * Formats a numeric value using tabular precision and optional Arabic-Indic numerals.
 */
export function formatNumber(
  value: number,
  digitMode: DigitMode,
  decimals = 1
): string {
  if (!Number.isFinite(value)) return '—';
  const fixed = decimals === 0 ? Math.round(value).toString() : value.toFixed(decimals);
  return digitMode === 'arabic' ? toArabicIndicDigits(fixed) : fixed;
}

/**
 * Formats a feddan count with appropriate precision and localized label.
 */
export function formatFeddanLabel(
  feddans: number,
  lang: Language,
  digitMode: DigitMode
): string {
  const decimals = feddans >= 10 ? 1 : 2;
  const numStr = formatNumber(feddans, digitMode, decimals);
  if (lang === 'en') return `${numStr} Feddan`;
  return `${numStr} فدان`;
}

/**
 * Returns HTML dir attribute for a language code.
 */
export function getDirectionForLang(lang: Language): 'rtl' | 'ltr' {
  return lang === 'en' ? 'ltr' : 'rtl';
}

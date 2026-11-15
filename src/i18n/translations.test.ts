import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS } from './translations';

test('all translation keys exist across arz, ar, and en with non-empty values', () => {
  const baseKeys = Object.keys(TRANSLATIONS.arz).sort();
  const arKeys = Object.keys(TRANSLATIONS.ar).sort();
  const enKeys = Object.keys(TRANSLATIONS.en).sort();

  assert.deepEqual(arKeys, baseKeys, 'ar keys must match arz keys');
  assert.deepEqual(enKeys, baseKeys, 'en keys must match arz keys');

  for (const lang of ['arz', 'ar', 'en'] as const) {
    for (const key of baseKeys) {
      const value = TRANSLATIONS[lang][key as keyof typeof TRANSLATIONS.arz];
      assert.ok(
        typeof value === 'string' && value.trim().length > 0,
        `Missing or empty translation for ${lang}.${key}`
      );
    }
  }
});

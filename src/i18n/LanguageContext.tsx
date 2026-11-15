import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { DigitMode, Language as AgriLanguage } from '../types/agrishift';
import type { Language as OwainatLanguage } from '../types/farm';
import { translations as owainatTranslations } from './owainatTranslations';
import { TRANSLATIONS as agriTranslations } from './translations';

const STORAGE_LANG_KEY = 'agrishift_twin_lang';
const STORAGE_DIGIT_KEY = 'agrishift_twin_digits';

interface LanguageContextValue {
  /** 'en' | 'ar' used by Owainat 3D Twin & Telemetry components */
  lang: OwainatLanguage;
  /** 'arz' | 'ar' | 'en' used by AgriShift rotation planner & crop atlas */
  fullLang: AgriLanguage;
  isRtl: boolean;
  setLang: (lang: OwainatLanguage) => void;
  setFullLang: (lang: AgriLanguage) => void;
  toggleLang: () => void;
  digitMode: DigitMode;
  setDigitMode: (mode: DigitMode | ((prev: DigitMode) => DigitMode)) => void;
  t: (typeof owainatTranslations)[OwainatLanguage];
  agriT: (typeof agriTranslations)[AgriLanguage];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLanguage(): AgriLanguage {
  try {
    const saved = window.localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'arz' || saved === 'ar' || saved === 'en') return saved;
  } catch {
    // Ignore storage access failures in restricted environments
  }
  return 'en';
}

function readInitialDigits(lang: AgriLanguage): DigitMode {
  try {
    const saved = window.localStorage.getItem(STORAGE_DIGIT_KEY);
    if (saved === 'western' || saved === 'arabic') return saved;
  } catch {
    // Ignore storage access failures
  }
  return lang === 'en' ? 'western' : 'arabic';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [fullLang, setFullLangState] = useState<AgriLanguage>(readInitialLanguage);
  const [digitMode, setDigitModeState] = useState<DigitMode>(() =>
    readInitialDigits(readInitialLanguage()),
  );

  const owainatLang: OwainatLanguage = fullLang === 'en' ? 'en' : 'ar';
  const isRtl = owainatLang === 'ar';

  const setFullLang = (next: AgriLanguage) => {
    setFullLangState(next);
    setDigitModeState(next === 'en' ? 'western' : 'arabic');
    try {
      window.localStorage.setItem(STORAGE_LANG_KEY, next);
      window.localStorage.setItem(STORAGE_DIGIT_KEY, next === 'en' ? 'western' : 'arabic');
    } catch {
      // Ignore storage failures
    }
  };

  const setLang = (next: OwainatLanguage) => {
    setFullLang(next);
  };

  const setDigitMode = (mode: DigitMode | ((prev: DigitMode) => DigitMode)) => {
    setDigitModeState((prev) => {
      const next = typeof mode === 'function' ? mode(prev) : mode;
      try {
        window.localStorage.setItem(STORAGE_DIGIT_KEY, next);
      } catch {
        // Ignore storage failures
      }
      return next;
    });
  };

  const toggleLang = () => setFullLang(owainatLang === 'en' ? 'ar' : 'en');

  useEffect(() => {
    document.documentElement.lang = fullLang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.title =
      owainatLang === 'ar'
        ? 'AgriShift Twin — خريطة الزراعة الذكية والتوأم الرقمي'
        : 'AgriShift Twin — NASA Earth & Precision Irrigation';
  }, [fullLang, isRtl, owainatLang]);

  return (
    <LanguageContext.Provider
      value={{
        lang: owainatLang,
        fullLang,
        isRtl,
        setLang,
        setFullLang,
        toggleLang,
        digitMode,
        setDigitMode,
        t: owainatTranslations[owainatLang],
        agriT: agriTranslations[fullLang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

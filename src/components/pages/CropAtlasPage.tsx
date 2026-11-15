import React, { useState } from 'react';
import { CheckCircle2, Droplets, ShieldAlert, Sparkles } from 'lucide-react';
import { CROPS_DATABASE, getCropById } from '../../data/cropsDatabase';
import { TRANSLATIONS } from '../../i18n/translations';
import type { DigitMode, EgyptianSeason, Language } from '../../types/agrishift';
import { formatNumber } from '../../utils/formatters';
import { CropArtwork, SeasonArtwork } from '../artwork/CropArtwork';
import { CropCalendarBar, WaterDropMeter } from '../artwork/VisualMeters';

interface CropAtlasPageProps {
  lang: Language;
  digitMode: DigitMode;
}

export const CropAtlasPage: React.FC<CropAtlasPageProps> = ({ lang, digitMode }) => {
  const t = TRANSLATIONS[lang];
  const [seasonFilter, setSeasonFilter] = useState<'all' | EgyptianSeason>('all');
  const [lowWaterOnly, setLowWaterOnly] = useState(false);
  const [saltTolerantOnly, setSaltTolerantOnly] = useState(false);

  const filtered = CROPS_DATABASE.filter((c) => {
    if (seasonFilter !== 'all' && !c.seasons.includes(seasonFilter)) return false;
    if (lowWaterOnly && c.waterNeed !== 'low') return false;
    if (saltTolerantOnly && c.salinityTolerance === 'low') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Visual Season + Trait Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t.cropsPageTitle}</h1>
          <p className="text-sm text-slate-500 font-semibold">{t.cropsPageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: formatNumber(CROPS_DATABASE.length, digitMode, 0) },
              { id: 'winter', label: t.seasonWinter },
              { id: 'summer', label: t.seasonSummer },
              { id: 'nili', label: t.seasonNili },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSeasonFilter(tab.id)}
              className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
                seasonFilter === tab.id
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
              }`}
            >
              {tab.id !== 'all' && <SeasonArtwork season={tab.id} className="w-6 h-6" />}
              <span>{tab.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setLowWaterOnly((v) => !v)}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
              lowWaterOnly
                ? 'bg-sky-700 text-white border-sky-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>{t.lowWaterFilter}</span>
          </button>

          <button
            type="button"
            onClick={() => setSaltTolerantOnly((v) => !v)}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-bold cursor-pointer ${
              saltTolerantOnly
                ? 'bg-teal-700 text-white border-teal-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.salineFilter}</span>
          </button>
        </div>
      </div>

      {/* Visual Crop Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((crop) => (
          <article
            key={crop.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col justify-between gap-4 shadow-2xs"
          >
            <div className="flex items-center gap-4">
              <CropArtwork cropId={crop.id} className="w-20 h-20 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 truncate">
                    {crop.name[lang]}
                  </h2>
                  <WaterDropMeter level={crop.waterNeed} />
                </div>

                <div className="mt-1.5 flex items-center gap-1.5">
                  {crop.seasons.map((s) => (
                    <SeasonArtwork key={s} season={s} className="w-6 h-6" />
                  ))}
                  {crop.waterM3PerFeddanMin && crop.waterM3PerFeddanMax && (
                    <span className="text-xs font-mono font-semibold text-sky-800 tabular-nums">
                      {formatNumber(crop.waterM3PerFeddanMin, digitMode, 0)}–
                      {formatNumber(crop.waterM3PerFeddanMax, digitMode, 0)}{' '}
                      {lang === 'en' ? 'm³' : 'م³'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 12-Month Visual Sowing & Harvest Calendar */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500">{t.sowHarvestBar}</div>
              <CropCalendarBar
                sowMonths={crop.sowMonths}
                harvestMonths={crop.harvestMonths}
                accentHex={crop.accentHex}
                digitMode={digitMode}
              />
            </div>

            {/* Companion Pairing Visuals */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>{t.goodBefore}</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {crop.goodFollowers.slice(0, 3).map((fid) => (
                    <span
                      key={fid}
                      title={getCropById(fid).name[lang]}
                      className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5"
                    >
                      <CropArtwork cropId={fid} className="w-5 h-5" />
                      <span>{getCropById(fid).name[lang]}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1 font-semibold">
                  {crop.id === 'rice' ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{crop.sources[0]}</span>
                </span>
                <span className="text-[11px] font-semibold text-amber-700">
                  {t.expertReviewTag}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

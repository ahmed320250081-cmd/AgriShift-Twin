import React from 'react';
import { ExternalLink, RefreshCw, Satellite, ShieldCheck } from 'lucide-react';
import { VISUAL_MEDIA } from '../../assets/visualMedia';
import { getCropById } from '../../data/cropsDatabase';
import { TRANSLATIONS } from '../../i18n/translations';
import type {
  DigitMode,
  Language,
  NasaTelemetryResponse,
  RotationPlan,
} from '../../types/agrishift';
import { formatNumber } from '../../utils/formatters';
import { CropArtwork, SeasonArtwork } from '../artwork/CropArtwork';
import {
  ClimatologyChart,
  NdviTimeSeriesChart,
  StatusLabel,
  TelemetryVisualDial,
  WaterBalanceChart,
} from '../artwork/VisualMeters';

interface NasaTransparencyPageProps {
  telemetry: NasaTelemetryResponse;
  telemetryLoading: boolean;
  onRefreshTelemetry: () => void;
  plan: RotationPlan;
  lang: Language;
  digitMode: DigitMode;
}

export const NasaTransparencyPage: React.FC<NasaTransparencyPageProps> = ({
  telemetry,
  telemetryLoading,
  onRefreshTelemetry,
  plan,
  lang,
  digitMode,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-6">
      {/* Orbital Satellite Header Card */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-sky-300">
                <Satellite className="w-4 h-4" />
                <span>
                  LAT {telemetry.lat.toFixed(2)} · LON {telemetry.lon.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={onRefreshTelemetry}
                disabled={telemetryLoading}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${telemetryLoading ? 'animate-spin' : ''}`} />
                <span>{t.refreshNasa}</span>
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{t.nasaPageTitle}</h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium">
              {t.nasaPageSubtitle}
            </p>
            <p className="text-xs text-amber-300 font-bold">{t.nasaCaveat}</p>
          </div>
          <div className="lg:col-span-5 min-h-[190px] relative">
            <img
              src={VISUAL_MEDIA.nasaEarthNile}
              alt="NASA Earth observation view of Egypt Nile Delta"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t ltr:lg:bg-gradient-to-r rtl:lg:bg-gradient-to-l from-slate-900/85 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* 4 Telemetry Dials + ET0 & Heat Stress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <TelemetryVisualDial
          kind="rain"
          value={telemetry.summary.seasonalPrecipMm}
          maxValue={60}
          unit="mm"
          label={t.metricRain}
          digitMode={digitMode}
        />
        <TelemetryVisualDial
          kind="heat"
          value={telemetry.summary.avgEt0MmDay}
          maxValue={10}
          unit="mm/d"
          label={t.metricEt0}
          subLabel={`${formatNumber(telemetry.summary.heatStressDays, digitMode, 0)} ${t.metricStressDays}`}
          digitMode={digitMode}
        />
        <TelemetryVisualDial
          kind="soil"
          value={telemetry.summary.avgSoilWetnessPct}
          maxValue={100}
          unit="%"
          label={t.metricSoilWet}
          digitMode={digitMode}
        />
        <TelemetryVisualDial
          kind="ndvi"
          value={telemetry.latestNdvi}
          maxValue={1}
          unit="NDVI"
          label={t.metricNdvi}
          digitMode={digitMode}
          decimals={2}
        />
      </div>

      {/* Charts: NDVI Series, Daily ET0 vs Rain, and 12-Month Climatology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 mb-3">{t.chartNdviTitle}</h2>
          <NdviTimeSeriesChart series={telemetry.ndviSeries} digitMode={digitMode} />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 mb-3">{t.chartWaterTitle}</h2>
          <WaterBalanceChart daily={telemetry.dailyWeather} digitMode={digitMode} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-base font-extrabold text-slate-900 mb-3">{t.climatologyChartTitle}</h2>
        <ClimatologyChart data={telemetry.monthlyClimatology} digitMode={digitMode} />
      </div>

      {/* Per-Source Transparency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {telemetry.sources.map((src) => (
          <div
            key={src.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase font-mono">
                  {src.id.replace('_', ' ')}
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  {src.resolution} · {src.dateRange}
                </p>
              </div>
              <StatusLabel status={src.status} lang={lang} />
            </div>

            <p className="text-sm text-slate-700 font-medium">{src.detail}</p>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              {typeof src.granuleCount === 'number' ? (
                <span className="font-mono font-semibold text-slate-600">
                  Passes indexed: {formatNumber(src.granuleCount, digitMode, 0)}
                </span>
              ) : (
                <span className="text-slate-400">NASA Earthdata</span>
              )}
              <a
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
              >
                <span>Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Engine Rule Trace */}
      {plan.ruleTrace.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-extrabold text-slate-900">{t.ruleTraceTitle}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {plan.ruleTrace.map((trace) => {
              const crop = getCropById(trace.selectedCrop);
              return (
                <div
                  key={trace.season}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SeasonArtwork season={trace.season} className="w-8 h-8" />
                      <CropArtwork cropId={crop.id} className="w-9 h-9" />
                      <span className="font-extrabold text-slate-900">{crop.name[lang]}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      -{formatNumber(trace.rejectedCount, digitMode, 0)}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-600 space-y-1">
                    <div>{trace.appliedRules.join(' · ')}</div>
                    <div className="text-sky-800">{trace.nasaInputsUsed.join(' · ')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

import { AlertTriangle, CheckCircle2, CloudSun, Droplets, Info, Wind } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { translateCrop } from '../i18n/owainatTranslations';
import { FarmPlot, FarmSettings, WeatherAlert, WeatherForecast } from '../types/farm';
import { OWAINAT_CENTER, predictCropYield } from '../utils/agronomy';

interface WeatherScheduleViewProps {
  weather: WeatherForecast;
  alerts: WeatherAlert[];
  plots: FarmPlot[];
  settings: FarmSettings;
  onToggleIrrigation: (plotId: string, nextIrrigating: boolean, nextFlow: number) => void;
}

export function WeatherScheduleView({
  weather,
  alerts,
  plots,
  settings,
  onToggleIrrigation,
}: WeatherScheduleViewProps) {
  const { lang, t } = useLanguage();

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B1117] px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 font-display">
              {t.weather.title}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {t.weather.subtitlePrefix}{' '}
              <span dir="ltr" className="inline-block font-mono">
                {OWAINAT_CENTER.lat.toFixed(4)}° N, {OWAINAT_CENTER.lng.toFixed(4)}° E
              </span>{' '}
              · {t.weather.lockoutSetAt} {settings.evapLockoutTempC}°C.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {t.weather.sourceLabel}:{' '}
            {weather.source === 'open-meteo' ? t.weather.sourceLive : t.weather.sourceFallback}
          </div>
        </div>

        {/* Current Conditions Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#111923] border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.weather.airTemp}</span>
              <CloudSun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            </div>
            <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-100">
              {weather.currentTempC.toFixed(1)} °C
            </div>
            <div className="mt-1 text-xs font-mono text-slate-400 tabular-nums">
              {t.weather.range}: {weather.dailyMinTempC.toFixed(1)}° –{' '}
              {weather.dailyMaxTempC.toFixed(1)}°C
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#111923] border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.weather.windSpeed}</span>
              <Wind className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            </div>
            <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-100">
              {weather.currentWindKmh} km/h
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {weather.currentWindKmh >= 28 ? t.weather.driftCaution : t.weather.lowDrift}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#111923] border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.weather.humidity}</span>
              <Droplets className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-100">
              {weather.currentHumidityPct}%
            </div>
            <div className="mt-1 text-xs text-slate-400">{t.weather.vpdIndex}</div>
          </div>

          <div className="p-4 rounded-lg bg-[#111923] border border-slate-800">
            <div className="text-xs text-slate-400">{t.weather.solar}</div>
            <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-amber-300">
              {weather.currentSolarWm2}
              <span className="text-xs font-normal text-slate-400 ms-1">W/m²</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">{t.weather.solarSub}</div>
          </div>
        </div>

        {/* Weather Alerts List (Non-hue-only: explicit severity icon + text) */}
        <section aria-label={t.weather.alertsSectionAria} className="space-y-3">
          <h2 className="text-base font-semibold text-slate-100">{t.weather.alertsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';
              return (
                <article
                  key={alert.id}
                  className="p-4 rounded-lg bg-[#111923] border border-slate-800 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          isCritical
                            ? 'text-rose-400'
                            : isWarning
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                        }`}
                      >
                        {isCritical ? (
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : isWarning ? (
                          <Info className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>
                          {isCritical
                            ? t.weather.sevCritical
                            : isWarning
                              ? t.weather.sevWarning
                              : t.weather.sevAdvisory}
                        </span>
                      </span>
                      <span dir="ltr" className="font-mono text-slate-300 tabular-nums">
                        {alert.metricValue}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100">{alert.title}</h3>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                    {t.weather.actionWindow}: {alert.actionWindow}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 24-Hour Meteorological & ET0 Profile */}
        <section className="rounded-lg bg-[#111923] border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <h2 className="text-base font-semibold text-slate-100">{t.weather.hourlyTitle}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-slate-800">
            {weather.hourly.slice(0, 8).map((hr) => {
              const lockedOut = hr.tempC >= settings.evapLockoutTempC;
              return (
                <div key={hr.timeIso} className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>{hr.hourLabel}</span>
                    <span className={lockedOut ? 'text-rose-400' : 'text-emerald-400'}>
                      {lockedOut ? t.weather.lockout : t.weather.optimal}
                    </span>
                  </div>
                  <div className="text-base font-semibold font-mono tabular-nums text-slate-100">
                    {hr.tempC.toFixed(1)}°C
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {t.weather.wind} {hr.windKmh} km/h · {t.weather.et0} {hr.et0MmHr.toFixed(2)} mm
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Real-Time Plot Irrigation Operations Queue */}
        <section className="rounded-lg bg-[#111923] border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-base font-semibold text-slate-100">{t.weather.queueTitle}</h2>
            <p className="text-xs text-slate-400">{t.weather.queueSub}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-[#0E151E]">
                  <th className="py-2.5 px-4 text-start">{t.weather.colPlot}</th>
                  <th className="py-2.5 px-3 text-start">{t.weather.colCrop}</th>
                  <th className="py-2.5 px-3 text-end">{t.weather.colRootMoisture}</th>
                  <th className="py-2.5 px-3 text-end">{t.weather.colTarget}</th>
                  <th className="py-2.5 px-3 text-end">{t.weather.colFlow}</th>
                  <th className="py-2.5 px-3 text-start">{t.weather.colGuidance}</th>
                  <th className="py-2.5 px-4 text-end">{t.weather.colPump}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {plots.map((plot) => {
                  const pred = predictCropYield(plot, 1.0, 0, lang);
                  return (
                    <tr key={plot.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-cyan-300">
                        {plot.plotCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {translateCrop(plot.cropType, lang)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-slate-200">
                        {plot.smapRootMoisturePct}%
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-slate-400">
                        {plot.targetMoisturePct}%
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-slate-200">
                        {plot.irrigating ? plot.flowRateM3Hr : 0}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-md">
                        {pred.recommendation}
                      </td>
                      <td className="py-2.5 px-4 text-end">
                        <button
                          type="button"
                          disabled={plot.cropType === 'Fallow'}
                          onClick={() =>
                            onToggleIrrigation(
                              plot.id,
                              !plot.irrigating,
                              Math.round(plot.sustainabilityCapM3Hr * 0.85),
                            )
                          }
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap disabled:opacity-40 ${
                            plot.irrigating
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                              : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                          }`}
                        >
                          {plot.cropType === 'Fallow'
                            ? t.weather.fallow
                            : plot.irrigating
                              ? t.weather.stopPump
                              : t.weather.startPump}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

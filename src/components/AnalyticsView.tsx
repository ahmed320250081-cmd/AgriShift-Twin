import { useMemo, useState } from 'react';
import { Download, FileText, Search, TrendingUp } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { translateCrop, translateOperator } from '../i18n/owainatTranslations';
import {
  AdaptationScenarioParams,
  CropType,
  FarmBoundaryEstimate,
  FarmPlot,
  FarmSettings,
  WeatherAlert,
  WeatherForecast,
} from '../types/farm';
import {
  buildDailyWaterTrends,
  predictCropYield,
  simulateAdaptationScenario,
} from '../utils/agronomy';
import { exportSeasonalCsvReport, exportSeasonalPdfReport } from '../services/reportExport';

interface AnalyticsViewProps {
  plots: FarmPlot[];
  boundary: FarmBoundaryEstimate;
  settings: FarmSettings;
  weather: WeatherForecast;
  alerts: WeatherAlert[];
  onSelectPlotInTwin: (plotId: string) => void;
}

export function AnalyticsView({
  plots,
  boundary,
  settings,
  weather,
  alerts,
  onSelectPlotInTwin,
}: AnalyticsViewProps) {
  const { lang, t } = useLanguage();
  const [cropFilter, setCropFilter] = useState<'All' | CropType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  const [scenario, setScenario] = useState<AdaptationScenarioParams>({
    deficitIrrigationPct: 10,
    nocturnalShiftPct: 75,
    convertAlfalfaToSorghum: false,
  });

  const waterTrends = useMemo(() => buildDailyWaterTrends(plots, lang), [plots, lang]);
  const scenarioResult = useMemo(
    () => simulateAdaptationScenario(plots, scenario),
    [plots, scenario],
  );

  const plotRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return plots
      .map((plot) => ({
        plot,
        prediction: predictCropYield(plot, 1.0, 0, lang),
      }))
      .filter(({ plot }) => {
        if (cropFilter !== 'All' && plot.cropType !== cropFilter) return false;
        if (!q) return true;
        return (
          plot.plotCode.toLowerCase().includes(q) ||
          plot.name.toLowerCase().includes(q) ||
          plot.cropType.toLowerCase().includes(q) ||
          translateCrop(plot.cropType, lang).toLowerCase().includes(q) ||
          plot.assignedOperator.toLowerCase().includes(q) ||
          translateOperator(plot.assignedOperator, lang).toLowerCase().includes(q)
        );
      });
  }, [plots, cropFilter, searchQuery, lang]);

  const totalWaterUsedM3 = plots.reduce((s, p) => s + p.seasonalWaterUsedM3, 0);
  const totalBaselineM3 = plots.reduce((s, p) => s + p.baselineWaterM3, 0);
  const waterSavingsPct = (
    ((totalBaselineM3 - totalWaterUsedM3) / Math.max(1, totalBaselineM3)) *
    100
  ).toFixed(1);
  const avgSmapRoot = (
    plots.reduce((s, p) => s + p.smapRootMoisturePct, 0) / Math.max(1, plots.length)
  ).toFixed(1);
  const avgSalinity = (
    plots.reduce((s, p) => s + p.soilSalinityDsM, 0) / Math.max(1, plots.length)
  ).toFixed(2);

  // SVG chart dimensions
  const chartW = 680;
  const chartH = 220;
  const padL = 56;
  const padR = 20;
  const padT = 18;
  const padB = 30;
  const maxY = Math.max(...waterTrends.map((d) => d.baselineFloodM3)) * 1.08;

  const toX = (idx: number) =>
    padL + (idx / Math.max(1, waterTrends.length - 1)) * (chartW - padL - padR);
  const toY = (val: number) =>
    chartH - padB - (val / Math.max(1, maxY)) * (chartH - padT - padB);

  const extractionPath = waterTrends
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.extractionM3).toFixed(1)}`)
    .join(' ');
  const demandPath = waterTrends
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.cropDemandM3).toFixed(1)}`)
    .join(' ');
  const baselinePath = waterTrends
    .map(
      (d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.baselineFloodM3).toFixed(1)}`,
    )
    .join(' ');

  const hoveredPoint = hoveredDayIdx !== null ? waterTrends[hoveredDayIdx] : waterTrends[waterTrends.length - 1];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B1117] px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Export Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 font-display">
              {t.analytics.title}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {t.analytics.subtitlePrefix} {plots.length} {t.analytics.subtitleSuffix}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => exportSeasonalCsvReport(plots, boundary, settings)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 bg-[#121B26] hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
              <span>{t.analytics.exportCsv}</span>
            </button>
            <button
              type="button"
              onClick={() => exportSeasonalPdfReport(plots, boundary, settings, weather, alerts)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.analytics.exportPdf}</span>
            </button>
          </div>
        </div>

        {/* Estate Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#111923] border border-slate-800">
            <div className="text-xs text-slate-400">{t.analytics.kpiSaved}</div>
            <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-emerald-400">
              -{waterSavingsPct}%
            </div>
            <div className="mt-1 text-xs font-mono text-slate-400 tabular-nums">
              {(totalWaterUsedM3 / 1000).toFixed(0)}k / {(totalBaselineM3 / 1000).toFixed(0)}k m³
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[#111923] border border-slate-800">
            <div className="text-xs text-slate-400">{t.analytics.kpiHarvest}</div>
            <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-100">
              {scenarioResult.baselineTotalYieldTons.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ms-1.5">{t.analytics.tons}</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {t.analytics.acrossCultivated} {boundary.cultivatedAreaHa} {t.analytics.cultivatedHa}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[#111923] border border-slate-800">
            <div className="text-xs text-slate-400">{t.analytics.kpiSmapRoot}</div>
            <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-cyan-300">
              {avgSmapRoot}%
            </div>
            <div className="mt-1 text-xs text-slate-400">{t.analytics.smapSub}</div>
          </div>
          <div className="p-4 rounded-lg bg-[#111923] border border-slate-800">
            <div className="text-xs text-slate-400">{t.analytics.kpiSalinity}</div>
            <div className="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-amber-300">
              {avgSalinity}
              <span className="text-xs font-normal text-slate-400 ms-1.5">dS/m</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">{t.analytics.salinitySub}</div>
          </div>
        </div>

        {/* Main Charts & Predictive Adaptation Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Water Usage Trends Chart */}
          <section className="lg:col-span-7 p-5 rounded-lg bg-[#111923] border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  {t.analytics.chartTitle}
                </h2>
                <p className="text-xs text-slate-400">{t.analytics.chartSub}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
                  {t.analytics.legendExtraction}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                  {t.analytics.legendDemand}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" />
                  {t.analytics.legendUnoptimized}
                </span>
              </div>
            </div>

            <div className="relative" dir="ltr">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-auto overflow-visible select-none"
                role="img"
                aria-label={t.analytics.chartAria}
              >
                {[0.25, 0.5, 0.75, 1.0].map((frac) => {
                  const yVal = Math.round(maxY * frac);
                  const yPos = toY(yVal);
                  return (
                    <g key={frac}>
                      <line
                        x1={padL}
                        x2={chartW - padR}
                        y1={yPos}
                        y2={yPos}
                        stroke="#1e293b"
                        strokeWidth={1}
                      />
                      <text
                        x={padL - 8}
                        y={yPos + 4}
                        textAnchor="end"
                        className="fill-slate-500 text-[10px] font-mono"
                      >
                        {(yVal / 1000).toFixed(0)}k
                      </text>
                    </g>
                  );
                })}

                <path
                  d={baselinePath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={1.75}
                  strokeDasharray="5 4"
                />
                <path d={demandPath} fill="none" stroke="#34d399" strokeWidth={2} />
                <path d={extractionPath} fill="none" stroke="#22d3ee" strokeWidth={2.5} />

                {waterTrends.map((d, idx) => {
                  const cx = toX(idx);
                  const cy = toY(d.extractionM3);
                  const isHovered = hoveredDayIdx === idx;
                  return (
                    <g key={d.dayLabel}>
                      {isHovered && (
                        <line
                          x1={cx}
                          x2={cx}
                          y1={padT}
                          y2={chartH - padB}
                          stroke="#38bdf8"
                          strokeOpacity={0.35}
                          strokeWidth={1}
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 5 : 3.5}
                        fill="#22d3ee"
                        stroke="#0b1117"
                        strokeWidth={1.5}
                      />
                      <text
                        x={cx}
                        y={chartH - 8}
                        textAnchor="middle"
                        className="fill-slate-400 text-[10px] font-mono"
                      >
                        {d.dayLabel}
                      </text>
                      <rect
                        x={cx - 24}
                        y={padT}
                        width={48}
                        height={chartH - padT - padB}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoveredDayIdx(idx)}
                        onMouseLeave={() => setHoveredDayIdx(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums text-slate-300">
                <span>
                  {t.analytics.windowLabel}: {hoveredPoint.dayLabel}
                </span>
                <span>
                  {t.analytics.extractionLabel}: {hoveredPoint.extractionM3.toLocaleString()} m³
                </span>
                <span>
                  {t.analytics.cropEtcLabel}: {hoveredPoint.cropDemandM3.toLocaleString()} m³
                </span>
                <span>
                  {t.analytics.smapAvgLabel}: {hoveredPoint.smapAvgSurface.toFixed(3)} m³/m³
                </span>
              </div>
            </div>
          </section>

          {/* Predictive Crop Yield & Climate Adaptation Simulator */}
          <section className="lg:col-span-5 p-5 rounded-lg bg-[#111923] border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                  <span>{t.analytics.simTitle}</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400">{t.analytics.simSub}</p>

              <div className="mt-4 space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sim-deficit" className="text-slate-300">
                      {t.analytics.simDeficit}
                    </label>
                    <span className="font-mono tabular-nums text-cyan-300">
                      {scenario.deficitIrrigationPct}%
                    </span>
                  </div>
                  <input
                    id="sim-deficit"
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={scenario.deficitIrrigationPct}
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, deficitIrrigationPct: Number(e.target.value) }))
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="sim-nocturnal" className="text-slate-300">
                      {t.analytics.simNocturnal}
                    </label>
                    <span className="font-mono tabular-nums text-emerald-400">
                      {scenario.nocturnalShiftPct}%
                    </span>
                  </div>
                  <input
                    id="sim-nocturnal"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={scenario.nocturnalShiftPct}
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, nocturnalShiftPct: Number(e.target.value) }))
                    }
                    className="w-full accent-emerald-400"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={scenario.convertAlfalfaToSorghum}
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, convertAlfalfaToSorghum: e.target.checked }))
                    }
                    className="rounded border-slate-600 bg-slate-900 accent-cyan-400"
                  />
                  <span>{t.analytics.simRotate}</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-3">
              <div>
                <div className="text-[11px] text-slate-400">{t.analytics.simSaved}</div>
                <div className="mt-0.5 text-lg font-semibold font-mono tabular-nums text-emerald-400">
                  {(scenarioResult.waterSavedM3 / 1000).toFixed(0)}k m³
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  +{scenarioResult.waterSavedPct}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">{t.analytics.simYield}</div>
                <div className="mt-0.5 text-lg font-semibold font-mono tabular-nums text-slate-100">
                  {scenarioResult.projectedTotalYieldTons.toLocaleString()} t
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {scenarioResult.yieldDeltaPct >= 0 ? '+' : ''}
                  {scenarioResult.yieldDeltaPct}% {t.analytics.simDelta}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">{t.analytics.simSustainability}</div>
                <div className="mt-0.5 text-lg font-semibold font-mono tabular-nums text-cyan-300">
                  {scenarioResult.aquiferSustainabilityIndex}/100
                </div>
                <div className="text-[11px] text-slate-400">{t.analytics.simIndex}</div>
              </div>
            </div>
          </section>
        </div>

        {/* Soil Health & Plot Productivity Matrix */}
        <section className="rounded-lg bg-[#111923] border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">{t.analytics.matrixTitle}</h2>
              <p className="text-xs text-slate-400">{t.analytics.matrixSub}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label={t.analytics.searchAria}
                  placeholder={t.analytics.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-8 pe-3 py-1.5 text-xs bg-[#0B1117] text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <select
                aria-label={t.analytics.cropFilterAria}
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value as 'All' | CropType)}
                className="px-3 py-1.5 text-xs bg-[#0B1117] text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="All">{t.analytics.allCrops}</option>
                <option value="Wheat">{translateCrop('Wheat', lang)}</option>
                <option value="Alfalfa">{translateCrop('Alfalfa', lang)}</option>
                <option value="Potato">{translateCrop('Potato', lang)}</option>
                <option value="Barley">{translateCrop('Barley', lang)}</option>
                <option value="Sorghum">{translateCrop('Sorghum', lang)}</option>
                <option value="Fallow">{translateCrop('Fallow', lang)}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-medium text-slate-400 bg-[#0E151E]">
                  <th className="py-2.5 px-4 text-start">{t.analytics.colPlot}</th>
                  <th className="py-2.5 px-3 text-start">{t.analytics.colCrop}</th>
                  <th className="py-2.5 px-3 text-end">{t.analytics.colArea}</th>
                  <th className="py-2.5 px-3 text-end">{t.analytics.colSmapSurf}</th>
                  <th className="py-2.5 px-3 text-end">{t.analytics.colRootZone}</th>
                  <th className="py-2.5 px-3 text-end">{t.analytics.colNdvi}</th>
                  <th className="py-2.5 px-3 text-end">{t.analytics.colSalinity}</th>
                  <th className="py-2.5 px-3 text-end">{t.analytics.colPh}</th>
                  <th className="py-2.5 px-3 text-end">{t.analytics.colOc}</th>
                  <th className="py-2.5 px-3 text-end">{t.analytics.colYield}</th>
                  <th className="py-2.5 px-4 text-end">{t.analytics.colScore}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {plotRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      {t.analytics.noMatches}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setCropFilter('All');
                          setSearchQuery('');
                        }}
                        className="text-cyan-400 underline ms-1"
                      >
                        {t.analytics.resetFilters}
                      </button>
                    </td>
                  </tr>
                ) : (
                  plotRows.map(({ plot, prediction }) => (
                    <tr
                      key={plot.id}
                      onClick={() => onSelectPlotInTwin(plot.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono font-medium text-cyan-300">
                        {plot.plotCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {translateCrop(plot.cropType, lang)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-slate-300">
                        {plot.areaHectares.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-slate-200">
                        {plot.smapSurfaceMoisture.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-emerald-400">
                        {plot.smapRootMoisturePct}%
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-slate-200">
                        {plot.ndvi.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-amber-300">
                        {plot.soilSalinityDsM.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-slate-300">
                        {plot.soilPh.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums text-slate-300">
                        {plot.organicCarbonPct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono tabular-nums font-medium text-slate-100">
                        {prediction.predictedYieldTHa.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-end font-mono tabular-nums text-cyan-300">
                        {prediction.sustainabilityScore}/100
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

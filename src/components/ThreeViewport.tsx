import { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Compass,
  Droplets,
  Languages,
  Layers,
  Lock,
  Pause,
  Play,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  translateCrop,
  translateGrowthStage,
  translateOperator,
} from '../i18n/owainatTranslations';
import { OwainatSceneManager } from '../scene/OwainatSceneManager';
import type { NasaTelemetryResponse } from '../types/agrishift';
import {
  AnalysisLayer,
  CameraPreset,
  CropType,
  FarmBoundaryEstimate,
  FarmPlot,
  UserRole,
} from '../types/farm';
import { getLayerLegend, OWAINAT_CENTER, predictCropYield } from '../utils/agronomy';

interface ThreeViewportProps {
  plots: FarmPlot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  activeLayer: AnalysisLayer;
  onChangeLayer: (layer: AnalysisLayer) => void;
  boundary: FarmBoundaryEstimate;
  effectiveRole: UserRole;
  nasaTelemetry?: NasaTelemetryResponse | null;
  onToggleIrrigation: (plotId: string, nextIrrigating: boolean, nextFlow: number) => void;
  onManagerUpdatePlot: (
    plotId: string,
    updates: {
      cropType: CropType;
      targetMoisturePct: number;
      sustainabilityCapM3Hr: number;
    },
  ) => void;
  onNavigateTab: (tab: 'analytics' | 'weather' | 'access') => void;
  onPlanPlotRotation?: (plot: FarmPlot) => void;
}

const LAYER_IDS: AnalysisLayer[] = [
  'satellite',
  'smap_surface',
  'smap_root',
  'ndvi',
  'thermal_et',
];
const CAMERA_IDS: CameraPreset[] = ['overview', 'flyover', 'nadir', 'focus'];
const CROP_OPTIONS: CropType[] = ['Wheat', 'Alfalfa', 'Potato', 'Barley', 'Sorghum', 'Fallow'];

export function ThreeViewport({
  plots,
  selectedPlotId,
  onSelectPlot,
  activeLayer,
  onChangeLayer,
  boundary,
  effectiveRole,
  nasaTelemetry,
  onToggleIrrigation,
  onManagerUpdatePlot,
  onNavigateTab,
  onPlanPlotRotation,
}: ThreeViewportProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const managerRef = useRef<OwainatSceneManager | null>(null);
  const onSelectPlotRef = useRef(onSelectPlot);
  onSelectPlotRef.current = onSelectPlot;

  const { lang, toggleLang, t } = useLanguage();
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>('overview');
  const [contextLost, setContextLost] = useState(false);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId) ?? plots[0];
  const selectedPrediction = predictCropYield(selectedPlot, 1.0, 0, lang);
  const legend = getLayerLegend(activeLayer, lang);
  const isManager = effectiveRole === 'farm_manager';

  const [flowDraft, setFlowDraft] = useState(selectedPlot.flowRateM3Hr);
  const [cropDraft, setCropDraft] = useState<CropType>(selectedPlot.cropType);
  const [targetMoistureDraft, setTargetMoistureDraft] = useState(selectedPlot.targetMoisturePct);
  const [capDraft, setCapDraft] = useState(selectedPlot.sustainabilityCapM3Hr);

  useEffect(() => {
    setFlowDraft(
      selectedPlot.flowRateM3Hr > 0
        ? selectedPlot.flowRateM3Hr
        : Math.round(selectedPlot.sustainabilityCapM3Hr * 0.85),
    );
    setCropDraft(selectedPlot.cropType);
    setTargetMoistureDraft(selectedPlot.targetMoisturePct);
    setCapDraft(selectedPlot.sustainabilityCapM3Hr);
  }, [
    selectedPlot.id,
    selectedPlot.flowRateM3Hr,
    selectedPlot.cropType,
    selectedPlot.targetMoisturePct,
    selectedPlot.sustainabilityCapM3Hr,
  ]);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const mgr = new OwainatSceneManager(
      mountEl,
      plots,
      (plotId) => onSelectPlotRef.current(plotId),
      (lost) => setContextLost(lost),
    );
    managerRef.current = mgr;

    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      mgr.dispose();
      managerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    managerRef.current?.updatePlots(plots, selectedPlotId);
  }, [plots, selectedPlotId]);

  useEffect(() => {
    managerRef.current?.setAnalysisLayer(activeLayer, plots);
  }, [activeLayer, plots]);

  useEffect(() => {
    managerRef.current?.setShowBoundaries(showBoundaries);
  }, [showBoundaries]);

  useEffect(() => {
    managerRef.current?.setPaused(isPaused);
  }, [isPaused]);

  const handleCameraPreset = (preset: CameraPreset) => {
    setActivePreset(preset);
    managerRef.current?.setCameraPreset(preset, selectedPlot);
  };

  const activePivotCount = plots.filter((p) => p.irrigating).length;
  const totalInstantFlow = plots.reduce((s, p) => s + (p.irrigating ? p.flowRateM3Hr : 0), 0);

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden bg-[#0B1117]">
      {/* Left/Center 3D Stage */}
      <div className="relative flex-1 min-h-[420px] lg:min-h-0 overflow-hidden bg-[#101923]">
        <div
          ref={canvasMountRef}
          dir="ltr"
          data-testid="three-viewport-canvas"
          data-layer={activeLayer}
          data-selected-plot={selectedPlot.plotCode}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {contextLost && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B1117]/95 text-slate-200 p-6 z-20">
            <div className="max-w-md text-center space-y-2">
              <h2 className="text-lg font-semibold">{t.twin.contextLostTitle}</h2>
              <p className="text-sm text-slate-400">{t.twin.contextLostBody}</p>
            </div>
          </div>
        )}

        {/* Top-Start Compact Telemetry & SMAP Colorbar Overlay (No backdrop-blur over WebGL) */}
        <div className="absolute top-4 start-4 z-10 max-w-[460px] bg-[#0B1117]/92 border border-slate-800 rounded-lg px-4 py-3 pointer-events-auto">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-medium text-slate-100 whitespace-nowrap">
              {t.twin.siteName} ·{' '}
              <span dir="ltr" className="inline-block font-mono">
                {OWAINAT_CENTER.lat.toFixed(4)}° N, {OWAINAT_CENTER.lng.toFixed(4)}° E
              </span>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums whitespace-nowrap">
            <span>
              {boundary.cultivatedAreaHa} {t.twin.cultivatedSuffix}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {activePivotCount}/12 {t.twin.pivotsActiveSuffix}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {totalInstantFlow.toLocaleString()} {t.twin.m3Hr}
            </span>
            {nasaTelemetry && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-300">
                  FAO-56 ET₀ {nasaTelemetry.summary.avgEt0MmDay.toFixed(1)} mm/d
                </span>
              </>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
              <span className="font-medium">{legend.title}</span>
              <span className="font-mono text-slate-400">{legend.unit}</span>
            </div>
            <div
              className="h-2 w-full rounded-sm border border-slate-700"
              style={{ background: legend.gradientCss }}
            />
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>{legend.minLabel}</span>
              <span>{legend.midLabel}</span>
              <span>{legend.maxLabel}</span>
            </div>
          </div>
        </div>

        {/* Collapsible Bottom Control Dock (Zero Center Occlusion) */}
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[min(960px,95%)] transition-transform duration-200 ${
            dockCollapsed ? 'translate-y-[calc(100%-34px)]' : 'translate-y-0'
          }`}
        >
          <div className="flex justify-center mb-1.5">
            <button
              type="button"
              onClick={() => setDockCollapsed((v) => !v)}
              aria-expanded={!dockCollapsed}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-slate-200 bg-[#0B1117]/95 border border-slate-700 rounded-t-md hover:text-cyan-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.twin.showControls}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.twin.hideControls}</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#0B1117]/94 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
            {/* NASA SMAP & EO Layer Switcher */}
            <div className="flex items-center gap-1 bg-[#111822] p-1 rounded-lg border border-slate-800 overflow-x-auto">
              <Layers className="w-3.5 h-3.5 text-cyan-400 ms-1.5 me-1 shrink-0" aria-hidden="true" />
              {LAYER_IDS.map((layerId) => (
                <button
                  key={layerId}
                  type="button"
                  onClick={() => onChangeLayer(layerId)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeLayer === layerId
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t.twin.layers[layerId]}
                </button>
              ))}
            </div>

            {/* Camera, Scene & Language Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-[#111822] p-1 rounded-lg border border-slate-800">
                <Compass className="w-3.5 h-3.5 text-slate-400 ms-1.5 me-0.5 shrink-0" aria-hidden="true" />
                {CAMERA_IDS.map((camId) => (
                  <button
                    key={camId}
                    type="button"
                    onClick={() => handleCameraPreset(camId)}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activePreset === camId
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {t.twin.cameras[camId]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowBoundaries((v) => !v)}
                aria-pressed={showBoundaries}
                className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showBoundaries
                    ? 'bg-cyan-950/70 border-cyan-700 text-cyan-300'
                    : 'bg-[#111822] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.twin.boundaries}
              </button>

              <button
                type="button"
                onClick={() => setIsPaused((v) => !v)}
                aria-label={isPaused ? t.twin.resumeAria : t.twin.pauseAria}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg bg-[#111822] border border-slate-800 text-slate-200 hover:border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>{t.twin.run}</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    <span>{t.twin.pause}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleLang}
                aria-label={t.langToggleAria}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg bg-[#111822] border border-slate-800 text-slate-200 hover:border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>{t.langToggleLabel}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right/End Non-Occluding Plot Telemetry & Control Column */}
      <aside
        aria-label={t.twin.asideAria}
        className="w-full lg:w-[370px] shrink-0 bg-[#0E151E] border-t lg:border-t-0 lg:border-s border-slate-800 flex flex-col overflow-y-auto"
      >
        {/* Plot Quick-Selector Strip */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <label htmlFor="plot-selector" className="text-xs font-medium text-slate-400">
              {t.twin.managedPlot}
            </label>
            <span dir="ltr" className="text-xs font-mono text-slate-400 tabular-nums">
              {selectedPlot.center.lat.toFixed(4)}°N, {selectedPlot.center.lng.toFixed(4)}°E
            </span>
          </div>
          <select
            id="plot-selector"
            value={selectedPlot.id}
            onChange={(e) => {
              onSelectPlot(e.target.value);
              const nextPlot = plots.find((p) => p.id === e.target.value);
              if (activePreset === 'focus' && nextPlot) {
                managerRef.current?.setCameraPreset('focus', nextPlot);
              }
            }}
            className="w-full px-3 py-2 text-sm font-medium bg-[#141E2B] text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.plotCode} — {translateCrop(p.cropType, lang)} ({p.areaHectares} {t.twin.ha}) ·{' '}
                {p.irrigating ? t.twin.irrigating : t.twin.idle}
              </option>
            ))}
          </select>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>{translateGrowthStage(selectedPlot.growthStage, lang)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {t.twin.radius} {selectedPlot.radiusMeters} {t.twin.m}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t.twin.opPrefix} {translateOperator(selectedPlot.assignedOperator, lang)}
            </span>
          </div>
          {onPlanPlotRotation && (
            <button
              type="button"
              onClick={() => onPlanPlotRotation(selectedPlot)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {lang === 'ar'
                  ? `تخطيط الدورة الزراعية لـ ${selectedPlot.plotCode}`
                  : `Plan AgriShift Rotation for ${selectedPlot.plotCode}`}
              </span>
            </button>
          )}
        </div>

        {/* NASA SMAP & Agronomy Metrics Grid */}
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xs font-semibold tracking-wide text-slate-300 mb-3">
            {t.twin.telemetryTitle}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[#141E2B] border border-slate-800">
              <div className="text-[11px] text-slate-400">{t.twin.smapSurface}</div>
              <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-cyan-300">
                {selectedPlot.smapSurfaceMoisture.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ms-1">m³/m³</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#141E2B] border border-slate-800">
              <div className="text-[11px] text-slate-400">{t.twin.smapRoot}</div>
              <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-emerald-400">
                {selectedPlot.smapRootMoisturePct}
                <span className="text-xs font-normal text-slate-400 ms-1">%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#141E2B] border border-slate-800">
              <div className="text-[11px] text-slate-400">{t.twin.ndviLabel}</div>
              <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-100">
                {selectedPlot.ndvi.toFixed(2)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#141E2B] border border-slate-800">
              <div className="text-[11px] text-slate-400">{t.twin.predictedYield}</div>
              <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-amber-300">
                {selectedPrediction.predictedYieldTHa.toFixed(1)}
                <span className="text-xs font-normal text-slate-400 ms-1">{t.twin.tHa}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
            <span>
              {t.twin.lst}: {selectedPlot.landSurfaceTempC.toFixed(1)} °C
            </span>
            <span>
              {t.twin.ec}: {selectedPlot.soilSalinityDsM.toFixed(1)} dS/m
            </span>
            <span>
              {t.twin.nozzles}: {selectedPlot.nozzleHealthPct}%
            </span>
          </div>
        </div>

        {/* Real-Time Irrigation Controls (Operator + Manager) */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wide text-slate-300 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
              <span>{t.twin.pivotControlTitle}</span>
            </h2>
            <span
              className={`text-xs font-medium ${
                selectedPlot.irrigating ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {selectedPlot.irrigating ? t.twin.activeFlow : t.twin.standby}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label htmlFor="flow-rate-slider" className="text-slate-400">
                {t.twin.wellheadFlow} ({t.twin.cap} {selectedPlot.sustainabilityCapM3Hr}{' '}
                {t.twin.m3Hr})
              </label>
              <span className="font-mono tabular-nums text-slate-200">
                {flowDraft} {t.twin.m3Hr}
              </span>
            </div>
            <input
              id="flow-rate-slider"
              type="range"
              min={80}
              max={selectedPlot.sustainabilityCapM3Hr}
              step={5}
              value={Math.min(flowDraft, selectedPlot.sustainabilityCapM3Hr)}
              disabled={selectedPlot.cropType === 'Fallow'}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFlowDraft(val);
                if (selectedPlot.irrigating) {
                  onToggleIrrigation(selectedPlot.id, true, val);
                }
              }}
              className="w-full accent-cyan-400"
            />
          </div>

          <button
            type="button"
            disabled={selectedPlot.cropType === 'Fallow'}
            onClick={() =>
              onToggleIrrigation(
                selectedPlot.id,
                !selectedPlot.irrigating,
                flowDraft || Math.round(selectedPlot.sustainabilityCapM3Hr * 0.8),
              )
            }
            className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
              selectedPlot.irrigating
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
            }`}
          >
            {selectedPlot.cropType === 'Fallow'
              ? t.twin.plotFallow
              : selectedPlot.irrigating
                ? `${t.twin.stopIrrigation} (${selectedPlot.plotCode})`
                : `${t.twin.startIrrigation} (${selectedPlot.plotCode})`}
          </button>
        </div>

        {/* Manager-Only Agronomic Policy & Boundary Summary */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wide text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>{t.twin.plotGovernance}</span>
            </h2>
            {!isManager && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                <Lock className="w-3 h-3" aria-hidden="true" />
                <span>{t.twin.managerOnly}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="crop-assign" className="block text-[11px] text-slate-400 mb-1">
                {t.twin.assignedCrop}
              </label>
              <select
                id="crop-assign"
                value={cropDraft}
                disabled={!isManager}
                onChange={(e) => setCropDraft(e.target.value as CropType)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#141E2B] text-slate-100 border border-slate-700 rounded-md disabled:opacity-50"
              >
                {CROP_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {translateCrop(c, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="target-moisture" className="block text-[11px] text-slate-400 mb-1">
                {t.twin.targetMoisture}
              </label>
              <input
                id="target-moisture"
                type="number"
                min={15}
                max={85}
                value={targetMoistureDraft}
                disabled={!isManager}
                onChange={(e) => setTargetMoistureDraft(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#141E2B] text-slate-100 border border-slate-700 rounded-md disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <label htmlFor="cap-input">{t.twin.aquiferCapLabel}</label>
              <span className="font-mono text-slate-300">
                {capDraft} {t.twin.m3Hr}
              </span>
            </div>
            <input
              id="cap-input"
              type="range"
              min={150}
              max={340}
              step={5}
              value={capDraft}
              disabled={!isManager}
              onChange={(e) => setCapDraft(Number(e.target.value))}
              className="w-full accent-emerald-400 disabled:opacity-50"
            />
          </div>

          {isManager ? (
            <button
              type="button"
              onClick={() =>
                onManagerUpdatePlot(selectedPlot.id, {
                  cropType: cropDraft,
                  targetMoisturePct: targetMoistureDraft,
                  sustainabilityCapM3Hr: capDraft,
                })
              }
              className="w-full py-2 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {t.twin.applyPolicy} {selectedPlot.plotCode}
            </button>
          ) : (
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.twin.operatorNoticePrefix}{' '}
              <button
                type="button"
                onClick={() => onNavigateTab('access')}
                className="text-cyan-400 underline hover:text-cyan-300 cursor-pointer"
              >
                {t.tabs.access}
              </button>{' '}
              {t.twin.operatorNoticeSuffix}
            </p>
          )}

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-medium text-slate-300">{t.twin.concessionBounds}</div>
            <div dir="ltr" className="font-mono tabular-nums">
              {boundary.boundingBox.minLat.toFixed(4)}°–{boundary.boundingBox.maxLat.toFixed(4)}° N ·{' '}
              {boundary.boundingBox.minLng.toFixed(4)}°–{boundary.boundingBox.maxLng.toFixed(4)}° E
            </div>
            <div>
              {boundary.totalConcessionAreaHa} {t.twin.parcel} · {boundary.perimeterKm}{' '}
              {t.twin.perimeter}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  Calendar,
  CheckCircle2,
  Droplets,
  Flame,
  Leaf,
  MapPin,
  Printer,
  RefreshCw,
  Satellite,
  ShieldAlert,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { VISUAL_MEDIA } from '../../assets/visualMedia';
import { CROPS_DATABASE, getCropById } from '../../data/cropsDatabase';
import { EGYPTIAN_SEASONS, EGYPT_POLICY_RULES } from '../../data/policyRules';
import { findGovernorateById } from '../../data/egyptGovernorates';
import { TRANSLATIONS } from '../../i18n/translations';
import type {
  CropId,
  DigitMode,
  EgyptianSeason,
  FarmProfile,
  FieldPolygonPoint,
  IrrigationMethod,
  Language,
  NasaTelemetryResponse,
  ReasonBadgeKey,
  RotationPlan,
  RotationStrategyId,
  SalinityLevel,
  SavedPlot,
  SoilType,
  WaterSource,
} from '../../types/agrishift';
import { formatFeddanLabel, formatNumber } from '../../utils/formatters';
import {
  CropArtwork,
  IrrigationArtwork,
  SalinityArtwork,
  SeasonArtwork,
  SoilArtwork,
  StrategyArtwork,
  WaterSourceArtwork,
} from '../artwork/CropArtwork';
import {
  CropCalendarBar,
  NasaSourceChip,
  StrategyComparisonBars,
  TelemetryVisualDial,
  WaterDropMeter,
} from '../artwork/VisualMeters';
import { AttractiveFarmMap } from '../map/AttractiveFarmMap';

interface FarmerPictureFlowProps {
  step: number;
  setStep: (step: number) => void;
  farm: FarmProfile;
  setFarm: React.Dispatch<React.SetStateAction<FarmProfile>>;
  telemetry: NasaTelemetryResponse;
  telemetryLoading: boolean;
  onRefreshTelemetry: () => void;
  plans: Record<RotationStrategyId, RotationPlan>;
  activeStrategy: RotationStrategyId;
  setActiveStrategy: (s: RotationStrategyId) => void;
  savedPlots: SavedPlot[];
  onSavePlot: () => void;
  onLoadPlot: (plot: SavedPlot) => void;
  onDeletePlot: (id: string) => void;
  lang: Language;
  digitMode: DigitMode;
  onReset: () => void;
}

export const FarmerPictureFlow: React.FC<FarmerPictureFlowProps> = ({
  step,
  setStep,
  farm,
  setFarm,
  telemetry,
  telemetryLoading,
  onRefreshTelemetry,
  plans,
  activeStrategy,
  setActiveStrategy,
  savedPlots,
  onSavePlot,
  onLoadPlot,
  onDeletePlot,
  lang,
  digitMode,
  onReset,
}) => {
  const t = TRANSLATIONS[lang];
  const isRtl = lang !== 'en';
  const [swappedCrops, setSwappedCrops] = useState<Partial<Record<EgyptianSeason, CropId>>>({});
  const [justSaved, setJustSaved] = useState(false);

  const activePlan = plans[activeStrategy];
  const currentGov = findGovernorateById(farm.governorateId);
  const powerSource = telemetry.sources.find((s) => s.id === 'power');
  const modisSource = telemetry.sources.find((s) => s.id === 'modis_ndvi');
  const gibsSource = telemetry.sources.find((s) => s.id === 'gibs');

  const handleSelectLocation = (
    lat: number,
    lon: number,
    governorateId: string,
    polygon?: FieldPolygonPoint[],
    areaFeddans?: number
  ) => {
    setFarm((prev) => ({
      ...prev,
      lat,
      lon,
      governorateId,
      polygon: polygon ?? prev.polygon,
      areaFeddans: areaFeddans ?? prev.areaFeddans,
    }));
  };

  const togglePreferredCrop = (cropId: CropId) => {
    setFarm((prev) => {
      const exists = prev.preferredCrops.includes(cropId);
      const next = exists
        ? prev.preferredCrops.filter((c) => c !== cropId)
        : [...prev.preferredCrops, cropId];
      return {
        ...prev,
        undecidedCrop: false,
        preferredCrops: next,
      };
    });
  };

  const totalAnnualWaterM3 = activePlan.seasons.reduce((acc, rec) => {
    const cid = swappedCrops[rec.season] ?? rec.cropId;
    const crop = getCropById(cid);
    const avg =
      crop.waterM3PerFeddanMin && crop.waterM3PerFeddanMax
        ? (crop.waterM3PerFeddanMin + crop.waterM3PerFeddanMax) / 2
        : 2000;
    return acc + avg * farm.areaFeddans;
  }, 0);

  const reasonLabel = (key: ReasonBadgeKey): { text: string; icon: React.ReactNode } => {
    switch (key) {
      case 'nitrogen_fixer':
        return { text: t.reasonNitrogen, icon: <Sprout className="w-3.5 h-3.5 text-emerald-700" /> };
      case 'good_sequence':
        return { text: t.reasonSequence, icon: <RefreshCw className="w-3.5 h-3.5 text-sky-700" /> };
      case 'water_saver':
        return { text: t.reasonWaterSaver, icon: <Droplets className="w-3.5 h-3.5 text-sky-700" /> };
      case 'heat_tolerant':
        return { text: t.reasonHeatTolerant, icon: <Flame className="w-3.5 h-3.5 text-amber-600" /> };
      case 'salinity_safe':
        return { text: t.reasonSalinitySafe, icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" /> };
      case 'soil_match':
        return { text: t.reasonSoilMatch, icon: <Leaf className="w-3.5 h-3.5 text-emerald-700" /> };
      case 'nasa_moisture_fit':
        return { text: t.reasonMoistureFit, icon: <Satellite className="w-3.5 h-3.5 text-sky-700" /> };
      case 'policy_check':
        return { text: t.reasonPolicyCheck, icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-700" /> };
    }
  };

  const stepItems = [
    { idx: 1, label: t.stepLocation, icon: MapPin },
    { idx: 2, label: t.stepCrops, icon: Sprout },
    { idx: 3, label: t.stepWaterSoil, icon: Droplets },
    { idx: 4, label: t.stepResult, icon: Calendar },
  ];

  const NextArrow = isRtl ? ArrowLeft : ArrowRight;
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const handleSaveCurrent = () => {
    onSavePlot();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Hero Banner on Step 1 */}
      {step === 1 && (
        <section className="relative overflow-hidden rounded-3xl border border-emerald-900/15 bg-slate-900 text-white shadow-lg no-print">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6 z-10">
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-snug max-w-xl">
                  {t.heroTitle}
                </h1>
                <p className="mt-2 text-emerald-100/90 text-base sm:text-lg font-semibold">
                  {t.heroSubtitle}
                </p>
              </div>

              {/* 3-Picture Visual Journey Strip */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  { num: 1, title: t.heroStep1, icon: MapPin, color: 'bg-emerald-500/20 border-emerald-400/40' },
                  { num: 2, title: t.heroStep2, icon: Sprout, color: 'bg-amber-500/20 border-amber-400/40' },
                  { num: 3, title: t.heroStep3, icon: Calendar, color: 'bg-sky-500/20 border-sky-400/40' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.num}
                      className={`rounded-2xl border ${item.color} p-3 flex flex-col items-center text-center gap-1.5 backdrop-blur-sm`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold leading-tight">
                        {item.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[210px] lg:min-h-full">
              <img
                src={VISUAL_MEDIA.heroNileDelta}
                alt={t.heroTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t ltr:lg:bg-gradient-to-r rtl:lg:bg-gradient-to-l from-slate-900/85 via-slate-900/20 to-transparent" />
            </div>
          </div>
        </section>
      )}

      {/* Saved Fields Quick Strip (if any saved) */}
      {savedPlots.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-print">
          <span className="text-xs font-extrabold text-slate-500 shrink-0">{t.savedPlots}:</span>
          {savedPlots.map((plot) => (
            <div
              key={plot.id}
              className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1 shrink-0"
            >
              <button
                type="button"
                onClick={() => onLoadPlot(plot)}
                className="text-xs font-extrabold text-emerald-900 hover:underline cursor-pointer whitespace-nowrap"
              >
                {plot.label}
              </button>
              <button
                type="button"
                onClick={() => onDeletePlot(plot.id)}
                className="text-emerald-700 hover:text-rose-700 px-1 text-xs font-bold cursor-pointer"
                aria-label={`Delete ${plot.label}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Visual Step Progress Tabs */}
      <nav aria-label="Steps" className="grid grid-cols-4 gap-2 sm:gap-3 no-print">
        {stepItems.map((s) => {
          const Icon = s.icon;
          const active = step === s.idx;
          const done = step > s.idx;
          return (
            <button
              key={s.idx}
              type="button"
              onClick={() => setStep(s.idx)}
              className={`min-h-[56px] flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 p-2.5 sm:px-4 rounded-2xl border font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                active
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
                  : done
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </nav>

      {/* STEP 1: LOCATION & ATTRACTIVE MAP */}
      {step === 1 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {t.stepLocation}
                </h2>
                <p className="text-sm font-semibold text-emerald-700">
                  {currentGov.name[lang]} · {formatFeddanLabel(farm.areaFeddans, lang, digitMode)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span>{t.nextBtn}</span>
              <NextArrow className="w-5 h-5" />
            </button>
          </div>

          <AttractiveFarmMap
            lat={farm.lat}
            lon={farm.lon}
            governorateId={farm.governorateId}
            polygon={farm.polygon}
            areaFeddans={farm.areaFeddans}
            lang={lang}
            digitMode={digitMode}
            gibsSource={gibsSource}
            onSelectLocation={handleSelectLocation}
          />
        </section>
      )}

      {/* STEP 2: VISUAL CROP PICTURE GRID + LAST CROP PICKER */}
      {step === 2 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={VISUAL_MEDIA.egyptWheatHarvest}
                alt={t.stepCrops}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {t.stepCrops}
                </h2>
                <p className="text-sm text-slate-500 font-semibold">{t.pickCropsHint}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[48px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer"
              >
                <BackArrow className="w-4 h-4" />
                <span>{t.backBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="min-h-[48px] inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base shadow-sm cursor-pointer"
              >
                <span>{t.nextBtn}</span>
                <NextArrow className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Last Crop Visual Selector (feeds avoidContinuousYears & goodFollowers) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="text-sm font-extrabold text-amber-950">{t.lastCropQuestion}</div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFarm((p) => ({ ...p, lastCrop: null }))}
                className={`min-h-[44px] shrink-0 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                  farm.lastCrop === null
                    ? 'bg-amber-700 text-white border-amber-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                {t.noneLabel}
              </button>
              {CROPS_DATABASE.map((crop) => {
                const isLast = farm.lastCrop === crop.id;
                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setFarm((p) => ({ ...p, lastCrop: isLast ? null : crop.id }))}
                    className={`min-h-[44px] shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold cursor-pointer ${
                      isLast
                        ? 'bg-amber-700 text-white border-amber-800 shadow-2xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <CropArtwork cropId={crop.id} className="w-7 h-7" />
                    <span>{crop.name[lang]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Preferred Crops Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Undecided Visual Card */}
            <button
              type="button"
              onClick={() =>
                setFarm((prev) => ({
                  ...prev,
                  undecidedCrop: true,
                  preferredCrops: [],
                }))
              }
              className={`min-h-[156px] p-3 rounded-3xl border-2 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                farm.undecidedCrop
                  ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30 shadow-md'
                  : 'border-dashed border-slate-300 bg-slate-50/70 hover:border-emerald-400'
              }`}
            >
              <CropArtwork cropId="undecided" className="w-20 h-20" />
              <span className="text-base font-extrabold text-slate-900">{t.undecidedCrop}</span>
            </button>

            {CROPS_DATABASE.map((crop) => {
              const selected = !farm.undecidedCrop && farm.preferredCrops.includes(crop.id);
              return (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => togglePreferredCrop(crop.id)}
                  className={`relative min-h-[156px] p-3 rounded-3xl border-2 flex flex-col items-center justify-between text-center gap-2 transition-all cursor-pointer ${
                    selected
                      ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/30 shadow-md'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <SeasonArtwork season={crop.seasons[0]} className="w-7 h-7" />
                    <WaterDropMeter level={crop.waterNeed} />
                  </div>
                  <CropArtwork cropId={crop.id} className="w-20 h-20" />
                  <span className="text-base font-extrabold text-slate-900">
                    {crop.name[lang]}
                  </span>
                  {selected && (
                    <span className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* STEP 3: WATER & SOIL PICTURE CARDS */}
      {step === 3 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={VISUAL_MEDIA.egyptDripIrrigation}
                alt={t.stepWaterSoil}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
              />
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {t.stepWaterSoil}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[48px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer"
              >
                <BackArrow className="w-4 h-4" />
                <span>{t.backBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="min-h-[48px] inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base shadow-sm cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t.showPlanBtn}</span>
              </button>
            </div>
          </div>

          {/* 1. Irrigation Method */}
          <div className="space-y-2.5">
            <h3 className="text-base font-extrabold text-slate-800">{t.irrigationMethod}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  { id: 'flood', label: t.flood },
                  { id: 'drip', label: t.drip },
                  { id: 'sprinkler', label: t.sprinkler },
                  { id: 'pivot', label: t.pivot },
                ] as { id: IrrigationMethod; label: string }[]
              ).map((item) => {
                const active = farm.irrigationMethod === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFarm((p) => ({ ...p, irrigationMethod: item.id }))}
                    className={`min-h-[120px] p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      active
                        ? 'border-sky-600 bg-sky-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-sky-300'
                    }`}
                  >
                    <IrrigationArtwork method={item.id} className="w-16 h-16" />
                    <span className="text-base font-extrabold text-slate-900">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Water Source + 3. Soil Type + 4. Salinity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Water Source */}
            <div className="space-y-2.5">
              <h3 className="text-base font-extrabold text-slate-800">{t.waterSource}</h3>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: 'canal', label: t.canal },
                    { id: 'groundwater', label: t.groundwater },
                  ] as { id: WaterSource; label: string }[]
                ).map((item) => {
                  const active = farm.waterSource === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFarm((p) => ({ ...p, waterSource: item.id }))}
                      className={`min-h-[112px] p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        active
                          ? 'border-sky-600 bg-sky-50'
                          : 'border-slate-200 bg-white hover:border-sky-300'
                      }`}
                    >
                      <WaterSourceArtwork source={item.id} className="w-14 h-14" />
                      <span className="text-sm font-extrabold text-slate-900">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Soil Type */}
            <div className="space-y-2.5">
              <h3 className="text-base font-extrabold text-slate-800">{t.soilType}</h3>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'clay', label: t.clay },
                    { id: 'loamy', label: t.loamy },
                    { id: 'sandy', label: t.sandy },
                  ] as { id: SoilType; label: string }[]
                ).map((item) => {
                  const active = farm.soilType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFarm((p) => ({ ...p, soilType: item.id }))}
                      className={`min-h-[112px] p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        active
                          ? 'border-amber-600 bg-amber-50'
                          : 'border-slate-200 bg-white hover:border-amber-300'
                      }`}
                    >
                      <SoilArtwork soil={item.id} className="w-12 h-12" />
                      <span className="text-sm font-extrabold text-slate-900">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Salinity Level */}
            <div className="space-y-2.5">
              <h3 className="text-base font-extrabold text-slate-800">{t.salinityLevel}</h3>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'fresh', label: t.fresh },
                    { id: 'moderate', label: t.moderate },
                    { id: 'saline', label: t.saline },
                  ] as { id: SalinityLevel; label: string }[]
                ).map((item) => {
                  const active = farm.salinityLevel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFarm((p) => ({ ...p, salinityLevel: item.id }))}
                      className={`min-h-[112px] p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        active
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-slate-200 bg-white hover:border-teal-300'
                      }`}
                    >
                      <SalinityArtwork level={item.id} className="w-12 h-12" />
                      <span className="text-sm font-extrabold text-slate-900">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 4: VISUAL 3-SEASON ROTATION PLAN + COMPARISON + TOTAL WATER */}
      {step === 4 && (
        <div className="space-y-5">
          {/* Honest Satellite Data Banner + Refresh Button */}
          <div
            className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold ${
              telemetry.dataSource === 'demo'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : telemetry.dataSource === 'partial'
                ? 'bg-sky-50 border-sky-300 text-sky-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {telemetry.dataSource === 'demo' ? (
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              ) : (
                <Satellite className="w-5 h-5 text-emerald-700 shrink-0" />
              )}
              <span>
                {telemetryLoading
                  ? '...'
                  : telemetry.dataSource === 'demo'
                  ? t.demoBanner
                  : telemetry.dataSource === 'partial'
                  ? t.partialBanner
                  : t.liveBanner}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-700">
                {currentGov.name[lang]} · {formatFeddanLabel(farm.areaFeddans, lang, digitMode)}
              </span>
              <button
                type="button"
                onClick={onRefreshTelemetry}
                disabled={telemetryLoading}
                className="no-print min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/90 border border-slate-300 hover:bg-white text-xs font-bold text-slate-800 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${telemetryLoading ? 'animate-spin' : ''}`} />
                <span>{t.refreshNasa}</span>
              </button>
            </div>
          </div>

          {/* Strategy Visual Switcher */}
          <div className="grid grid-cols-3 gap-3 no-print">
            {(
              [
                { id: 'balanced', label: t.strategyBalanced },
                { id: 'water_saving', label: t.strategyWater },
                { id: 'soil_health', label: t.strategySoil },
              ] as { id: RotationStrategyId; label: string }[]
            ).map((st) => {
              const active = activeStrategy === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setActiveStrategy(st.id);
                    setSwappedCrops({});
                  }}
                  className={`min-h-[76px] p-3 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 cursor-pointer transition-all ${
                    active
                      ? 'border-emerald-700 bg-emerald-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <StrategyArtwork strategy={st.id} className="w-11 h-11 shrink-0" />
                  <span className="text-sm sm:text-base font-extrabold text-slate-900">
                    {st.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3-Season Visual Timeline Cards */}
          <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {t.planTitle}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  {t.decisionSupportNote}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 no-print">
                {/* Total Field Annual Water Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs sm:text-sm font-extrabold tabular-nums">
                  <Droplets className="w-4 h-4 text-sky-700" />
                  <span>{t.totalWaterNeeded}:</span>
                  <span dir="ltr">
                    {formatNumber(totalAnnualWaterM3, digitMode, 0)} {lang === 'en' ? 'm³' : 'م³'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCurrent}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
                >
                  {justSaved ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <BookmarkPlus className="w-4 h-4" />
                  )}
                  <span>{justSaved ? t.plotSavedMsg : t.savePlot}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.printPlan}</span>
                </button>

                <button
                  type="button"
                  onClick={onReset}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.restartBtn}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activePlan.seasons.map((rec) => {
                const seasonCfg = EGYPTIAN_SEASONS.find((s) => s.id === rec.season)!;
                const displayCropId = swappedCrops[rec.season] ?? rec.cropId;
                const crop = getCropById(displayCropId);

                return (
                  <div
                    key={rec.season}
                    className="rounded-3xl border-2 border-slate-200 bg-[#FCFBF8] p-4 flex flex-col justify-between gap-4"
                  >
                    {/* Top Season Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <SeasonArtwork season={rec.season} className="w-10 h-10" />
                        <div>
                          <div className="text-base font-extrabold text-slate-900">
                            {seasonCfg.name[lang]}
                          </div>
                          <div className="text-xs font-semibold text-slate-500">
                            {seasonCfg.monthsLabel[lang]}
                          </div>
                        </div>
                      </div>
                      <WaterDropMeter level={crop.waterNeed} />
                    </div>

                    {/* Central Crop Artwork */}
                    <div className="flex flex-col items-center text-center py-1">
                      <CropArtwork cropId={crop.id} className="w-28 h-28" />
                      <h3 className="mt-2 text-2xl font-extrabold text-slate-900">
                        {crop.name[lang]}
                      </h3>
                      {crop.waterM3PerFeddanMin && crop.waterM3PerFeddanMax && (
                        <div className="mt-1 text-xs font-mono font-semibold text-sky-800 tabular-nums">
                          {formatNumber(crop.waterM3PerFeddanMin, digitMode, 0)}–
                          {formatNumber(crop.waterM3PerFeddanMax, digitMode, 0)}{' '}
                          {lang === 'en' ? 'm³' : 'م³'} / {t.feddanUnit}
                        </div>
                      )}
                    </div>

                    {/* 12-Month Visual Sowing & Harvest Calendar Bar */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-500">{t.sowHarvestBar}</div>
                      <CropCalendarBar
                        sowMonths={crop.sowMonths}
                        harvestMonths={crop.harvestMonths}
                        accentHex={crop.accentHex}
                        digitMode={digitMode}
                      />
                    </div>

                    {/* Visual Reason Tags */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {rec.reasons.map((rKey) => {
                        const info = reasonLabel(rKey);
                        return (
                          <span
                            key={rKey}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                          >
                            {info.icon}
                            <span>{info.text}</span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Policy Caution for Rice */}
                    {crop.id === 'rice' && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold">
                        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>{EGYPT_POLICY_RULES[0].cautionNote[lang]}</span>
                      </div>
                    )}

                    {/* NASA Evidence Chips */}
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500">{t.basedOnNasa}</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <NasaSourceChip source={powerSource} label="NASA POWER" lang={lang} />
                        <NasaSourceChip source={modisSource} label="MODIS NDVI" lang={lang} />
                      </div>
                    </div>

                    {/* One-Tap Visual Alternatives */}
                    {rec.alternatives.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 no-print">
                        <div className="text-xs font-bold text-slate-500 mb-2">
                          {t.alternativesTitle}
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto">
                          {rec.alternatives.map((altId) => {
                            const alt = getCropById(altId);
                            const isSwapped = displayCropId === altId;
                            return (
                              <button
                                key={altId}
                                type="button"
                                onClick={() =>
                                  setSwappedCrops((prev) => ({
                                    ...prev,
                                    [rec.season]: isSwapped ? rec.cropId : altId,
                                  }))
                                }
                                className={`min-h-[44px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer whitespace-nowrap ${
                                  isSwapped
                                    ? 'bg-emerald-700 text-white border-emerald-800'
                                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400'
                                }`}
                              >
                                <CropArtwork cropId={altId} className="w-7 h-7" />
                                <span>{alt.name[lang]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Visual Strategy Comparison Bars */}
            <StrategyComparisonBars
              plans={plans}
              activeStrategy={activeStrategy}
              onSelectStrategy={(s) => {
                setActiveStrategy(s);
                setSwappedCrops({});
              }}
              lang={lang}
              digitMode={digitMode}
            />

            {/* 4 Visual NASA Dials Right Below Plan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
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
                value={telemetry.summary.avgTMaxC}
                maxValue={48}
                unit="°C"
                label={t.metricHeat}
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
                subLabel={
                  telemetry.ndviTrend === 'rising'
                    ? t.ndviTrendRising
                    : telemetry.ndviTrend === 'falling'
                    ? t.ndviTrendFalling
                    : t.ndviTrendStable
                }
                digitMode={digitMode}
                decimals={2}
              />
            </div>

            {/* Plain-language satellite scale caveat */}
            <p className="text-xs font-semibold text-slate-500 text-center pt-1">
              {t.nasaCaveat}
            </p>
          </section>
        </div>
      )}
    </div>
  );
};

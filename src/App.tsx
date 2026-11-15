import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { BookOpen, Calendar, CloudSun, Compass, Globe, Map as MapIcon, Satellite, TrendingUp } from 'lucide-react';
import { AccessLogsView } from './components/AccessLogsView';
import { AnalyticsView } from './components/AnalyticsView';
import { FarmerPictureFlow } from './components/flow/FarmerPictureFlow';
import { CropAtlasPage } from './components/pages/CropAtlasPage';
import { NasaTransparencyPage } from './components/pages/NasaTransparencyPage';
import { SatelliteExplorerPage } from './components/pages/SatelliteExplorerPage';
import { ThreeViewport } from './components/ThreeViewport';
import { TopBar } from './components/TopBar';
import { WeatherScheduleView } from './components/WeatherScheduleView';
import { findGovernorateById } from './data/egyptGovernorates';
import { generateAllStrategyPlans } from './engine/rotationEngine';
import { useLanguage } from './i18n/LanguageContext';
import {
  ensureUserProfile,
  listTeamUsersForManager,
  persistFarmSettings,
  persistFieldLog,
  persistManagerPlotConfig,
  persistOperatorIrrigationChange,
  seedPlotsIfManager,
  signInWithGoogleAccount,
  signOutAccount,
  subscribeFieldLogs,
  subscribePlotsSync,
  subscribeToAuth,
  updateMemberRoleByManager,
} from './services/firebaseService';
import { fetchOwainatWeather } from './services/weatherService';
import type {
  CropId,
  FarmProfile,
  Language as AgriLanguage,
  NasaTelemetryResponse,
  RotationStrategyId,
  SavedPlot,
} from './types/agrishift';
import type {
  AnalysisLayer,
  CropType,
  FarmPlot,
  FarmSettings,
  FieldLogEntry,
  UserProfile,
  UserRole,
  WeatherForecast,
  WorkspaceTab,
} from './types/farm';
import {
  CROP_SPECS,
  createInitialPlots,
  estimateFarmBoundaries,
  generateWeatherAlerts,
  INITIAL_FARM_SETTINGS,
} from './utils/agronomy';
import { formatFeddanLabel } from './utils/formatters';
import {
  getDefaultFarmProfile,
  loadCachedTelemetry,
  loadSavedFarm,
  loadSavedPlots,
  saveCachedTelemetry,
  saveFarm,
  savePlots,
} from './utils/storage';

const FALLBACK_INITIAL_TELEMETRY: NasaTelemetryResponse = {
  lat: 22.5833,
  lon: 28.6667,
  fetchedAt: new Date().toISOString(),
  cached: false,
  dataSource: 'demo',
  ndviTrend: 'stable',
  latestNdvi: 0.61,
  ndviSeries: [
    { date: '2026-08-15', ndvi: 0.56, quality: 'estimated' },
    { date: '2026-09-01', ndvi: 0.58, quality: 'estimated' },
    { date: '2026-09-17', ndvi: 0.6, quality: 'estimated' },
    { date: '2026-10-03', ndvi: 0.61, quality: 'estimated' },
  ],
  dailyWeather: Array.from({ length: 10 }, (_, idx) => ({
    date: `2026-10-${String(idx + 1).padStart(2, '0')}`,
    tMaxC: Number((27.8 + Math.sin(idx) * 1.1).toFixed(1)),
    tMinC: Number((15.8 + Math.cos(idx) * 0.7).toFixed(1)),
    precipMm: idx === 3 ? 2.1 : idx === 7 ? 1.4 : 0,
    solarMJm2: 19.6,
    wind2mMs: 2.3,
    rhPct: 58,
    soilWetnessPct: 49,
    et0Mm: Number((4.1 + Math.sin(idx) * 0.4).toFixed(2)),
  })),
  monthlyClimatology: [19.5, 21, 24.5, 29, 33, 35.5, 36, 35.8, 33.5, 30, 25.5, 21].map((t, i) => ({
    month: i + 1,
    tMaxC: t,
    precipMm: [18, 12, 8, 2, 0.5, 0, 0, 0, 0.2, 4, 10, 16][i],
  })),
  summary: {
    avgEt0MmDay: 4.3,
    seasonalEt0Mm: 129,
    seasonalPrecipMm: 4.8,
    irrigationNeedMm: 125,
    heatStressDays: 0,
    avgTMaxC: 28.5,
    avgTMinC: 16.2,
    avgSoilWetnessPct: 49,
    historicalSoilWetnessPct: null,
    waterStressFlag: 'low',
  },
  sources: [
    {
      id: 'power',
      status: 'demo',
      dateRange: 'Regional baseline',
      resolution: '0.5° × 0.625°',
      detail: 'Regional Egypt weather baseline while connecting to NASA POWER',
      url: 'https://power.larc.nasa.gov/',
    },
    {
      id: 'modis_ndvi',
      status: 'demo',
      dateRange: 'Regional baseline',
      resolution: '250 m',
      detail: 'Regional NDVI baseline while connecting to ORNL MODIS',
      url: 'https://modis.ornl.gov/',
    },
  ],
};

function mapPlotCropToAgriCrop(crop: CropType): CropId | null {
  switch (crop) {
    case 'Wheat':
      return 'wheat';
    case 'Sorghum':
      return 'sorghum';
    case 'Potato':
      return 'potato';
    case 'Alfalfa':
      return 'berseem';
    case 'Barley':
      return 'wheat';
    case 'Fallow':
    default:
      return null;
  }
}

const INITIAL_LOGS: FieldLogEntry[] = [
  {
    id: 'seed-1',
    plotCode: 'P-03',
    authorUid: 'system-op-1',
    authorName: 'Nadia Mansour',
    authorRole: 'field_operator',
    category: 'nozzle_check',
    note: 'Outer span drop nozzles 14–18 showed partial mineral scaling; scheduled backflush before 21:00 cycle.',
    createdAt: '2026-11-14T06:20:00.000Z',
  },
  {
    id: 'seed-2',
    plotCode: 'P-02',
    authorUid: 'system-mgr-1',
    authorName: 'Dr. Hany El-Gamal',
    authorRole: 'farm_manager',
    category: 'irrigation',
    note: 'SMAP L3 surface moisture reached 0.31 m³/m³; capped P-02 flow at 280 m³/h to protect aquifer drawdown.',
    createdAt: '2026-11-14T04:45:00.000Z',
  },
];

export default function App() {
  const { lang, fullLang, setFullLang, digitMode, setDigitMode, t, agriT } = useLanguage();

  // Top-level navigation & contextual sub-views
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('twin');
  const [planSubTab, setPlanSubTab] = useState<'planner' | 'atlas'>('planner');
  const [mapSubTab, setMapSubTab] = useState<'satellite' | 'nasa'>('satellite');

  // --- Owainat 3D Digital Twin & Telemetry State ---
  const [plots, setPlots] = useState<FarmPlot[]>(() => createInitialPlots());
  const [selectedPlotId, setSelectedPlotId] = useState<string>('P-01');
  const [activeLayer, setActiveLayer] = useState<AnalysisLayer>('satellite');
  const [weather, setWeather] = useState<WeatherForecast>(() => ({
    latitude: 22.5833,
    longitude: 28.6667,
    source: 'climatology-fallback',
    fetchedAt: new Date().toISOString(),
    currentTempC: 36.2,
    currentWindKmh: 24,
    currentHumidityPct: 14,
    currentSolarWm2: 865,
    dailyMaxTempC: 40.4,
    dailyMinTempC: 18.8,
    hourly: [
      { timeIso: '00:00', hourLabel: '00:00', tempC: 21.4, humidityPct: 28, windKmh: 11, solarWm2: 0, et0MmHr: 0.08 },
      { timeIso: '03:00', hourLabel: '03:00', tempC: 18.8, humidityPct: 33, windKmh: 9, solarWm2: 0, et0MmHr: 0.05 },
      { timeIso: '06:00', hourLabel: '06:00', tempC: 20.1, humidityPct: 30, windKmh: 12, solarWm2: 140, et0MmHr: 0.14 },
      { timeIso: '09:00', hourLabel: '09:00', tempC: 29.6, humidityPct: 19, windKmh: 19, solarWm2: 610, et0MmHr: 0.48 },
      { timeIso: '12:00', hourLabel: '12:00', tempC: 37.8, humidityPct: 13, windKmh: 26, solarWm2: 915, et0MmHr: 0.84 },
      { timeIso: '15:00', hourLabel: '15:00', tempC: 40.4, humidityPct: 11, windKmh: 31, solarWm2: 780, et0MmHr: 0.89 },
      { timeIso: '18:00', hourLabel: '18:00', tempC: 32.5, humidityPct: 16, windKmh: 22, solarWm2: 120, et0MmHr: 0.36 },
      { timeIso: '21:00', hourLabel: '21:00', tempC: 25.2, humidityPct: 24, windKmh: 14, solarWm2: 0, et0MmHr: 0.12 },
    ],
  }));
  const [settings, setSettings] = useState<FarmSettings>(INITIAL_FARM_SETTINGS);
  const [logs, setLogs] = useState<FieldLogEntry[]>(INITIAL_LOGS);

  // Firebase Auth & RBAC state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(null);
  const [previewRole, setPreviewRole] = useState<UserRole>('farm_manager');
  const [authError, setAuthError] = useState<string | null>(null);
  const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);

  const effectiveRole: UserRole = authProfile ? authProfile.role : previewRole;

  // --- AgriShift Rotation Planner & National NASA Telemetry State ---
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [farm, setFarm] = useState<FarmProfile>(() => loadSavedFarm());
  const [savedPlots, setSavedPlots] = useState<SavedPlot[]>(() => loadSavedPlots());
  const [activeStrategy, setActiveStrategy] = useState<RotationStrategyId>('balanced');
  const [telemetry, setTelemetry] = useState<NasaTelemetryResponse>(
    () => loadCachedTelemetry() ?? FALLBACK_INITIAL_TELEMETRY,
  );
  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(false);

  useEffect(() => {
    saveFarm(farm);
  }, [farm]);

  useEffect(() => {
    savePlots(savedPlots);
  }, [savedPlots]);

  const fetchTelemetry = useCallback(
    async (lat: number, lon: number, forceRefresh = false) => {
      setTelemetryLoading(true);
      try {
        const res = await fetch(
          `/api/nasa/telemetry?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}${
            forceRefresh ? '&refresh=1' : ''
          }`,
        );
        if (!res.ok) throw new Error('Telemetry fetch failed');
        const data = (await res.json()) as NasaTelemetryResponse;
        setTelemetry(data);
        saveCachedTelemetry(data);
      } catch {
        // Retain cached or demo fallback gracefully
      } finally {
        setTelemetryLoading(false);
      }
    },
    [],
  );

  // Fetch NASA telemetry when coordinates change
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchTelemetry(farm.lat, farm.lon, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [farm.lat, farm.lon, fetchTelemetry]);

  // Fetch Open-Meteo weather for Sharq El Owainat
  useEffect(() => {
    void fetchOwainatWeather().then((res) => setWeather(res));
  }, []);

  // Firebase Auth & Firestore subscriptions
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setFirebaseUser(user);
      if (!user) {
        setAuthProfile(null);
        setTeamUsers([]);
        return;
      }
      void ensureUserProfile(user)
        .then(async (profile) => {
          setAuthProfile(profile);
          if (profile.role === 'farm_manager') {
            await seedPlotsIfManager(createInitialPlots(), user);
            const members = await listTeamUsersForManager();
            setTeamUsers(members);
          }
        })
        .catch((err) => {
          setAuthError(err instanceof Error ? err.message : 'Unable to load user profile');
        });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !authProfile) return;
    const unsubPlots = subscribePlotsSync(
      (patches) => {
        setPlots((prev) =>
          prev.map((plot) => {
            const patch = patches[plot.plotCode];
            if (!patch) return plot;
            return { ...plot, ...patch };
          }),
        );
      },
      () => {
        // Keep local plots if offline or permission pending
      },
    );
    const unsubLogs = subscribeFieldLogs(
      firebaseUser.uid,
      authProfile.role,
      (remoteLogs) => {
        if (remoteLogs.length > 0) {
          setLogs(remoteLogs);
        }
      },
      () => {},
    );
    return () => {
      unsubPlots();
      unsubLogs();
    };
  }, [firebaseUser, authProfile]);

  const boundary = useMemo(() => estimateFarmBoundaries(plots), [plots]);
  const alerts = useMemo(
    () => generateWeatherAlerts(weather, settings.evapLockoutTempC, lang),
    [weather, settings.evapLockoutTempC, lang],
  );
  const plans = useMemo(() => generateAllStrategyPlans(farm, telemetry), [farm, telemetry]);

  const handleToggleIrrigation = (plotId: string, nextIrrigating: boolean, nextFlow: number) => {
    const targetPlot = plots.find((p) => p.id === plotId);
    if (!targetPlot) return;
    const clampedFlow = nextIrrigating
      ? Math.min(targetPlot.sustainabilityCapM3Hr, Math.max(80, Math.round(nextFlow)))
      : 0;

    setPlots((prev) =>
      prev.map((p) => {
        if (p.id !== plotId) return p;
        return {
          ...p,
          irrigating: nextIrrigating,
          flowRateM3Hr: clampedFlow,
          smapSurfaceMoisture: nextIrrigating
            ? Number(Math.min(0.36, p.smapSurfaceMoisture + 0.02).toFixed(2))
            : p.smapSurfaceMoisture,
        };
      }),
    );

    if (firebaseUser) {
      void persistOperatorIrrigationChange(
        targetPlot,
        nextIrrigating,
        clampedFlow,
        firebaseUser.uid,
      );
    }
  };

  const handleManagerUpdatePlot = (
    plotId: string,
    updates: {
      cropType: CropType;
      targetMoisturePct: number;
      sustainabilityCapM3Hr: number;
    },
  ) => {
    if (effectiveRole !== 'farm_manager') return;
    const targetPlot = plots.find((p) => p.id === plotId);
    if (!targetPlot) return;

    const isFallow = updates.cropType === 'Fallow';
    const nextIrrigating = isFallow ? false : targetPlot.irrigating;
    const nextFlow = isFallow
      ? 0
      : Math.min(targetPlot.flowRateM3Hr, updates.sustainabilityCapM3Hr);

    setPlots((prev) =>
      prev.map((p) => {
        if (p.id !== plotId) return p;
        return {
          ...p,
          cropType: updates.cropType,
          targetMoisturePct: updates.targetMoisturePct,
          sustainabilityCapM3Hr: updates.sustainabilityCapM3Hr,
          irrigating: nextIrrigating,
          flowRateM3Hr: nextFlow,
          dailyEtcMm: CROP_SPECS[updates.cropType].baseEtcMm,
          ndvi: isFallow ? 0.12 : Math.max(0.58, p.ndvi),
        };
      }),
    );

    if (firebaseUser) {
      void persistManagerPlotConfig(
        targetPlot,
        {
          cropType: updates.cropType,
          targetMoisturePct: updates.targetMoisturePct,
          sustainabilityCapM3Hr: updates.sustainabilityCapM3Hr,
          irrigating: nextIrrigating,
          flowRateM3Hr: nextFlow,
        },
        firebaseUser.uid,
      );
    }
  };

  const handleUpdateSettings = (next: FarmSettings) => {
    if (effectiveRole !== 'farm_manager') return;
    setSettings(next);
    if (firebaseUser) {
      void persistFarmSettings(next, firebaseUser.uid);
    }
  };

  const handleSubmitLog = async (entry: {
    plotCode: string;
    category: FieldLogEntry['category'];
    note: string;
  }) => {
    const newEntry: FieldLogEntry = {
      id: `local-${Date.now()}`,
      plotCode: entry.plotCode,
      authorUid: firebaseUser?.uid ?? 'local-preview',
      authorName:
        authProfile?.displayName ??
        (effectiveRole === 'farm_manager' ? 'Farm Manager' : 'Field Operator'),
      authorRole: effectiveRole,
      category: entry.category,
      note: entry.note,
      createdAt: new Date().toISOString(),
    };
    setLogs((prev) => [newEntry, ...prev]);

    if (firebaseUser && authProfile) {
      await persistFieldLog({
        plotCode: newEntry.plotCode,
        authorUid: firebaseUser.uid,
        authorName: authProfile.displayName,
        authorRole: authProfile.role,
        category: newEntry.category,
        note: newEntry.note,
      });
    }
  };

  const handleSignInGoogle = async () => {
    setAuthError(null);
    try {
      const profile = await signInWithGoogleAccount();
      setAuthProfile(profile);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google sign-in popup was closed or blocked.',
      );
    }
  };

  const handleSignOut = async () => {
    await signOutAccount();
    setAuthProfile(null);
  };

  const handleManagerChangeUserRole = async (uid: string, role: UserRole) => {
    await updateMemberRoleByManager(uid, role);
    const updated = await listTeamUsersForManager();
    setTeamUsers(updated);
  };

  // --- Cross-App Bridge Handlers ---
  const handlePlanPlotRotation = (plot: FarmPlot) => {
    const mappedCrop = mapPlotCropToAgriCrop(plot.cropType);
    const feddans = Math.max(1, Math.round(plot.areaHectares * 2.381));
    const salinityLevel =
      plot.soilSalinityDsM >= 4.0 ? 'saline' : plot.soilSalinityDsM >= 2.0 ? 'moderate' : 'fresh';

    setFarm((prev) => ({
      ...prev,
      governorateId: 'sharq_el_owainat',
      lat: plot.center.lat,
      lon: plot.center.lng,
      areaFeddans: feddans,
      polygon: [],
      irrigationMethod: 'pivot',
      waterSource: 'groundwater',
      soilType: 'sandy',
      salinityLevel,
      lastCrop: mappedCrop,
      preferredCrops: mappedCrop ? [mappedCrop] : [],
      undecidedCrop: mappedCrop === null,
    }));
    setPlanSubTab('planner');
    setWizardStep(4);
    setActiveTab('plan');
  };

  const handleLoadOwainatPreset = () => {
    const gov = findGovernorateById('sharq_el_owainat');
    setFarm((prev) => ({
      ...prev,
      governorateId: gov.id,
      lat: gov.lat,
      lon: gov.lon,
      polygon: [],
      areaFeddans: 145,
      irrigationMethod: 'pivot',
      waterSource: 'groundwater',
      soilType: 'sandy',
      salinityLevel: 'moderate',
    }));
  };

  const handleResetFarm = () => {
    const def = getDefaultFarmProfile();
    setFarm(def);
    setWizardStep(1);
    setActiveStrategy('balanced');
  };

  const handleSavePlot = () => {
    const gov = findGovernorateById(farm.governorateId);
    const label = `${gov.name[fullLang]} · ${formatFeddanLabel(farm.areaFeddans, fullLang, digitMode)}`;
    const newPlot: SavedPlot = {
      id: `plot_${Date.now()}`,
      label,
      savedAt: new Date().toISOString(),
      strategy: activeStrategy,
      farm,
    };
    setSavedPlots((prev) => [newPlot, ...prev.filter((p) => p.label !== label)].slice(0, 8));
  };

  const handleLoadPlot = (plot: SavedPlot) => {
    setFarm(plot.farm);
    setActiveStrategy(plot.strategy);
    setPlanSubTab('planner');
    setActiveTab('plan');
    setWizardStep(4);
  };

  const handleDeletePlot = (id: string) => {
    setSavedPlots((prev) => prev.filter((p) => p.id !== id));
  };

  const isLightAgrishiftView = activeTab === 'plan' || activeTab === 'map';
  const activeGov = findGovernorateById(farm.governorateId);

  return (
    <div
      data-role={effectiveRole}
      data-tab={activeTab}
      data-lang={fullLang}
      className={`${
        activeTab === 'twin' ? 'h-screen overflow-hidden' : 'min-h-screen'
      } w-full flex flex-col bg-[#0B1117] text-slate-100`}
    >
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        effectiveRole={effectiveRole}
        authUser={authProfile}
        onOpenRolePanel={() => setActiveTab('access')}
      />

      {/* Contextual Workspace Sub-Bar (shown on non-3D views so TopBar stays strictly 3-zone) */}
      {activeTab !== 'twin' && (
        <div className="bg-[#0F1722] border-b border-slate-800 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'plan' && (
              <div className="inline-flex items-center gap-1 bg-[#141E2B] p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPlanSubTab('planner')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    planSubTab === 'planner'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{agriT.navPlan}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlanSubTab('atlas')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    planSubTab === 'atlas'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{agriT.navCrops}</span>
                </button>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="inline-flex items-center gap-1 bg-[#141E2B] p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMapSubTab('satellite')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    mapSubTab === 'satellite'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{agriT.navMap}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapSubTab('nasa')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    mapSubTab === 'nasa'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Satellite className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{agriT.navNasa}</span>
                </button>
              </div>
            )}

            {(activeTab === 'analytics' || activeTab === 'weather') && (
              <div className="inline-flex items-center gap-1 bg-[#141E2B] p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.tabs.analytics}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('weather')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'weather'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <CloudSun className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.tabs.weather}</span>
                </button>
              </div>
            )}

            {isLightAgrishiftView && (
              <button
                type="button"
                onClick={handleLoadOwainatPreset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-[#141E2B] text-cyan-300 hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {lang === 'ar' ? 'تحديد شرق العوينات (22.58° N)' : 'Pin Sharq El Owainat'}
                </span>
              </button>
            )}
          </div>

          {/* Right side: Active coordinate context, Digits & Multilingual Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="hidden sm:inline-block text-xs text-slate-400 font-mono tabular-nums">
              {activeGov.name[fullLang]} · {farm.lat.toFixed(2)}°N, {farm.lon.toFixed(2)}°E
            </span>

            {isLightAgrishiftView && (
              <button
                type="button"
                onClick={() => setDigitMode((d) => (d === 'arabic' ? 'western' : 'arabic'))}
                className="px-2.5 py-1 rounded-lg border border-slate-700 bg-[#141E2B] hover:bg-slate-800 text-xs font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
              >
                {digitMode === 'arabic' ? agriT.digitsArabic : agriT.digitsWestern}
              </button>
            )}

            <div className="inline-flex items-center rounded-lg border border-slate-700 bg-[#141E2B] p-0.5">
              <Globe className="w-3.5 h-3.5 text-slate-400 mx-1.5 hidden sm:block" aria-hidden="true" />
              {(['arz', 'ar', 'en'] as AgriLanguage[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setFullLang(code)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                    fullLang === code
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {code === 'arz' ? 'مصري' : code === 'ar' ? 'فصحى' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Unified Workspace */}
      <main
        className={`flex-1 min-h-0 flex flex-col ${
          activeTab === 'twin'
            ? 'overflow-hidden'
            : isLightAgrishiftView
              ? 'bg-[#F9F8F4] text-[#17211B]'
              : 'bg-[#0B1117] text-slate-100'
        }`}
      >
        {activeTab === 'twin' && (
          <ThreeViewport
            plots={plots}
            selectedPlotId={selectedPlotId}
            onSelectPlot={setSelectedPlotId}
            activeLayer={activeLayer}
            onChangeLayer={setActiveLayer}
            boundary={boundary}
            effectiveRole={effectiveRole}
            nasaTelemetry={telemetry}
            onToggleIrrigation={handleToggleIrrigation}
            onManagerUpdatePlot={handleManagerUpdatePlot}
            onNavigateTab={setActiveTab}
            onPlanPlotRotation={handlePlanPlotRotation}
          />
        )}

        {activeTab === 'plan' && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 flex-1">
            {planSubTab === 'planner' ? (
              <FarmerPictureFlow
                step={wizardStep}
                setStep={setWizardStep}
                farm={farm}
                setFarm={setFarm}
                telemetry={telemetry}
                telemetryLoading={telemetryLoading}
                onRefreshTelemetry={() => void fetchTelemetry(farm.lat, farm.lon, true)}
                plans={plans}
                activeStrategy={activeStrategy}
                setActiveStrategy={setActiveStrategy}
                savedPlots={savedPlots}
                onSavePlot={handleSavePlot}
                onLoadPlot={handleLoadPlot}
                onDeletePlot={handleDeletePlot}
                lang={fullLang}
                digitMode={digitMode}
                onReset={handleResetFarm}
              />
            ) : (
              <CropAtlasPage lang={fullLang} digitMode={digitMode} />
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7 flex-1">
            {mapSubTab === 'satellite' ? (
              <SatelliteExplorerPage
                farm={farm}
                setFarm={setFarm}
                telemetry={telemetry}
                lang={fullLang}
                digitMode={digitMode}
                onJumpToPlan={() => {
                  setPlanSubTab('planner');
                  setActiveTab('plan');
                  setWizardStep(4);
                }}
                onJumpToTwin={() => setActiveTab('twin')}
              />
            ) : (
              <NasaTransparencyPage
                telemetry={telemetry}
                telemetryLoading={telemetryLoading}
                onRefreshTelemetry={() => void fetchTelemetry(farm.lat, farm.lon, true)}
                plan={plans[activeStrategy]}
                lang={fullLang}
                digitMode={digitMode}
              />
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            plots={plots}
            boundary={boundary}
            settings={settings}
            weather={weather}
            alerts={alerts}
            onSelectPlotInTwin={(plotId) => {
              setSelectedPlotId(plotId);
              setActiveTab('twin');
            }}
          />
        )}

        {activeTab === 'weather' && (
          <WeatherScheduleView
            weather={weather}
            alerts={alerts}
            plots={plots}
            settings={settings}
            onToggleIrrigation={handleToggleIrrigation}
          />
        )}

        {activeTab === 'access' && (
          <AccessLogsView
            authUser={authProfile}
            effectiveRole={effectiveRole}
            onChangePreviewRole={setPreviewRole}
            onSignInGoogle={handleSignInGoogle}
            onSignOut={handleSignOut}
            authError={authError}
            plots={plots}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            logs={logs}
            onSubmitLog={handleSubmitLog}
            teamUsers={teamUsers}
            onManagerChangeUserRole={handleManagerChangeUserRole}
          />
        )}
      </main>
    </div>
  );
}

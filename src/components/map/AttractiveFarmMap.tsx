import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Check,
  Compass,
  Droplets,
  Flame,
  Layers,
  LocateFixed,
  MapPin,
  Minus,
  PenTool,
  Plus,
  RotateCcw,
  Satellite,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Trash2,
} from 'lucide-react';
import {
  EGYPT_GOVERNORATES,
  findGovernorateById,
  findNearestGovernorate,
} from '../../data/egyptGovernorates';
import { TRANSLATIONS } from '../../i18n/translations';
import type {
  DigitMode,
  FieldPolygonPoint,
  Language,
  SourceHealthInfo,
} from '../../types/agrishift';
import { formatFeddanLabel, formatNumber } from '../../utils/formatters';
import {
  calculatePolygonAreaFeddans,
  calculatePolygonCentroid,
  feddansToFeddansAndKirats,
} from '../../utils/units';
import { NasaSourceChip } from '../artwork/VisualMeters';

type GibsOverlayId = 'none' | 'ndvi' | 'heat' | 'moisture';
type BasemapId = 'esri_satellite' | 'gibs_truecolor';
type RegionFilter = 'all' | 'delta' | 'valley' | 'oasis';

interface AttractiveFarmMapProps {
  lat: number;
  lon: number;
  governorateId: string;
  polygon: FieldPolygonPoint[];
  areaFeddans: number;
  lang: Language;
  digitMode: DigitMode;
  gibsSource?: SourceHealthInfo;
  heightClass?: string;
  onSelectLocation: (
    lat: number,
    lon: number,
    governorateId: string,
    polygon?: FieldPolygonPoint[],
    areaFeddans?: number
  ) => void;
}

function getGibsDateString(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().slice(0, 10);
}

const GIBS_LAYER_CONFIG: Record<
  Exclude<GibsOverlayId, 'none'>,
  { layer: string; matrixSet: string; ext: string; maxZoom: number }
> = {
  ndvi: {
    layer: 'MODIS_Terra_NDVI_8Day',
    matrixSet: 'GoogleMapsCompatible_Level9',
    ext: 'png',
    maxZoom: 9,
  },
  heat: {
    layer: 'MODIS_Terra_Land_Surface_Temp_Day',
    matrixSet: 'GoogleMapsCompatible_Level7',
    ext: 'png',
    maxZoom: 7,
  },
  moisture: {
    layer: 'SMAP_L4_Analyzed_Surface_Soil_Moisture',
    matrixSet: 'GoogleMapsCompatible_Level6',
    ext: 'png',
    maxZoom: 6,
  },
};

export const AttractiveFarmMap: React.FC<AttractiveFarmMapProps> = ({
  lat,
  lon,
  governorateId,
  polygon,
  areaFeddans,
  lang,
  digitMode,
  gibsSource,
  heightClass = 'h-[360px] sm:h-[440px]',
  onSelectLocation,
}) => {
  const t = TRANSLATIONS[lang];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const labelLayerRef = useRef<L.TileLayer | null>(null);
  const gibsLayerRef = useRef<L.TileLayer | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const vertexGroupRef = useRef<L.LayerGroup | null>(null);

  const [basemap, setBasemap] = useState<BasemapId>('esri_satellite');
  const [overlay, setOverlay] = useState<GibsOverlayId>('none');
  const [daysAgo, setDaysAgo] = useState<number>(6);
  const [opacity, setOpacity] = useState<number>(0.72);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);
  const [tileWarning, setTileWarning] = useState<boolean>(false);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');

  const isDrawingRef = useRef(isDrawing);
  isDrawingRef.current = isDrawing;
  const polygonRef = useRef(polygon);
  polygonRef.current = polygon;
  const areaRef = useRef(areaFeddans);
  areaRef.current = areaFeddans;

  const gibsDate = useMemo(() => getGibsDateString(daysAgo), [daysAgo]);
  const selectedGov = findGovernorateById(governorateId);

  const filteredGovs = useMemo(
    () =>
      regionFilter === 'all'
        ? EGYPT_GOVERNORATES
        : EGYPT_GOVERNORATES.filter((g) => g.region === regionFilter),
    [regionFilter]
  );

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 13,
      zoomControl: false,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: [
        [20.5, 23.5],
        [33.2, 37.5],
      ],
    });

    mapInstanceRef.current = map;
    vertexGroupRef.current = L.layerGroup().addTo(map);

    const pinIcon = L.divIcon({
      className: 'agrishift-field-pin',
      html: `<div class="agrishift-pin-wrapper"><span class="agrishift-pin-pulse"></span><span class="agrishift-pin-core"></span></div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const marker = L.marker([lat, lon], { icon: pinIcon, draggable: true }).addTo(map);
    pinMarkerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const nearest = findNearestGovernorate(pos.lat, pos.lng);
      onSelectLocation(
        Number(pos.lat.toFixed(5)),
        Number(pos.lng.toFixed(5)),
        nearest.id,
        polygonRef.current,
        areaRef.current
      );
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = Number(e.latlng.lat.toFixed(5));
      const clickedLon = Number(e.latlng.lng.toFixed(5));
      const nearest = findNearestGovernorate(clickedLat, clickedLon);

      if (isDrawingRef.current) {
        const nextPoly = [...polygonRef.current, { lat: clickedLat, lon: clickedLon }];
        const computedArea =
          nextPoly.length >= 3 ? calculatePolygonAreaFeddans(nextPoly) : areaRef.current;
        const centroid = calculatePolygonCentroid(nextPoly);
        onSelectLocation(
          centroid ? centroid.lat : clickedLat,
          centroid ? centroid.lon : clickedLon,
          nearest.id,
          nextPoly,
          computedArea > 0 ? Number(computedArea.toFixed(2)) : areaRef.current
        );
      } else {
        onSelectLocation(clickedLat, clickedLon, nearest.id, polygonRef.current, areaRef.current);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update basemap tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseLayerRef.current) map.removeLayer(baseLayerRef.current);
    if (labelLayerRef.current) map.removeLayer(labelLayerRef.current);

    let tileErrors = 0;

    if (basemap === 'esri_satellite') {
      baseLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri World Imagery',
          maxZoom: 18,
        }
      ).addTo(map);

      labelLayerRef.current = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          opacity: 0.85,
        }
      ).addTo(map);
    } else {
      baseLayerRef.current = L.tileLayer(
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        {
          attribution: 'NASA GIBS MODIS',
          maxNativeZoom: 9,
          maxZoom: 18,
        }
      ).addTo(map);
    }

    baseLayerRef.current.on('tileerror', () => {
      tileErrors++;
      if (tileErrors >= 4) setTileWarning(true);
    });
    baseLayerRef.current.on('tileload', () => {
      setTileWarning(false);
    });
  }, [basemap, gibsDate]);

  // Update NASA GIBS overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (gibsLayerRef.current) {
      map.removeLayer(gibsLayerRef.current);
      gibsLayerRef.current = null;
    }

    if (overlay === 'none') return;

    const cfg = GIBS_LAYER_CONFIG[overlay];
    const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${cfg.layer}/default/${gibsDate}/${cfg.matrixSet}/{z}/{y}/{x}.${cfg.ext}`;

    gibsLayerRef.current = L.tileLayer(url, {
      attribution: `NASA GIBS ${cfg.layer}`,
      opacity,
      maxNativeZoom: cfg.maxZoom,
      maxZoom: 18,
    }).addTo(map);
  }, [overlay, gibsDate, opacity]);

  // Sync pin & smooth flyTo when coordinates change externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = pinMarkerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([lat, lon]);
    const currentCenter = map.getCenter();
    const dist = Math.hypot(currentCenter.lat - lat, currentCenter.lng - lon);
    if (dist > 0.04) {
      map.flyTo([lat, lon], Math.max(map.getZoom(), 11), { duration: 0.9 });
    }
  }, [lat, lon]);

  // Render polygon & corner vertex markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const vGroup = vertexGroupRef.current;
    if (!map || !vGroup) return;

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    vGroup.clearLayers();

    if (polygon.length >= 2) {
      const latLngs = polygon.map((p) => [p.lat, p.lon] as [number, number]);
      polygonLayerRef.current = L.polygon(latLngs, {
        color: '#F59E0B',
        weight: 3,
        dashArray: isDrawing ? '6 6' : undefined,
        fillColor: '#10B981',
        fillOpacity: 0.28,
      }).addTo(map);
    }

    polygon.forEach((pt) => {
      const dotIcon = L.divIcon({
        className: 'agrishift-field-pin',
        html: '<div class="agrishift-vertex-handle"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([pt.lat, pt.lon], { icon: dotIcon, interactive: false }).addTo(vGroup);
    });
  }, [polygon, isDrawing]);

  const handleUseGps = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gLat = Number(pos.coords.latitude.toFixed(5));
        const gLon = Number(pos.coords.longitude.toFixed(5));
        const clampedLat = Math.max(22, Math.min(31.8, gLat));
        const clampedLon = Math.max(25, Math.min(36.5, gLon));
        const nearest = findNearestGovernorate(clampedLat, clampedLon);
        mapInstanceRef.current?.flyTo([clampedLat, clampedLon], 14, { duration: 1.0 });
        onSelectLocation(clampedLat, clampedLon, nearest.id, [], areaFeddans);
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const handleGovernorateClick = (govId: string) => {
    const gov = EGYPT_GOVERNORATES.find((g) => g.id === govId);
    if (!gov) return;
    mapInstanceRef.current?.flyTo([gov.lat, gov.lon], 12, { duration: 0.9 });
    onSelectLocation(gov.lat, gov.lon, gov.id, [], areaFeddans);
  };

  const handleSetManualArea = (nextArea: number) => {
    const clamped = Math.max(0.25, Math.min(500, Number(nextArea.toFixed(2))));
    onSelectLocation(lat, lon, governorateId, polygon, clamped);
  };

  const handleUndoVertex = () => {
    if (polygon.length === 0) return;
    const next = polygon.slice(0, -1);
    const area = next.length >= 3 ? Number(calculatePolygonAreaFeddans(next).toFixed(2)) : 2.0;
    const centroid = calculatePolygonCentroid(next);
    onSelectLocation(
      centroid ? centroid.lat : lat,
      centroid ? centroid.lon : lon,
      governorateId,
      next,
      area
    );
  };

  const handleClearPolygon = () => {
    setIsDrawing(false);
    onSelectLocation(lat, lon, governorateId, [], 2.0);
  };

  const { feddans, kirats } = feddansToFeddansAndKirats(areaFeddans);

  return (
    <div className="space-y-3">
      {/* Visual Toolbar Above Map */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUseGps}
            disabled={locating}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <LocateFixed className="w-4 h-4 shrink-0" />
            <span>{locating ? t.locating : t.useMyLocation}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDrawing((d) => !d)}
            className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-colors cursor-pointer whitespace-nowrap ${
              isDrawing
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-amber-50'
            }`}
          >
            {isDrawing ? <Check className="w-4 h-4 shrink-0" /> : <PenTool className="w-4 h-4 shrink-0" />}
            <span>{isDrawing ? t.finishDraw : t.drawField}</span>
          </button>

          {polygon.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleUndoVertex}
                className="min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer whitespace-nowrap"
                aria-label={t.undoPoint}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.undoPoint}</span>
              </button>
              <button
                type="button"
                onClick={handleClearPolygon}
                className="min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer whitespace-nowrap"
                aria-label={t.clearField}
              >
                <Trash2 className="w-4 h-4" />
                <span>{t.clearField}</span>
              </button>
            </>
          )}
        </div>

        {/* Interactive Feddan Area Stepper + Live Readout */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 bg-white border border-emerald-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleSetManualArea(areaFeddans - 0.5)}
              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center cursor-pointer"
              aria-label="Decrease feddans"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2.5 text-sm font-extrabold text-slate-900 tabular-nums">
              <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{formatFeddanLabel(areaFeddans, lang, digitMode)}</span>
              {kirats > 0 && (
                <span className="hidden sm:inline text-xs font-semibold text-slate-500">
                  ({formatNumber(feddans, digitMode, 0)} {t.feddanUnit} ·{' '}
                  {formatNumber(kirats, digitMode, 0)} {t.kiratUnit})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleSetManualArea(areaFeddans + 0.5)}
              className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center cursor-pointer"
              aria-label="Increase feddans"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Feddan Presets */}
          <div className="hidden sm:flex items-center gap-1">
            {[1, 2, 5, 10].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSetManualArea(val)}
                className={`min-h-[38px] px-2.5 rounded-lg text-xs font-bold border cursor-pointer tabular-nums ${
                  Math.abs(areaFeddans - val) < 0.05
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                {formatNumber(val, digitMode, 0)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Draw instruction strip */}
      {isDrawing && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-bold">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t.drawHint}</span>
        </div>
      )}

      {/* Map Viewport Container */}
      <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden border-2 border-slate-200 shadow-md bg-slate-900`}>
        <div
          ref={mapContainerRef}
          data-testid="farm-leaflet-map"
          className="w-full h-full z-10"
        />

        {/* Top-Left Basemap & NASA Layer Floating Visual Selector */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-w-[calc(100%-70px)]">
          {/* Basemap Pills */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/92 backdrop-blur-md shadow-md border border-white/60 self-start">
            <button
              type="button"
              onClick={() => setBasemap('esri_satellite')}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                basemap === 'esri_satellite'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t.basemapSatellite}
            </button>
            <button
              type="button"
              onClick={() => setBasemap('gibs_truecolor')}
              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                basemap === 'gibs_truecolor'
                  ? 'bg-sky-700 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {t.basemapNasa}
            </button>
          </div>

          {/* GIBS Overlay Icon Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/92 backdrop-blur-md shadow-md border border-white/60">
            <button
              type="button"
              onClick={() => setOverlay('none')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                overlay === 'none'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.layerTrueColor}</span>
            </button>
            <button
              type="button"
              onClick={() => setOverlay('ndvi')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                overlay === 'ndvi'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-700 hover:bg-emerald-50'
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>{t.layerNdvi}</span>
            </button>
            <button
              type="button"
              onClick={() => setOverlay('heat')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                overlay === 'heat'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-700 hover:bg-amber-50'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>{t.layerHeat}</span>
            </button>
            <button
              type="button"
              onClick={() => setOverlay('moisture')}
              className={`min-h-[38px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                overlay === 'moisture'
                  ? 'bg-sky-700 text-white'
                  : 'text-slate-700 hover:bg-sky-50'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>{t.layerMoisture}</span>
            </button>
          </div>
        </div>

        {/* Right-Side Touch-Friendly Zoom Controls */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-11 h-11 rounded-xl bg-white/95 hover:bg-white text-slate-900 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer"
            aria-label="Zoom in"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-11 h-11 rounded-xl bg-white/95 hover:bg-white text-slate-900 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer"
            aria-label="Zoom out"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.flyTo([lat, lon], 13, { duration: 0.7 })}
            className="w-11 h-11 rounded-xl bg-white/95 hover:bg-white text-emerald-700 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer"
            aria-label="Center on field"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom-Left Coordinates & NASA GIBS Legend/Controls */}
        <div className="absolute bottom-7 left-3 right-3 z-20 flex flex-wrap items-end justify-between gap-2 pointer-events-none">
          <div
            dir="ltr"
            className="pointer-events-auto flex items-center gap-2 bg-slate-950/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-mono tabular-nums"
          >
            <Satellite className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {lat.toFixed(3)}, {lon.toFixed(3)}
            </span>
          </div>

          {overlay !== 'none' && (
            <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-lg border border-slate-200 flex flex-wrap items-center gap-3">
              {/* Color ramp visual legend */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>
                  {overlay === 'ndvi'
                    ? t.legendDry
                    : overlay === 'heat'
                    ? t.legendCool
                    : t.legendDry}
                </span>
                <div
                  className={`w-24 h-3 rounded-full ${
                    overlay === 'ndvi'
                      ? 'bg-gradient-to-r from-amber-200 via-lime-400 to-emerald-800'
                      : overlay === 'heat'
                      ? 'bg-gradient-to-r from-sky-400 via-amber-400 to-rose-600'
                      : 'bg-gradient-to-r from-amber-100 via-teal-400 to-blue-800'
                  }`}
                />
                <span>
                  {overlay === 'ndvi'
                    ? t.legendLush
                    : overlay === 'heat'
                    ? t.legendHot
                    : t.legendMoist}
                </span>
              </div>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span>{t.layerDate}:</span>
                <input
                  type="range"
                  min={3}
                  max={30}
                  step={3}
                  value={daysAgo}
                  onChange={(e) => setDaysAgo(Number(e.target.value))}
                  className="w-20 accent-emerald-700"
                />
                <span className="font-mono text-[11px] text-slate-800">{gibsDate.slice(5)}</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <span>{t.layerOpacity}:</span>
                <input
                  type="range"
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-16 accent-sky-700"
                />
              </label>

              <NasaSourceChip source={gibsSource} label="NASA GIBS" lang={lang} />
            </div>
          )}
        </div>

        {/* Tile Error Fallback Banner */}
        {tileWarning && (
          <div className="absolute top-16 right-3 z-30 bg-amber-50/95 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow">
            {t.tileErrorHint}
          </div>
        )}
      </div>

      {/* Governorate Quick-Jump Visual Strip with Region Tabs & Rice Permit Indicator */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: t.regionAll },
                { id: 'delta', label: t.regionDelta },
                { id: 'valley', label: t.regionValley },
                { id: 'oasis', label: t.regionOasis },
              ] as { id: RegionFilter; label: string }[]
            ).map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => setRegionFilter(reg.id)}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                  regionFilter === reg.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold ${
              selectedGov.ricePermitted ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {selectedGov.ricePermitted ? (
              <ShieldCheck className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0" />
            )}
            <span>{selectedGov.ricePermitted ? t.riceAllowed : t.riceRestricted}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filteredGovs.map((gov) => {
            const active = gov.id === governorateId;
            const regionColor =
              gov.region === 'delta'
                ? 'bg-emerald-600'
                : gov.region === 'valley'
                ? 'bg-sky-600'
                : 'bg-amber-600';
            return (
              <button
                key={gov.id}
                type="button"
                onClick={() => handleGovernorateClick(gov.id)}
                className={`min-h-[44px] shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-white' : regionColor}`} aria-hidden="true" />
                <span>{gov.name[lang]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

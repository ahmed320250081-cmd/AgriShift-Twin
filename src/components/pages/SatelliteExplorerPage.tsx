import React from 'react';
import { Box, Calendar, Compass } from 'lucide-react';
import { VISUAL_MEDIA } from '../../assets/visualMedia';
import { findGovernorateById } from '../../data/egyptGovernorates';
import { TRANSLATIONS } from '../../i18n/translations';
import type {
  DigitMode,
  FarmProfile,
  FieldPolygonPoint,
  Language,
  NasaTelemetryResponse,
} from '../../types/agrishift';
import { formatFeddanLabel } from '../../utils/formatters';
import { TelemetryVisualDial } from '../artwork/VisualMeters';
import { AttractiveFarmMap } from '../map/AttractiveFarmMap';

interface SatelliteExplorerPageProps {
  farm: FarmProfile;
  setFarm: React.Dispatch<React.SetStateAction<FarmProfile>>;
  telemetry: NasaTelemetryResponse;
  lang: Language;
  digitMode: DigitMode;
  onJumpToPlan: () => void;
  onJumpToTwin?: () => void;
}

export const SatelliteExplorerPage: React.FC<SatelliteExplorerPageProps> = ({
  farm,
  setFarm,
  telemetry,
  lang,
  digitMode,
  onJumpToPlan,
  onJumpToTwin,
}) => {
  const t = TRANSLATIONS[lang];
  const gov = findGovernorateById(farm.governorateId);
  const gibsSource = telemetry.sources.find((s) => s.id === 'gibs');

  const handleSelectLocation = (
    lat: number,
    lon: number,
    governorateId: string,
    polygon?: FieldPolygonPoint[],
    areaFeddans?: number,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <AttractiveFarmMap
          lat={farm.lat}
          lon={farm.lon}
          governorateId={farm.governorateId}
          polygon={farm.polygon}
          areaFeddans={farm.areaFeddans}
          lang={lang}
          digitMode={digitMode}
          gibsSource={gibsSource}
          heightClass="h-[430px] sm:h-[540px]"
          onSelectLocation={handleSelectLocation}
        />
      </div>

      <aside className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="relative h-36">
            <img
              src={VISUAL_MEDIA.egyptSoilHands}
              alt={gov.name[lang]}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-3 start-4 end-4 text-white flex items-end justify-between">
              <div>
                <div className="text-xl font-extrabold">{gov.name[lang]}</div>
                <div className="text-xs font-mono text-emerald-200">
                  {farm.lat.toFixed(3)}, {farm.lon.toFixed(3)}
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl text-xs font-extrabold">
                <Compass className="w-4 h-4 text-amber-300" />
                <span>{formatFeddanLabel(farm.areaFeddans, lang, digitMode)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              <TelemetryVisualDial
                kind="ndvi"
                value={telemetry.latestNdvi}
                maxValue={1}
                unit="NDVI"
                label={t.metricNdvi}
                digitMode={digitMode}
                decimals={2}
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
                kind="heat"
                value={telemetry.summary.avgTMaxC}
                maxValue={48}
                unit="°C"
                label={t.metricHeat}
                digitMode={digitMode}
              />
            </div>

            <button
              type="button"
              onClick={onJumpToPlan}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base shadow-sm cursor-pointer"
            >
              <Calendar className="w-5 h-5" />
              <span>{t.showPlanBtn}</span>
            </button>

            {onJumpToTwin && (
              <button
                type="button"
                onClick={onJumpToTwin}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer"
              >
                <Box className="w-4 h-4 text-cyan-400" />
                <span>
                  {lang === 'en'
                    ? 'Open Sharq El Owainat 3D Twin'
                    : 'افتح التوأم ثلاثي الأبعاد (شرق العوينات)'}
                </span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

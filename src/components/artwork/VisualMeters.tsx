import React, { useState } from 'react';
import {
  CloudRain,
  Droplets,
  Leaf,
  Satellite,
  Sun,
  ThermometerSun,
  X,
} from 'lucide-react';
import type {
  DailyWeatherPoint,
  DataSourceStatus,
  DigitMode,
  Language,
  MonthlyClimatologyPoint,
  NdviPoint,
  RotationPlan,
  RotationStrategyId,
  SourceHealthInfo,
  WaterNeedLevel,
} from '../../types/agrishift';
import { TRANSLATIONS } from '../../i18n/translations';
import { formatNumber } from '../../utils/formatters';

/**
 * Pictorial 1-to-3 water drop indicator so water consumption is readable without text.
 */
export const WaterDropMeter: React.FC<{ level: WaterNeedLevel; className?: string }> = ({
  level,
  className = '',
}) => {
  const count = level === 'low' ? 1 : level === 'medium' ? 2 : 3;
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {[1, 2, 3].map((idx) => (
        <Droplets
          key={idx}
          className={`w-4 h-4 ${
            idx <= count
              ? 'text-sky-600 fill-sky-500/30'
              : 'text-slate-300 dark:text-slate-600'
          }`}
        />
      ))}
    </span>
  );
};

/**
 * 12-Month visual crop sowing & harvest bar so seasonal timing is clear at a glance.
 */
export const CropCalendarBar: React.FC<{
  sowMonths: [number, number];
  harvestMonths: [number, number];
  accentHex?: string;
  digitMode: DigitMode;
}> = ({ sowMonths, harvestMonths, accentHex = '#15803D', digitMode }) => {
  const isMonthActive = (m: number): 'sow' | 'grow' | 'harvest' | 'idle' => {
    const inRange = (start: number, end: number, val: number) =>
      start <= end ? val >= start && val <= end : val >= start || val <= end;

    if (inRange(sowMonths[0], sowMonths[1], m)) return 'sow';
    if (inRange(harvestMonths[0], harvestMonths[1], m)) return 'harvest';
    if (inRange(sowMonths[0], harvestMonths[1], m)) return 'grow';
    return 'idle';
  };

  return (
    <div className="w-full" dir="ltr">
      <div className="grid grid-cols-12 gap-0.5">
        {Array.from({ length: 12 }, (_, idx) => {
          const m = idx + 1;
          const phase = isMonthActive(m);
          const bg =
            phase === 'sow'
              ? 'bg-emerald-600 text-white'
              : phase === 'harvest'
              ? 'bg-amber-500 text-white'
              : phase === 'grow'
              ? 'bg-emerald-200 text-emerald-950'
              : 'bg-slate-100 text-slate-400';
          return (
            <div
              key={m}
              style={phase === 'grow' ? { borderBottom: `2px solid ${accentHex}` } : undefined}
              className={`h-5 rounded-sm flex items-center justify-center text-[10px] font-mono font-bold tabular-nums ${bg}`}
            >
              {formatNumber(m, digitMode, 0)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Visual side-by-side comparison bars across the 3 rotation strategies.
 */
export const StrategyComparisonBars: React.FC<{
  plans: Record<RotationStrategyId, RotationPlan>;
  activeStrategy: RotationStrategyId;
  onSelectStrategy: (s: RotationStrategyId) => void;
  lang: Language;
  digitMode: DigitMode;
}> = ({ plans, activeStrategy, onSelectStrategy, lang, digitMode }) => {
  const t = TRANSLATIONS[lang];
  const items: { id: RotationStrategyId; label: string }[] = [
    { id: 'balanced', label: t.strategyBalanced },
    { id: 'water_saving', label: t.strategyWater },
    { id: 'soil_health', label: t.strategySoil },
  ];

  return (
    <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="text-xs font-extrabold text-slate-600">{t.compareStrategies}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => {
          const p = plans[item.id];
          const isActive = item.id === activeStrategy;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStrategy(item.id)}
              className={`text-start p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-white border-emerald-600 shadow-xs'
                  : 'bg-white/70 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-extrabold text-slate-900">{item.label}</span>
                <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums">
                  {formatNumber(p.relativeDecisionScore, digitMode, 0)}%
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-20 truncate">{t.waterScoreLabel}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full"
                      style={{ width: `${p.scoreBreakdown.waterEfficiency}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 truncate">{t.soilScoreLabel}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${p.scoreBreakdown.soilHealth}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 truncate">{t.climateScoreLabel}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${p.scoreBreakdown.climateFit}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Clickable NASA satellite source badge that opens an inline transparent attribution popover.
 */
export const NasaSourceChip: React.FC<{
  source?: SourceHealthInfo;
  label: string;
  lang: Language;
}> = ({ source, label, lang }) => {
  const [open, setOpen] = useState(false);
  const t = TRANSLATIONS[lang];

  const statusText =
    source?.status === 'live'
      ? t.statusLive
      : source?.status === 'estimated'
      ? t.statusEstimated
      : source?.status === 'demo'
      ? t.statusDemo
      : t.statusUnavailable;

  const statusColor =
    source?.status === 'live'
      ? 'text-emerald-700'
      : source?.status === 'estimated'
      ? 'text-sky-700'
      : 'text-amber-700';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 border border-slate-200 rounded-lg px-2 py-1 transition-colors cursor-pointer whitespace-nowrap"
        aria-expanded={open}
      >
        <Satellite className="w-3.5 h-3.5 text-sky-700 shrink-0" />
        <span>{label}</span>
      </button>

      {open && source && (
        <div
          role="dialog"
          className="absolute z-40 mt-2 w-64 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl text-xs text-slate-700 start-0"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`font-bold ${statusColor}`}>{statusText}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="font-semibold text-slate-900 mb-1">{source.detail}</p>
          <p className="text-slate-500 tabular-nums mb-1">{source.dateRange}</p>
          <p className="text-slate-500 mb-2">{source.resolution}</p>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-sky-700 underline font-semibold"
          >
            Earthdata Source ↗
          </a>
        </div>
      )}
    </div>
  );
};

/**
 * Visual circular telemetry dial for quick visual reading of rain, heat, moisture, and NDVI.
 */
export const TelemetryVisualDial: React.FC<{
  kind: 'rain' | 'heat' | 'soil' | 'ndvi';
  value: number;
  maxValue: number;
  unit: string;
  label: string;
  subLabel?: string;
  digitMode: DigitMode;
  decimals?: number;
}> = ({ kind, value, maxValue, unit, label, subLabel, digitMode, decimals = 1 }) => {
  const ratio = Math.max(0.06, Math.min(1, value / Math.max(1, maxValue)));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);

  const colorMap = {
    rain: { stroke: '#0284C7', bg: 'bg-sky-50', icon: CloudRain, iconColor: 'text-sky-600' },
    heat: { stroke: '#D97706', bg: 'bg-amber-50', icon: ThermometerSun, iconColor: 'text-amber-600' },
    soil: { stroke: '#0D9488', bg: 'bg-teal-50', icon: Droplets, iconColor: 'text-teal-600' },
    ndvi: { stroke: '#15803D', bg: 'bg-emerald-50', icon: Leaf, iconColor: 'text-emerald-600' },
  }[kind];

  const IconComponent = colorMap.icon;

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="6"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={colorMap.stroke}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-2.5 rounded-full ${colorMap.bg} flex items-center justify-center`}>
          <IconComponent className={`w-5 h-5 ${colorMap.iconColor}`} />
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500 truncate">{label}</div>
        <div
          dir="ltr"
          className="inline-flex items-baseline gap-1 text-xl font-extrabold text-slate-900 tabular-nums leading-tight"
        >
          <span>{formatNumber(value, digitMode, decimals)}</span>
          <span className="text-xs font-semibold text-slate-500">{unit}</span>
        </div>
        {subLabel && (
          <div className="text-xs font-semibold text-emerald-700 truncate">{subLabel}</div>
        )}
      </div>
    </div>
  );
};

/**
 * Lightweight responsive SVG chart for MODIS NDVI greenness time series.
 */
export const NdviTimeSeriesChart: React.FC<{
  series: NdviPoint[];
  digitMode: DigitMode;
}> = ({ series, digitMode }) => {
  if (series.length === 0) return null;
  const w = 520;
  const h = 170;
  const padX = 36;
  const padY = 20;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const coords = series.map((pt, idx) => {
    const x = padX + (idx / Math.max(1, series.length - 1)) * innerW;
    const y = padY + (1 - Math.max(0, Math.min(1, pt.ndvi))) * innerH;
    return { x, y, pt };
  });

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(h - padY).toFixed(
    1
  )} L ${coords[0].x.toFixed(1)} ${(h - padY).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44 overflow-visible" role="img" aria-label="MODIS NDVI Chart">
      <defs>
        <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((tick) => {
        const y = padY + (1 - tick) * innerH;
        return (
          <g key={tick}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="#E2E8F0" strokeDasharray="4 4" />
            <text x={padX - 6} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
              {formatNumber(tick, digitMode, 2)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#ndviGrad)" />
      <path d={linePath} fill="none" stroke="#15803D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, idx) => (
        <g key={idx}>
          <circle cx={c.x} cy={c.y} r="4.5" fill="#FFFFFF" stroke="#15803D" strokeWidth="2.5" />
          {(idx === 0 || idx === coords.length - 1 || idx % 2 === 0) && (
            <text x={c.x} y={h - 4} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
              {c.pt.date.slice(5)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

/**
 * Lightweight responsive SVG chart comparing daily FAO-56 ET0 loss vs NASA POWER precipitation.
 */
export const WaterBalanceChart: React.FC<{
  daily: DailyWeatherPoint[];
  digitMode: DigitMode;
}> = ({ daily, digitMode }) => {
  const slice = daily.slice(-14);
  if (slice.length === 0) return null;
  const w = 520;
  const h = 170;
  const padX = 34;
  const padY = 20;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const maxVal = Math.max(10, ...slice.map((d) => Math.max(d.et0Mm, d.precipMm)));
  const barW = Math.max(8, innerW / slice.length - 6);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44" role="img" aria-label="ET0 and Rain Chart">
      {[0, 0.5, 1].map((ratio) => {
        const val = maxVal * ratio;
        const y = padY + (1 - ratio) * innerH;
        return (
          <g key={ratio}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
            <text x={padX - 6} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
              {formatNumber(val, digitMode, 0)}
            </text>
          </g>
        );
      })}
      {slice.map((d, idx) => {
        const x = padX + idx * (innerW / slice.length) + 3;
        const etH = (d.et0Mm / maxVal) * innerH;
        const rainH = (d.precipMm / maxVal) * innerH;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={padY + innerH - etH}
              width={barW * 0.65}
              height={Math.max(2, etH)}
              rx="3"
              fill="#F59E0B"
            />
            {d.precipMm > 0 && (
              <rect
                x={x + barW * 0.65 + 1}
                y={padY + innerH - rainH}
                width={barW * 0.35}
                height={Math.max(3, rainH)}
                rx="2"
                fill="#0284C7"
              />
            )}
            {idx % 3 === 0 && (
              <text
                x={x + barW / 2}
                y={h - 4}
                textAnchor="middle"
                className="fill-slate-500 text-[9px] font-mono"
              >
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/**
 * 12-month NASA POWER climate normal chart (Max Temp curve + Monthly Rain bars).
 */
export const ClimatologyChart: React.FC<{
  data: MonthlyClimatologyPoint[];
  digitMode: DigitMode;
}> = ({ data, digitMode }) => {
  if (!data || data.length === 0) return null;
  const w = 540;
  const h = 155;
  const padX = 34;
  const padY = 18;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const maxTemp = Math.max(42, ...data.map((d) => d.tMaxC));
  const maxRain = Math.max(25, ...data.map((d) => d.precipMm));

  const tempPoints = data.map((d, i) => {
    const x = padX + ((i + 0.5) / data.length) * innerW;
    const y = padY + (1 - d.tMaxC / maxTemp) * innerH;
    return { x, y, d };
  });
  const line = tempPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" role="img" aria-label="12-Month Climate Normal Chart">
      {[20, 35].map((tVal) => {
        const y = padY + (1 - tVal / maxTemp) * innerH;
        return (
          <g key={tVal}>
            <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
            <text x={padX - 6} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
              {formatNumber(tVal, digitMode, 0)}°
            </text>
          </g>
        );
      })}
      {tempPoints.map((p) => {
        const rainH = (p.d.precipMm / maxRain) * (innerH * 0.45);
        return (
          <g key={p.d.month}>
            {p.d.precipMm > 0 && (
              <rect
                x={p.x - 7}
                y={padY + innerH - rainH}
                width={14}
                height={Math.max(2, rainH)}
                rx="3"
                fill="#38BDF8"
                opacity="0.7"
              />
            )}
            <text x={p.x} y={h - 3} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
              {formatNumber(p.d.month, digitMode, 0)}
            </text>
          </g>
        );
      })}
      <path d={line} fill="none" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" />
      {tempPoints.map((p) => (
        <circle key={p.d.month} cx={p.x} cy={p.y} r="3.5" fill="#FFFFFF" stroke="#D97706" strokeWidth="2" />
      ))}
    </svg>
  );
};

export const StatusLabel: React.FC<{ status: DataSourceStatus; lang: Language }> = ({
  status,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const map = {
    live: { label: t.statusLive, icon: Sun, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    estimated: { label: t.statusEstimated, icon: Satellite, cls: 'text-sky-700 bg-sky-50 border-sky-200' },
    demo: { label: t.statusDemo, icon: CloudRain, cls: 'text-amber-800 bg-amber-50 border-amber-200' },
    unavailable: { label: t.statusUnavailable, icon: X, cls: 'text-slate-600 bg-slate-100 border-slate-200' },
  }[status];
  const Icon = map.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold ${map.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{map.label}</span>
    </span>
  );
};

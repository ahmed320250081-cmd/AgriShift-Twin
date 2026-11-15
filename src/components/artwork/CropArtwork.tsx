import React from 'react';
import type {
  CropId,
  EgyptianSeason,
  IrrigationMethod,
  RotationStrategyId,
  SalinityLevel,
  SoilType,
  WaterSource,
} from '../../types/agrishift';

interface ArtworkProps {
  className?: string;
}

/**
 * Rich, layered botanical SVG illustrations for each Egyptian crop so users recognize crops instantly by sight.
 */
export const CropArtwork: React.FC<{ cropId: CropId | 'undecided'; className?: string }> = ({
  cropId,
  className = 'w-16 h-16',
}) => {
  switch (cropId) {
    case 'wheat':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#FEF3C7" />
          <path d="M48 82V26" stroke="#B45309" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M36 78C36 62 44 54 48 52" stroke="#D97706" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M60 78C60 62 52 54 48 52" stroke="#D97706" strokeWidth="3" fill="none" strokeLinecap="round" />
          {[28, 38, 48, 58].map((y, i) => (
            <g key={i}>
              <ellipse cx="41" cy={y} rx="6" ry="9" transform={`rotate(-28 41 ${y})`} fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
              <ellipse cx="55" cy={y} rx="6" ry="9" transform={`rotate(28 55 ${y})`} fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
            </g>
          ))}
          <ellipse cx="48" cy="18" rx="5" ry="9" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
          <path d="M48 10V4M36 16L30 10M60 16L66 10" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'berseem':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#DCFCE7" />
          <path d="M48 80V44M48 64L30 50M48 60L66 48" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="48" cy="34" r="10" fill="#22C55E" stroke="#166534" strokeWidth="2" />
          <circle cx="38" cy="44" r="10" fill="#16A34A" stroke="#166534" strokeWidth="2" />
          <circle cx="58" cy="44" r="10" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
          <circle cx="26" cy="46" r="8" fill="#22C55E" stroke="#166534" strokeWidth="1.8" />
          <circle cx="70" cy="44" r="8" fill="#22C55E" stroke="#166534" strokeWidth="1.8" />
          <circle cx="48" cy="24" r="5" fill="#FDF4FF" stroke="#E879F9" strokeWidth="1.5" />
        </svg>
      );
    case 'faba_bean':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#ECFCCB" />
          <path d="M24 68C28 40 52 24 72 22C74 44 58 68 24 68Z" fill="#65A30D" stroke="#365314" strokeWidth="2.5" />
          <ellipse cx="40" cy="52" rx="7" ry="5.5" transform="rotate(-30 40 52)" fill="#D9F99D" stroke="#3F6212" strokeWidth="1.8" />
          <ellipse cx="52" cy="41" rx="7" ry="5.5" transform="rotate(-30 52 41)" fill="#D9F99D" stroke="#3F6212" strokeWidth="1.8" />
          <ellipse cx="63" cy="31" rx="6" ry="4.5" transform="rotate(-30 63 31)" fill="#D9F99D" stroke="#3F6212" strokeWidth="1.8" />
          <path d="M24 68L18 76" stroke="#365314" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'maize':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#FEF9C3" />
          <path d="M48 18C38 22 36 44 40 66H56C60 44 58 22 48 18Z" fill="#FACC15" stroke="#A16207" strokeWidth="2" />
          <path d="M42 30H54M40 40H56M40 50H56M42 60H54" stroke="#CA8A04" strokeWidth="1.6" />
          <path d="M48 22V64" stroke="#CA8A04" strokeWidth="1.4" />
          <path d="M36 74C24 60 26 42 36 36C38 50 42 62 48 74Z" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
          <path d="M60 74C72 60 70 42 60 36C58 50 54 62 48 74Z" fill="#16A34A" stroke="#15803D" strokeWidth="2" />
          <path d="M44 18C43 12 46 10 48 12C50 10 53 12 52 18" stroke="#D97706" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'sorghum':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#FFEDD5" />
          <path d="M48 82V46" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
          <path d="M48 64C34 58 28 62 24 68M48 60C62 54 68 58 72 64" stroke="#16A34A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <ellipse cx="48" cy="34" rx="14" ry="20" fill="#C2410C" stroke="#7C2D12" strokeWidth="2" />
          {[
            [42, 26], [54, 26], [48, 20], [40, 35], [56, 35], [48, 32], [43, 44], [53, 44],
          ].map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="3.8" fill="#FDBA74" />
          ))}
        </svg>
      );
    case 'rice':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#E0F2FE" />
          <path d="M16 68C26 64 36 72 48 68C60 64 70 72 80 68" stroke="#0284C7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M22 76C32 72 40 78 48 76C58 72 66 78 74 76" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M48 68C48 48 40 30 28 24" stroke="#65A30D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M48 68C48 46 58 28 70 24" stroke="#65A30D" strokeWidth="3" fill="none" strokeLinecap="round" />
          {[
            [30, 26], [35, 32], [40, 38], [66, 26], [61, 32], [56, 38],
          ].map(([cx, cy], idx) => (
            <ellipse key={idx} cx={cx} cy={cy} rx="4" ry="2.5" fill="#FDE047" stroke="#A16207" strokeWidth="1.2" />
          ))}
        </svg>
      );
    case 'cotton':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#F1F5F9" />
          <path d="M48 82V58" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          <path d="M30 58L48 64L66 58L58 46L38 46Z" fill="#78350F" stroke="#451A03" strokeWidth="2" />
          <circle cx="48" cy="36" r="14" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          <circle cx="36" cy="44" r="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          <circle cx="60" cy="44" r="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
          <circle cx="48" cy="45" r="10" fill="#F8FAFC" />
        </svg>
      );
    case 'sugar_beet':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#FFE4E6" />
          <path d="M48 38C40 24 32 16 28 20C26 26 36 36 44 40" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
          <path d="M48 38C48 20 48 12 48 12C54 18 54 30 50 40" fill="#16A34A" stroke="#15803D" strokeWidth="2" />
          <path d="M48 38C56 24 64 16 68 20C70 26 60 36 52 40" fill="#4ADE80" stroke="#15803D" strokeWidth="2" />
          <path d="M32 52C32 40 64 40 64 52C64 68 54 78 48 84C42 78 32 68 32 52Z" fill="#E11D48" stroke="#881337" strokeWidth="2.5" />
          <path d="M40 50C40 46 56 46 56 50" stroke="#FDA4AF" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'onion':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#F3E8FF" />
          <path d="M48 32V12M44 32L38 14M52 32L58 14" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
          <path d="M48 30C66 36 72 52 68 66C64 76 56 80 48 80C40 80 32 76 28 66C24 52 30 36 48 30Z" fill="#A855F7" stroke="#6B21A8" strokeWidth="2.5" />
          <path d="M48 30C56 40 58 60 48 80M48 30C40 40 38 60 48 80" stroke="#E9D5FF" strokeWidth="1.6" fill="none" />
        </svg>
      );
    case 'potato':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#FEF3C7" />
          <ellipse cx="44" cy="54" rx="24" ry="18" transform="rotate(-14 44 54)" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
          <ellipse cx="60" cy="42" rx="16" ry="12" transform="rotate(18 60 42)" fill="#F59E0B" stroke="#78350F" strokeWidth="2.5" />
          <circle cx="34" cy="52" r="2" fill="#78350F" />
          <circle cx="46" cy="60" r="2" fill="#78350F" />
          <circle cx="62" cy="40" r="1.8" fill="#78350F" />
        </svg>
      );
    case 'tomato':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#FEE2E2" />
          <circle cx="48" cy="54" r="24" fill="#EF4444" stroke="#991B1B" strokeWidth="2.5" />
          <ellipse cx="38" cy="46" rx="5" ry="3" transform="rotate(-30 38 46)" fill="#FCA5A5" />
          <path d="M48 30L40 22L46 28L48 18L50 28L56 22L48 30L36 32L44 34L48 40L52 34L60 32Z" fill="#16A34A" stroke="#14532D" strokeWidth="1.5" />
        </svg>
      );
    case 'sesame':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#FEF3C7" />
          <path d="M48 82V22" stroke="#65A30D" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="34" y="34" width="10" height="16" rx="5" fill="#FDE68A" stroke="#92400E" strokeWidth="2" />
          <rect x="52" y="28" width="10" height="16" rx="5" fill="#FCD34D" stroke="#92400E" strokeWidth="2" />
          <rect x="34" y="54" width="10" height="16" rx="5" fill="#FCD34D" stroke="#92400E" strokeWidth="2" />
          <rect x="52" y="50" width="10" height="16" rx="5" fill="#FDE68A" stroke="#92400E" strokeWidth="2" />
          <circle cx="48" cy="18" r="6" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.8" />
        </svg>
      );
    case 'peanut':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#FFEDD5" />
          <path
            d="M32 64C24 58 24 46 32 40C37 36 42 38 46 34C50 30 52 24 60 24C70 24 74 36 68 44C62 52 56 50 52 56C48 62 40 70 32 64Z"
            fill="#FDBA74"
            stroke="#9A3412"
            strokeWidth="2.5"
          />
          <path d="M36 48L62 32M34 56L64 40" stroke="#C2410C" strokeWidth="1.4" strokeDasharray="3 3" />
          <circle cx="62" cy="64" r="10" fill="#EA580C" stroke="#7C2D12" strokeWidth="2" />
        </svg>
      );
    case 'undecided':
    default:
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="#ECFDF5" />
          <path d="M48 76V40" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
          <path d="M48 48C32 48 26 36 28 24C40 24 48 34 48 48Z" fill="#34D399" stroke="#065F46" strokeWidth="2.2" />
          <path d="M48 42C64 42 70 30 68 18C56 18 48 28 48 42Z" fill="#10B981" stroke="#065F46" strokeWidth="2.2" />
          <circle cx="70" cy="68" r="11" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M70 63V73M65 68H75" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
};

export const IrrigationArtwork: React.FC<{ method: IrrigationMethod } & ArtworkProps> = ({
  method,
  className = 'w-16 h-16',
}) => {
  switch (method) {
    case 'flood':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="6" y="10" width="84" height="76" rx="18" fill="#E0F2FE" />
          <path d="M12 62C24 54 36 68 48 60C60 52 72 68 84 60V78H12Z" fill="#0284C7" />
          <path d="M12 48C24 40 36 54 48 46C60 38 72 54 84 46" stroke="#0EA5E9" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M32 42V22M48 40V18M64 42V22" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'drip':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="6" y="10" width="84" height="76" rx="18" fill="#ECFDF5" />
          <rect x="12" y="34" width="72" height="8" rx="4" fill="#334155" />
          <path d="M30 42C26 50 26 56 30 56C34 56 34 50 30 42Z" fill="#0EA5E9" />
          <path d="M66 42C62 50 62 56 66 56C70 56 70 50 66 42Z" fill="#0EA5E9" />
          <path d="M30 74V58M66 74V58" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
          <circle cx="30" cy="60" r="7" fill="#22C55E" />
          <circle cx="66" cy="60" r="7" fill="#22C55E" />
          <rect x="12" y="72" width="72" height="10" rx="4" fill="#78350F" />
        </svg>
      );
    case 'sprinkler':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="6" y="10" width="84" height="76" rx="18" fill="#F0F9FF" />
          <path d="M48 76V46" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
          <path d="M48 46C36 28 24 30 16 42M48 46C60 28 72 30 80 42M48 46C42 26 54 26 48 16" stroke="#0284C7" strokeWidth="3" strokeDasharray="4 4" fill="none" strokeLinecap="round" />
          <rect x="14" y="72" width="68" height="8" rx="4" fill="#22C55E" />
        </svg>
      );
    case 'pivot':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="6" y="10" width="84" height="76" rx="18" fill="#FEF3C7" />
          <circle cx="48" cy="48" r="28" fill="#22C55E" stroke="#15803D" strokeWidth="3" />
          <line x1="48" y1="48" x2="72" y2="34" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <circle cx="48" cy="48" r="5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
        </svg>
      );
  }
};

export const WaterSourceArtwork: React.FC<{ source: WaterSource } & ArtworkProps> = ({
  source,
  className = 'w-14 h-14',
}) =>
  source === 'canal' ? (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="#E0F2FE" />
      <path d="M12 52C26 42 54 42 68 52L62 66H18Z" fill="#0284C7" />
      <path d="M18 44C28 38 52 38 62 44" stroke="#38BDF8" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M22 40V22M22 22L14 26M22 22L30 26" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="#FEF3C7" />
      <rect x="16" y="46" width="48" height="18" rx="6" fill="#0369A1" />
      <rect x="35" y="18" width="10" height="36" rx="3" fill="#475569" />
      <path d="M26 24H54" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );

export const SoilArtwork: React.FC<{ soil: SoilType } & ArtworkProps> = ({
  soil,
  className = 'w-14 h-14',
}) => {
  const palette =
    soil === 'clay'
      ? { top: '#57534E', mid: '#44403C', bot: '#292524', dot: '#78716C' }
      : soil === 'loamy'
      ? { top: '#92400E', mid: '#78350F', bot: '#451A03', dot: '#B45309' }
      : { top: '#FCD34D', mid: '#F59E0B', bot: '#D97706', dot: '#FEF3C7' };
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="#F8FAFC" />
      <path d="M12 42Q40 34 68 42V62Q40 72 12 62Z" fill={palette.mid} />
      <path d="M12 42Q40 34 68 42Q40 50 12 42Z" fill={palette.top} />
      <circle cx="28" cy="52" r="2.5" fill={palette.dot} />
      <circle cx="46" cy="56" r="3" fill={palette.dot} />
      <circle cx="56" cy="48" r="2" fill={palette.dot} />
      <path d="M40 38V20M40 28C34 26 32 22 34 18M40 26C46 24 48 20 46 16" stroke="#16A34A" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
};

export const SalinityArtwork: React.FC<{ level: SalinityLevel } & ArtworkProps> = ({
  level,
  className = 'w-14 h-14',
}) => (
  <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
    <circle
      cx="40"
      cy="40"
      r="36"
      fill={level === 'fresh' ? '#E0F2FE' : level === 'moderate' ? '#FEF3C7' : '#FFE4E6'}
    />
    <path
      d="M40 16C26 34 24 48 24 52C24 61 31 68 40 68C49 68 56 61 56 52C56 48 54 34 40 16Z"
      fill={level === 'fresh' ? '#0EA5E9' : level === 'moderate' ? '#F59E0B' : '#E11D48'}
    />
    {level !== 'fresh' && (
      <>
        <polygon points="35,48 40,43 45,48 40,53" fill="#FFFFFF" />
        {level === 'saline' && (
          <>
            <polygon points="28,56 32,52 36,56 32,60" fill="#FFFFFF" />
            <polygon points="44,56 48,52 52,56 48,60" fill="#FFFFFF" />
          </>
        )}
      </>
    )}
  </svg>
);

export const SeasonArtwork: React.FC<{ season: EgyptianSeason } & ArtworkProps> = ({
  season,
  className = 'w-12 h-12',
}) => {
  if (season === 'winter') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#E0F2FE" />
        <path d="M22 38H44A8 8 0 0 0 44 22A10 10 0 0 0 24 20A8 8 0 0 0 22 38Z" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
        <path d="M24 44L22 50M32 44L30 50M40 44L38 50" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (season === 'summer') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#FEF3C7" />
        <circle cx="32" cy="32" r="12" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
        <path
          d="M32 10V15M32 49V54M10 32H15M49 32H54M17 17L21 21M43 43L47 47M47 17L43 21M21 43L17 47"
          stroke="#D97706"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#DCFCE7" />
      <path d="M14 42C22 36 30 46 38 40C44 36 48 42 52 38" stroke="#0284C7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="36" cy="24" r="9" fill="#FBBF24" />
      <path d="M22 38V24M22 24L16 28M22 24L28 28" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};

export const StrategyArtwork: React.FC<{ strategy: RotationStrategyId } & ArtworkProps> = ({
  strategy,
  className = 'w-12 h-12',
}) => {
  if (strategy === 'water_saving') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#E0F2FE" />
        <path d="M32 14C22 28 20 38 20 42C20 49 25 54 32 54C39 54 44 49 44 42C44 38 42 28 32 14Z" fill="#0284C7" />
        <path d="M28 40L31 43L38 35" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (strategy === 'soil_health') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#DCFCE7" />
        <path d="M32 50V24" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M32 32C22 32 18 24 20 18C28 18 32 24 32 32Z" fill="#22C55E" />
        <path d="M32 28C42 28 46 20 44 14C36 14 32 20 32 28Z" fill="#16A34A" />
        <rect x="16" y="46" width="32" height="8" rx="4" fill="#78350F" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#FEF3C7" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="#D97706" strokeWidth="3.5" strokeDasharray="24 8" />
      <circle cx="32" cy="16" r="5" fill="#16A34A" />
      <circle cx="46" cy="40" r="5" fill="#F59E0B" />
      <circle cx="18" cy="40" r="5" fill="#0284C7" />
    </svg>
  );
};

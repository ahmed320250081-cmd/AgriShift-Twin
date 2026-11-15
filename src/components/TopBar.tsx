import { ShieldCheck, UserCheck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { translateOperator, translateRole } from '../i18n/owainatTranslations';
import { UserProfile, UserRole, WorkspaceTab } from '../types/farm';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  effectiveRole: UserRole;
  authUser: UserProfile | null;
  onOpenRolePanel: () => void;
}

const NAV_ITEMS: Array<{
  id: 'twin' | 'plan' | 'map' | 'analytics' | 'access';
  en: string;
  ar: string;
}> = [
  { id: 'twin', en: '3D Twin', ar: 'التوأم 3D' },
  { id: 'plan', en: 'Rotation', ar: 'الدورة الزراعية' },
  { id: 'map', en: 'Satellite Map', ar: 'خريطة القمر' },
  { id: 'analytics', en: 'Analytics', ar: 'التحليلات' },
  { id: 'access', en: 'Team & Logs', ar: 'الفريق والسجلات' },
];

export function TopBar({
  activeTab,
  onTabChange,
  effectiveRole,
  authUser,
  onOpenRolePanel,
}: TopBarProps) {
  const { lang, t } = useLanguage();
  const roleLabel = translateRole(effectiveRole, lang);

  const isNavActive = (id: (typeof NAV_ITEMS)[number]['id']) => {
    if (id === 'analytics' && activeTab === 'weather') return true;
    return activeTab === id;
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0B1117] border-b border-slate-800 shrink-0 z-30">
      {/* Zone 1: Single Brand Wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onTabChange('twin');
        }}
        className="text-lg font-semibold tracking-tight text-slate-100 whitespace-nowrap shrink-0 font-display"
      >
        {lang === 'ar' ? 'أجري شيفت توين' : 'AgriShift Twin'}
      </a>

      {/* Zone 2: 5 Single-Line Navigation Links */}
      <nav aria-label={t.navLabel} className="flex items-center gap-6 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-t-sm cursor-pointer ${
                active
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-400 border-transparent hover:text-slate-100 hover:border-slate-700'
              }`}
            >
              {lang === 'ar' ? item.ar : item.en}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenRolePanel}
          aria-label={`${t.roleAriaPrefix} ${roleLabel}. ${t.roleAriaSuffix}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer"
        >
          {effectiveRole === 'farm_manager' ? (
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
          <span className="whitespace-nowrap">
            {authUser
              ? `${translateOperator(authUser.displayName.split(' ')[0], lang)} · ${roleLabel}`
              : roleLabel}
          </span>
        </button>
      </div>
    </header>
  );
}

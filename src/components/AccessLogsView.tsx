import { useState } from 'react';
import { Lock, LogIn, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  translateCrop,
  translateLogCategory,
  translateLogNote,
  translateOperator,
  translateRole,
} from '../i18n/owainatTranslations';
import {
  FarmPlot,
  FarmSettings,
  FieldLogEntry,
  UserProfile,
  UserRole,
} from '../types/farm';

interface AccessLogsViewProps {
  authUser: UserProfile | null;
  effectiveRole: UserRole;
  onChangePreviewRole: (role: UserRole) => void;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  authError: string | null;
  plots: FarmPlot[];
  settings: FarmSettings;
  onUpdateSettings: (next: FarmSettings) => void;
  logs: FieldLogEntry[];
  onSubmitLog: (entry: {
    plotCode: string;
    category: FieldLogEntry['category'];
    note: string;
  }) => Promise<void>;
  teamUsers: UserProfile[];
  onManagerChangeUserRole: (uid: string, role: UserRole) => Promise<void>;
}

export function AccessLogsView({
  authUser,
  effectiveRole,
  onChangePreviewRole,
  onSignInGoogle,
  onSignOut,
  authError,
  plots,
  settings,
  onUpdateSettings,
  logs,
  onSubmitLog,
  teamUsers,
  onManagerChangeUserRole,
}: AccessLogsViewProps) {
  const { lang, t } = useLanguage();
  const isManager = effectiveRole === 'farm_manager';

  const [plotCode, setPlotCode] = useState(plots[0]?.plotCode ?? 'P-01');
  const [category, setCategory] = useState<FieldLogEntry['category']>('irrigation');
  const [note, setNote] = useState('');
  const [logError, setLogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [dailyCapDraft, setDailyCapDraft] = useState(settings.aquiferDailyCapM3);
  const [lockoutTempDraft, setLockoutTempDraft] = useState(settings.evapLockoutTempC);
  const [policySaved, setPolicySaved] = useState(false);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = note.trim();
    if (trimmed.length < 3) {
      setLogError(t.access.noteValidation);
      return;
    }
    setLogError(null);
    setSubmitting(true);
    try {
      await onSubmitLog({ plotCode, category, note: trimmed });
      setNote('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B1117] px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100 font-display">
              {t.access.title}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{t.access.subtitle}</p>
          </div>
        </div>

        {/* Account & Role Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Authentication & Role Switcher */}
          <section className="lg:col-span-5 p-5 rounded-lg bg-[#111923] border border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">{t.access.identityTitle}</h2>

            {authUser ? (
              <div className="p-3.5 rounded-lg bg-[#0E151E] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">
                    {translateOperator(authUser.displayName, lang)}
                  </span>
                  <span className="text-xs font-mono text-cyan-400">
                    {translateRole(authUser.role, lang)}
                  </span>
                </div>
                <div dir="ltr" className="text-xs font-mono text-slate-400 text-start">
                  {authUser.email}
                </div>
                <button
                  type="button"
                  onClick={() => void onSignOut()}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.access.signOut}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">{t.access.signInPrompt}</p>
                <button
                  type="button"
                  onClick={() => void onSignInGoogle()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.access.signInGoogle}</span>
                </button>
                {authError && (
                  <p role="alert" className="text-xs text-rose-400">
                    {authError}
                  </p>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-xs font-medium text-slate-300">{t.access.roleSwitcherTitle}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangePreviewRole('farm_manager')}
                  aria-pressed={effectiveRole === 'farm_manager'}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                    effectiveRole === 'farm_manager'
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                      : 'bg-[#0E151E] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{translateRole('farm_manager', lang)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangePreviewRole('field_operator')}
                  aria-pressed={effectiveRole === 'field_operator'}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                    effectiveRole === 'field_operator'
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                      : 'bg-[#0E151E] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{translateRole('field_operator', lang)}</span>
                </button>
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="pt-3 border-t border-slate-800 text-xs space-y-1.5">
              <div className="font-medium text-slate-300 mb-2">{t.access.matrixTitle}</div>
              <div className="flex justify-between gap-2 text-slate-400">
                <span>{t.access.permToggle}</span>
                <span className="font-mono text-emerald-400 shrink-0">
                  {t.access.managerPlusOp}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-slate-400">
                <span>{t.access.permInspect}</span>
                <span className="font-mono text-emerald-400 shrink-0">
                  {t.access.managerPlusOp}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-slate-400">
                <span>{t.access.permSubmitLog}</span>
                <span className="font-mono text-emerald-400 shrink-0">
                  {t.access.managerPlusOp}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-slate-400">
                <span>{t.access.permModifyPolicy}</span>
                <span className="font-mono text-amber-300 shrink-0">{t.access.managerOnly}</span>
              </div>
              <div className="flex justify-between gap-2 text-slate-400">
                <span>{t.access.permAssignRoles}</span>
                <span className="font-mono text-amber-300 shrink-0">{t.access.managerOnly}</span>
              </div>
            </div>
          </section>

          {/* Estate Sustainability Governance (Manager Only) */}
          <section className="lg:col-span-7 p-5 rounded-lg bg-[#111923] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">
                {t.access.thresholdsTitle}
              </h2>
              {!isManager && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.access.lockedOperator}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estate-cap-input" className="block text-xs text-slate-400 mb-1.5">
                  {t.access.dailyCapLabel}
                </label>
                <input
                  id="estate-cap-input"
                  type="number"
                  min={10000}
                  max={100000}
                  step={1000}
                  disabled={!isManager}
                  value={dailyCapDraft}
                  onChange={(e) => setDailyCapDraft(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#0E151E] text-slate-100 border border-slate-700 rounded-lg disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="evap-lockout-input" className="block text-xs text-slate-400 mb-1.5">
                  {t.access.evapLockoutLabel}
                </label>
                <input
                  id="evap-lockout-input"
                  type="number"
                  min={30}
                  max={50}
                  step={1}
                  disabled={!isManager}
                  value={lockoutTempDraft}
                  onChange={(e) => setLockoutTempDraft(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono bg-[#0E151E] text-slate-100 border border-slate-700 rounded-lg disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!isManager}
                onClick={() => {
                  onUpdateSettings({
                    aquiferDailyCapM3: dailyCapDraft,
                    evapLockoutTempC: lockoutTempDraft,
                  });
                  setPolicySaved(true);
                  window.setTimeout(() => setPolicySaved(false), 3000);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.access.savePolicy}
              </button>
              {policySaved && (
                <span className="text-xs text-emerald-400 font-medium">{t.access.policySaved}</span>
              )}
            </div>

            {isManager && teamUsers.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-300">{t.access.teamTitle}</h3>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg">
                  {teamUsers.map((member) => (
                    <div
                      key={member.uid}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-200">{member.displayName}</div>
                        <div dir="ltr" className="font-mono text-slate-400 text-start">
                          {member.email}
                        </div>
                      </div>
                      <select
                        aria-label={`${t.access.roleForPrefix} ${member.displayName}`}
                        value={member.role}
                        onChange={(e) =>
                          void onManagerChangeUserRole(member.uid, e.target.value as UserRole)
                        }
                        className="px-2.5 py-1 text-xs bg-[#0E151E] text-slate-100 border border-slate-700 rounded-md"
                      >
                        <option value="farm_manager">{translateRole('farm_manager', lang)}</option>
                        <option value="field_operator">
                          {translateRole('field_operator', lang)}
                        </option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Field Observation Log Submission & Audit Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 p-5 rounded-lg bg-[#111923] border border-slate-800">
            <h2 className="text-base font-semibold text-slate-100 mb-3">
              {t.access.submitLogTitle}
            </h2>
            <form onSubmit={handleLogSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="log-plot" className="block text-xs text-slate-400 mb-1">
                    {t.access.plotLabel}
                  </label>
                  <select
                    id="log-plot"
                    value={plotCode}
                    onChange={(e) => setPlotCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0E151E] text-slate-100 border border-slate-700 rounded-lg"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.plotCode}>
                        {p.plotCode} ({translateCrop(p.cropType, lang)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="log-category" className="block text-xs text-slate-400 mb-1">
                    {t.access.categoryLabel}
                  </label>
                  <select
                    id="log-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FieldLogEntry['category'])}
                    className="w-full px-3 py-2 text-xs bg-[#0E151E] text-slate-100 border border-slate-700 rounded-lg"
                  >
                    <option value="irrigation">{translateLogCategory('irrigation', lang)}</option>
                    <option value="nozzle_check">
                      {translateLogCategory('nozzle_check', lang)}
                    </option>
                    <option value="soil_sample">
                      {translateLogCategory('soil_sample', lang)}
                    </option>
                    <option value="weather_action">
                      {translateLogCategory('weather_action', lang)}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="log-note" className="block text-xs text-slate-400 mb-1">
                  {t.access.noteLabel}
                </label>
                <textarea
                  id="log-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.access.notePlaceholder}
                  className="w-full px-3 py-2 text-xs bg-[#0E151E] text-slate-100 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {logError && (
                <p role="alert" className="text-xs text-rose-400">
                  {logError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? t.access.recordingLog : t.access.recordLog}
              </button>
            </form>
          </section>

          <section className="lg:col-span-7 p-5 rounded-lg bg-[#111923] border border-slate-800">
            <h2 className="text-base font-semibold text-slate-100 mb-3">{t.access.feedTitle}</h2>
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{t.access.feedEmpty}</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {logs.map((entry) => (
                  <li key={entry.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-cyan-300">
                          {entry.plotCode}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="text-slate-200 font-medium">
                          {translateOperator(entry.authorName, lang)}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="text-slate-400">
                          {translateRole(entry.authorRole, lang)}
                        </span>
                      </div>
                      <span dir="ltr" className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {entry.createdAt.slice(0, 16).replace('T', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {translateLogNote(entry.note, lang)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

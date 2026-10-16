import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { 
  Calculator, 
  FileText, 
  UserCheck, 
  CreditCard, 
  Layers, 
  Palette, 
  Type, 
  Tag, 
  UploadCloud, 
  Hash, 
  Columns, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  ShieldCheck, 
  FileEdit, 
  Clock, 
  Send, 
  Archive, 
  Lock, 
  Unlock, 
  Check, 
  Copy, 
  BookOpen, 
  Sparkles, 
  HelpCircle,
  FileCheck,
  XCircle,
  LayoutDashboard
} from 'lucide-react';
import { 
  StatusBadge, 
  BadgeStatusType, 
  PDFUploader, 
  TabularFigure, 
  MetricCard, 
  PageHeader, 
  SplitScreenViewer,
  LanguageSwitcher 
} from '@/components/ui';
import { useTranslation } from '@/hooks/use-translation';

export default function DesignSystemPreview() {
  const { t, locale } = useTranslation();

  // Navigation active anchor
  const [activeSection, setActiveSection] = useState<string>('colors');

  // Interactive PDFUploader state
  const [demoFile, setDemoFile] = useState<File | null>(null);

  // Interactive SplitScreenViewer Rubric State
  const [scoreUrgensi, setScoreUrgensi] = useState<number>(88);
  const [scoreMetode, setScoreMetode] = useState<number>(92);
  const [scoreKelayakan, setScoreKelayakan] = useState<number>(85);
  const [reviewerNotes, setReviewerNotes] = useState<string>(
    'Metodologi penelitian telah terstruktur dengan baik. Integrasi data multi-kampus memberikan nilai kebaruan yang signifikan bagi institusi.'
  );
  const [coiAcknowledged, setCoiAcknowledged] = useState<boolean>(true);
  const [recommendation, setRecommendation] = useState<string>('Lolos_Didanai');
  const [formSaved, setFormSaved] = useState<boolean>(false);

  // Copied token notification
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Calculated aggregate score for rubric (35% + 35% + 30%)
  const aggregateScore = Number((scoreUrgensi * 0.35 + scoreMetode * 0.35 + scoreKelayakan * 0.3).toFixed(2));

  // 14 Status list
  const allStatuses: {
    status: BadgeStatusType;
    label: string;
    phase: string;
    rule: string;
  }[] = [
    { status: 'Draft', label: t.statuses.Draft, phase: t.designSystem.phaseProposal, rule: t.statusDescriptions.Draft },
    { status: 'Submitted', label: t.statuses.Submitted, phase: t.designSystem.phaseProposal, rule: t.statusDescriptions.Submitted },
    { status: 'In_Review', label: t.statuses.In_Review, phase: t.designSystem.phaseReview, rule: t.statusDescriptions.In_Review },
    { status: 'Lolos_Didanai', label: t.statuses.Lolos_Didanai, phase: t.designSystem.phaseReview, rule: t.statusDescriptions.Lolos_Didanai },
    { status: 'Ditolak', label: t.statuses.Ditolak, phase: t.designSystem.phaseReview, rule: t.statusDescriptions.Ditolak },
    { status: 'Revisi', label: t.statuses.Revisi, phase: t.designSystem.phaseReview, rule: t.statusDescriptions.Revisi },
    { status: 'Contracted', label: t.statuses.Contracted, phase: t.designSystem.phaseContract, rule: t.statusDescriptions.Contracted },
    { status: 'Disbursed_T1', label: t.statuses.Disbursed_T1, phase: t.designSystem.phaseDisbursement, rule: t.statusDescriptions.Disbursed_T1 },
    { status: 'Disbursed_T2', label: t.statuses.Disbursed_T2, phase: t.designSystem.phaseDisbursement, rule: t.statusDescriptions.Disbursed_T2 },
    { status: 'Monev_Approved', label: t.statuses.Monev_Approved, phase: t.designSystem.phaseMonev, rule: t.statusDescriptions.Monev_Approved },
    { status: 'Monev_Locked', label: t.statuses.Monev_Locked, phase: t.designSystem.phaseMonev, rule: t.statusDescriptions.Monev_Locked },
    { status: 'Output_Verified', label: t.statuses.Output_Verified, phase: t.designSystem.phaseOutput, rule: t.statusDescriptions.Output_Verified },
    { status: 'Completed_SKTS', label: t.statuses.Completed_SKTS, phase: t.designSystem.phaseOutput, rule: t.statusDescriptions.Completed_SKTS },
    { status: 'Terminated', label: t.statuses.Terminated, phase: t.designSystem.phaseEdgeCase, rule: t.statusDescriptions.Terminated },
  ];

  const [statusFilter, setStatusFilter] = useState<'all' | 'usulan' | 'kontrak' | 'monev' | 'selesai'>('all');

  const filteredStatuses = allStatuses.filter((item) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'usulan') return ['Draft', 'Submitted', 'In_Review', 'Lolos_Didanai', 'Ditolak', 'Revisi'].includes(item.status);
    if (statusFilter === 'kontrak') return ['Contracted', 'Disbursed_T1', 'Disbursed_T2'].includes(item.status);
    if (statusFilter === 'monev') return ['Monev_Approved', 'Monev_Locked', 'Output_Verified'].includes(item.status);
    if (statusFilter === 'selesai') return ['Completed_SKTS', 'Terminated'].includes(item.status);
    return true;
  });

  const navItems = [
    { id: 'colors', label: t.designSystem.nav.colors, icon: Palette },
    { id: 'typography', label: t.designSystem.nav.typography, icon: Type },
    { id: 'badges', label: t.designSystem.nav.badges, icon: Tag },
    { id: 'uploader', label: t.designSystem.nav.uploader, icon: UploadCloud },
    { id: 'figures', label: t.designSystem.nav.figures, icon: Hash },
    { id: 'metrics', label: t.designSystem.nav.metrics, icon: LayoutDashboard },
    { id: 'splitscreen', label: t.designSystem.nav.splitscreen, icon: Columns },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Head title={t.designSystem.pageTitle} />

      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-blue-900 flex items-center justify-center text-white font-mono font-bold text-xs">
                RPL
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 block">
                  {t.designSystem.catalogSpecTag}
                </span>
                <span className="text-sm font-sans font-bold text-slate-900 tracking-tight">
                  {t.designSystem.previewGate}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2 text-xs font-medium">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                {t.designSystem.wcagTag}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                {t.designSystem.zeroEmojiTag}
              </span>
              <LanguageSwitcher variant="segmented" />
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-mono">
                {t.designSystem.cleanTablesTag}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="md:hidden">
                <LanguageSwitcher variant="segmented" />
              </div>
              <a
                href="#splitscreen"
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-xs"
              >
                <span>{t.designSystem.testSplitScreen}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </div>
          </div>

          {/* Sub-bar Quick Jump Navigation */}
          <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Page Header Component Showcase */}
        <PageHeader
          title={t.designSystem.title}
          isEditorialSerif={true}
          breadcrumbs={[
            { label: t.common.appName, href: '/' },
            { label: t.designSystem.breadcrumbsArch, href: '#' },
            { label: t.designSystem.breadcrumbsCatalog },
          ]}
          subtitle={t.designSystem.subtitle}
          badge={
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-sans font-bold bg-blue-900 text-white tracking-wider uppercase">
              {t.designSystem.badgeBaseline}
            </span>
          }
          actions={
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => copyToClipboard('docs/technical/design.md')}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                title={t.designSystem.copySpecTooltip}
              >
                {copiedToken === 'docs/technical/design.md' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                    <span>{t.designSystem.pathCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                    <span>{t.designSystem.designSpecBtn}</span>
                  </>
                )}
              </button>
            </div>
          }
        />

        {/* SECTION 1: Palet Warna Tokens */}
        <section id="colors" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Palette className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-sans font-bold text-slate-900">
                {t.designSystem.section1Title}
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">{t.designSystem.wcagCompliantTag}</span>
          </div>

          <p className="text-sm text-slate-600">
            {t.designSystem.section1Description}
          </p>

          {/* Group 1: Cool Slate Surfaces */}
          <div className="space-y-3">
            <h3 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
              {t.designSystem.colorGroupSurfaces}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {[
                { token: 'surface-base', hex: '#F8FAFC', tailwind: 'bg-slate-50', role: t.designSystem.surfaceBaseRole },
                { token: 'surface-card', hex: '#FFFFFF', tailwind: 'bg-white', role: t.designSystem.surfaceCardRole },
                { token: 'surface-elevated', hex: '#F1F5F9', tailwind: 'bg-slate-100', role: t.designSystem.surfaceElevatedRole },
                { token: 'surface-muted', hex: '#E2E8F0', tailwind: 'bg-slate-200', role: t.designSystem.surfaceMutedRole },
                { token: 'surface-sidebar', hex: '#0F172A', tailwind: 'bg-slate-900', role: t.designSystem.surfaceSidebarRole },
              ].map((swatch) => (
                <div
                  key={swatch.token}
                  className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 shadow-xs"
                >
                  <div
                    className={`h-16 w-full rounded border border-slate-200 flex items-center justify-center font-mono text-xs ${
                      swatch.token === 'surface-sidebar' ? 'bg-slate-900 text-white' : swatch.tailwind
                    }`}
                  >
                    {swatch.hex}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-900 block truncate">
                      {swatch.token}
                    </span>
                    <span className="text-xs text-slate-500 font-sans block mt-0.5 line-clamp-2">
                      {swatch.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Brand Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
              {t.designSystem.colorGroupBrand}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {[
                { token: 'brand-primary', hex: '#1E3A8A', tailwind: 'bg-blue-900 text-white', label: t.designSystem.brandPrimaryLabel },
                { token: 'brand-primary-hover', hex: '#1E40AF', tailwind: 'bg-blue-800 text-white', label: t.designSystem.brandPrimaryHoverLabel },
                { token: 'brand-primary-light', hex: '#EFF6FF', tailwind: 'bg-blue-50 text-blue-900', label: t.designSystem.brandPrimaryLightLabel },
                { token: 'brand-accent', hex: '#059669', tailwind: 'bg-emerald-600 text-white', label: t.designSystem.brandAccentLabel },
                { token: 'brand-accent-hover', hex: '#047857', tailwind: 'bg-emerald-700 text-white', label: t.designSystem.brandAccentHoverLabel },
                { token: 'brand-accent-light', hex: '#ECFDF5', tailwind: 'bg-emerald-50 text-emerald-800', label: t.designSystem.brandAccentLightLabel },
              ].map((swatch) => (
                <div
                  key={swatch.token}
                  className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-xs"
                >
                  <div className={`h-14 w-full rounded flex items-center justify-center font-mono text-xs font-bold ${swatch.tailwind}`}>
                    {swatch.hex}
                  </div>
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-900 block truncate">
                      {swatch.token}
                    </span>
                    <span className="text-xs text-slate-500 block truncate">
                      {swatch.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 3: Semantic System States */}
          <div className="space-y-3">
            <h3 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
              {t.designSystem.colorGroupSystem}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {[
                { name: t.designSystem.semanticSuccessName, classes: 'bg-emerald-50 text-emerald-800 border-emerald-200', hexText: '#059669', hexBg: '#ECFDF5' },
                { name: t.designSystem.semanticInfoName, classes: 'bg-sky-50 text-sky-800 border-sky-200', hexText: '#0284C7', hexBg: '#F0F9FF' },
                { name: t.designSystem.semanticWarningName, classes: 'bg-amber-50 text-amber-800 border-amber-200', hexText: '#D97706', hexBg: '#FFFBEB' },
                { name: t.designSystem.semanticDangerName, classes: 'bg-rose-50 text-rose-800 border-rose-200', hexText: '#E11D48', hexBg: '#FFF1F2' },
                { name: t.designSystem.semanticNeutralName, classes: 'bg-slate-100 text-slate-800 border-slate-300', hexText: '#475569', hexBg: '#F1F5F9' },
              ].map((state) => (
                <div
                  key={state.name}
                  className={`p-3.5 rounded-lg border flex flex-col justify-between ${state.classes}`}
                >
                  <div className="font-sans text-xs font-bold tracking-wide uppercase">
                    {state.name}
                  </div>
                  <div className="mt-3 pt-2 border-t border-current/15 font-mono text-xs flex justify-between">
                    <span>{t.designSystem.textPrefix}{state.hexText}</span>
                    <span>{t.designSystem.bgPrefix}{state.hexBg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: Tipografi Ganda */}
        <section id="typography" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Type className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-sans font-bold text-slate-900">
                {t.designSystem.section2Title}
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">{t.designSystem.section2FontsTag}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Serif Column: Scholarly */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-900">
                  {t.designSystem.typoScholarly}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                  {t.designSystem.typoScholarlyFont}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">{t.designSystem.typoScholarlyHeading}</span>
                  <h3 className="font-serif text-2xl font-semibold text-slate-900 leading-snug">
                    {t.designSystem.typoScholarlySampleTitle}
                  </h3>
                </div>
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">{t.designSystem.typoScholarlyAbstractLabel}</span>
                  <p className="font-serif text-sm text-slate-800 leading-relaxed italic border-l-2 border-blue-900 pl-3">
                    {t.designSystem.typoScholarlySampleAbstract}
                  </p>
                </div>
                <div className="pt-2 text-xs font-sans text-slate-500">
                  {t.designSystem.typoScholarlyUsage}
                </div>
              </div>
            </div>

            {/* Sans Column: Enterprise */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                  {t.designSystem.typoEnterprise}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                  {t.designSystem.typoEnterpriseFont}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">{t.designSystem.typoEnterpriseHeading}</span>
                  <h4 className="font-sans text-base font-bold text-slate-900">
                    {t.designSystem.typoEnterpriseSampleHeading}
                  </h4>
                </div>
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">{t.designSystem.typoEnterpriseInputLabel}</span>
                  <label className="block text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider">
                    {t.designSystem.typoEnterpriseInputLabel} <span className="text-rose-600">*</span>
                  </label>
                  <div className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-sans text-slate-800">
                    0612088501 - Dr. Ir. Hendra Prasetyo, M.T.
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <button className="px-3 py-1.5 bg-blue-900 text-white text-xs font-sans font-semibold rounded hover:bg-blue-800">
                    {t.designSystem.typoEnterpriseSaveBtn}
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-sans font-medium rounded hover:bg-slate-50">
                    {t.designSystem.typoEnterpriseCancelBtn}
                  </button>
                </div>
                <div className="pt-2 text-xs font-sans text-slate-500">
                  {t.designSystem.typoEnterpriseUsage}
                </div>
              </div>
            </div>

            {/* Mono Column: Tabular & Financial */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                  {t.designSystem.typoTabular}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                  {t.designSystem.typoTabularFont}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-sans text-slate-400 block mb-1">{t.designSystem.typoTabularHeading}</span>
                  <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {locale === 'en' ? 'IDR 75,000,000.00' : 'Rp75.000.000,00'}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.designSystem.typoTabularTermin1}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{locale === 'en' ? 'IDR 52,500,000.00' : 'Rp52.500.000,00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.designSystem.typoTabularTermin2}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{locale === 'en' ? 'IDR 22,500,000.00' : 'Rp22.500.000,00'}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">{t.designSystem.typoTabularPassing}</span>
                    <span className="font-bold text-emerald-700 tabular-nums">87.50 / 100.00</span>
                  </div>
                </div>
                <div className="pt-2 text-xs font-sans text-slate-500">
                  {t.designSystem.typoTabularUsage}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: StatusBadge (14 Status) */}
        <section id="badges" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200 gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  {t.designSystem.section3Title}
                </h2>
                <p className="text-xs text-slate-500">
                  {t.designSystem.statusDescription}
                </p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1 overflow-x-auto text-xs">
              {[
                { id: 'all', label: `${t.designSystem.filterAll} (14)` },
                { id: 'usulan', label: `${t.designSystem.filterProposal} (6)` },
                { id: 'kontrak', label: `${t.designSystem.filterContract} (3)` },
                { id: 'monev', label: `${t.designSystem.filterMonev} (3)` },
                { id: 'selesai', label: `${t.designSystem.filterCompletion} (2)` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-blue-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-sans font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{t.designSystem.statusColKey}</th>
                    <th className="py-3 px-4">{t.designSystem.statusColSmall}</th>
                    <th className="py-3 px-4">{t.designSystem.statusColMedium}</th>
                    <th className="py-3 px-4">{t.designSystem.statusColPhase}</th>
                    <th className="py-3 px-4">{t.designSystem.statusColRule}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {filteredStatuses.map((item) => (
                    <tr key={item.status} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {item.status}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="md" />
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.phase}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {item.rule}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: PDFUploader */}
        <section id="uploader" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  {t.designSystem.section4Title}
                </h2>
                <p className="text-xs text-slate-500">
                  {t.designSystem.section4Description}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">{t.designSystem.uploadGuardTag}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Instance 1: Interactive Live Demo */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-sans font-bold text-blue-900 uppercase tracking-wider">
                  {t.designSystem.uploaderInteractiveTitle}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono">
                  {t.designSystem.uploaderReadyBadge}
                </span>
              </div>
              <PDFUploader
                value={demoFile}
                onChange={(file) => setDemoFile(file)}
                maxSizeMB={10}
                label={t.designSystem.uploaderProposalLabel}
                required={true}
                helperText={t.designSystem.uploaderProposalHelper}
              />
              {demoFile && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 space-y-1">
                  <div className="font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.designSystem.uploaderFileVerified}</span>
                  </div>
                  <div className="font-mono text-[11px] text-emerald-700">
                    {t.designSystem.uploaderSize}: {(demoFile.size / (1024 * 1024)).toFixed(2)} MB &bull; MIME: {demoFile.type || 'application/pdf'}
                  </div>
                </div>
              )}
            </div>

            {/* Instance 2: Pre-filled State */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
                  {t.designSystem.uploaderPrefilledTitle}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                  {t.designSystem.uploaderPrefilledBadge}
                </span>
              </div>
              <PDFUploader
                value={null}
                existingFileUrl="/sample-proposal.pdf"
                onChange={() => {}}
                maxSizeMB={10}
                label={t.designSystem.uploaderMonevLabel}
                helperText={t.designSystem.uploaderMonevHelper}
              />
              <p className="text-xs text-slate-500 font-sans">
                {t.designSystem.uploaderPrefilledDesc}
              </p>
            </div>

            {/* Instance 3: Disabled / Locked State */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider">
                  {t.designSystem.uploaderLockedTitle}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono">
                  {t.designSystem.uploaderLockedBadge}
                </span>
              </div>
              <PDFUploader
                value={null}
                onChange={() => {}}
                maxSizeMB={10}
                disabled={true}
                label={t.designSystem.uploaderContractLabel}
                helperText={t.designSystem.uploaderContractHelper}
              />
              <p className="text-xs text-slate-500 font-sans">
                {t.designSystem.uploaderLockedDesc}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: TabularFigure */}
        <section id="figures" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  {t.designSystem.section5Title}
                </h2>
                <p className="text-xs text-slate-500">
                  {t.designSystem.section5Description}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">{t.designSystem.intlNumberFormatTag}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card Currency */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
              <span className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                {t.designSystem.figureCurrencyLabel}
              </span>
              <div className="py-2">
                <TabularFigure value={125000000} type="currency" size="xl" weight="bold" align="left" />
              </div>
              <p className="text-xs text-slate-500 font-sans">
                {t.designSystem.figureCurrencyCaption}
              </p>
            </div>

            {/* Card Score */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
              <span className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                {t.designSystem.figureScoreLabel}
              </span>
              <div className="py-2">
                <TabularFigure value={91.75} type="score" size="xl" weight="bold" align="left" suffix=" / 100.00" />
              </div>
              <p className="text-xs text-slate-500 font-sans">
                {t.designSystem.figureScoreCaption}
              </p>
            </div>

            {/* Card Percentage */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
              <span className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                {t.designSystem.figurePercentageLabel}
              </span>
              <div className="py-2">
                <TabularFigure value={70.0} type="percentage" size="xl" weight="bold" align="left" prefix={t.designSystem.figurePercentagePrefix} />
              </div>
              <p className="text-xs text-slate-500 font-sans">
                {t.designSystem.figurePercentageCaption}
              </p>
            </div>

            {/* Card Integer */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-xs">
              <span className="text-xs font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                {t.designSystem.figureIntegerLabel}
              </span>
              <div className="py-2">
                <TabularFigure value={1420} type="integer" size="xl" weight="bold" align="left" suffix={t.designSystem.figureIntegerSuffix} />
              </div>
              <p className="text-xs text-slate-500 font-sans">
                {t.designSystem.figureIntegerCaption}
              </p>
            </div>
          </div>

          {/* Demonstration: Zero-CLS Alignment Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">
                  {t.designSystem.matrixTitle}
                </h4>
                <p className="text-xs text-slate-500">
                  {t.designSystem.matrixSubtitle}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                {t.designSystem.zeroClsBadge}
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-sans font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">{t.designSystem.matrixColBudget}</th>
                  <th className="py-2.5 px-4 text-center">{t.designSystem.matrixColShare}</th>
                  <th className="py-2.5 px-4 text-right">{t.designSystem.matrixColAllocation}</th>
                  <th className="py-2.5 px-4 text-right">{t.designSystem.matrixColRealization}</th>
                  <th className="py-2.5 px-4 text-center">{t.designSystem.matrixColStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {[
                  { name: t.designSystem.matrixRow1, porsi: 70.0, alokasi: 35000000, realisasi: 35000000, status: 'Disbursed_T1' as BadgeStatusType },
                  { name: t.designSystem.matrixRow2, porsi: 30.0, alokasi: 15000000, realisasi: 0, status: 'Monev_Locked' as BadgeStatusType },
                  { name: t.designSystem.matrixRow3, porsi: 20.0, alokasi: 10000000, realisasi: 10000000, status: 'Disbursed_T1' as BadgeStatusType },
                  { name: t.designSystem.matrixRow4, porsi: 40.0, alokasi: 20000000, realisasi: 18450000, status: 'Disbursed_T1' as BadgeStatusType },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{row.name}</td>
                    <td className="py-2.5 px-4 text-center">
                      <TabularFigure value={row.porsi} type="percentage" size="sm" align="center" />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <TabularFigure value={row.alokasi} type="currency" size="sm" align="right" weight="semibold" />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <TabularFigure value={row.realisasi} type="currency" size="sm" align="right" />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 6: MetricCard Bento Grid */}
        <section id="metrics" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  {t.designSystem.section6Title}
                </h2>
                <p className="text-xs text-slate-500">
                  {t.designSystem.section6Description}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">{t.designSystem.bentoTag}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title={t.designSystem.metric1Title}
              value={750000000}
              type="currency"
              icon={Calculator}
              iconBgClass="bg-blue-50"
              iconColorClass="text-blue-900"
              caption={t.designSystem.metric1Caption}
              badgeText={t.designSystem.metric1Badge}
              badgeVariant="neutral"
            />
            <MetricCard
              title={t.designSystem.metric2Title}
              value={142}
              type="integer"
              icon={FileText}
              iconBgClass="bg-sky-50"
              iconColorClass="text-sky-700"
              caption={t.designSystem.metric2Caption}
              badgeText={t.designSystem.metric2Badge}
              badgeVariant="success"
            />
            <MetricCard
              title={t.designSystem.metric3Title}
              value={28}
              type="integer"
              icon={UserCheck}
              iconBgClass="bg-amber-50"
              iconColorClass="text-amber-800"
              caption={t.designSystem.metric3Caption}
              badgeText={t.designSystem.metric3Badge}
              badgeVariant="warning"
            />
            <MetricCard
              title={t.designSystem.metric4Title}
              value={315000000}
              type="currency"
              icon={CreditCard}
              iconBgClass="bg-emerald-50"
              iconColorClass="text-emerald-700"
              caption={t.designSystem.metric4Caption}
              badgeText={t.designSystem.metric4Badge}
              badgeVariant="success"
            />
          </div>
        </section>

        {/* SECTION 7: SplitScreenViewer */}
        <section id="splitscreen" className="space-y-6 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <Columns className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  {t.designSystem.section7Title}
                </h2>
                <p className="text-xs text-slate-500">
                  {t.designSystem.section7Description}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">{t.designSystem.splitScreenRatioTag}</span>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
            {/* Embedded Live Split Screen Viewer */}
            <div className="h-[620px] w-full">
              <SplitScreenViewer
                pdfUrl="/sample-proposal.pdf"
                documentTitle="Proposal-Riset-Penelitian-Dasar-2026.pdf"
                headerActions={
                  <div className="flex items-center space-x-2 mr-2">
                    <StatusBadge status="In_Review" size="sm" />
                    <span className="text-xs font-mono text-slate-500">{t.designSystem.reviewer1Assignment}</span>
                  </div>
                }
                formContent={
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-sans text-sm font-bold text-slate-900 uppercase tracking-wide">
                        {t.components.splitScreen.rubricTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.components.splitScreen.rubricSubtitle}
                      </p>
                    </div>

                    {/* Kriteria 1 */}
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-slate-700">
                          {t.components.splitScreen.criteriaUrgency}
                        </label>
                        <TabularFigure value={scoreUrgensi} type="score" size="sm" weight="bold" />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scoreUrgensi}
                        onChange={(e) => {
                          setScoreUrgensi(Number(e.target.value));
                          setFormSaved(false);
                        }}
                        className="w-full accent-blue-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{t.components.splitScreen.scoreRangePoor}</span>
                        <span>{t.components.splitScreen.scoreRangeFair}</span>
                        <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                      </div>
                    </div>

                    {/* Kriteria 2 */}
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-slate-700">
                          {t.components.splitScreen.criteriaMethodology}
                        </label>
                        <TabularFigure value={scoreMetode} type="score" size="sm" weight="bold" />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scoreMetode}
                        onChange={(e) => {
                          setScoreMetode(Number(e.target.value));
                          setFormSaved(false);
                        }}
                        className="w-full accent-blue-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{t.components.splitScreen.scoreRangePoor}</span>
                        <span>{t.components.splitScreen.scoreRangeFair}</span>
                        <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                      </div>
                    </div>

                    {/* Kriteria 3 */}
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-slate-700">
                          {t.components.splitScreen.criteriaFeasibility}
                        </label>
                        <TabularFigure value={scoreKelayakan} type="score" size="sm" weight="bold" />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={scoreKelayakan}
                        onChange={(e) => {
                          setScoreKelayakan(Number(e.target.value));
                          setFormSaved(false);
                        }}
                        className="w-full accent-blue-900 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{t.components.splitScreen.scoreRangePoor}</span>
                        <span>{t.components.splitScreen.scoreRangeFair}</span>
                        <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                      </div>
                    </div>

                    {/* Total Aggregate Score Display */}
                    <div className="p-3.5 bg-blue-50/75 border border-blue-200 rounded-md flex items-center justify-between">
                      <div>
                        <span className="text-xs font-sans font-semibold text-blue-900 block">
                          {t.components.splitScreen.aggregateScoreLabel}
                        </span>
                        <span className="text-[11px] text-slate-600 font-sans">
                          {t.designSystem.rubricPassingGrade}
                        </span>
                      </div>
                      <TabularFigure
                        value={aggregateScore}
                        type="score"
                        size="2xl"
                        weight="bold"
                        className={aggregateScore >= 70 ? 'text-emerald-700' : 'text-rose-700'}
                      />
                    </div>

                    {/* Recommendation Select */}
                    <div className="space-y-1">
                      <label className="block text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider">
                        {t.components.splitScreen.recommendationLabel} <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={recommendation}
                        onChange={(e) => {
                          setRecommendation(e.target.value);
                          setFormSaved(false);
                        }}
                        className="w-full text-xs font-sans rounded border-slate-300 bg-white py-1.5 px-2.5 focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                      >
                        <option value="Lolos_Didanai">{t.designSystem.recFunded}</option>
                        <option value="Revisi">{t.designSystem.recRevision}</option>
                        <option value="Ditolak">{t.designSystem.recRejected}</option>
                      </select>
                    </div>

                    {/* Reviewer Qualitative Feedback */}
                    <div className="space-y-1">
                      <label className="block text-xs font-sans font-semibold text-slate-700 uppercase tracking-wider">
                        {t.components.splitScreen.reviewerNotesLabel}
                      </label>
                      <textarea
                        rows={3}
                        value={reviewerNotes}
                        onChange={(e) => {
                          setReviewerNotes(e.target.value);
                          setFormSaved(false);
                        }}
                        className="w-full text-xs font-sans rounded border-slate-300 p-2.5 focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                        placeholder={t.designSystem.reviewerNotesPlaceholder}
                      />
                    </div>

                    {/* Conflict of Interest Checkbox */}
                    <div className="flex items-start space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded">
                      <input
                        type="checkbox"
                        id="coi_ack"
                        checked={coiAcknowledged}
                        onChange={(e) => setCoiAcknowledged(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                      <label htmlFor="coi_ack" className="text-[11px] text-slate-700 font-sans leading-tight cursor-pointer">
                        {t.components.splitScreen.coiAgreement}
                      </label>
                    </div>

                    {/* Form Action Buttons */}
                    <div className="pt-2 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setFormSaved(true)}
                        className="flex-1 py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-sans font-semibold transition-colors shadow-xs"
                      >
                        {formSaved ? t.designSystem.draftSavedBtn : t.components.splitScreen.saveDraftButton}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormSaved(true);
                          alert(t.designSystem.evaluationSubmittedAlert);
                        }}
                        className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-sans font-semibold transition-colors shadow-xs"
                      >
                        {t.components.splitScreen.finalSubmitButton}
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* Footer Audit Information */}
        <footer className="pt-8 pb-12 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-sans">
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">
              {t.designSystem.footerTitle}
            </p>
            <p>
              {t.designSystem.footerSubtitle}
            </p>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            {t.designSystem.footerBaseline}
          </div>
        </footer>
      </main>
    </div>
  );
}

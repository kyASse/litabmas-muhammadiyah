import {
    BadgeStatusType,
    LanguageSwitcher,
    MetricCard,
    PageHeader,
    PDFUploader,
    SplitScreenViewer,
    StatusBadge,
    TabularFigure,
} from '@/components/ui';
import { useTranslation } from '@/hooks/use-translation';
import { Head } from '@inertiajs/react';
import {
    Calculator,
    Check,
    CheckCircle2,
    Columns,
    Copy,
    CreditCard,
    ExternalLink,
    FileText,
    Hash,
    LayoutDashboard,
    Palette,
    Tag,
    Type,
    UploadCloud,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';

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
        'Metodologi penelitian telah terstruktur dengan baik. Integrasi data multi-kampus memberikan nilai kebaruan yang signifikan bagi institusi.',
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
        {
            status: 'Output_Verified',
            label: t.statuses.Output_Verified,
            phase: t.designSystem.phaseOutput,
            rule: t.statusDescriptions.Output_Verified,
        },
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
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            <Head title={t.designSystem.pageTitle} />

            {/* Top Banner Navigation */}
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-900 font-mono text-xs font-bold text-white">
                                RPL
                            </div>
                            <div>
                                <span className="block font-mono text-xs tracking-widest text-slate-500 uppercase">
                                    {t.designSystem.catalogSpecTag}
                                </span>
                                <span className="font-sans text-sm font-bold tracking-tight text-slate-900">{t.designSystem.previewGate}</span>
                            </div>
                        </div>

                        <div className="hidden items-center space-x-2 text-xs font-medium md:flex">
                            <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-emerald-700">
                                {t.designSystem.wcagTag}
                            </span>
                            <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-blue-800">
                                {t.designSystem.zeroEmojiTag}
                            </span>
                            <LanguageSwitcher variant="segmented" />
                            <span className="inline-flex items-center rounded border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-slate-700">
                                {t.designSystem.cleanTablesTag}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className="md:hidden">
                                <LanguageSwitcher variant="segmented" />
                            </div>
                            <a
                                href="#splitscreen"
                                className="inline-flex items-center rounded-md bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-800"
                            >
                                <span>{t.designSystem.testSplitScreen}</span>
                                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Sub-bar Quick Jump Navigation */}
                    <nav className="flex scrollbar-none space-x-1 overflow-x-auto border-t border-slate-100 py-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            return (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`flex items-center space-x-1.5 rounded px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                                        isActive ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </a>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Main Container */}
            <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
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
                        <span className="inline-flex items-center rounded bg-blue-900 px-2.5 py-1 font-sans text-xs font-bold tracking-wider text-white uppercase">
                            {t.designSystem.badgeBaseline}
                        </span>
                    }
                    actions={
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => copyToClipboard('docs/technical/design.md')}
                                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                title={t.designSystem.copySpecTooltip}
                            >
                                {copiedToken === 'docs/technical/design.md' ? (
                                    <>
                                        <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                                        <span>{t.designSystem.pathCopied}</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                                        <span>{t.designSystem.designSpecBtn}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    }
                />

                {/* SECTION 1: Palet Warna Tokens */}
                <section id="colors" className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2.5">
                            <div className="rounded border border-blue-200 bg-blue-50 p-1.5 text-blue-900">
                                <Palette className="h-4 w-4" />
                            </div>
                            <h2 className="font-sans text-lg font-bold text-slate-900">{t.designSystem.section1Title}</h2>
                        </div>
                        <span className="font-mono text-xs text-slate-500">{t.designSystem.wcagCompliantTag}</span>
                    </div>

                    <p className="text-sm text-slate-600">{t.designSystem.section1Description}</p>

                    {/* Group 1: Cool Slate Surfaces */}
                    <div className="space-y-3">
                        <h3 className="font-sans text-xs font-bold tracking-wider text-slate-700 uppercase">{t.designSystem.colorGroupSurfaces}</h3>
                        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
                            {[
                                { token: 'surface-base', hex: '#F8FAFC', tailwind: 'bg-slate-50', role: t.designSystem.surfaceBaseRole },
                                { token: 'surface-card', hex: '#FFFFFF', tailwind: 'bg-white', role: t.designSystem.surfaceCardRole },
                                { token: 'surface-elevated', hex: '#F1F5F9', tailwind: 'bg-slate-100', role: t.designSystem.surfaceElevatedRole },
                                { token: 'surface-muted', hex: '#E2E8F0', tailwind: 'bg-slate-200', role: t.designSystem.surfaceMutedRole },
                                { token: 'surface-sidebar', hex: '#0F172A', tailwind: 'bg-slate-900', role: t.designSystem.surfaceSidebarRole },
                            ].map((swatch) => (
                                <div key={swatch.token} className="space-y-2.5 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                                    <div
                                        className={`flex h-16 w-full items-center justify-center rounded border border-slate-200 font-mono text-xs ${
                                            swatch.token === 'surface-sidebar' ? 'bg-slate-900 text-white' : swatch.tailwind
                                        }`}
                                    >
                                        {swatch.hex}
                                    </div>
                                    <div>
                                        <span className="block truncate font-mono text-xs font-semibold text-slate-900">{swatch.token}</span>
                                        <span className="mt-0.5 line-clamp-2 block font-sans text-xs text-slate-500">{swatch.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Group 2: Brand Identity */}
                    <div className="space-y-3">
                        <h3 className="font-sans text-xs font-bold tracking-wider text-slate-700 uppercase">{t.designSystem.colorGroupBrand}</h3>
                        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
                            {[
                                {
                                    token: 'brand-primary',
                                    hex: '#1E3A8A',
                                    tailwind: 'bg-blue-900 text-white',
                                    label: t.designSystem.brandPrimaryLabel,
                                },
                                {
                                    token: 'brand-primary-hover',
                                    hex: '#1E40AF',
                                    tailwind: 'bg-blue-800 text-white',
                                    label: t.designSystem.brandPrimaryHoverLabel,
                                },
                                {
                                    token: 'brand-primary-light',
                                    hex: '#EFF6FF',
                                    tailwind: 'bg-blue-50 text-blue-900',
                                    label: t.designSystem.brandPrimaryLightLabel,
                                },
                                {
                                    token: 'brand-accent',
                                    hex: '#059669',
                                    tailwind: 'bg-emerald-600 text-white',
                                    label: t.designSystem.brandAccentLabel,
                                },
                                {
                                    token: 'brand-accent-hover',
                                    hex: '#047857',
                                    tailwind: 'bg-emerald-700 text-white',
                                    label: t.designSystem.brandAccentHoverLabel,
                                },
                                {
                                    token: 'brand-accent-light',
                                    hex: '#ECFDF5',
                                    tailwind: 'bg-emerald-50 text-emerald-800',
                                    label: t.designSystem.brandAccentLightLabel,
                                },
                            ].map((swatch) => (
                                <div key={swatch.token} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                                    <div
                                        className={`flex h-14 w-full items-center justify-center rounded font-mono text-xs font-bold ${swatch.tailwind}`}
                                    >
                                        {swatch.hex}
                                    </div>
                                    <div>
                                        <span className="block truncate font-mono text-xs font-semibold text-slate-900">{swatch.token}</span>
                                        <span className="block truncate text-xs text-slate-500">{swatch.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Group 3: Semantic System States */}
                    <div className="space-y-3">
                        <h3 className="font-sans text-xs font-bold tracking-wider text-slate-700 uppercase">{t.designSystem.colorGroupSystem}</h3>
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                            {[
                                {
                                    name: t.designSystem.semanticSuccessName,
                                    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                                    hexText: '#059669',
                                    hexBg: '#ECFDF5',
                                },
                                {
                                    name: t.designSystem.semanticInfoName,
                                    classes: 'bg-sky-50 text-sky-800 border-sky-200',
                                    hexText: '#0284C7',
                                    hexBg: '#F0F9FF',
                                },
                                {
                                    name: t.designSystem.semanticWarningName,
                                    classes: 'bg-amber-50 text-amber-800 border-amber-200',
                                    hexText: '#D97706',
                                    hexBg: '#FFFBEB',
                                },
                                {
                                    name: t.designSystem.semanticDangerName,
                                    classes: 'bg-rose-50 text-rose-800 border-rose-200',
                                    hexText: '#E11D48',
                                    hexBg: '#FFF1F2',
                                },
                                {
                                    name: t.designSystem.semanticNeutralName,
                                    classes: 'bg-slate-100 text-slate-800 border-slate-300',
                                    hexText: '#475569',
                                    hexBg: '#F1F5F9',
                                },
                            ].map((state) => (
                                <div key={state.name} className={`flex flex-col justify-between rounded-lg border p-3.5 ${state.classes}`}>
                                    <div className="font-sans text-xs font-bold tracking-wide uppercase">{state.name}</div>
                                    <div className="mt-3 flex justify-between border-t border-current/15 pt-2 font-mono text-xs">
                                        <span>
                                            {t.designSystem.textPrefix}
                                            {state.hexText}
                                        </span>
                                        <span>
                                            {t.designSystem.bgPrefix}
                                            {state.hexBg}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SECTION 2: Tipografi Ganda */}
                <section id="typography" className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2.5">
                            <div className="rounded border border-blue-200 bg-blue-50 p-1.5 text-blue-900">
                                <Type className="h-4 w-4" />
                            </div>
                            <h2 className="font-sans text-lg font-bold text-slate-900">{t.designSystem.section2Title}</h2>
                        </div>
                        <span className="font-mono text-xs text-slate-500">{t.designSystem.section2FontsTag}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Serif Column: Scholarly */}
                        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="font-mono text-xs font-bold tracking-wider text-blue-900 uppercase">
                                    {t.designSystem.typoScholarly}
                                </span>
                                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                                    {t.designSystem.typoScholarlyFont}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="mb-1 block font-sans text-xs text-slate-400">{t.designSystem.typoScholarlyHeading}</span>
                                    <h3 className="font-serif text-2xl leading-snug font-semibold text-slate-900">
                                        {t.designSystem.typoScholarlySampleTitle}
                                    </h3>
                                </div>
                                <div>
                                    <span className="mb-1 block font-sans text-xs text-slate-400">{t.designSystem.typoScholarlyAbstractLabel}</span>
                                    <p className="border-l-2 border-blue-900 pl-3 font-serif text-sm leading-relaxed text-slate-800 italic">
                                        {t.designSystem.typoScholarlySampleAbstract}
                                    </p>
                                </div>
                                <div className="pt-2 font-sans text-xs text-slate-500">{t.designSystem.typoScholarlyUsage}</div>
                            </div>
                        </div>

                        {/* Sans Column: Enterprise */}
                        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="font-mono text-xs font-bold tracking-wider text-slate-700 uppercase">
                                    {t.designSystem.typoEnterprise}
                                </span>
                                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                                    {t.designSystem.typoEnterpriseFont}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="mb-1 block font-sans text-xs text-slate-400">{t.designSystem.typoEnterpriseHeading}</span>
                                    <h4 className="font-sans text-base font-bold text-slate-900">{t.designSystem.typoEnterpriseSampleHeading}</h4>
                                </div>
                                <div>
                                    <span className="mb-1 block font-sans text-xs text-slate-400">{t.designSystem.typoEnterpriseInputLabel}</span>
                                    <label className="block font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        {t.designSystem.typoEnterpriseInputLabel} <span className="text-rose-600">*</span>
                                    </label>
                                    <div className="mt-1 rounded border border-slate-300 bg-slate-50 px-3 py-1.5 font-sans text-xs text-slate-800">
                                        0612088501 - Dr. Ir. Hendra Prasetyo, M.T.
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <button className="rounded bg-blue-900 px-3 py-1.5 font-sans text-xs font-semibold text-white hover:bg-blue-800">
                                        {t.designSystem.typoEnterpriseSaveBtn}
                                    </button>
                                    <button className="rounded border border-slate-300 bg-white px-3 py-1.5 font-sans text-xs font-medium text-slate-700 hover:bg-slate-50">
                                        {t.designSystem.typoEnterpriseCancelBtn}
                                    </button>
                                </div>
                                <div className="pt-2 font-sans text-xs text-slate-500">{t.designSystem.typoEnterpriseUsage}</div>
                            </div>
                        </div>

                        {/* Mono Column: Tabular & Financial */}
                        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="font-mono text-xs font-bold tracking-wider text-emerald-800 uppercase">
                                    {t.designSystem.typoTabular}
                                </span>
                                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                                    {t.designSystem.typoTabularFont}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="mb-1 block font-sans text-xs text-slate-400">{t.designSystem.typoTabularHeading}</span>
                                    <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                                        {locale === 'en' ? 'IDR 75,000,000.00' : 'Rp75.000.000,00'}
                                    </div>
                                </div>
                                <div className="space-y-1.5 rounded border border-slate-200 bg-slate-50 p-3 font-mono text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{t.designSystem.typoTabularTermin1}</span>
                                        <span className="font-semibold text-slate-900 tabular-nums">
                                            {locale === 'en' ? 'IDR 52,500,000.00' : 'Rp52.500.000,00'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{t.designSystem.typoTabularTermin2}</span>
                                        <span className="font-semibold text-slate-900 tabular-nums">
                                            {locale === 'en' ? 'IDR 22,500,000.00' : 'Rp22.500.000,00'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-200 pt-1">
                                        <span className="text-slate-500">{t.designSystem.typoTabularPassing}</span>
                                        <span className="font-bold text-emerald-700 tabular-nums">87.50 / 100.00</span>
                                    </div>
                                </div>
                                <div className="pt-2 font-sans text-xs text-slate-500">{t.designSystem.typoTabularUsage}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: StatusBadge (14 Status) */}
                <section id="badges" className="space-y-6 pt-4">
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-2.5">
                            <div className="rounded border border-blue-200 bg-blue-50 p-1.5 text-blue-900">
                                <Tag className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="font-sans text-lg font-bold text-slate-900">{t.designSystem.section3Title}</h2>
                                <p className="text-xs text-slate-500">{t.designSystem.statusDescription}</p>
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
                                    className={`rounded px-2.5 py-1 font-medium whitespace-nowrap transition-colors ${
                                        statusFilter === f.id
                                            ? 'bg-blue-900 text-white'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-100 font-sans font-semibold tracking-wider text-slate-700 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">{t.designSystem.statusColKey}</th>
                                        <th className="px-4 py-3">{t.designSystem.statusColSmall}</th>
                                        <th className="px-4 py-3">{t.designSystem.statusColMedium}</th>
                                        <th className="px-4 py-3">{t.designSystem.statusColPhase}</th>
                                        <th className="px-4 py-3">{t.designSystem.statusColRule}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-sans">
                                    {filteredStatuses.map((item) => (
                                        <tr key={item.status} className="transition-colors hover:bg-slate-50/75">
                                            <td className="px-4 py-3 font-mono font-medium text-slate-900">{item.status}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge status={item.status} size="sm" />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge status={item.status} size="md" />
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{item.phase}</td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{item.rule}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* SECTION 4: PDFUploader */}
                <section id="uploader" className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2.5">
                            <div className="rounded border border-blue-200 bg-blue-50 p-1.5 text-blue-900">
                                <UploadCloud className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="font-sans text-lg font-bold text-slate-900">{t.designSystem.section4Title}</h2>
                                <p className="text-xs text-slate-500">{t.designSystem.section4Description}</p>
                            </div>
                        </div>
                        <span className="font-mono text-xs text-slate-500">{t.designSystem.uploadGuardTag}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Instance 1: Interactive Live Demo */}
                        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-sans text-xs font-bold tracking-wider text-blue-900 uppercase">
                                    {t.designSystem.uploaderInteractiveTitle}
                                </span>
                                <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-700">
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
                                <div className="space-y-1 rounded border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                                    <div className="flex items-center space-x-1.5 font-semibold">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>{t.designSystem.uploaderFileVerified}</span>
                                    </div>
                                    <div className="font-mono text-[11px] text-emerald-700">
                                        {t.designSystem.uploaderSize}: {(demoFile.size / (1024 * 1024)).toFixed(2)} MB &bull; MIME:{' '}
                                        {demoFile.type || 'application/pdf'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Instance 2: Pre-filled State */}
                        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-sans text-xs font-bold tracking-wider text-slate-700 uppercase">
                                    {t.designSystem.uploaderPrefilledTitle}
                                </span>
                                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
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
                            <p className="font-sans text-xs text-slate-500">{t.designSystem.uploaderPrefilledDesc}</p>
                        </div>

                        {/* Instance 3: Disabled / Locked State */}
                        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-sans text-xs font-bold tracking-wider text-slate-700 uppercase">
                                    {t.designSystem.uploaderLockedTitle}
                                </span>
                                <span className="rounded bg-rose-50 px-2 py-0.5 font-mono text-xs text-rose-700">
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
                            <p className="font-sans text-xs text-slate-500">{t.designSystem.uploaderLockedDesc}</p>
                        </div>
                    </div>
                </section>

                {/* SECTION 5: TabularFigure */}
                <section id="figures" className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2.5">
                            <div className="rounded border border-blue-200 bg-blue-50 p-1.5 text-blue-900">
                                <Hash className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="font-sans text-lg font-bold text-slate-900">{t.designSystem.section5Title}</h2>
                                <p className="text-xs text-slate-500">{t.designSystem.section5Description}</p>
                            </div>
                        </div>
                        <span className="font-mono text-xs text-slate-500">{t.designSystem.intlNumberFormatTag}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Card Currency */}
                        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                            <span className="block font-sans text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                {t.designSystem.figureCurrencyLabel}
                            </span>
                            <div className="py-2">
                                <TabularFigure value={125000000} type="currency" size="xl" weight="bold" align="left" />
                            </div>
                            <p className="font-sans text-xs text-slate-500">{t.designSystem.figureCurrencyCaption}</p>
                        </div>

                        {/* Card Score */}
                        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                            <span className="block font-sans text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                {t.designSystem.figureScoreLabel}
                            </span>
                            <div className="py-2">
                                <TabularFigure value={91.75} type="score" size="xl" weight="bold" align="left" suffix=" / 100.00" />
                            </div>
                            <p className="font-sans text-xs text-slate-500">{t.designSystem.figureScoreCaption}</p>
                        </div>

                        {/* Card Percentage */}
                        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                            <span className="block font-sans text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                {t.designSystem.figurePercentageLabel}
                            </span>
                            <div className="py-2">
                                <TabularFigure
                                    value={70.0}
                                    type="percentage"
                                    size="xl"
                                    weight="bold"
                                    align="left"
                                    prefix={t.designSystem.figurePercentagePrefix}
                                />
                            </div>
                            <p className="font-sans text-xs text-slate-500">{t.designSystem.figurePercentageCaption}</p>
                        </div>

                        {/* Card Integer */}
                        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                            <span className="block font-sans text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                {t.designSystem.figureIntegerLabel}
                            </span>
                            <div className="py-2">
                                <TabularFigure
                                    value={1420}
                                    type="integer"
                                    size="xl"
                                    weight="bold"
                                    align="left"
                                    suffix={t.designSystem.figureIntegerSuffix}
                                />
                            </div>
                            <p className="font-sans text-xs text-slate-500">{t.designSystem.figureIntegerCaption}</p>
                        </div>
                    </div>

                    {/* Demonstration: Zero-CLS Alignment Table */}
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
                            <div>
                                <h4 className="font-sans text-xs font-bold tracking-wider text-slate-800 uppercase">{t.designSystem.matrixTitle}</h4>
                                <p className="text-xs text-slate-500">{t.designSystem.matrixSubtitle}</p>
                            </div>
                            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-800">
                                {t.designSystem.zeroClsBadge}
                            </span>
                        </div>
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-100 font-sans font-semibold text-slate-700 uppercase">
                                <tr>
                                    <th className="px-4 py-2.5">{t.designSystem.matrixColBudget}</th>
                                    <th className="px-4 py-2.5 text-center">{t.designSystem.matrixColShare}</th>
                                    <th className="px-4 py-2.5 text-right">{t.designSystem.matrixColAllocation}</th>
                                    <th className="px-4 py-2.5 text-right">{t.designSystem.matrixColRealization}</th>
                                    <th className="px-4 py-2.5 text-center">{t.designSystem.matrixColStatus}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-sans">
                                {[
                                    {
                                        name: t.designSystem.matrixRow1,
                                        porsi: 70.0,
                                        alokasi: 35000000,
                                        realisasi: 35000000,
                                        status: 'Disbursed_T1' as BadgeStatusType,
                                    },
                                    {
                                        name: t.designSystem.matrixRow2,
                                        porsi: 30.0,
                                        alokasi: 15000000,
                                        realisasi: 0,
                                        status: 'Monev_Locked' as BadgeStatusType,
                                    },
                                    {
                                        name: t.designSystem.matrixRow3,
                                        porsi: 20.0,
                                        alokasi: 10000000,
                                        realisasi: 10000000,
                                        status: 'Disbursed_T1' as BadgeStatusType,
                                    },
                                    {
                                        name: t.designSystem.matrixRow4,
                                        porsi: 40.0,
                                        alokasi: 20000000,
                                        realisasi: 18450000,
                                        status: 'Disbursed_T1' as BadgeStatusType,
                                    },
                                ].map((row, idx) => (
                                    <tr key={idx} className="transition-colors hover:bg-slate-50">
                                        <td className="px-4 py-2.5 font-medium text-slate-900">{row.name}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <TabularFigure value={row.porsi} type="percentage" size="sm" align="center" />
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <TabularFigure value={row.alokasi} type="currency" size="sm" align="right" weight="semibold" />
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <TabularFigure value={row.realisasi} type="currency" size="sm" align="right" />
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
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
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2.5">
                            <div className="rounded border border-blue-200 bg-blue-50 p-1.5 text-blue-900">
                                <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="font-sans text-lg font-bold text-slate-900">{t.designSystem.section6Title}</h2>
                                <p className="text-xs text-slate-500">{t.designSystem.section6Description}</p>
                            </div>
                        </div>
                        <span className="font-mono text-xs text-slate-500">{t.designSystem.bentoTag}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2.5">
                            <div className="rounded border border-blue-200 bg-blue-50 p-1.5 text-blue-900">
                                <Columns className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="font-sans text-lg font-bold text-slate-900">{t.designSystem.section7Title}</h2>
                                <p className="text-xs text-slate-500">{t.designSystem.section7Description}</p>
                            </div>
                        </div>
                        <span className="font-mono text-xs text-slate-500">{t.designSystem.splitScreenRatioTag}</span>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                        {/* Embedded Live Split Screen Viewer */}
                        <div className="h-[620px] w-full">
                            <SplitScreenViewer
                                pdfUrl="/sample-proposal.pdf"
                                documentTitle="Proposal-Riset-Penelitian-Dasar-2026.pdf"
                                headerActions={
                                    <div className="mr-2 flex items-center space-x-2">
                                        <StatusBadge status="In_Review" size="sm" />
                                        <span className="font-mono text-xs text-slate-500">{t.designSystem.reviewer1Assignment}</span>
                                    </div>
                                }
                                formContent={
                                    <div className="space-y-5">
                                        <div>
                                            <h3 className="font-sans text-sm font-bold tracking-wide text-slate-900 uppercase">
                                                {t.components.splitScreen.rubricTitle}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-slate-500">{t.components.splitScreen.rubricSubtitle}</p>
                                        </div>

                                        {/* Kriteria 1 */}
                                        <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <label className="font-semibold text-slate-700">{t.components.splitScreen.criteriaUrgency}</label>
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
                                                className="w-full cursor-pointer accent-blue-900"
                                            />
                                            <div className="flex justify-between font-mono text-[10px] text-slate-400">
                                                <span>{t.components.splitScreen.scoreRangePoor}</span>
                                                <span>{t.components.splitScreen.scoreRangeFair}</span>
                                                <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                                            </div>
                                        </div>

                                        {/* Kriteria 2 */}
                                        <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <label className="font-semibold text-slate-700">{t.components.splitScreen.criteriaMethodology}</label>
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
                                                className="w-full cursor-pointer accent-blue-900"
                                            />
                                            <div className="flex justify-between font-mono text-[10px] text-slate-400">
                                                <span>{t.components.splitScreen.scoreRangePoor}</span>
                                                <span>{t.components.splitScreen.scoreRangeFair}</span>
                                                <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                                            </div>
                                        </div>

                                        {/* Kriteria 3 */}
                                        <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <label className="font-semibold text-slate-700">{t.components.splitScreen.criteriaFeasibility}</label>
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
                                                className="w-full cursor-pointer accent-blue-900"
                                            />
                                            <div className="flex justify-between font-mono text-[10px] text-slate-400">
                                                <span>{t.components.splitScreen.scoreRangePoor}</span>
                                                <span>{t.components.splitScreen.scoreRangeFair}</span>
                                                <span>{t.components.splitScreen.scoreRangeExcellent}</span>
                                            </div>
                                        </div>

                                        {/* Total Aggregate Score Display */}
                                        <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/75 p-3.5">
                                            <div>
                                                <span className="block font-sans text-xs font-semibold text-blue-900">
                                                    {t.components.splitScreen.aggregateScoreLabel}
                                                </span>
                                                <span className="font-sans text-[11px] text-slate-600">{t.designSystem.rubricPassingGrade}</span>
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
                                            <label className="block font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                                {t.components.splitScreen.recommendationLabel} <span className="text-rose-600">*</span>
                                            </label>
                                            <select
                                                value={recommendation}
                                                onChange={(e) => {
                                                    setRecommendation(e.target.value);
                                                    setFormSaved(false);
                                                }}
                                                className="w-full rounded border-slate-300 bg-white px-2.5 py-1.5 font-sans text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                                            >
                                                <option value="Lolos_Didanai">{t.designSystem.recFunded}</option>
                                                <option value="Revisi">{t.designSystem.recRevision}</option>
                                                <option value="Ditolak">{t.designSystem.recRejected}</option>
                                            </select>
                                        </div>

                                        {/* Reviewer Qualitative Feedback */}
                                        <div className="space-y-1">
                                            <label className="block font-sans text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                                {t.components.splitScreen.reviewerNotesLabel}
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={reviewerNotes}
                                                onChange={(e) => {
                                                    setReviewerNotes(e.target.value);
                                                    setFormSaved(false);
                                                }}
                                                className="w-full rounded border-slate-300 p-2.5 font-sans text-xs focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                                                placeholder={t.designSystem.reviewerNotesPlaceholder}
                                            />
                                        </div>

                                        {/* Conflict of Interest Checkbox */}
                                        <div className="flex items-start space-x-2 rounded border border-slate-200 bg-slate-50 p-2.5">
                                            <input
                                                type="checkbox"
                                                id="coi_ack"
                                                checked={coiAcknowledged}
                                                onChange={(e) => setCoiAcknowledged(e.target.checked)}
                                                className="mt-0.5 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                                            />
                                            <label htmlFor="coi_ack" className="cursor-pointer font-sans text-[11px] leading-tight text-slate-700">
                                                {t.components.splitScreen.coiAgreement}
                                            </label>
                                        </div>

                                        {/* Form Action Buttons */}
                                        <div className="flex items-center space-x-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormSaved(true)}
                                                className="flex-1 rounded bg-blue-900 px-3 py-2 font-sans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-800"
                                            >
                                                {formSaved ? t.designSystem.draftSavedBtn : t.components.splitScreen.saveDraftButton}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormSaved(true);
                                                    alert(t.designSystem.evaluationSubmittedAlert);
                                                }}
                                                className="rounded bg-emerald-700 px-3 py-2 font-sans text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-800"
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
                <footer className="flex flex-col gap-4 border-t border-slate-200 pt-8 pb-12 font-sans text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <p className="font-semibold text-slate-700">{t.designSystem.footerTitle}</p>
                        <p>{t.designSystem.footerSubtitle}</p>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">{t.designSystem.footerBaseline}</div>
                </footer>
            </main>
        </div>
    );
}

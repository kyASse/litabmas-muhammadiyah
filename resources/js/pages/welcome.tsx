import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TabularFigure } from '@/components/ui/TabularFigure';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BookOpen,
    Building2,
    CheckCircle2,
    FileText,
    GraduationCap,
    LayoutDashboard,
    Lock,
    Search,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

interface ResearchSchemeItem {
    id: number;
    nama_skema?: string;
    name?: string;
    deskripsi?: string;
    description?: string;
    biaya_maksimal?: string | number;
    max_funding?: string | number;
    tanggal_mulai?: string;
    tanggal_selesai?: string;
    university?: {
        id: number;
        name: string;
        code: string;
    } | null;
}

interface WelcomeProps extends SharedData {
    overallStats?: {
        totalUniversities?: number;
        totalSchemas?: number;
        totalProposals?: number;
        totalOutputs?: number;
    };
    activeSchemas?: ResearchSchemeItem[];
}

export default function Welcome() {
    const { auth, overallStats, activeSchemas } = usePage<WelcomeProps>().props;
    const { t } = useTranslation();
    const [searchFilter, setSearchFilter] = useState('');

    const stats = overallStats || {
        totalUniversities: 0,
        totalSchemas: 0,
        totalProposals: 0,
        totalOutputs: 0,
    };

    const schemes = activeSchemas || [];
    const filteredSchemes = schemes.filter((s) => {
        const title = (s.nama_skema || s.name || '').toLowerCase();
        const desc = (s.deskripsi || s.description || '').toLowerCase();
        const query = searchFilter.toLowerCase();
        return title.includes(query) || desc.includes(query);
    });

    return (
        <>
            <Head title={`${t.common.appName} - ${t.welcome.heroTitle}`}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-900 selection:text-white dark:bg-slate-950 dark:text-slate-100">
                {/* TOP NAVIGATION BAR */}
                <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-serif text-lg font-bold tracking-tight text-slate-900 dark:text-white">{t.common.appName}</span>
                                <span className="text-[11px] font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                    {t.common.specTag}
                                </span>
                            </div>
                        </div>

                        {/* Middle Links */}
                        <div className="hidden text-sm font-medium text-slate-600 md:flex md:items-center md:gap-6 dark:text-slate-300">
                            <a href="#statistik" className="transition-colors hover:text-blue-900 dark:hover:text-blue-400">
                                {t.welcome.statsNav}
                            </a>
                            <a href="#skema-riset" className="transition-colors hover:text-blue-900 dark:hover:text-blue-400">
                                {t.welcome.schemesNav}
                            </a>
                            <a href="#pilar-tata-kelola" className="transition-colors hover:text-blue-900 dark:hover:text-blue-400">
                                {t.welcome.governanceNav}
                            </a>
                        </div>

                        {/* Auth Navigation, LanguageSwitcher & ThemeToggle */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <LanguageSwitcher variant="compact" />
                            <ThemeToggle variant="compact" />
                            {auth?.user ? (
                                <Link href={route('dashboard')}>
                                    <Button className="h-9 gap-2 rounded-lg bg-blue-900 px-4 text-xs font-semibold text-white shadow hover:bg-blue-800">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span>{t.welcome.openDashboard}</span>
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')}>
                                        <Button
                                            variant="ghost"
                                            className="h-9 rounded-lg px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            {t.navigation.login}
                                        </Button>
                                    </Link>
                                    <Link href={route('register')}>
                                        <Button className="h-9 rounded-lg bg-blue-900 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-800">
                                            {t.navigation.register}
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* HERO SECTION */}
                <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 sm:py-24 dark:border-slate-800 dark:bg-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.06),transparent_50%)]"></div>
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
                                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span>{t.welcome.platformBadge}</span>
                            </div>

                            <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                                {t.welcome.heroTitle}
                            </h1>

                            <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">{t.welcome.heroSubtitle}</p>

                            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                                <Link href={auth?.user ? route('dashboard') : route('login')}>
                                    <Button className="h-11 gap-2 rounded-lg bg-blue-900 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">
                                        <span>{auth?.user ? t.welcome.dashboardCta : t.welcome.loginCta}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>

                                <a href="#skema-riset">
                                    <Button
                                        variant="outline"
                                        className="h-11 gap-2 rounded-lg border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <BookOpen className="h-4 w-4 text-blue-900 dark:text-blue-400" />
                                        <span>{t.welcome.exploreSchemes}</span>
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* OVERALL METRICS SECTION (BENTO GRID) */}
                <section id="statistik" className="relative mx-auto -mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title={t.welcome.participatingUniversities}
                            value={stats.totalUniversities || 0}
                            type="integer"
                            icon={Building2}
                            iconBgClass="bg-blue-50"
                            iconColorClass="text-blue-900"
                            badgeText="MULTI-TENANT"
                            badgeVariant="neutral"
                            caption={t.welcome.participatingUniversitiesCaption}
                        />
                        <MetricCard
                            title={t.welcome.activeSchemesCount}
                            value={stats.totalSchemas || 0}
                            type="integer"
                            icon={BookOpen}
                            iconBgClass="bg-emerald-50"
                            iconColorClass="text-emerald-700"
                            badgeText={t.welcome.competitiveBadge}
                            badgeVariant="success"
                            caption={t.welcome.activeSchemesCaption}
                        />
                        <MetricCard
                            title={t.welcome.proposalsSubmitted}
                            value={stats.totalProposals || 0}
                            type="integer"
                            icon={FileText}
                            iconBgClass="bg-amber-50"
                            iconColorClass="text-amber-700"
                            badgeText={t.welcome.registeredBadge}
                            badgeVariant="warning"
                            caption={t.welcome.proposalsCaption}
                        />
                        <MetricCard
                            title={t.welcome.verifiedOutputs}
                            value={stats.totalOutputs || 0}
                            type="integer"
                            icon={Award}
                            iconBgClass="bg-purple-50"
                            iconColorClass="text-purple-700"
                            badgeText={t.welcome.validBadge}
                            badgeVariant="neutral"
                            caption={t.welcome.outputsCaption}
                        />
                    </div>
                </section>

                {/* ACTIVE RESEARCH SCHEMES SECTION */}
                <section id="skema-riset" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                                {t.welcome.openSchemesBadge}
                            </span>
                            <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {t.welcome.schemesTitle}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.welcome.schemesSubtitle}</p>
                        </div>

                        {/* Search Filter */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t.welcome.searchPlaceholder}
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {filteredSchemes.length === 0 ? (
                        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                            <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
                            <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">{t.welcome.noSchemesFound}</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.welcome.contactLppm}</p>
                        </div>
                    ) : (
                        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredSchemes.map((scheme) => {
                                const title = scheme.nama_skema || scheme.name || t.welcome.schemeFallback;
                                const description = scheme.deskripsi || scheme.description || t.welcome.noDesc;
                                const funding = Number(scheme.biaya_maksimal || scheme.max_funding || 0);

                                return (
                                    <div
                                        key={scheme.id}
                                        className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <StatusBadge status="Lolos_Didanai" size="sm" />
                                                {scheme.university && (
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                        {scheme.university.code}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="mt-4 font-serif text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                                            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                                {description}
                                            </p>
                                        </div>

                                        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                        {t.welcome.maxFunding}
                                                    </span>
                                                    <div className="mt-0.5">
                                                        <TabularFigure
                                                            value={funding}
                                                            type="currency"
                                                            className="text-base font-bold text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                </div>

                                                <Link href={auth?.user ? route('dashboard') : route('login')}>
                                                    <Button
                                                        variant="outline"
                                                        className="h-8 rounded-lg border-blue-200 px-3 text-xs font-semibold text-blue-900 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300"
                                                    >
                                                        {t.welcome.applyScheme}
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ARCHITECTURE PILLARS SECTION */}
                <section id="pilar-tata-kelola" className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <span className="text-xs font-semibold tracking-wider text-blue-900 uppercase dark:text-blue-400">
                                {t.welcome.architectureBadge}
                            </span>
                            <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {t.welcome.pillarsTitle}
                            </h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.welcome.pillarsSubtitle}</p>
                        </div>

                        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{t.welcome.pillar1Title}</h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t.welcome.pillar1Desc}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{t.welcome.pillar2Title}</h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t.welcome.pillar2Desc}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{t.welcome.pillar3Title}</h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t.welcome.pillar3Desc}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{t.welcome.pillar4Title}</h3>
                                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t.welcome.pillar4Desc}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="border-t border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-950">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-serif text-sm font-bold text-slate-900 dark:text-white">{t.common.appName}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.welcome.footerInstitution}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <Link href={route('login')} className="hover:text-blue-900 dark:hover:text-white">
                                    {t.navigation.login}
                                </Link>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <Link href={route('register')} className="hover:text-blue-900 dark:hover:text-white">
                                    {t.navigation.register}
                                </Link>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-slate-200/60 pt-6 text-center text-xs text-slate-400 dark:border-slate-800">
                            {t.welcome.footerNotice}
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

/**
 * @fileoverview Dashboard/User.tsx — Personal research-proposal dashboard for the
 * "Peneliti / Dosen" role (Modul 6 – Dashboard dan Pelaporan).
 *
 * Displays KPI metric cards and a visual success-rate ring sourced from the
 * `proposals` table (Modul 1 – Manajemen Proposal Penelitian) as specified in
 * the Sistem Penelitian Terintegrasi PRD Standalone.
 *
 * Data flow:
 *   DashboardController (PHP) → Inertia::render('Dashboard/User', [...])
 *     → this component via `stats` and `proposal_stats` page props.
 *
 * @module pages/Dashboard/User
 * @author RPL-2026
 */

import { MetricCard } from '@/components/ui/MetricCard';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Coins, DraftingCompass, FileText, Inbox, Layers, Percent, Plus, XCircle } from 'lucide-react';

/**
 * Proposal riset statistics aggregated per-user from the `proposals` table.
 * Sourced from StatsService::getProposalSummaryForUser().
 */
interface ProposalStats {
    total: number;
    masuk: number;
    lolos: number;
    gagal: number;
    draft: number;
    success_rate: number;
    total_pendanaan: number;
}

/**
 * Dashboard statistics for the User (Peneliti/Dosen) role.
 */
interface DashboardStats {
    total_proposals: number;
    proposal_masuk: number;
    proposal_lolos: number;
    proposal_gagal: number;
    proposal_draft: number;
    total_pendanaan: number;
}

interface UserDashboardProps extends PageProps {
    stats: DashboardStats;
    proposal_stats: ProposalStats;
}

/**
 * Renders an animated SVG progress ring showing the proposal success rate.
 */
function SuccessRing({ rate }: { rate: number }) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const filled = (rate / 100) * circumference;
    const color = rate >= 75 ? 'text-emerald-500' : rate >= 40 ? 'text-amber-500' : 'text-rose-500';

    return (
        <div className="relative flex h-24 w-24 items-center justify-center">
            <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - filled}
                    className={`${color} transition-all duration-700 ease-out`}
                />
            </svg>
            <span className={`absolute font-mono text-lg font-bold ${color}`}>{rate}%</span>
        </div>
    );
}

export default function UserDashboard({ stats: _stats, proposal_stats }: UserDashboardProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const { t, format } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [{ title: t.navigation.dashboard, href: '/dashboard' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.navigation.dashboard} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 sm:p-6 lg:p-8">
                {/* Welcome banner */}
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div>
                        <h1 className="font-sans text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
                            {format(t.userDashboard.welcomeTitle, { name: user.name })}
                        </h1>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t.userDashboard.welcomeSubtitle}</p>
                    </div>
                    <Link
                        href={route('proposal.index')}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 sm:mt-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <FileText className="h-4 w-4 text-blue-900 dark:text-blue-400" />
                        {t.userDashboard.myProposals}
                    </Link>
                </div>

                {/* Section: Ringkasan Proposal Riset */}
                <section aria-labelledby="proposal-section-title">
                    <h2
                        id="proposal-section-title"
                        className="mb-3 text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400"
                    >
                        {t.userDashboard.proposalSummaryTitle}
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <MetricCard
                            title={t.userDashboard.totalProposals}
                            value={proposal_stats.total}
                            type="integer"
                            caption={t.userDashboard.totalProposalsDesc}
                            icon={Layers}
                            iconBgClass="bg-blue-50 dark:bg-blue-950/40"
                            iconColorClass="text-blue-900 dark:text-blue-400"
                        />

                        <MetricCard
                            title={t.userDashboard.draft}
                            value={proposal_stats.draft}
                            type="integer"
                            caption={t.userDashboard.draftDesc}
                            icon={DraftingCompass}
                            iconBgClass="bg-slate-100 dark:bg-slate-800"
                            iconColorClass="text-slate-700 dark:text-slate-300"
                            badgeText="[DRAFT]"
                            badgeVariant="neutral"
                        />

                        <MetricCard
                            title={t.userDashboard.awaitingReview}
                            value={proposal_stats.masuk}
                            type="integer"
                            caption={t.userDashboard.awaitingReviewDesc}
                            icon={Inbox}
                            iconBgClass="bg-amber-50 dark:bg-amber-950/40"
                            iconColorClass="text-amber-700 dark:text-amber-400"
                            badgeText="[SUBMITTED]"
                            badgeVariant="warning"
                        />
                    </div>
                </section>

                {/* Section: Hasil Seleksi Administrasi */}
                <section aria-labelledby="seleksi-section-title">
                    <h2
                        id="seleksi-section-title"
                        className="mb-3 text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400"
                    >
                        {t.userDashboard.selectionResultsTitle}
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <MetricCard
                            title={t.userDashboard.passedAdmin}
                            value={proposal_stats.lolos}
                            type="integer"
                            caption={t.userDashboard.passedAdminDesc}
                            icon={CheckCircle2}
                            iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
                            iconColorClass="text-emerald-700 dark:text-emerald-400"
                            badgeText="[LOLOS]"
                            badgeVariant="success"
                        />

                        <MetricCard
                            title={t.userDashboard.rejected}
                            value={proposal_stats.gagal}
                            type="integer"
                            caption={t.userDashboard.rejectedDesc}
                            icon={XCircle}
                            iconBgClass="bg-rose-50 dark:bg-rose-950/40"
                            iconColorClass="text-rose-700 dark:text-rose-400"
                            badgeText="[DITOLAK]"
                            badgeVariant="danger"
                        />
                    </div>
                </section>

                {/* Section: Pendanaan Riset */}
                <section aria-labelledby="pendanaan-section-title">
                    <h2
                        id="pendanaan-section-title"
                        className="mb-3 text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400"
                    >
                        {t.userDashboard.fundingMetricsTitle}
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <MetricCard
                            title={t.userDashboard.totalFundingApproved}
                            value={proposal_stats.total_pendanaan}
                            type="currency"
                            caption={t.userDashboard.totalFundingApprovedDesc}
                            icon={Coins}
                            iconBgClass="bg-blue-50 dark:bg-blue-950/40"
                            iconColorClass="text-blue-900 dark:text-blue-400"
                        />

                        <MetricCard
                            title={t.userDashboard.successRate}
                            value={proposal_stats.success_rate || 0}
                            type="percentage"
                            caption={t.userDashboard.successRateDesc}
                            icon={Percent}
                            iconBgClass="bg-purple-50 dark:bg-purple-950/40"
                            iconColorClass="text-purple-700 dark:text-purple-400"
                        />
                    </div>
                </section>

                {/* Success Rate Ring Card */}
                {(proposal_stats.lolos > 0 || proposal_stats.gagal > 0) && (
                    <section aria-labelledby="success-rate-title">
                        <h2
                            id="success-rate-title"
                            className="mb-3 text-xs font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400"
                        >
                            {t.userDashboard.successRateCardTitle}
                        </h2>

                        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                <div className="shrink-0">
                                    <SuccessRing rate={proposal_stats.success_rate} />
                                </div>

                                <div className="flex-1">
                                    <p className="font-sans text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {t.userDashboard.successRateCardTitle}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.userDashboard.successRateCardSubtitle}</p>

                                    <div className="mt-4 flex flex-wrap gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                {format(t.userDashboard.acceptedCount, { count: proposal_stats.lolos })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block h-3 w-3 rounded-full bg-rose-500" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                {format(t.userDashboard.rejectedCount, { count: proposal_stats.gagal })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                {format(t.userDashboard.waitingCount, { count: proposal_stats.masuk })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-1">
                                        <div className="flex justify-between font-mono text-xs text-slate-500 dark:text-slate-400">
                                            <span>{t.userDashboard.progressLabel}</span>
                                            <span className="font-semibold">{proposal_stats.success_rate}%</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className={[
                                                    'h-full rounded-full transition-all duration-700 ease-out',
                                                    proposal_stats.success_rate >= 75
                                                        ? 'bg-emerald-500'
                                                        : proposal_stats.success_rate >= 40
                                                          ? 'bg-amber-500'
                                                          : 'bg-rose-500',
                                                ].join(' ')}
                                                style={{ width: `${proposal_stats.success_rate}%` }}
                                                role="progressbar"
                                                aria-valuenow={proposal_stats.success_rate}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Empty state — belum ada proposal */}
                {proposal_stats.total === 0 && (
                    <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                        <h3 className="mt-4 font-sans text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {t.userDashboard.emptyProposalsTitle}
                        </h3>
                        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{t.userDashboard.emptyProposalsSubtitle}</p>
                        <Link
                            href={route('proposals.create')}
                            id="btn-buat-proposal"
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            {t.userDashboard.createProposalBtn}
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

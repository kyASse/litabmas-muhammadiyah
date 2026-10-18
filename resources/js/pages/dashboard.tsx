import StatisticsDashboard from '@/components/StatisticsDashboard';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type JournalStatistics, type PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, CheckCircle, ClipboardCheck, Clock, TrendingUp, UserPlus, XCircle } from 'lucide-react';
import { route } from 'ziggy-js';

interface UniversityDistribution {
    id: number;
    name: string;
    count: number;
}

interface JournalsByStatus {
    pending: number;
    approved: number;
    rejected: number;
}

interface ProposalStats {
    total: number;
    masuk: number;
    lolos: number;
    gagal: number;
    success_rate: number;
}

interface DashboardProps extends PageProps {
    stats: {
        total_journals: number;
        total_assessments: number;
        average_score: number;
        pending_lppm_count?: number;
        universities_distribution?: UniversityDistribution[];
        journals_by_status?: JournalsByStatus;
    };
    statistics: JournalStatistics;
    proposal_stats: ProposalStats;
}

export default function Dashboard({ stats, statistics }: DashboardProps) {
    const { t } = useTranslation();
    const { auth } = usePage<PageProps>().props;
    const isSuperAdmin = auth.user?.role?.name === 'Super Admin';
    const isUser = auth.user?.role?.name === 'User';

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.navigation.dashboard,
            href: route('dashboard'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.navigation.dashboard} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 sm:p-6">
                {/* Stats Cards - Conditional Grid Based on Role */}
                <div
                    className={`grid auto-rows-min grid-cols-1 gap-4 ${
                        isSuperAdmin && stats.pending_lppm_count !== undefined
                            ? 'md:grid-cols-2 lg:grid-cols-4'
                            : isUser && stats.journals_by_status
                              ? 'sm:grid-cols-2 lg:grid-cols-5'
                              : 'md:grid-cols-3'
                    }`}
                >
                    {/* Total Assessments */}
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-neutral-950">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t.dashboard.totalAssessments}</p>
                                <h3 className="mt-2 text-3xl font-bold font-mono">{stats.total_assessments}</h3>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                                <ClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    {/* Average Score */}
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-neutral-950">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t.dashboard.averageScore}</p>
                                <h3 className="mt-2 text-3xl font-bold font-mono">
                                    {stats.average_score !== null ? Number(stats.average_score).toFixed(1) : '0.0'}
                                </h3>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                                <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </div>

                    {/* Pending LPPM Registrations (Super Admin Only) */}
                    {isSuperAdmin && stats.pending_lppm_count !== undefined && (
                        <Link href="/admin/admin-kampus" className="block">
                            <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 transition-all hover:border-orange-500 hover:shadow-md dark:border-sidebar-border dark:bg-neutral-950 dark:hover:border-orange-400">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t.dashboard.pendingLppm}</p>
                                        <h3 className="mt-2 text-3xl font-bold font-mono">{stats.pending_lppm_count}</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">{t.dashboard.clickToReview}</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                                        <UserPlus className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* User Role: Approval Status Breakdown */}
                    {isUser && stats.journals_by_status && (
                        <>
                            {/* Pending Journals */}
                            <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-neutral-950">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t.dashboard.pending}</p>
                                        <h3 className="mt-2 text-3xl font-bold font-mono">{stats.journals_by_status.pending}</h3>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                                        <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Approved Journals */}
                            <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-neutral-950">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t.dashboard.approved}</p>
                                        <h3 className="mt-2 text-3xl font-bold font-mono">{stats.journals_by_status.approved}</h3>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Rejected Journals */}
                            <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-neutral-950">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t.dashboard.rejected}</p>
                                        <h3 className="mt-2 text-3xl font-bold font-mono">{stats.journals_by_status.rejected}</h3>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                                        <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* University Distribution Table (Super Admin Only) */}
                {isSuperAdmin && stats.universities_distribution && stats.universities_distribution.length > 0 && (
                    <div className="mt-2 rounded-xl border border-sidebar-border/70 bg-white dark:border-sidebar-border dark:bg-neutral-950">
                        <div className="flex items-center justify-between border-b border-sidebar-border/70 p-6 dark:border-sidebar-border">
                            <div>
                                <h3 className="text-lg font-semibold font-serif text-foreground">{t.dashboard.distributionTitle}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {t.dashboard.distributionSubtitle.replace('{count}', String(Math.min(10, stats.universities_distribution.length)))}
                                </p>
                            </div>
                            {stats.universities_distribution.length > 10 && (
                                <Link href="/admin/universities" className="text-sm font-medium text-primary hover:underline">
                                    {t.dashboard.viewAll.replace('{count}', String(stats.universities_distribution.length))}
                                </Link>
                            )}
                        </div>
                        <div className="min-w-full overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="border-b border-sidebar-border/70 dark:border-sidebar-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">{t.dashboard.colNumber}</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">{t.dashboard.colUniversity}</th>
                                        <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">{t.dashboard.colJournalCount}</th>
                                        <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">{t.dashboard.colPercentage}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                    {stats.universities_distribution.slice(0, 10).map((university, index) => {
                                        const percentage =
                                            stats.total_journals > 0 ? ((university.count / stats.total_journals) * 100).toFixed(1) : '0.0';
                                        return (
                                            <tr key={university.id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                                                <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{index + 1}</td>
                                                <td className="px-6 py-4 text-sm font-medium">{university.name}</td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold font-mono">{university.count}</td>
                                                <td className="px-6 py-4 text-right text-sm text-muted-foreground font-mono">{percentage}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Journal Statistics Visualization */}
                {stats.total_journals > 0 && statistics && (
                    <div className="mt-2">
                        <StatisticsDashboard statistics={statistics} />
                    </div>
                )}

                {/* Empty State */}
                {stats.total_journals === 0 && (
                    <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white dark:border-sidebar-border dark:bg-neutral-950">
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            <div className="relative z-10">
                                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">{t.dashboard.noJournalsTitle}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {isSuperAdmin
                                        ? t.dashboard.noJournalsSuperAdmin
                                        : auth.user?.role?.name === 'Admin Kampus'
                                          ? t.dashboard.noJournalsCampusAdmin
                                          : t.dashboard.noJournalsUser}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

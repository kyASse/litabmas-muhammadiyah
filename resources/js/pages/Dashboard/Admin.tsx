/**
 * Admin Dashboard Page Component
 *
 * @description
 * Institutional LPPM Research Dashboard providing helicopter-view analytics
 * for university proposals, funding absorption, faculty performance, and system activity logs.
 *
 * @filepath resources/js/pages/Dashboard/Admin.tsx
 */

import ActivityLog from '@/components/ActivityLog';
import BarChart from '@/components/Charts/BarChart';
import PieChart from '@/components/Charts/PieChart';
import FacultyTable from '@/components/FacultyTable';
import TopLecturerList from '@/components/TopLecturerList';
import TopResearchList from '@/components/TopResearchList';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { MetricCard } from '@/components/ui/MetricCard';
import PageHeader from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/use-translation';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Coins, FileText, TrendingUp, UserCheck } from 'lucide-react';

interface DashboardStats {
    total_proposals: number;
    approved_proposals: number;
    rejected_proposals: number;
    success_rate: number;
    total_absorbed_funding: number;
    pending_researchers_count?: number;
}

interface FacultyPerformanceItem {
    faculty_name: string;
    submitted: number;
    accepted: number;
}

interface ResearchItem {
    id: number;
    title: string;
    citations: number;
}

interface LecturerItem {
    name: string;
    score: number;
}

interface ActivityLogItem {
    id: number;
    action: string;
    description: string;
    created_at: string;
    user: { name: string } | null;
}

interface Props {
    stats: DashboardStats;
    yearlyFundingData: { year: number; amount: number }[];
    facultyPerformance: FacultyPerformanceItem[];
    topResearch: ResearchItem[];
    topLecturers: LecturerItem[];
    systemLogs: ActivityLogItem[];
}

export default function AdminDashboard({ stats, yearlyFundingData, facultyPerformance, topResearch, topLecturers, systemLogs }: Props) {
    const { t, format } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t.adminDashboard.pageTitle,
            href: '/admin/dashboard',
        },
    ];

    // Map faculty performance to category distribution for PieChart
    const pieChartData = facultyPerformance.map((item) => ({
        label: item.faculty_name,
        value: item.submitted,
        percentage: 0,
    }));

    const proposalsCaption = `${format(t.adminDashboard.approvedCount, { count: stats.approved_proposals })} • ${format(t.adminDashboard.rejectedCount, { count: stats.rejected_proposals })}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t.adminDashboard.pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeader
                    title={t.adminDashboard.pageTitle}
                    subtitle={t.adminDashboard.pageSubtitle}
                    isEditorialSerif={false}
                    breadcrumbs={breadcrumbs}
                    actions={<LanguageSwitcher variant="compact" />}
                />

                {Boolean(stats.pending_researchers_count && stats.pending_researchers_count > 0) && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-sans text-sm font-semibold text-amber-900">
                                    {t.adminUsers.pendingResearchers}
                                </h3>
                                <p className="font-sans text-xs text-amber-700">
                                    {format(t.adminUsers.pendingCount, { count: stats.pending_researchers_count! })}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/admin/users?is_active=0"
                            className="inline-flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-1.5 font-sans text-xs font-medium text-white shadow-xs transition-colors hover:bg-amber-800"
                        >
                            <span>{t.adminUsers.activateAction}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                )}

                {/* ROW 1: Summary Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <MetricCard
                        title={t.adminDashboard.totalAbsorbedFunding}
                        value={stats.total_absorbed_funding}
                        type="currency"
                        icon={Coins}
                        iconBgClass="bg-blue-50"
                        iconColorClass="text-blue-900"
                        caption={t.adminDashboard.absorbedFundingSubtitle}
                    />

                    <MetricCard
                        title={t.adminDashboard.totalProposals}
                        value={stats.total_proposals}
                        type="integer"
                        icon={FileText}
                        iconBgClass="bg-slate-100"
                        iconColorClass="text-slate-800"
                        caption={proposalsCaption}
                    />

                    <MetricCard
                        title={t.adminDashboard.successRate}
                        value={stats.success_rate}
                        type="percentage"
                        icon={TrendingUp}
                        iconBgClass="bg-emerald-50"
                        iconColorClass="text-emerald-700"
                        caption={t.adminDashboard.successRateSubtitle}
                    />
                </div>

                {/* ROW 2: Graphs Split Screen */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    {/* Left: BarChart (60%) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-3">
                        <h2 className="mb-4 text-base font-bold text-slate-900">{t.adminDashboard.yearlyFundingTitle}</h2>
                        <BarChart data={yearlyFundingData} />
                    </div>

                    {/* Right: PieChart (40%) */}
                    <div className="lg:col-span-2">
                        <PieChart title={t.adminDashboard.facultyDistributionTitle} categories={pieChartData} />
                    </div>
                </div>

                {/* ROW 3: Leaderboard & Audit Logs */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <TopLecturerList data={topLecturers} />
                    <TopResearchList data={topResearch} />
                    <div className="h-full">
                        <ActivityLog logs={systemLogs} title={t.adminDashboard.systemLogsTitle} />
                    </div>
                </div>

                {/* ROW 4: Detailed Faculty Performance Table */}
                <div className="w-full">
                    <FacultyTable data={facultyPerformance} />
                </div>
            </div>
        </AppLayout>
    );
}
